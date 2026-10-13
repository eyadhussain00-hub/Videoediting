"""plan/words.json (raw faster-whisper) → src/words.json with the spellings corrected for on-screen captions."""
import json
w = json.load(open("plan/words.json"))
out = []
i = 0
while i < len(w):
    x = dict(w[i]); nx = w[i + 1] if i + 1 < len(w) else None
    t = x["w"]
    if t == "Qur" and nx and nx["w"] == "'an":
        x["w"], x["e"] = "Qur'an", nx["e"]; i += 1
    elif t == "non" and nx and nx["w"].startswith("-"):
        x["w"], x["e"] = "non-negotiables", nx["e"]; i += 1
    elif t == "Isha" and nx and nx["w"] == "and" and i + 2 < len(w) and w[i + 2]["w"] == "Blueprint":
        x["w"], x["e"] = "Ihsan", nx["e"]; i += 1          # "Isha and Blueprint" = the Ihsan Blueprint
    elif t == "Come" and nx and nx["w"] == "up":
        x["w"], x["e"] = "Comment", nx["e"]; i += 1
    elif t == "Winter" and out and out[-1]["w"] == "Comment":
        x["w"] = "“WINTER”"
    elif t == "corn,":
        x["w"] = "“corn”,"
    elif t == "I" and nx and nx["w"] == "just":
        x["w"] = "I've"
    elif t in ("Brotherhood", "Men"):
        x["w"] = t.lower()
    elif t == "Unrecognisable":
        x["w"] = "Unrecognisable."
    out.append(x); i += 1
json.dump(out, open("src/words.json", "w"), indent=0, ensure_ascii=False)
print(" ".join(x["w"] for x in out))
