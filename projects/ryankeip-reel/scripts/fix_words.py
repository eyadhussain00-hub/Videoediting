"""plan/words.json (raw faster-whisper, source times) → src/words.json with on-screen spellings
("self -preservation" → "self-preservation", "over explaining" → "over-explaining").
The edit's cut list (plan/segments.json, read by src/data.ts) maps these source times onto the timeline."""
import json
w = json.load(open("plan/words.json"))
out, i = [], 0
while i < len(w):
    x = dict(w[i]); nx = w[i + 1] if i + 1 < len(w) else None
    if nx and (x["w"], nx["w"]) in {("self", "-preservation."), ("over", "explaining,")}:
        x["w"], x["e"] = x["w"] + "-" + nx["w"].lstrip("-"), nx["e"]; i += 1
    out.append(x); i += 1
json.dump(out, open("src/words.json", "w"), indent=0, ensure_ascii=False)
print(" ".join(x["w"] for x in out))
