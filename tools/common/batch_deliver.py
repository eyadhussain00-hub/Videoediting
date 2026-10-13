#!/usr/bin/env python3
"""Batch QA + Drive delivery (all clients): QA every render, upload the ones that pass to a named Drive export folder
without duplicates, then send ONE Telegram summary.

Usage:
  batch_deliver.py --client ceowills --folder ceowills-export out/*.mp4 [--dry-run]
      [--listing export.json] [--no-stutters] [--model medium.en] [--ok "<file>=12.3,40.1"]
  batch_deliver.py --resume output/<client>/batch-<ts>.json --sessions sessions.json     (Make uploads, step 2)

QA per file (targets from tools/<client>/layout.json): has a duration (a render killed mid-way has none), the canvas size,
H.264, has audio, length in the client's range, integrated loudness (±tol) and true peak, and tools/common/stutters.py
must PASS, as on the Adnan batches: it stops at the end card when a boxes.json with "endcard" sits next to the video
(Whisper hears the nasheed there), and --ok accepts hits you checked, per file.

No duplicates: a file whose md5 is already in the folder (any name), or the same name with the same size, is skipped;
the same file twice in one batch goes once. The same name with different content is a new version → it REPLACES that
Drive file in place (same link, nothing binned — the house rule). The folder's contents come from rclone when
RCLONE_REMOTE is set, else from --listing: the Drive connector's search_files result saved as JSON (or any list of
{name, size, id, md5}). Without either, nothing is known about the folder: the run says so and only dedupes the batch.

Upload: with RCLONE_REMOTE → rclone copyto + a size check. Otherwise it's the Make route (deliver.sh): the run writes
output/<client>/batch-<ts>.json with each file's Make call (7630409 new / 7680385 replace); run those, save
{"<drive name>": "<LOCATION url from upload-session-*.txt>"} as sessions.json and run --resume: it PUTs each file and
sends the summary. Then check each fileSize with get_file_metadata and trash only the upload-session-*.txt files.
--dry-run does all the QA and dedupe for real, uploads nothing and prints the Telegram text instead of sending it.
Exit 0 when every file passed and nothing is left to upload, 1 otherwise."""
import argparse, hashlib, json, os, re, shutil, subprocess, sys, time
from pathlib import Path

HERE = Path(__file__).resolve().parent; TOOLS = HERE.parent; REPO = TOOLS.parent
CLIENT_NAME = {"ceowills": "CEOwills", "sk-media": "SK Media", "boxabl": "BOXABL"}


def spec(client):
    """QA targets from the client's layout.json (each client spells them differently)."""
    L = json.loads((TOOLS / client / "layout.json").read_text(encoding="utf-8")) if client else {}
    c, a, ln, q = L.get("canvas", {}), L.get("audio", {}), L.get("length", {}), L.get("qa", {})
    lo, hi = ln.get("target_s") or [ln.get("min", 5), ln.get("max", 180)]
    return {"w": c.get("w", 1080), "h": c.get("h", 1920), "len": (lo, hi), "lufs": a.get("lufs", -14),
            "lufs_tol": q.get("lufs_tol", 1.0), "tp": a.get("true_peak", a.get("tp", -1.0))}


def folder(name):
    reg = json.loads((HERE / "drive_folders.json").read_text(encoding="utf-8"))
    if name in reg: return {"name": name, **reg[name]}
    if re.fullmatch(r"[A-Za-z0-9_-]{20,}", name): return {"name": name, "id": name, "path": None}
    sys.exit(f"batch: unknown folder '{name}' — add it to {HERE / 'drive_folders.json'} or pass its Drive id")


def md5(p):
    h = hashlib.md5()
    with open(p, "rb") as f:
        for b in iter(lambda: f.read(1 << 20), b""): h.update(b)
    return h.hexdigest()


