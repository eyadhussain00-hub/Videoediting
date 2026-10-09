#!/usr/bin/env python3
"""Re-cut an existing CEOwills job tighter, keeping every editing decision (30 Sep, Sofian: "the trimming isn't fast like
ExamQA videos", "you can hear me say 'go' at the start").

Usage: tighten.py <edit.json> [--dry]

Each existing cut becomes a pauses.py block (so the takes, stutter cuts and reorders stay exactly as chosen), and
pauses.py re-trims it with layout.json → cuts (pauses down to keep_pause_s, pad_before_s of air before the first sound).
The end is held at most tail_hold_s after his last word. Everything timed is moved onto the new timeline: iMessage cards
(`ctas[].at_out`, output seconds — same source moment as before), and hook_until / cta.at / nasheed.from / punch_at
(source seconds) are snapped into a kept cut if they now fall in a removed pause. Writes the edit back (with --dry,
prints it). Run check.py afterwards, as always."""
import argparse, json, subprocess, sys
from pathlib import Path

HERE = Path(__file__).resolve().parent
sys.path.insert(0, str(HERE))
import render  # noqa: E402

ap = argparse.ArgumentParser(); ap.add_argument("edit"); ap.add_argument("--dry", action="store_true")
a = ap.parse_args()
P = Path(a.edit).resolve(); base = P.parent; E = json.loads(P.read_text(encoding="utf-8"))
C = render.L["cuts"]; fps = render.probe(base / E["video"])[2]
old = E["cuts"]; oseg, odur, _ = render.timeline(old, fps)

r = subprocess.run([sys.executable, str(HERE / "pauses.py"), str(base / E["audio"]), str(base / E["words"]), "--video", str(base / E["video"]),
                    "--blocks", ",".join(f"{c['in']}-{c['out']}" for c in old)], capture_output=True, text=True)
if r.returncode: sys.exit(r.stderr)
new = json.loads(r.stdout.strip().splitlines()[-1]); print(r.stderr.strip(), file=sys.stderr)
hold = C.get("tail_hold_s", 0.8)
new[-1]["out"] = round(min(old[-1]["out"], new[-1]["out"] - C["pad_after_s"] + hold), 2)
nseg, ndur, to_out = render.timeline(new, fps)


def src_of_old(t):   # old output second → source second
    for s in oseg:
        if s["t0"] - 1e-6 <= t <= s["t0"] + s["n"] / fps + 1e-6: return s["in"] + t - s["t0"]
    return oseg[-1]["out"]


def snap(t, prefer):   # a source second that fell into a removed pause → the nearest kept edge on the preferred side
    if t is None or to_out(t) is not None: return t
    after = [c["in"] for c in new if c["in"] >= t]; before = [c["out"] for c in new if c["out"] <= t]
    pick = (after[:1] if prefer == "after" else before[-1:]) or after[:1] or before[-1:]
    return round(pick[0] - (0.02 if prefer == "before" else -0.02), 3)


changes = []
if isinstance(E.get("ctas"), list):
    for c in E["ctas"]:
        k = "at_out" if "at_out" in c else "at"; src = src_of_old(c[k]); t = to_out(snap(src, "after"))
        changes.append(f"card @{c[k]} → {t:.1f}"); c[k] = round(t, 1)
if E.get("hook_until") is not None: E["hook_until"] = snap(E["hook_until"], "before")
if E.get("cta"): E["cta"]["at"] = snap(E["cta"]["at"], "after")
if E.get("nasheed") and E["nasheed"].get("from") is not None: E["nasheed"]["from"] = snap(E["nasheed"]["from"], "after")
E["punch_at"] = [p for p in E.get("punch_at", []) if to_out(p) is not None]
E["cuts"] = new
print(f"{odur:.1f} s → {ndur:.1f} s, {len(old)} → {len(new)} cuts; " + "; ".join(changes), file=sys.stderr)
if a.dry: print(json.dumps(E, indent=1, ensure_ascii=False))
else: P.write_text(json.dumps(E, indent=1, ensure_ascii=False) + "\n", encoding="utf-8")
