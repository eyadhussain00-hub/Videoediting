"""Screen spellings for the transcript: plan/words.json (faster-whisper) → src/words.json.
Whisper heard "The reasons" for "Three sins", "members" for "remembrance", "won't" for "want to"."""
import json
w = json.load(open("plan/words.json"))
FIX = {(0, "The"): "Three", (1, "reasons"): "sins"}
for i, x in enumerate(w):
    if (i, x["w"]) in FIX:
        x["w"] = FIX[(i, x["w"])]
    elif x["w"] == "members":
        x["w"] = "remembrance"
    elif x["w"] == "won't":
        x["w"] = "want to"
    elif x["w"] == "Quran,":
        x["w"] = "Qur'an,"
    elif x["w"] == "warn":
        x["w"] = "warns"
# zero-length / swallowed words: give them a sane span
for i, x in enumerate(w):
    if x["e"] - x["s"] < 0.08:
        x["s"] = round(max(x["s"] - 0.12, w[i - 1]["e"] if i else 0), 3)
json.dump(w, open("src/words.json", "w"), indent=0)
print(" ".join(x["w"] for x in w))
