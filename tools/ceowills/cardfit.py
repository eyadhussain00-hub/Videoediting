"""Try iMessage card start times against a finished render before re-rendering (PRESET hard rule 6).
usage: python3 cardfit.py <render.mp4> <card bottom y from boxes.json> t1 t2 ...   → OK/BAD per candidate `at_out`"""
import json, sys
from pathlib import Path
import qa

L = json.loads((Path(__file__).resolve().parent / "layout.json").read_text())
video, bottom = sys.argv[1], int(sys.argv[2])
for t in map(float, sys.argv[3:]):
    res = []
    qa.check = lambda name, ok, detail="": res.append((ok, detail))
    qa.head_clearance(video, {"cards": [{"key": "try", "in": t, "out": t + L["notify"]["hold_s"], "top": L["notify"]["y"], "bottom": bottom}]}, L)
    print(f"{t:6.1f}", "OK " if res and res[0][0] else "BAD", res[0][1] if res else "")
