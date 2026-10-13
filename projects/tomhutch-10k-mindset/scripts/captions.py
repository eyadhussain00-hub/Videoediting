#!/usr/bin/env python3
"""cache/words.json (whisper) → src/captions.json. Each group: n transcript words, display text, keywords, hide flag.
Display words take the transcript times when the counts match, else they're spread across the group's span."""
import json
W = json.load(open("cache/words.json"))
G = [  # (n words, display, keywords, hidden: the big graphic says it instead)
 (6, "10K per month means absolutely nothing.", [], True),
 (4, "When you hit it,", ["hit"], False), (4, "you wake up in", [], False), (3, "the same bed", ["same"], False),
 (3, "the next morning,", [], False), (4, "you have the same", ["same"], False), (3, "girlfriend or boyfriend,", [], False),
 (5, "you work with the same", ["same"], False), (2, "or maybe", [], False), (4, "a few extra clients.", ["clients."], False),
 (3, "Maybe you can", [], False), (4, "start to give money", ["money"], False), (3, "to your family", ["family"], False),
 (4, "or support your friends.", ["friends."], False), (3, "You might even", [], False), (4, "be able to afford", ["afford"], False),
 (4, "a business class flight", ["business", "class"], False), (4, "and larp on Instagram,", ["larp"], False), (2, "like me.", [], False),
 (4, "But other than that,", [], False), (3, "nothing really changes.", [], True), (3, "You just keep", [], False),
 (3, "playing the game.", ["game."], False), (5, "The point in this video", [], False), (3, "is to get you", [], False),
 (3, "to stop pedestalizing", ["pedestalizing"], False), (2, "10K a month,", ["10K"], False), (3, "because the minute", [], False),
 (7, "you stop looking up to it,", ["looking", "up"], False), (3, "it comes to you", ["comes"], False), (3, "a lot easier.", ["easier."], False),
 (3, "The minute you", [], False), (2, "normalize it", ["normalize"], False), (3, "in your mind,", ["mind,"], False),
 (3, "it starts to appear", ["appear"], False), (3, "in your reality,", ["reality,"], False), (3, "you'll also just", [], False),
 (4, "be able to regulate", ["regulate"], False), (2, "your emotions", ["emotions"], False), (3, "a lot easier", [], False),
 (5, "if you think of it", [], False), (3, "in this way.", [], False), (2, "You're welcome.", [], True),
]
assert sum(g[0] for g in G) == len(W), (sum(g[0] for g in G), len(W))
out, i = [], 0
for k, (n, text, keys, hide) in enumerate(G):
    ws = W[i:i + n]; i += n
    disp = text.split()
    s, e = ws[0]["s"], ws[-1]["e"]
    times = [w["s"] for w in ws] if len(disp) == n else [s + (e - s) * j / len(disp) for j in range(len(disp))]
    out.append({"s": s, "words": [{"w": d, "t": round(t, 3), "key": d in keys} for d, t in zip(disp, times)], "hide": hide})
for k, g in enumerate(out):   # each group holds until the next one starts (max 1.4 s after its last word)
    nxt = out[k + 1]["s"] if k + 1 < len(out) else g["s"] + 2
    g["e"] = round(min(nxt, g["words"][-1]["t"] + 1.4), 3)
json.dump(out, open("src/captions.json", "w"), indent=1)
print(len(out), "groups")
