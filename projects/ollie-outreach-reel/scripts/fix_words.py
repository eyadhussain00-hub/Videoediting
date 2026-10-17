"""plan/words.json (raw faster-whisper, source times) → src/words.json with on-screen spellings.
Whisper hears "a hard no" as "a hard note"."""
import json
w = json.load(open("plan/words.json"))
for x in w:
    if x["w"] == "note.":
        x["w"] = "no."
json.dump(w, open("src/words.json", "w"), indent=0, ensure_ascii=False)
print(" ".join(x["w"] for x in w))
