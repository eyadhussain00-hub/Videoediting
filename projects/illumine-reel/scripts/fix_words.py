"""plan/words.json (raw faster-whisper, source times) → src/words.json with on-screen spellings.
Whisper splits "£20 ,000", "tax -free", "100 %" and "self -invested" into two tokens: they're glued back.
"do not drop a follow" is "do want to drop a follow" (his own burned-in captions say "want to drop").
The edit's cut list (src/data.ts SEGMENTS) maps these source times onto the timeline."""
import json
w = json.load(open("plan/words.json"))
out = []
for x in w:
    x = dict(x)
    if out and x["w"][:1] in ",-%" :
        out[-1]["w"] += x["w"]; out[-1]["e"] = x["e"]
        continue
    out.append(x)
for i, x in enumerate(out):
    if x["w"] == "not" and out[i - 1]["w"] == "do" and out[i + 1]["w"] == "drop":
        x["w"] = "want to"
    if x["w"] == "next" and out[i + 2]["w"] == "taxed":
        x["w"] = "rest"                           # "the rest is taxed as income" (his captions)
json.dump(out, open("src/words.json", "w"), indent=0, ensure_ascii=False)
print(" ".join(x["w"] for x in out))