def qa(f, S, a):
    """[(check, ok, detail)] for one file."""
    R = []; ck = lambda n, ok, d="": R.append((n, bool(ok), d))
    p = subprocess.run(["ffprobe", "-v", "error", "-show_streams", "-show_format", "-of", "json", f], capture_output=True, text=True)
    d = json.loads(p.stdout or "{}"); dur = float(d.get("format", {}).get("duration", 0) or 0)
    if not dur: ck("readable, has a duration", False, "no duration (render died?) — re-render"); return R
    v = next((s for s in d["streams"] if s["codec_type"] == "video"), {}); au = next((s for s in d["streams"] if s["codec_type"] == "audio"), None)
    ck(f"{S['w']}x{S['h']} H.264", (v.get("width"), v.get("height"), v.get("codec_name")) == (S["w"], S["h"], "h264"),
       f"{v.get('width')}x{v.get('height')} {v.get('codec_name')}")
    lo, hi = S["len"]; ck(f"length {lo:g}–{hi:g}s", lo <= dur <= hi, f"{dur:.1f}s")
    ck("has audio", au is not None)
    if au:
        e = subprocess.run(["ffmpeg", "-hide_banner", "-nostats", "-i", f, "-map", "0:a:0", "-af", "ebur128=peak=true", "-f", "null", "-"],
                           capture_output=True, text=True).stderr
        I = re.findall(r"I:\s+(-?[\d.]+) LUFS", e); tp = re.findall(r"Peak:\s+(-?[\d.]+) dBFS", e)
        I = float(I[-1]) if I else -99.0; tp = float(tp[-1]) if tp else 99.0
        ck(f"loudness {S['lufs']} LUFS (±{S['lufs_tol']:g})", abs(I - S["lufs"]) <= S["lufs_tol"], f"{I} LUFS")
        ck(f"true peak ≤ {S['tp']} dBTP", tp <= S["tp"] + 0.3, f"{tp} dBTP")
    if not a.no_stutters:
        cmd = [sys.executable, str(HERE / "stutters.py"), f, "--model", a.model]
        bx = Path(f).with_name("boxes.json")
        ec = json.loads(bx.read_text(encoding="utf-8")).get("endcard") if bx.exists() else None
        if ec: cmd += ["--to", str(ec[0])]
        ok = [o.split("=", 1)[1] for o in a.ok if "=" in o and Path(o.split("=", 1)[0]).name == Path(f).name]
        if ok: cmd += ["--ok", ",".join(ok)]
        r = subprocess.run(cmd, capture_output=True, text=True); out = (r.stdout + r.stderr).strip().splitlines()
        if "No module named 'faster_whisper'" in r.stderr: ck("stutters", False, "faster-whisper missing — pip install faster-whisper (or --no-stutters)")
        elif "ProxyError" in r.stderr or "huggingface" in r.stderr.lower(): ck("stutters", False, f"couldn't download the Whisper model {a.model} (huggingface.co blocked?)")
        else: ck("stutters" + (f" (to {ec[0]:.1f}s)" if ec else ""), r.returncode == 0,
                 "; ".join(l[6:].strip() for l in out if l.startswith("FAIL"))[:300] or ("" if r.returncode == 0 else (out[-1] if out else "crashed")))
    return R


def listing(F, a):
    """Files already in the export folder: [{name, size, id, md5}], or None when unknown."""
    rows = None
    if a.listing:
        j = json.loads(Path(a.listing).read_text(encoding="utf-8"))
        rows = j.get("files", j.get("items", [])) if isinstance(j, dict) else j
    elif os.environ.get("RCLONE_REMOTE") and shutil.which("rclone") and F.get("path"):
        r = subprocess.run(["rclone", "lsjson", "--hash", "--files-only", f"{os.environ['RCLONE_REMOTE']}:{F['path']}"], capture_output=True, text=True)
        if r.returncode: sys.exit(f"batch: rclone lsjson failed — {r.stderr.strip()[:300]}")
        rows = json.loads(r.stdout)
    if rows is None: return None
    g = lambda r, *k: next((r[x] for x in k if r.get(x) not in (None, "")), None)
    return [{"name": g(r, "name", "title", "Name"), "size": int(g(r, "size", "fileSize", "Size") or -1), "id": g(r, "id", "ID"),
             "md5": (g(r, "md5Checksum", "md5") or (r.get("Hashes") or {}).get("md5") or "").lower()} for r in rows]


