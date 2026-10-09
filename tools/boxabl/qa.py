#!/usr/bin/env python3
"""QA a rendered clip. Must print ALL PASS before delivery; then LOOK at the contact sheet it writes.

usage: qa.py <ws>/out/<name>.mp4 [--job <job.json>]
Reads <name>.captions.txt / <name>.overlays.txt next to the video. Writes <name>.contact.jpg.
"""
import json, os, re, subprocess, sys

HERE = os.path.dirname(os.path.abspath(__file__))
L = json.load(open(f"{HERE}/layout.json"))
G = json.load(open(f"{HERE}/glossary.json"))
args = sys.argv[1:]
mp4 = args[0]
job = json.load(open(args[args.index("--job") + 1])) if "--job" in args else {}
stem = mp4[:-4]
res = []


def check(name, ok, detail=""):
    res.append(ok)
    print(("PASS " if ok else "FAIL ") + name + (f" — {detail}" if detail else ""))


def ff(*a):
    return subprocess.run(["ffmpeg", "-hide_banner", *a], capture_output=True, text=True).stderr


info = ff("-i", mp4)
m = re.search(r"Duration: (\d+):(\d+):([\d.]+)", info)
dur = int(m[1]) * 3600 + int(m[2]) * 60 + float(m[3]) if m else 0
vm = re.search(r"Video: h264.*?(\d{3,4})x(\d{3,4}).*?([\d.]+) fps", info)
c = L["canvas"]
check("encode h264 1080x1920 30fps", bool(vm) and (int(vm[1]), int(vm[2])) == (c["w"], c["h"]) and abs(float(vm[3]) - c["fps"]) < 0.5,
      vm.group(0)[:60] if vm else "no h264 video stream")
check("audio aac", "Audio: aac" in info)
ln = L["length"]
check(f"length {ln['min']}-{ln['max']} s", ln["min"] <= dur <= ln["max"], f"{dur:.1f}s")

eb = ff("-nostats", "-i", mp4, "-af", "ebur128=peak=true", "-f", "null", "-")
I = re.findall(r"I:\s+(-?[\d.]+) LUFS", eb)
TP = re.findall(r"Peak:\s+(-?[\d.]+) dBFS", eb)
lufs = float(I[-1]) if I else -99
check("loudness", abs(lufs - L["audio"]["lufs"]) <= L["qa"]["lufs_tol"], f"{lufs:.1f} LUFS (target {L['audio']['lufs']})")
if TP:
    check("true peak", float(TP[-1]) <= L["audio"]["tp"] + 0.6, f"{TP[-1]} dBTP")

bl = ff("-i", mp4, "-vf", "blackdetect=d=0.1:pix_th=0.08", "-an", "-f", "null", "-")
black = sum(float(x) for x in re.findall(r"black_duration:([\d.]+)", bl))
check("no black frames", black <= L["qa"]["black_max"], f"{black:.2f}s black")
fr = ff("-i", mp4, "-vf", "freezedetect=n=0.003:d=" + str(L["qa"]["freeze_max"]), "-an", "-f", "null", "-")
check("no frozen video", "freeze_start" not in fr, "frozen stretch found" if "freeze_start" in fr else "")

caps = open(stem + ".captions.txt").read() if os.path.exists(stem + ".captions.txt") else ""
ovl = open(stem + ".overlays.txt").read() if os.path.exists(stem + ".overlays.txt") else ""
post = open(stem + ".post.md").read() if os.path.exists(stem + ".post.md") else ""
ok_words = {w.lower() for w in job.get("ok_words", [])}
low = (caps + "\n" + ovl + "\n" + post).lower()
wrong = [w for w in G["wrong_forms"] if re.search(rf"(?<![a-z]){re.escape(w)}(?![a-z])", low)]
check("BOXABL spelled right everywhere", not wrong, f"found {wrong}" if wrong else "")
banned = [b for b in G["banned"] if b not in ok_words and re.search(rf"(?<![a-z]){re.escape(b)}(?![a-z])", low)]
check("no banned words (Kanye, stock/ticker, politics…)", not banned, f"found {banned}" if banned else "")
check("BOXABL on screen", "BOXABL" in ovl.upper())
check("captions present", len(caps.strip().splitlines()) >= 3 or job.get("no_captions_ok", False),
      f"{len(caps.strip().splitlines())} caption chunks")
check("posting text tags @boxabl and has an X tracking URL", "@boxabl" in post.lower() and ("[TRACKING URL]" in post or "http" in post))

frames = max(1, int(dur // 2))
ff("-y", "-v", "error", "-i", mp4, "-vf", f"fps=1/2,scale=180:-1,tile=8x{(frames + 7) // 8}", "-frames:v", "1", stem + ".contact.jpg")
print(f"contact sheet: {stem}.contact.jpg — look at it")
print("ALL PASS" if all(res) else f"{res.count(False)} FAIL")
sys.exit(0 if all(res) else 1)
