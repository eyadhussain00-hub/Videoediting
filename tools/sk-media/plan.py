#!/usr/bin/env python3
"""job.json -> everything the renderer needs, in one step.
Usage: plan.py <workspace>/job.json          (all relative paths in the job resolve against its folder)

  1. cuts (snapped to whole words by "last" word) -> pauses.py -> edl.json
  2. voice: frame-exact pieces -> voice_raw.wav -> audio.sh -> voice_master.wav
  3. sections, punch-ins, one face framing per section (from facetrack.py output)
  4. captions (<= 4 words, no dangling function words, orphans folded, glossary + job fixes) -> captions.txt
  5. beats -> timed graphics (timing rules enforced), CTA, SFX cues -> sfx.wav mixed + limited -> mix.wav
  6. plan.json (input to render.py)
See jobs/tjr-v3.json for a complete example."""
import json, re, statistics, subprocess, sys, wave
from pathlib import Path
import numpy as np

TOOLS = Path(__file__).resolve().parent
L = json.loads((TOOLS / "layout.json").read_text()); FPS = L["canvas"]["fps"]; RD = L["motion"]["reading"]
GLOSS = {k: v for k, v in json.loads((TOOLS / "glossary.json").read_text()).items() if not k.startswith("_")}
WEAK = {"a", "an", "the", "of", "on", "to", "his", "her", "he", "she", "and", "or", "in", "that", "is", "who", "as",
        "he's", "it", "for", "like", "because", "about", "at", "with", "your", "my"}
BRANDS = {"tjr", "kick", "youtube", "tiktok", "instagram", "twitter", "x", "threads", "icp"}
norm = lambda s: re.sub(r"[^a-z0-9]", "", s.lower())

