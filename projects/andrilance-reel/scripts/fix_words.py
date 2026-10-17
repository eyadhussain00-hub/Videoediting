"""plan/words.json (raw faster-whisper, source times) → src/words.json with on-screen spellings:
numbers whisper split ("$500" ",000", "0" ".01" "%", "9" "-to" "-5"), hyphenated words ("high" "-ticket"),
and its mishearings ("Eman" = Iman Gadzhi, "name me"/"give me the word" = DM me, "If the quality" = It's the quality,
"people to sell too" = sell to, "spend the last 3 years" = spent)."""
import json
w = json.load(open("plan/words.json"))
out = []
for x in w:
    x = dict(x)
    glue = out and (x["w"][:1] in ",-." or x["w"] == "%") and x["w"] not in ("-",)
    if glue:
        p = out[-1]
        p["w"] = p["w"].rstrip(",.") + x["w"]
        p["e"] = x["e"]
        continue
    out.append(x)
fix = {"Eman,": "Iman,", "spend": "spent", "too,": "to,"}
for i, x in enumerate(out):
    if x["w"] in fix:
        x["w"] = fix[x["w"]]
    if x["w"] in ("name", "give") and i + 4 < len(out) and out[i + 4]["w"].startswith("prompt"):
        x["w"] = "DM"
    if x["w"] == "If" and out[i + 2]["w"] == "quality,":
        x["w"] = "It's"
    x["w"] = x["w"].replace("2-3", "2–3").replace("Micro-", "Micro-")
json.dump(out, open("src/words.json", "w"), indent=0, ensure_ascii=False)
print(" ".join(x["w"] for x in out))