def plan(items, existing):
    """Decide each passing file's action against the batch and the folder."""
    seen = {}
    for it in items:
        if not it["pass"]: it["action"] = "failed QA"; continue
        if it["md5"] in seen: it["action"] = "skip"; it["why"] = f"same file as {seen[it['md5']]} in this batch"; continue
        seen[it["md5"]] = it["name"]
        same = next((e for e in existing or [] if e["md5"] and e["md5"] == it["md5"]), None) \
            or next((e for e in existing or [] if e["name"] == it["name"] and e["size"] == it["size"]), None)
        named = next((e for e in existing or [] if e["name"] == it["name"]), None)
        if same: it["action"] = "skip"; it["why"] = f"already in Drive as \"{same['name']}\""
        elif named: it["action"] = "replace"; it["file_id"] = named["id"]; it["why"] = "new version of the file in Drive (same link)"
        else: it["action"] = "upload"


def make_call(it, F):
    if it["action"] == "replace":
        return {"scenario": 7680385, "title": "Drive: replace file (resumable, keeps the link)", "fileId": it["file_id"],
                "name": it["name"], "parentId": F["id"], "size": it["size"], "mime": "video/mp4"}
    return {"scenario": 7630409, "title": "Drive: start resumable upload (any file)", "name": it["name"], "parentId": F["id"],
            "size": it["size"], "mime": "video/mp4"}


def put(it, url):
    r = subprocess.run(["curl", "-sS", "-o", "/dev/stderr", "-w", "%{http_code}", "-X", "PUT", "-H", "Content-Type: video/mp4",
                        "--data-binary", f"@{it['path']}", url], capture_output=True, text=True)
    code = r.stdout.strip(); body = r.stderr
    if code in ("200", "201"):
        m = re.search(r'"id"\s*:\s*"([^"]+)"', body); it["drive_id"] = m[1] if m else it.get("file_id"); return True
    it["error"] = f"PUT {code or 'failed'}: {body.strip()[:200]}"; return False


def upload(items, F, a):
    """Run the uploads that can run now; mark the rest pending."""
    todo = [it for it in items if it["action"] in ("upload", "replace") and it.get("status") != "uploaded"]
    for it in todo:
        if a.dry_run: it["status"] = "would " + it["action"]; continue
        if os.environ.get("RCLONE_REMOTE") and shutil.which("rclone") and F.get("path"):
            dest = f"{os.environ['RCLONE_REMOTE']}:{F['path']}/{it['name']}"
            r = subprocess.run(["rclone", "copyto", it["path"], dest, "--drive-chunk-size", "64M"], capture_output=True, text=True)
            got = subprocess.run(["rclone", "size", "--json", dest], capture_output=True, text=True).stdout
            got = json.loads(got).get("bytes") if got.strip() else None
            it["status"] = "uploaded" if r.returncode == 0 and got == it["size"] else "error"
            if it["status"] == "error": it["error"] = r.stderr.strip()[:200] or f"size mismatch: local {it['size']} remote {got}"
        elif it["name"] in a.sess:
            it["status"] = "uploaded" if put(it, a.sess[it["name"]]) else "error"
        else:
            it["status"] = "pending"; it["make"] = make_call(it, F)


def summary(items, F, a, client):
    n = lambda *s: sum(1 for it in items if it.get("status", it["action"]) in s)
    head = f"{'DRY RUN · ' if a.dry_run else ''}📦 {CLIENT_NAME.get(client, client or 'Batch')} batch → {F.get('path') or F['id']}"
    up, rep = (("would upload", "would replace") if a.dry_run else ("uploaded", "uploaded"))
    counts = [f"✓ {n(up)} {'to upload' if a.dry_run else 'uploaded'}"]
    if a.dry_run and n(rep): counts.append(f"↺ {n(rep)} to replace (new version)")
    if n("skip"): counts.append(f"= {n('skip')} already there")
    if n("failed QA"): counts.append(f"✗ {n('failed QA')} failed QA")
    if n("error"): counts.append(f"⚠ {n('error')} upload error")
    if n("pending"): counts.append(f"… {n('pending')} waiting for upload")
    lines = [head, " · ".join(counts)]
    for it in items:
        st = it.get("status", it["action"])
        if st == "failed QA": lines.append(f"✗ {it['name']} — " + "; ".join(f"{c}: {d}" if d else c for c, ok, d in it["checks"] if not ok))
        elif st == "skip": lines.append(f"= {it['name']} — {it['why']}")
        elif st == "error": lines.append(f"⚠ {it['name']} — {it['error']}")
        elif st in ("uploaded", "would upload", "would replace"): lines.append(f"✓ {it['name']}" + (" (replaces the old version)" if it["action"] == "replace" else ""))
    if a.existing_unknown: lines.append("⚠ Export folder not listed — only duplicates within this batch were caught")
    if os.environ.get("SESSION_URL"): lines.append(os.environ["SESSION_URL"])
    return "\n".join(lines)


