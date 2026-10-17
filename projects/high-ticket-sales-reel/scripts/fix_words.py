"""plan/words.json (raw faster-whisper, source times) → src/words.json with on-screen spellings:
"$1" + ",000" → "$1,000"; "buyer's rules" is "buyer's remorse" (medium.en hears it right)."""
import json
w = json.load(open("plan/words.json"))
out, i = [], 0
while i < len(w):
    x = dict(w[i]); nx = w[i + 1] if i + 1 < len(w) else None
    if x["w"] == "$1" and nx and nx["w"].startswith(",000"):
        x["w"], x["e"] = "$1,000" + nx["w"][4:], nx["e"]; i += 1
    if x["w"] == "rules.": x["w"] = "remorse."
    out.append(x); i += 1
json.dump(out, open("src/words.json", "w"), indent=0, ensure_ascii=False)
print(" ".join(x["w"] for x in out))