def main():
    jp = Path(sys.argv[1]).resolve(); J = json.loads(jp.read_text()); V = jp.parent
    P = lambda p: str(V / p) if p else None
    SRC = J["sources"]
    words = {k: json.loads(Path(P(s["words"])).read_text()) for k, s in SRC.items()}
    words = {k: (w["words"] if isinstance(w, dict) else w) for k, w in words.items()}
    words = {k: [{"word": x.get("word", x.get("w")), "start": x.get("start", x.get("s")), "end": x.get("end", x.get("e"))} for x in w]
             for k, w in words.items()}
    # word_patch: ASR merges restarts/stutters into one long "word" — replace words starting in [from, to) with verbatim
    # timings read off the RMS (see PRESET "Stutters"). {"src", "from", "to", "words": [[word, start, end], ...]}
    for wp in J.get("word_patch", []):
        W = [w for w in words[wp["src"]] if not (wp["from"] <= w["start"] < wp["to"])]
        W += [{"word": a, "start": b, "end": c} for a, b, c in wp["words"]]
        words[wp["src"]] = sorted(W, key=lambda w: w["start"])

    # ---------- 1. cuts -> tight word ranges -> pauses.py
    def last_word_t(src, t_in, last, occ=1):
        k = 0
        for w in words[src]:
            if w["start"] >= t_in - 0.03 and norm(w["word"]) == norm(last):
                k += 1
                if k == occ: return w["start"] + 0.01
        sys.exit(f"cut: '{last}' not found after {t_in} in {src}")
    cut = []
    for c in J["cuts"]:
        W = words[c["src"]]; c_in = c.get("in_t", c.get("in"))
        out_t = c.get("out_t") or c.get("out") or last_word_t(c["src"], c_in, c["last"], c.get("occ", 1))
        idx = [i for i, w in enumerate(W) if c_in - 0.03 <= w["start"] <= out_t]
        a, b = idx[0], idx[-1]
        lo = W[a - 1]["end"] + 0.01 if a > 0 else 0
        hi = W[b + 1]["start"] - 0.01 if b + 1 < len(W) else W[b]["end"] + 0.3
        # in_t / out_t: exact edges (e.g. inside a 60 ms gap after a stutter) — no padding, no clamping
        cin = c["in_t"] if "in_t" in c else round(max(W[a]["start"] - 0.08, lo), 3)
        cout = c["out_t"] if "out_t" in c else round(min(W[b]["end"] + 0.10, hi), 3)
        cut.append({"src": c["src"], "section": c["section"], "wi": [a, b], "in": cin, "out": cout,
                    "text": " ".join(W[i]["word"] for i in range(a, b + 1))})
    (V / "cutlist_tight.json").write_text(json.dumps(cut, indent=1))
    wx = V / "wx"; wx.mkdir(exist_ok=True); au = V / "audio"; au.mkdir(exist_ok=True)
    for k, s in SRC.items():
        (wx / f"{k}.json").write_text(json.dumps(words[k]))
        if not (au / f"{k}.wav").exists():
            subprocess.run(["ffmpeg", "-v", "error", "-y", "-i", P(s.get("audio") or s["face"]), "-vn", "-ac", "1", "-ar", "48000", str(au / f"{k}.wav")], check=True)
    r = subprocess.run([sys.executable, str(TOOLS / "pauses.py"), "--cutlist", str(V / "cutlist_tight.json"), "--words", str(wx), "--audio", str(au)],
                       capture_output=True, text=True, check=True)
    print(r.stderr.strip()); edl = json.loads(r.stdout); (V / "edl.json").write_text(json.dumps(edl, indent=1))
    f0 = 0; clips = []
    for i, e in enumerate(edl):
        n = int(round((e["out"] - e["in"]) * FPS)); clips.append({**e, "idx": i, "frames": n, "out_f0": f0, "dur": n / FPS}); f0 += n
    total = f0 / FPS

    # ---------- 2. voice
    sr = 48000; pieces = []; cache = {}
    for c in clips:
        if c["src"] not in cache:
            with wave.open(str(au / f"{c['src']}.wav")) as w: cache[c["src"]] = np.frombuffer(w.readframes(w.getnframes()), np.int16).astype(np.float32)
        x = cache[c["src"]]; s0 = int(round(c["in"] * sr)); n = int(round(c["frames"] * sr / FPS))
        p = np.pad(x[s0:s0 + n].copy(), (0, max(0, n - len(x[s0:s0 + n]))))
        fd = int(0.004 * sr); ramp = np.linspace(0, 1, fd); p[:fd] *= ramp; p[-fd:] *= ramp[::-1]; pieces.append(p)
    with wave.open(str(V / "voice_raw.wav"), "w") as w:
        w.setnchannels(1); w.setsampwidth(2); w.setframerate(sr); w.writeframes(np.concatenate(pieces).clip(-32768, 32767).astype(np.int16).tobytes())
    subprocess.run(["bash", str(TOOLS / "audio.sh"), str(V / "voice_raw.wav"), str(V / "voice_master.wav")], check=True)

    # ---------- 3. sections, punch-ins, face framing
    secs = {}
    for c in clips:
        s = secs.setdefault(c["section"], {"t0": c["out_f0"] / FPS, "dur": 0}); s["dur"] = c["out_f0"] / FPS + c["dur"] - s["t0"]
    for k, v in secs.items(): v["num"], v["title"] = J["sections"].get(k, ["", ""])
    prev = None
    for c in clips:
        same = prev and prev["section"] == c["section"]
        c["punch"] = (not prev.get("punch", False)) if (same and abs(prev["out"] - c["in"]) > 0.35) else (prev.get("punch", False) if same else False)
        prev = c
    fts = {k: json.loads(Path(P(s["facetrack"])).read_text()) for k, s in SRC.items()}
    asp = max(l["face"]["w"] / l["face"]["h"] for l in L["layouts"].values())
    for sec in secs:
        cs = [c for c in clips if c["section"] == sec]; s = SRC[cs[0]["src"]]; ft = fts[cs[0]["src"]]; W, H = ft["W"], ft["H"]
        off = s.get("face_offset", 0.0)
        pts = [p for p in ft["track"] for c in cs if c["in"] + off - 0.5 <= p["t"] <= c["out"] + off + 0.5] or ft["track"]
        cx = statistics.median(p["cx"] for p in pts); cy = statistics.median(p["cy"] for p in pts); fh = statistics.median(p["h"] for p in pts)
        hc = max(min(1.35 * fh, 2 * min(cx, W - cx) / asp, H) * 0.999, 1.15 * fh)  # widest crop that still centres the face
        for c in cs: c["face"] = {"cx": cx, "cy": min(max(cy + 0.06 * hc, hc / 2), H - hc / 2), "hc": hc}
    plan_clips = [{**c, "screen_src": P(SRC[c["src"]].get("screen")), "screen_t0": c["in"], "face_src": P(SRC[c["src"]]["face"]),
                   "face_t0": c["in"] + SRC[c["src"]].get("face_offset", 0.0), "face_W": fts[c["src"]]["W"], "face_H": fts[c["src"]]["H"]} for c in clips]

    # ---------- 4. captions
    display = {"kick": "Kick", "youtube": "YouTube", "tiktok": "TikTok", "instagram": "Instagram", "twitter": "Twitter",
               "threads": "Threads", "x": "X", "tjr": "TJR", "icp": "ICP"}
    fix = {**display, **{k.lower(): v for k, v in GLOSS.items() if " " not in k}, **{k.lower(): v for k, v in J.get("caption_fix", {}).items()}}
    pairs = {(a.lower(), b.lower()): v for a, b, v in J.get("caption_pairs", [])}
    keepcase = {v.lower() for v in fix.values()} | BRANDS
    caps = []
    for c in clips:
        W = words[c["src"]]; base = c["out_f0"] / FPS - c["in"]
        same = [k for k in clips if k["src"] == c["src"] and k["wi"] == c["wi"]]
        def owner(w):
            for k in same:
                if k["in"] - 0.02 <= w["start"] < k["out"]: return k
            ov = [(min(w["end"], k["out"]) - max(w["start"], k["in"]), k) for k in same]; ov = [o for o in ov if o[0] > 0.02]
            return max(ov, key=lambda o: o[0])[1] if ov else None
        ws = [dict(w, start=max(w["start"], c["in"]), src_start=w["start"]) for w in W[c["wi"][0]: c["wi"][1] + 1] if owner(w) is c]
        merged = []
        for w in ws:
            key = (merged[-1]["word"].lower().rstrip(",.?!"), w["word"].lower().rstrip(",.?!")) if merged else None
            if key in pairs: merged[-1] = dict(merged[-1], word=pairs[key], end=w["end"])
            else: merged.append(w)
        toks = []
        for w in merged:
            raw = w["word"]; lw = raw.lower().strip(",.?!\"")
            disp = fix.get(lw, raw.strip(",.?!\""))
            if disp[:1].isupper() and disp.lower() not in keepcase and lw not in ("i", "i've", "i'm", "i'll") and not disp.isupper():
                disp = disp.lower()
            if disp.lower() == "island" and toks and toks[-1]["w"] == "TJR": disp = "Island"
            toks.append({"w": disp, "s": round(w["start"] + base, 3), "e": round(min(w["end"], c["out"]) + base, 3),
                         "src": c["src"], "src_s": w.get("src_start", w["start"]), "brk": raw.endswith((".", "?", "!", ","))})
        chunk = []; mw = L["style"]["caption"]["max_words"]
        for i, t in enumerate(toks):
            chunk.append(t); nxt = toks[i + 1] if i + 1 < len(toks) else None
            if len(chunk) >= mw or t["brk"] or not nxt or nxt["s"] - t["e"] > 0.45 or sum(len(q["w"]) for q in chunk) >= 17:
                carry = []
                while nxt and not t["brk"] and len(chunk) > 2 and chunk[-1]["w"].lower() in WEAK and nxt["s"] - chunk[-1]["e"] < 0.45:
                    carry.insert(0, chunk.pop())
                caps.append({"words": chunk, "start": chunk[0]["s"], "sec": c["section"]}); chunk = carry
    i = 0
    while i < len(caps):
        ch = caps[i]
        if len(ch["words"]) == 1 and len(caps) > 1:
            if i + 1 < len(caps) and caps[i + 1]["sec"] == ch["sec"] and len(caps[i + 1]["words"]) < mw and caps[i + 1]["start"] - ch["words"][-1]["e"] < 1.0:
                caps[i + 1]["words"] = ch["words"] + caps[i + 1]["words"]; caps[i + 1]["start"] = ch["start"]; caps.pop(i); continue
            if i > 0 and caps[i - 1]["sec"] == ch["sec"] and len(caps[i - 1]["words"]) < mw and ch["start"] - caps[i - 1]["words"][-1]["e"] < 1.0:
                caps[i - 1]["words"] += ch["words"]; caps.pop(i); continue
        i += 1
    for i, ch in enumerate(caps):
        ch["end"] = round(min(caps[i + 1]["start"] if i + 1 < len(caps) else total, ch["words"][-1]["e"] + 0.6), 3)
    (V / "captions.txt").write_text("\n".join(" ".join(q["w"] for q in ch["words"]) for ch in caps))

    # ---------- 5. beats -> graphics, CTA, SFX
    TOK = [w for ch in caps for w in ch["words"]]
    def at(spec, end=False):
        """'word@t' = the spoken word at SOURCE time t (seconds in its recording, ±0.4 s) — survives re-cuts.
        'word@src:t' picks the source when two recordings could match."""
        word, t = spec.rsplit("@", 1); src = None
        if ":" in t: src, t = t.split(":")
        c = [w for w in TOK if norm(w["w"]) == norm(word) and abs(w["src_s"] - float(t)) <= 0.4 and (src is None or w["src"] == src)]
        if not c: sys.exit(f"beat word not found (is it still in the cut?): {spec}")
        w = min(c, key=lambda w: abs(w["src_s"] - float(t))); return w["e"] if end else w["s"]
    def sec_of(t): return next(k for k, v in secs.items() if v["t0"] <= t < v["t0"] + v["dur"])
    def reading(g):
        n = len((" ".join(str(g.get(k, "")) for k in ("text", "big", "sub", "l1", "l2")) + " " + " ".join(g.get("items", []))).split())
        return max(RD["min_ms"], RD["base_ms"] + RD["per_word_ms"] * n) / 1000
    gfx = []
    for i, b in enumerate(J.get("beats", [])):
        b = dict(b); typ = b.pop("type"); t0 = at(b.pop("at")); endw = b.pop("until", None)
        g = {"id": f"g{i:02d}", "type": typ, "t0": round(max(0.0, t0 - 0.05), 3), "sec": sec_of(t0), **b}
        g["t1"] = round(at(endw, end=True) + 0.25 if endw else t0 + reading(g), 3)
        if "item_words" in g: g["times"] = [round(at(x) - 0.05, 3) for x in g.pop("item_words")]
        if "count_word" in g:
            cw = g.pop("count_word"); g["count_end"] = round(min(at(cw, end=True) + 0.35, at(cw) + 0.45), 3)
        gfx.append(g)
    gfx.sort(key=lambda g: g["t0"]); warn = []
    for i, g in enumerate(gfx):  # 1) never cross a section / next graphic, 2) min reading time (start earlier), 3) phrase end
        sec = secs[g["sec"]]; s_end = sec["t0"] + sec["dur"] - 0.05
        if g["t0"] < L["opening_duration_s"]: s_end = min(s_end, L["opening_duration_s"] - 0.05)  # nothing crosses the layout switch
        nxt = next((h["t0"] for h in gfx[i + 1:] if h["sec"] == g["sec"]), s_end + 1) - 0.04
        prv = max([h["t1"] + 0.04 for h in gfx[:i] if h["sec"] == g["sec"]] + [sec["t0"] + (0.25 if sec["num"] else 0)])
        g["t1"] = min(g["t1"], s_end, nxt); need = reading(g)
        if g["t1"] - g["t0"] < need: g["t0"] = max(prv, g["t1"] - need)
        if g["t1"] - g["t0"] < need - 0.05: warn.append(f'{g["id"]} {g["type"]} {g["t1"]-g["t0"]:.2f}s < {need:.2f}s reading time')
        if "times" in g: g["times"] = [max(x, g["t0"]) for x in g["times"]]
        if "count_end" in g: g["count_end"] = min(g["count_end"], g["t1"] - 0.2)
    cta = J["cta"]
    ctad = {"keyword": cta["keyword"], "follow_t": at(cta["follow"]) - 0.1, "comment_t": at(cta["comment"]), "full_t": at(cta["full"]) - 0.05}
    bd = V / "cta_backdrop.png"; b = cta["backdrop"]; rg = J["screen_region"]
    subprocess.run(["ffmpeg", "-v", "error", "-y", "-ss", str(b["t"]), "-i", P(SRC[b["src"]]["screen"]), "-frames:v", "1",
                    "-vf", "crop=%d:%d:%d:%d" % tuple(rg), str(bd)], check=True)
    cues = [(secs[k]["t0"], "whoosh") for k in secs if secs[k]["num"]] + [(g["t0"], "pop") for g in gfx]
    cues += [(g["count_end"], "tick") for g in gfx if "count_end" in g] + [(ctad["follow_t"] + 0.45, "tick")]
    kept = []; pri = {"whoosh": 0, "tick": 1, "pop": 2}
    for t, kind in sorted(cues):
        if kept and t - kept[-1][0] < L["audio"]["sfx_min_gap_s"]:
            if pri[kind] < pri[kept[-1][1]]: kept[-1] = (t, kind)
            continue
        kept.append((t, kind))
    subprocess.run([sys.executable, str(TOOLS / "sfx.py"), str(V / "voice_master.wav"), str(V / "mix.wav"), json.dumps(kept)], check=True)

    # ---------- 6. plan.json
    plan = {"clips": plan_clips, "captions": caps, "sections": secs, "graphics": gfx, "headline": J["headline"], "cta": ctad,
            "cta_backdrop": str(bd), "cta_keyword": cta["keyword"], "screen_region": rg, "sfx": [{"t": t, "kind": k} for t, k in kept],
            "audio_master": str(V / "mix.wav"), "total_s": total}
    (V / "plan.json").write_text(json.dumps(plan, indent=1))
    print(f"plan: {len(clips)} clips, {total:.1f}s, {len(caps)} captions, {len(gfx)} graphics, {len(kept)} sfx")
    print("sections: " + ", ".join(f"{k} {v['t0']:.1f}+{v['dur']:.1f}" for k, v in secs.items()))
    for w in warn: print("WARN", w)

if __name__ == "__main__": main()
