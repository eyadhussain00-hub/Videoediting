#!/usr/bin/env python3
"""QA gate for CEOwills reels. Prints PASS/FAIL per check and ALL PASS at the end (exit 1 otherwise).
Usage: qa.py final.mp4 [--captions captions.txt] [--boxes boxes.json] [--target 15:45]
Writes contact.jpg next to the video (a frame every 1.5 s, platform UI zones shaded): look at it before delivering."""
import argparse, json, re, subprocess, sys
from pathlib import Path
import numpy as np

HERE = Path(__file__).resolve().parent
R = []


def check(name, ok, detail=""):
    R.append(ok); print(f"{'PASS' if ok else 'FAIL'}  {name}{'  — ' + detail if detail else ''}")


def ff(args):
    return subprocess.run(["ffmpeg", "-hide_banner", "-nostats", *args], capture_output=True, text=True).stderr


def head_clearance(video, b, L, ok=()):
    """Adnan's head against everything drawn around it, on the real frames every 0.5 s (heads.py, YuNet):
    - the title and every iMessage card stay above the top of his hair (Eyad: "the CTA covers his head", #6 v5);
    - the captions stay below the tip of his beard (Sofian 30 Sep: "captions never on his chin, they have to be below");
    - the stretched fill above the shot never reaches his hair (Sofian 30 Sep: red circle round his head — the old
      blurred fill cut into his hair). Grazing is the limit (head_tol_px)."""
    import heads
    Q = L["qa"]; tol = Q.get("head_tol_px", 12); N = L["notify"]; W, H = L["canvas"]["w"], L["canvas"]["h"]
    dur = float(subprocess.run(["ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", video], capture_output=True, text=True).stdout)
    ti = b.get("title_ink"); cards = b.get("cards", []); ct = b.get("caption_top"); shifts = b.get("shifts", [])
    bad = {"title/cards over his hair": [], "captions on his beard": [], "fill reaches his hair": []}; near, blind = [], []
    for t, img in heads.frames(video, 0.05, dur - 0.05, 2, ""):
        if any(abs(t - o) <= 0.3 for o in ok): near.append(f"@{t:.1f}s accepted (--ok-heads)"); continue
        r = heads.head(img)
        if not r: blind.append(f"{t:.1f}s"); continue
        hair, beard = r[0] * H / heads.DH, r[1] * H / heads.DH
        over = [("title", ti["bottom"])] if ti and t < ti["until"] - 0.3 else []
        over += [(f"card {c['key'][:24]}", c["bottom"]) for c in cards if c["in"] + N["in_ms"] / 1000 <= t <= c["out"] - N["out_ms"] / 1000 - 0.05]
        for what, bottom in over:
            if bottom > hair + tol: bad["title/cards over his hair"].append(f"{what} @{t:.1f}s ends {bottom}, hair ≈{hair:.0f}")
            elif bottom > hair - tol: near.append(f"{what} @{t:.1f}s ({bottom} vs hair ≈{hair:.0f})")
        if ct:
            top = ct["cta"] if ct.get("cta_t") is not None and t >= ct["cta_t"] else ct["run"]
            if beard > top + tol: bad["captions on his beard"].append(f"@{t:.1f}s beard ≈{beard:.0f}, captions from {top}")
        # the cut showing at t (a sampled frame can be the next cut's first frame: within 0.1 s of a cut, either counts)
        cand = [x for x in shifts if x["t0"] <= t + 0.1][-2:]
        cand = cand if len(cand) == 2 and t + 0.1 >= cand[1]["t0"] >= t - 0.1 else cand[-1:]
        fill = min((x["shift"] + x["strip"]) if x["shift"] else 0 for x in cand) if cand else 0
        if fill and hair < fill - tol:
            bad["fill reaches his hair"].append(f"@{t:.1f}s hair ≈{hair:.0f}, fill to {fill}")
    for k, v in bad.items():
        check(f"layout: {k} — none (real frames every 0.5 s)", not v, "; ".join(v[:6]) + (f" … {len(v)} in all" if len(v) > 6 else ""))
    if near: print("NOTE  grazing his hair (the limit) — look at these frames: " + "; ".join(near[:8]))
    if blind: print(f"NOTE  no face found at {len(blind)} probe(s) (look yourself): " + ", ".join(blind[:12]))


