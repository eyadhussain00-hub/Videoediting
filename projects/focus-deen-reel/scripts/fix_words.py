"""plan/words.json (raw faster-whisper, source times) → src/words.json with on-screen spellings.
"Focus Deen" is the app FocusDeen (one word on the App Store). The edit's cut list (src/data.ts SEGMENTS)
maps these source times onto the timeline."""
import json
w = json.load(open("plan/words.json"))
out, i = [], 0
while i < len(w):
    x = dict(w[i]); nx = w[i + 1] if i + 1 < len(w) else None
    if x["w"] == "Focus" and nx and nx["w"].startswith("Deen"):
        x["w"], x["e"] = "FocusDeen" + nx["w"][4:], nx["e"]; i += 1
    elif x["w"] == "salah":
        x["w"] = "salah"
    out.append(x); i += 1
json.dump(out, open("src/words.json", "w"), indent=0, ensure_ascii=False)
print(" ".join(x["w"] for x in out))
