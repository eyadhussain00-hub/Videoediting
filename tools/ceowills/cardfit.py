"""Try iMessage card start times against a finished render before re-rendering (PRESET hard rule 6).
usage: python3 cardfit.py <render.mp4> <card bottom y from boxes.json> t1 t2 ...   → OK/BAD per candidate `at_out`
Uses the same head tracker as qa.py (heads.py): his hair top on the real frames every 0.5 s while the card would be up."""
import json, sys
from pathlib import Path
import heads

L = json.loads((Path(__file__).resolve().parent / "layout.json").read_text(encoding="utf-8")); N = L["notify"]
H, tol = L["canvas"]["h"], L["qa"]["head_tol_px"]
video, bottom = sys.argv[1], int(sys.argv[2])
for t in map(float, sys.argv[3:]):
    on, off = t + N["in_ms"] / 1000, t + N["hold_s"] - N["out_ms"] / 1000 - 0.05
    hair = [r[0] * H / heads.DH for _, img in heads.frames(video, on, off, 2, "") if (r := heads.head(img))]
    worst = min(hair, default=None)
    ok = worst is not None and bottom <= worst + tol
    print(f"{t:6.1f}", "OK " if ok else "BAD", "no face found" if worst is None else f"card ends {bottom}, his hair ≥ {worst:.0f}")