def main():
    ap = argparse.ArgumentParser(); ap.add_argument("video"); ap.add_argument("--captions"); ap.add_argument("--boxes")
    ap.add_argument("--target", help="min:max seconds, default from layout.json")
    ap.add_argument("--no-cta", action="store_true", help="the take has no spoken 'comment … below' (say so in the preview caption)")
    ap.add_argument("--ok-heads", default="", help="times (s) you looked at and accept for the head checks, e.g. a half-second lunge at the lens (say why in the job's _source)")
    a = ap.parse_args(); L = json.loads((HERE / "layout.json").read_text(encoding="utf-8")); cv = L["canvas"]; S = L["safe"]

    d = json.loads(subprocess.run(["ffprobe", "-v", "error", "-show_streams", "-show_format", "-of", "json", a.video], capture_output=True, text=True).stdout)
    v = next(s for s in d["streams"] if s["codec_type"] == "video"); au = next((s for s in d["streams"] if s["codec_type"] == "audio"), None)
    num, den = map(int, v["r_frame_rate"].split("/")); fps = num / den; dur = float(d["format"]["duration"])
    check("encode: 1080x1920 H.264 yuv420p", (v["width"], v["height"], v["codec_name"], v.get("pix_fmt")) == (cv["w"], cv["h"], "h264", "yuv420p"),
          f'{v["width"]}x{v["height"]} {v["codec_name"]} {v.get("pix_fmt")} {fps:.2f}fps')
    lo, hi = map(float, a.target.split(":")) if a.target else L["length"]["target_s"]
    check(f"length within {lo:g}–{hi:g}s", lo <= dur <= hi, f"{dur:.2f}s")
    check("encode: has audio", au is not None)
    if au:
        dv, da = float(v.get("duration", dur)), float(au.get("duration", dur))
        check("encode: A/V lengths match", abs(dv - da) < 0.1, f"video {dv:.2f}s audio {da:.2f}s")
        e = ff(["-i", a.video, "-map", "0:a", "-af", "ebur128=peak=true", "-f", "null", "-"])
        I = float(re.findall(r"I:\s+(-?[\d.]+) LUFS", e)[-1]); tp = float(re.findall(r"Peak:\s+(-?[\d.]+) dBFS", e)[-1])
        check(f"audio: {L['audio']['lufs']} LUFS (±1)", abs(I - L["audio"]["lufs"]) <= 1.0, f"{I} LUFS")
        check(f"audio: true peak ≤ {L['audio']['true_peak']} dBTP", tp <= L["audio"]["true_peak"] + 0.3, f"{tp} dBTP")
        e = ff(["-i", a.video, "-map", "0:a", "-af", "silencedetect=n=-45dB:d=0.6", "-f", "null", "-"])
        gaps = [(float(s), float(t)) for s, t in re.findall(r"silence_start: ([\d.]+).*?silence_end: ([\d.]+)", e, re.S)]
        inner = [f"{s:.1f}s" for s, t in gaps if s > 0.3 and t < dur - 0.3]
        check("audio: no dead air ≥0.6s mid-video", not inner, ", ".join(inner))
    e = ff(["-i", a.video, "-map", "0:v", "-vf", "blackdetect=d=0.04:pix_th=0.06,freezedetect=n=0.002:d=1.2", "-f", "null", "-"])
    check("video: no black frames", "black_start" not in e); check("video: no frozen video ≥1.2s", "freeze_start" not in e)
    # first frame must already carry the hook text (white type in the hook band) and the red logo
    W, H = cv["w"] // 4, cv["h"] // 4
    raw = subprocess.run(["ffmpeg", "-v", "error", "-i", a.video, "-vf", f"scale={W}:{H},format=gray", "-frames:v", "1", "-f", "rawvideo", "-"], capture_output=True).stdout
    f0 = np.frombuffer(raw, np.uint8).reshape(H, W)
    hy = L["hook"]["top"] // 4; band = f0[hy - 12:hy + 40]
    white = int((band > 225).sum())
    titled = (not a.boxes) or json.loads(Path(a.boxes).read_text(encoding="utf-8"))["title"][1] > 0
    if titled: check("hook: text visible on frame 1", white > 150, f"{white} bright px in hook band")
    else:   # no title layer in the render (boxes.title height 0, render.py draws none): bright pixels up there are his
        # background — a yellow plant (#6), a white orchid and a lit shelf (#2) all read as "text" to a pixel count (2 Oct)
        check("hook: no title layer (job has none — Eyad, 2 Oct)", True, "boxes.title height 0")
    rgb = subprocess.run(["ffmpeg", "-v", "error", "-i", a.video, "-vf", f"scale={W}:{H}", "-frames:v", "1", "-f", "rawvideo", "-pix_fmt", "rgb24", "-"], capture_output=True).stdout
    c0 = np.frombuffer(rgb, np.uint8).reshape(H, W, 3).astype(int); G = L["logo"]
    lb = c0[(G["baseline_y"] - 70) // 4:G["baseline_y"] // 4, (G["center_x"] - G["width"] // 2) // 4:(G["center_x"] + G["width"] // 2) // 4]
    red = int(((lb[..., 0] > 180) & (lb[..., 1] < 80) & (lb[..., 2] < 80)).sum())
    check("logo: CEOwills wordmark in place", red > 300, f"{red} logo-red px")

    if a.captions:
        txt = Path(a.captions).read_text(encoding="utf-8")
        g = json.loads((HERE / "glossary.json").read_text(encoding="utf-8"))
        hits = [k for k in g if not k.startswith("_") and k.lower() != g[k].lower() and re.search(r"\b" + re.escape(k) + r"\b", txt.lower())
                and not re.search(r"\b" + re.escape(g[k]) + r"\b", txt)]
        check("captions: no known ASR misspellings", not hits, ", ".join(hits))
        spans = [tuple(map(float, m)) for m in re.findall(r"^\s*([\d.]+)-\s*([\d.]+)", txt, re.M)]
        short = [f"{s:.2f}" for s, e in spans if e - s < 0.25]
        check("captions: every chunk on screen ≥0.25s", not short, ", ".join(short))
        if a.no_cta: print("NOTE  captions: no end CTA (--no-cta: he doesn't say one in this take)")
        else: check("captions: has CTA", "[CTA]" in txt)
    if a.boxes:
        b = json.loads(Path(a.boxes).read_text(encoding="utf-8"))
        em = L["hook"].get("edge_margin", S["y0"])   # Eyad: overlays high and off his face, but not tight to the edge
        U = L["hook"].get("uniform")
        htop = (L["hook"]["bar"]["top"] if L["hook"].get("style") == "bar" else U["top"] - round(U["px"] * 0.73) if U
                else L["hook"]["top"] - L["hook"]["eyebrow_px"])
        if b["title"][1] > 0: check("layout: title under the platform bar (Instagram/TikTok/Shorts)", htop >= S["y0"], f"title cap top {htop}, platform bar ends {S['y0']}")
        check("layout: iMessage CTA clear of the top edge", L["notify"]["y"] >= em, f"card top {L['notify']['y']}")
        cap_top = L["logo"]["baseline_y"] - round(L["logo"]["px"] * 0.72)   # the logo's cap height
        check("layout: captions above the logo", L["caption"]["baseline_y"] + 40 < cap_top, f"caption baseline {L['caption']['baseline_y']}, logo cap top {cap_top}")
        check("layout: logo above platform UI", L["logo"]["baseline_y"] <= S["y1"] + 60, f"logo baseline {L['logo']['baseline_y']}")
        head_clearance(a.video, b, L, [float(x) for x in a.ok_heads.split(",") if x])
        if "max_line_w" in b:   # the end CTA "Comment DAUGHTERS below" once ran off both edges
            check("layout: every caption/CTA line fits the frame", b["max_line_w"] <= L["caption"]["max_w"] + 1,
                  f"widest line {b['max_line_w']} px (max {L['caption']['max_w']})")

    sheet = str(Path(a.video).with_name("contact.jpg"))
    shade = (f"drawbox=x=0:y=0:w=iw:h={S['y0']}:color=black@0.35:t=fill,drawbox=x=0:y={S['y1']}:w=iw:h=ih-{S['y1']}:color=black@0.35:t=fill,"
             f"drawbox=x={S['x1']}:y=0:w=iw-{S['x1']}:h=ih:color=black@0.25:t=fill")
    subprocess.run(["ffmpeg", "-v", "error", "-y", "-i", a.video, "-vf", f"fps=1/1.5,{shade},scale=216:-1,tile=8x{max(1, -(-int(dur / 1.5 + 1) // 8))}", "-frames:v", "1", sheet])
    print(f"contact sheet → {sheet}  (look at it)")
    print("ALL PASS" if all(R) else f"{R.count(False)} FAILED")
    sys.exit(0 if all(R) else 1)


if __name__ == "__main__":
    main()
