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


def his_face(faces, seam=None):
    """Adnan's face among the Haar hits: the top-most of the big ones (a hand or his shirt can come out as a second
    'face' of the same size lower down — #9 at 29 s picked a box on his chest). A box that starts in the blurred fill
    (y < seam) is the plant behind him when a clearly bigger box sits below the seam — he's nearest the camera, so his
    face is the biggest (#7 at 2.8/16.2 s, 10 Oct: with the title gone, the plant came out as a ~300 px 'face' at y≈120
    next to his 370 px one at y≈680)."""
    low = [f for f in faces if seam and f[1] >= seam]
    if low: faces = [f for f in faces if f[1] >= seam or f[2] >= 0.9 * max(g[2] for g in low)]
    big = max(f[2] for f in faces)
    return min((f for f in faces if f[2] >= 0.7 * big), key=lambda f: f[1])


def head_clearance(video, b, L):
    """The title and every iMessage card must stay above Adnan's head (Eyad: "the CTA covers his head", #6 v5). Finds his
    face on the real frames (OpenCV Haar), estimates the top of his hair from it, and compares with where render.py drew
    the title text and each card (boxes.json → title_ink, cards). Grazing the top of the hair is the limit."""
    Q = L["qa"]; hair, tol = Q.get("hair_above_face", 0.45), Q.get("head_tol_px", 12)
    try:
        import cv2
    except ImportError:
        check("layout: title and cards clear of his head", False, "opencv missing — run setup.sh"); return
    if not hasattr(cv2, "CascadeClassifier"):   # newer OpenCV builds drop the Haar detector
        check("layout: title and cards clear of his head", False, "this OpenCV has no Haar detector — pip install opencv-python-headless==4.10.0.84"); return
    casc = cv2.CascadeClassifier(cv2.data.haarcascades + "haarcascade_frontalface_default.xml")
    W, H = L["canvas"]["w"], L["canvas"]["h"]; N = L["notify"]; probes = []
    ti = b.get("title_ink")
    if ti: probes += [(t, ti["bottom"], "title") for t in (0.1, ti["until"] / 2, max(0.1, ti["until"] - 0.4))]
    for c in b.get("cards", []):
        on, off = c["in"] + N["in_ms"] / 1000, c["out"] - N["out_ms"] / 1000 - 0.05
        n = max(2, int((off - on) / 0.5))   # every ~0.5 s while it's up (30 Sep: 3 probes missed him leaning in mid-card)
        probes += [(on + (off - on) * i / n, c["bottom"], f"card {c['key']}") for i in range(n + 1)]
    bad, near, blind = [], [], []
    for t, bottom, what in probes:
        raw = subprocess.run(["ffmpeg", "-v", "error", "-ss", f"{t:.2f}", "-i", video, "-frames:v", "1", "-f", "rawvideo", "-pix_fmt", "gray", "-"],
                             capture_output=True).stdout
        if len(raw) != W * H: blind.append(f"{what} @{t:.1f}s (no frame)"); continue
        g = np.frombuffer(raw, np.uint8).reshape(H, W)
        faces = casc.detectMultiScale(g, 1.1, 6, minSize=(W // 6, W // 6))
        if not len(faces): blind.append(f"{what} @{t:.1f}s"); continue
        x, y, w, h = his_face(faces, b.get("seam_end")); head = y - hair * h
        if bottom > head + tol: bad.append(f"{what} @{t:.1f}s ends y {bottom}, his head starts ≈{head:.0f}")
        elif bottom > head - tol: near.append(f"{what} @{t:.1f}s ({bottom} vs head ≈{head:.0f})")
    check("layout: title and cards clear of his head (real frames)", not bad, "; ".join(bad) or (f"{len(probes) - len(blind)} frames checked" if probes else "nothing to check"))
    if near: print("NOTE  grazing his hair (the limit) — look at these frames: " + "; ".join(near))
    if blind: print("NOTE  no face found (look yourself): " + "; ".join(blind))


def chin_and_seam(video, b, L, dur):
    """Every 0.5 s on the real frames (30 Sep, Sofian): (1) the caption on screen starts below his chin/beard — "captions
    are never on his chin, they have to be below"; (2) the top of his hair stays below the end of the blurred fill above
    the shot (boxes seam_end) — his head reaching into the fade looked smeared (red circle on #14)."""
    import cv2
    Q = L["qa"]; hair, chin_k = Q.get("hair_above_face", 0.12), Q.get("chin_below_face", 0.45)
    casc = cv2.CascadeClassifier(cv2.data.haarcascades + "haarcascade_frontalface_default.xml")
    W, H = L["canvas"]["w"], L["canvas"]["h"]; caps = b.get("captions", []); seam = b.get("seam_end")
    p = subprocess.Popen(["ffmpeg", "-v", "error", "-i", video, "-vf", "fps=2,format=gray", "-f", "rawvideo", "-"], stdout=subprocess.PIPE)
    on_chin, in_seam, seen, i = [], [], 0, 0
    while True:
        buf = p.stdout.read(W * H)
        if len(buf) < W * H: break
        t = i / 2 + 0.25; i += 1   # fps=2 samples the middle of each half second
        if b.get("endcard") and t >= b["endcard"][0]: continue   # Adnan's follow card: his photo there isn't the shot
        g = np.frombuffer(buf, np.uint8).reshape(H, W)
        faces = casc.detectMultiScale(g, 1.1, 6, minSize=(W // 6, W // 6))
        if not len(faces): continue
        seen += 1; x, y, w, h = his_face(faces, seam)
        chin, head = y + h * (1 + chin_k), y - hair * h
        cap = next((c for c in caps if c[0] <= t < c[1]), None)
        if cap and cap[2] < chin: on_chin.append(f"{t:.1f}s (caption top {cap[2]}, chin ≈{chin:.0f})")
        if seam and head < seam: in_seam.append(f"{t:.1f}s (hair ≈{head:.0f} < {seam})")
    p.wait()
    check("layout: captions below his chin (real frames, every 0.5 s)", not on_chin, "; ".join(on_chin[:8]) or f"{seen} frames with his face")
    if seam: check("layout: his head below the blurred fill (real frames)", not in_seam, "; ".join(in_seam[:8]) or f"fill ends y {seam}")


def main():
    ap = argparse.ArgumentParser(); ap.add_argument("video"); ap.add_argument("--captions"); ap.add_argument("--boxes")
    ap.add_argument("--target", help="min:max seconds, default from layout.json")
    ap.add_argument("--no-cta", action="store_true", help="the take has no spoken 'comment … below' (say so in the preview caption)")
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
    b = json.loads(Path(a.boxes).read_text(encoding="utf-8")) if a.boxes else {}
    ec = b.get("endcard")   # [start, end] of the follow card (7 Oct) — a slow push-in on a still, so freezedetect stops before it
    e = ff(["-i", a.video, "-map", "0:v"] + (["-t", f"{ec[0]:.3f}"] if ec else []) + ["-vf", "blackdetect=d=0.04:pix_th=0.06,freezedetect=n=0.002:d=1.2", "-f", "null", "-"])
    check("video: no black frames", "black_start" not in e); check("video: no frozen video ≥1.2s", "freeze_start" not in e)
    # first frame must already carry the red logo (and the hook text, while titles are on — off since 9 Oct, Sofian)
    W, H = cv["w"] // 4, cv["h"] // 4
    if not L["hook"].get("off"):
        raw = subprocess.run(["ffmpeg", "-v", "error", "-i", a.video, "-vf", f"scale={W}:{H},format=gray", "-frames:v", "1", "-f", "rawvideo", "-"], capture_output=True).stdout
        f0 = np.frombuffer(raw, np.uint8).reshape(H, W)
        hy = L["hook"]["top"] // 4; band = f0[hy - 12:hy + 40]
        white = int((band > 225).sum())
        check("hook: text visible on frame 1", white > 150, f"{white} bright px in hook band")
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
    if ec:   # the last frame is Adnan's card, not the shot (Adnan, 7 Oct: "add it at the end of every video")
        cf = L["endcard"]["file"]; from PIL import Image
        ref = np.asarray(Image.open(HERE / cf).convert("L").resize((W, H)), np.float32)
        raw = subprocess.run(["ffmpeg", "-v", "error", "-sseof", "-0.2", "-i", a.video, "-vf", f"scale={W}:{H},format=gray", "-frames:v", "1",
                              "-f", "rawvideo", "-"], capture_output=True).stdout
        if len(raw) == W * H:
            last = np.frombuffer(raw, np.uint8).reshape(H, W).astype(np.float32)
            z = L["endcard"].get("zoom", 1.0); import cv2   # the push-in ends at `zoom`: zoom the reference the same way
            r = cv2.resize(ref, (round(W * z), round(H * z))); zh, zw = r.shape; ref = r[(zh - H) // 2:(zh - H) // 2 + H, (zw - W) // 2:(zw - W) // 2 + W]
            diff = float(np.abs(last - ref).mean())
        else: diff = 999.0
        check("end card: the follow card is the last thing on screen", diff < 12, f"mean diff {diff:.1f} vs {cf}")
        check("end card: on screen ≥2.5 s", ec[1] - ec[0] >= 2.5 and abs(ec[1] - dur) < 0.15, f"{ec[0]:.2f}–{ec[1]:.2f}s of {dur:.2f}s")
    if a.boxes:
        em = L["hook"].get("edge_margin", S["y0"])   # Eyad: overlays high and off his face, but not tight to the edge
        htop = L["hook"]["bar"]["top"] if L["hook"].get("style") == "bar" else L["hook"]["top"] - L["hook"]["eyebrow_px"]
        if not L["hook"].get("off"): check("layout: hook clear of the top edge", htop >= em, f"hook top {htop}, margin ≥ {em}")
        check("layout: iMessage CTA clear of the top edge", L["notify"]["y"] >= em, f"card top {L['notify']['y']}")
        ends = [c for c in b.get("cards", []) if c["key"].startswith("end:")]   # Sofian, 9 Oct: a CTA banner at the end of every video
        check("end banner: CTA banner over the last seconds", len(ends) == 1 and abs(ends[0]["out"] - (ec[0] if ec else dur)) < 0.1,
              ", ".join(f"{c['key'][4:]} {c['in']:.1f}–{c['out']:.1f}s" for c in ends) or "none")
        if ends: check("end banner: clear of the top edge", ends[0]["top"] >= em, f"banner top {ends[0]['top']}")
        check("layout: captions above the logo", L["caption"]["baseline_y"] + 60 < L["logo"]["baseline_y"] - L["logo"]["px"], f"caption baseline {L['caption']['baseline_y']}")
        check("layout: logo above platform UI", L["logo"]["baseline_y"] <= S["y1"] + 60, f"logo baseline {L['logo']['baseline_y']}")
        head_clearance(a.video, b, L)
        chin_and_seam(a.video, b, L, dur)
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
