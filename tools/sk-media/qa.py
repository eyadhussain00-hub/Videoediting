#!/usr/bin/env python3
"""QA gate. Prints PASS/FAIL per check and ALL PASS at the end (exit 1 otherwise).
Usage: qa.py final.mp4 [--boxes boxes.json] [--faces face_track.json] [--captions captions.txt] [--layout layout.json]
boxes.json : {"<frame>": [{"id","kind","x","y","w","h","overflow":bool,"parent":id|null}]}
face_track.json : [{"clip","section","cx","cy","w","h"}]   (face centre in the card's crop, px; w/h = crop size)"""
import argparse, json, re, subprocess, sys
from pathlib import Path
import numpy as np

R = []
def check(name, ok, detail=""):
    R.append(ok); print(f"{'PASS' if ok else 'FAIL'}  {name}{'  — ' + detail if detail else ''}")

def ff(args):
    return subprocess.run(["ffmpeg", "-hide_banner", "-nostats", *args], capture_output=True, text=True).stderr

def probe(path):
    d = json.loads(subprocess.run(["ffprobe", "-v", "error", "-show_streams", "-show_format", "-of", "json", path],
                                  capture_output=True, text=True).stdout)
    v = next(s for s in d["streams"] if s["codec_type"] == "video"); a = next((s for s in d["streams"] if s["codec_type"] == "audio"), None)
    return v, a

