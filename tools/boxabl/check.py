#!/usr/bin/env python3
"""Lint a job before rendering. Prints OK, or FAIL/WARN lines. Exit 1 on any FAIL.

usage: check.py <job.json> [--ws <ws>]      with --ws it also checks the source files and the spoken words
Every rule here comes from the ClipFlow x ASG brief or a lesson in HISTORY.md.
"""
import glob, json, os, re, sys

HERE = os.path.dirname(os.path.abspath(__file__))
L = json.load(open(f"{HERE}/layout.json"))
G = json.load(open(f"{HERE}/glossary.json"))
args = sys.argv[1:]
job_path = args[0]
ws = args[args.index("--ws") + 1] if "--ws" in args else None
job = json.load(open(job_path))
fails, warns = [], []
ok_words = {w.lower() for w in job.get("ok_words", [])}


def banned_in(text):
    t = text.lower()
    return [b for b in G["banned"] if b not in ok_words and re.search(rf"(?<![a-z]){re.escape(b)}(?![a-z])", t)]


def wrong_in(text):
    t = text.lower()
    return [w for w in G["wrong_forms"] if re.search(rf"(?<![a-z]){re.escape(w)}(?![a-z])", t)]


segs, total = job.get("segments", []), 0.0
for i, s in enumerate(segs):
    a_src = s.get("a", s["v"])
    as_, ae = s.get("as", s["vs"]), s.get("ae", s.get("ve"))
    ve = s.get("ve", s["vs"] + (ae - as_))
    for k in {s["v"], a_src}:
        if k not in job.get("sources", {}):
            fails.append(f"segment {i}: source '{k}' is not in job.sources")
        elif ws and not os.path.exists(f"{ws}/src/{k}.mp4"):
            fails.append(f"segment {i}: {ws}/src/{k}.mp4 missing — run fetch.py")
    if ae <= as_ or ve <= s["vs"]:
        fails.append(f"segment {i}: empty range")
        continue
    speed = (ve - s["vs"]) / (ae - as_)
    if not 0.5 <= speed <= 2.6:
        warns.append(f"segment {i}: video plays at {speed:.2f}x to fit the audio")
    total += ae - as_

ln = L["length"]
if not ln["min"] <= total <= ln["max"]:
    fails.append(f"length {total:.1f}s outside {ln['min']}-{ln['max']}s")
elif not ln["target"][0] <= total <= ln["target"][1]:
    warns.append(f"length {total:.1f}s outside the {ln['target'][0]}-{ln['target'][1]}s sweet spot")

if not any(s.get("home") for s in segs):
    fails.append('no segment marked "home": true — the brief requires a shot of the WHOLE home, not just a feature')

ovs = job.get("overlays", [])
tops = sorted([o for o in ovs if o.get("style", "Top") == "Top"], key=lambda o: o["s"])
if not tops or tops[0]["s"] > L["hook"]["max_start"] or tops[0]["e"] - tops[0]["s"] < L["hook"]["min_len"]:
    fails.append("hook: the first title must start at 0 s and stay >= 2 s (first frame matters most)")
if not any("BOXABL" in o["text"].upper() for o in ovs):
    fails.append("no overlay says BOXABL — the brand must be on screen when the home shows")
for a, b in zip(tops, tops[1:]):
    if b["s"] < a["e"] - 0.01:
        fails.append(f"titles overlap at {b['s']}s")
for o in ovs:
    if o["e"] > total + 0.05:
        warns.append(f"overlay '{o['text'][:20]}' ends at {o['e']}s, after the clip ({total:.1f}s)")
    for line in o["text"].replace("*", "").split("\n"):
        if o.get("style", "Top") == "Top" and len(line) > 22:
            warns.append(f"title line '{line}' is {len(line)} chars (> 22 wraps badly)")
    if banned_in(o["text"]):
        fails.append(f"overlay '{o['text']}' has banned words {banned_in(o['text'])}")
    if wrong_in(o["text"]):
        fails.append(f"overlay '{o['text']}' misspells the brand/product {wrong_in(o['text'])}")

post = job.get("post", {})
short, x = post.get("short", ""), post.get("x", "")
if "@boxabl" not in short.lower():
    fails.append("post.short (TikTok/Reels/Shorts) must tag @boxabl")
if "boxabl" not in short.lower().replace("@boxabl", ""):
    fails.append("post.short must mention Boxabl / the Casita in words, not only the tag")
if "[TRACKING URL]" not in x and "http" not in x:
    fails.append("post.x must carry the tracking URL placeholder [TRACKING URL] (X = URL, not the tag)")
for k, t in (("short", short), ("x", x)):
    if banned_in(t):
        fails.append(f"post.{k} has banned words {banned_in(t)}")
    if wrong_in(t):
        fails.append(f"post.{k} misspells BOXABL {wrong_in(t)}")

if ws:   # what's actually said inside the kept ranges
    for i, s in enumerate(segs):
        if s.get("nocap"):
            continue
        a_src = s.get("a", s["v"])
        p = f"{ws}/words/{a_src}.json"
        if not os.path.exists(p):
            warns.append(f"segment {i}: no transcript for {a_src} — captions will be missing")
            continue
        as_, ae = s.get("as", s["vs"]), s.get("ae", s.get("ve"))
        said = " ".join(w["w"] for w in json.load(open(p))["words"] if as_ - 0.05 <= w["s"] and w["e"] <= ae + 0.15)
        if banned_in(said):
            fails.append(f"segment {i} says {banned_in(said)}: '{said[:90]}…' — cut it or add ok_words with a _why")

# variety: don't reuse the same moment of the same source as an earlier job
me = os.path.abspath(job_path)
for other in glob.glob(f"{HERE}/jobs/*.json"):
    if os.path.abspath(other) == me:
        continue
    oj = json.load(open(other))
    if oj.get("name") == job.get("name"):
        continue
    for s in segs:
        src = job["sources"].get(s["v"])
        for t in oj.get("segments", []):
            if oj.get("sources", {}).get(t["v"]) != src:
                continue
            ov = min(s.get("ve", 0), t.get("ve", 0)) - max(s["vs"], t["vs"])
            if ov > 3:
                warns.append(f"reuses {ov:.0f}s of '{os.path.basename(src)}' @{s['vs']} from {oj['name']} — vary your clips")

for f in fails:
    print("FAIL", f)
for w in warns:
    print("WARN", w)
print("OK" if not fails else f"{len(fails)} FAIL", f"({total:.1f}s)")
sys.exit(1 if fails else 0)