def main():
    ap = argparse.ArgumentParser(description=__doc__.split("\n")[0])
    ap.add_argument("files", nargs="*"); ap.add_argument("--client", choices=sorted(CLIENT_NAME)); ap.add_argument("--folder")
    ap.add_argument("--listing"); ap.add_argument("--dry-run", action="store_true"); ap.add_argument("--no-stutters", action="store_true")
    ap.add_argument("--model", default="medium.en"); ap.add_argument("--ok", action="append", default=[])
    ap.add_argument("--resume"); ap.add_argument("--sessions"); ap.add_argument("--report")
    a = ap.parse_args(); a.sess = json.loads(Path(a.sessions).read_text(encoding="utf-8")) if a.sessions else {}

    if a.resume:   # step 2 of the Make route: PUT the pending files, then the one summary
        st = json.loads(Path(a.resume).read_text(encoding="utf-8")); items, F, client = st["items"], st["folder"], st["client"]
        a.existing_unknown = st.get("existing_unknown", False); report = Path(a.resume)
        for it in items: it.pop("error", None)
        upload(items, F, a)
    else:
        if not (a.files and a.folder): ap.error("files and --folder are required (or --resume)")
        F = folder(a.folder); client = a.client or F.get("client"); S = spec(client)
        if F.get("client") and client != F["client"]: sys.exit(f"batch: folder {a.folder} belongs to {F['client']}, not {client}")
        existing = listing(F, a); a.existing_unknown = existing is None
        if existing is None: print("NOTE  no folder listing (--listing or RCLONE_REMOTE): only duplicates inside this batch are caught", file=sys.stderr)
        else: print(f"folder: {len(existing)} file(s) already in {F.get('path') or F['id']}")
        items = []
        for f in a.files:
            f = str(Path(f).resolve()); print(f"\n== {Path(f).name}", flush=True)
            checks = qa(f, S, a)
            for c, ok, d in checks: print(f"{'PASS' if ok else 'FAIL'}  {c}{'  — ' + d if d else ''}", flush=True)
            items.append({"path": f, "name": Path(f).name, "size": os.path.getsize(f), "md5": md5(f), "checks": checks,
                          "pass": all(ok for _, ok, _ in checks)})
        plan(items, existing); upload(items, F, a)
        stamp = time.strftime("%Y%m%d-%H%M%S")
        report = Path(a.report) if a.report else REPO / "output" / (client or "batch") / f"batch-{stamp}{'-dry' if a.dry_run else ''}.json"

    report.parent.mkdir(parents=True, exist_ok=True)
    report.write_text(json.dumps({"client": client, "folder": F, "dry_run": a.dry_run, "existing_unknown": a.existing_unknown,
                                  "items": items}, indent=1, ensure_ascii=False), encoding="utf-8")
    print("\n" + "\n".join(f"{it.get('status', it['action']):14} {it['name']}" + (f"  ({it['why']})" if it.get("why") else "") for it in items))
    print(f"report → {report}")
    pending = [it for it in items if it.get("status") == "pending"]
    if pending:
        print("\nMake uploads to run (each needs Eyad's tap — tg.sh msg \"🔐 …\" first):")
        for it in pending: print("  " + json.dumps(it["make"], ensure_ascii=False))
        print(f"then save {{\"<name>\": \"<LOCATION>\"}} as sessions.json (read each upload-session-<name>.txt with download_file_content)\n"
              f"and run: {Path(__file__).name} --resume {report} --sessions sessions.json   (the Telegram summary goes out then)")
    text = summary(items, F, a, client)
    if a.dry_run: print("\n--- Telegram summary (dry run, not sent) ---\n" + text)
    elif not pending: print("\n--- Telegram summary ---\n" + text); subprocess.run(["bash", str(TOOLS / "tg.sh"), "msg", text])
    if any(it.get("status") in ("uploaded",) for it in items) and not a.dry_run:
        print("check each upload's fileSize with Drive get_file_metadata, then trash only the upload-session-*.txt files")
    bad = [it for it in items if not it["pass"] or it.get("status") in ("pending", "error")]
    sys.exit(1 if bad else 0)


if __name__ == "__main__":
    main()