def main():
    ap = argparse.ArgumentParser(); ap.add_argument("video")
    ap.add_argument("--boxes"); ap.add_argument("--faces"); ap.add_argument("--captions")
    ap.add_argument("--layout", default=str(Path(__file__).with_name("layout.json")))
    a = ap.parse_args(); L = json.loads(Path(a.layout).read_text()); cv = L["canvas"]; S = L["safe"]; Q = L["qa"]

    # --- encode
    v, au = probe(a.video)
    num, den = map(int, v["r_frame_rate"].split("/"))
    check("encode: 1080x1920 H.264 30fps", (v["width"], v["height"], v["codec_name"]) == (cv["w"], cv["h"], "h264") and abs(num / den - cv["fps"]) < 0.01,
          f'{v["width"]}x{v["height"]} {v["codec_name"]} {num/den:.2f}fps')
    check("encode: has audio", au is not None)
    if au:
        dv, da = float(v.get("duration", 0)), float(au.get("duration", 0))
        check("encode: A/V lengths match", abs(dv - da) < 0.1, f"video {dv:.2f}s audio {da:.2f}s")
        e = ff(["-i", a.video, "-map", "0:a", "-af", "ebur128=peak=true", "-f", "null", "-"])
        I = float(re.findall(r"I:\s+(-?[\d.]+) LUFS", e)[-1]); tp = float(re.findall(r"Peak:\s+(-?[\d.]+) dBFS", e)[-1])
        check("audio: -14 LUFS (±0.5)", abs(I - L["audio"]["lufs"]) <= 0.5, f"{I} LUFS")
        check("audio: true peak ≤ -2 dBTP", tp <= L["audio"]["true_peak"] + 0.05, f"{tp} dBTP")
    e = ff(["-i", a.video, "-map", "0:v", "-vf", "blackdetect=d=0.03:pix_th=0.05,freezedetect=n=0.001:d=1.5", "-f", "null", "-"])
    check("video: no black segments", "black_start" not in e); check("video: no frozen video ≥1.5s", "freeze_start" not in e)

    # --- empty cards (catches the black/blank frame at joins), every frame at 1/4 res
    sc = 4; W, H = cv["w"] // sc, cv["h"] // sc
    raw = subprocess.run(["ffmpeg", "-v", "error", "-i", a.video, "-vf", f"scale={W}:{H},format=gray", "-f", "rawvideo", "-"],
                         capture_output=True).stdout
    fr = np.frombuffer(raw, np.uint8).reshape(-1, H, W)
    bad = []
    lay = L["layouts"]; op_frames = int(L["opening_duration_s"] * cv["fps"])
    for i, f in enumerate(fr):
        cards = lay["opening"] if i < op_frames else lay["standard"]
        for k in ("screen", "face"):
            b = cards[k]; crop = f[b["y"] // sc + 4:(b["y"] + b["h"]) // sc - 4, b["x"] // sc + 4:(b["x"] + b["w"]) // sc - 4]
            if crop.std() < Q["empty_card_std"]: bad.append(f"{k}@f{i}")
    check("video: zero empty screen/face frames", not bad, ", ".join(bad[:8]) + (" …" if len(bad) > 8 else ""))

    # --- layout lint
    if a.boxes:
        boxes = json.loads(Path(a.boxes).read_text()); out, spill, over = set(), set(), set()
        for fi, els in boxes.items():
            for el in els:
                if el["x"] < S["x0"] or el["y"] < S["y0"] or el["x"] + el["w"] > S["x1"] or el["y"] + el["h"] > S["y1"]: out.add(el["id"])
                if el.get("overflow"): spill.add(el["id"])
            for i, p in enumerate(els):
                for q in els[i + 1:]:
                    if p.get("parent") != q.get("parent"): continue  # only siblings can collide; children sit inside cards
                    if p["x"] < q["x"] + q["w"] and q["x"] < p["x"] + p["w"] and p["y"] < q["y"] + q["h"] and q["y"] < p["y"] + p["h"]:
                        over.add(f'{p["id"]}×{q["id"]}')
        check("layout: inside safe zone", not out, ", ".join(sorted(out)[:8]))
        check("layout: no text spill", not spill, ", ".join(sorted(spill)[:8]))
        check("layout: no overlaps", not over, ", ".join(sorted(over)[:8]))
        xs = [(el["x"] + el["w"] / 2) for els in boxes.values() for el in els if el.get("kind") == "card"]
        check("layout: cards centred on x=540", all(abs(x - L["center_x"]) <= 2 for x in xs))

    # --- face centring + jitter
    if a.faces:
        ft = json.loads(Path(a.faces).read_text())
        off = [f["clip"] for f in ft if abs(f["cx"] / f["w"] - 0.5) > Q["face_center_tol"]]
        check("face: centred within 5%", not off, ", ".join(map(str, off[:8])))
        # compare the face position relative to each crop: punch-ins (1.10) and drift change the crop size on purpose
        jumps = [f'{p["clip"]}→{q["clip"]}' for p, q in zip(ft, ft[1:])
                 if p["section"] == q["section"] and (abs(p["cx"] / p["w"] - q["cx"] / q["w"]) > Q["face_jump_tol"]
                                                      or abs(p["cy"] / p["h"] - q["cy"] / q["h"]) > Q["face_jump_tol"])]
        check("face: no jitter across same-section cuts", not jumps, ", ".join(jumps[:8]))

    # --- captions
    if a.captions:
        txt = Path(a.captions).read_text().lower()
        g = json.loads(Path(__file__).with_name("glossary.json").read_text())
        hits = [k for k in g if not k.startswith("_") and re.search(r"\b" + re.escape(k) + r"\b", txt)]
        check("captions: no known ASR misspellings", not hits, ", ".join(hits))

    # --- contact sheet (look at it)
    sheet = str(Path(a.video).with_name("contact.jpg")); s = S
    draw = (f"fps=1/3,drawbox=x={s['x0']}:y={s['y0']}:w={s['x1']-s['x0']}:h={s['y1']-s['y0']}:color=red@0.8:t=4,"
            f"drawbox=x={L['center_x']-1}:y=0:w=2:h={cv['h']}:color=cyan@0.8:t=fill,scale=270:-1,tile=8x4")
    subprocess.run(["ffmpeg", "-v", "error", "-y", "-i", a.video, "-vf", draw, "-frames:v", "1", sheet])
    print(f"contact sheet → {sheet}  (look at it)")
    print("ALL PASS" if all(R) else f"{R.count(False)} FAILED"); sys.exit(0 if all(R) else 1)

if __name__ == "__main__": main()
