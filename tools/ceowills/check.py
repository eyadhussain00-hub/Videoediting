#!/usr/bin/env python3
"""Pre-render check for a CEOwills edit.json — catches the notes Eyad kept sending back, before any render time is spent.
Usage: check.py edit.json        → FAIL lines must be fixed; WARN lines must be read (fix, or say why in _source). Exit 1 on FAIL.

Checks: files (raw, lav audio, words, nasheed), cuts and length, title (present, ≤22 chars a line, gone before the first
card), end CTA (keyword actually spoken at `cta.at`), iMessage cards (chosen by hand, exist, fit the frame timeline,
match what he says around them, not repeated from recent videos), suspected stutters (long words inside kept cuts),
hand-set caption chunks that don't match the transcript."""
import contextlib, io, json, re, sys
from pathlib import Path

HERE = Path(__file__).resolve().parent
sys.path.insert(0, str(HERE))
import render  # noqa: E402  (layout, glossary, chunker and CTA helpers — same code the render uses)

L = render.L; FAILS, WARNS = [], []
fail = lambda m: FAILS.append(m)
warn = lambda m: WARNS.append(m)


def main():
    if len(sys.argv) != 2: sys.exit(__doc__)
    E_path = Path(sys.argv[1]).resolve(); base = E_path.parent; E = json.loads(E_path.read_text(encoding="utf-8"))
    if E.get("notify"): L["notify"].update(E["notify"])   # per-job card override, exactly as render.py applies it
    N = L["notify"]
    P = lambda k: (base / E[k]) if E.get(k) else None

    # ---- files
    if not E.get("name"): warn("no \"name\" — cta_history.json and the export name use it")
    if "rotate" not in E: warn("\"rotate\" not set — Sony files are usually sideways (\"ccw\"); look at a frame and set it")
    if not P("video") or not P("video").exists(): fail(f"raw video missing: {E.get('video')}")
    if not E.get("audio"): fail("no \"audio\": the lav mic is required (match_mic.py), never the camera audio")
    elif not P("audio").exists(): fail(f"lav audio missing: {E['audio']}")
    if not E.get("words") or not P("words").exists(): fail(f"words file missing: {E.get('words')}")
    nas = E.get("nasheed")
    if not nas: warn("no nasheed — the house bed is the-sins (muffled) unless Eyad said otherwise")
    elif not (base / nas["file"]).exists(): fail(f"nasheed file missing: {nas['file']} (the render would go out voice-only)")
    elif Path(nas["file"]).stem not in json.loads((HERE / "nasheeds.json").read_text(encoding="utf-8")):
        warn(f"nasheed '{Path(nas['file']).stem}' is not in nasheeds.json (Adnan's approved list)")

    # ---- timeline (render.py's own code, so the check sees exactly what the render will)
    fps = 25.0
    if P("video") and P("video").exists():
        try: fps = render.probe(P("video"))[2]
        except Exception: fail(f"raw video won't open (incomplete download?): {E['video']}")
    for i, c in enumerate(E.get("cuts", [])):
        if c["out"] <= c["in"]: fail(f"cut {i}: out {c['out']} ≤ in {c['in']}")
    # shots (a smooth join continues the shot): a short real shot next to a tiny pause reads as a flash cut (1 Oct)
    cuts = E.get("cuts", []); sh = []
    for i, c in enumerate(cuts):
        if not sh or c.get("join") != "smooth": sh.append([i])
        else: sh[-1].append(i)
    for g in sh:
        d = sum(cuts[i]["out"] - cuts[i]["in"] for i in g)
        if d >= L["cuts"].get("min_shot_s", 0.8): continue
        near = ([cuts[g[0]]["in"] - cuts[g[0] - 1]["out"]] if g[0] else []) + ([cuts[g[-1] + 1]["in"] - cuts[g[-1]]["out"]] if g[-1] + 1 < len(cuts) else [])
        gap = min([x for x in near if x >= 0], default=9)   # a negative gap = re-ordered words, on purpose
        (fail if gap <= 0.35 else warn)(f"shot at cut {g[0]} is only {d:.2f} s" + (f" and {gap:.2f} s from its neighbour — make that join smooth" if gap <= 0.35 else " — a flash cut? fine only if it's a whole word or line on purpose"))
    segs, dur, to_out = render.timeline(E.get("cuts", []), fps)
    if not segs: fail("no cuts")
    lo, hi = L["length"]["target_s"]
    if segs and not lo <= dur <= hi: fail(f"length {dur:.1f} s is outside {lo}–{hi} s")
    cta = E.get("cta"); cta_t = to_out(cta["at"]) if cta else None
    words = render.apply_glossary(json.loads(P("words").read_text(encoding="utf-8"))) if E.get("words") and P("words").exists() else []
    kept = render.caption_words(words, segs, to_out, None)   # everything he says in the kept cuts, CTA included
    said = lambda t0, t1: " ".join(w["word"] for w in kept if t0 <= w["start"] <= t1).lower()

    # ---- stutter suspects: Whisper hides a restart inside one long "word" (numbers/acronyms are naturally long; skip them)
    def suspect(w):
        core = re.sub(r"[^\w]", "", w["word"]); d = w["end"] - w["start"]
        return not (re.search(r"\d", core) or (len(core) > 1 and core.isupper())) and d > 0.6 and d > 0.35 + 0.09 * len(core)
    longw = [f"'{w['word']}' @{w['start']:.1f}s out ({w['end'] - w['start']:.2f}s)" for w in kept if suspect(w)]
    if longw: warn("long words inside kept cuts — check each for a hidden stutter (tools/common/stutters.py on that range): " + ", ".join(longw[:8]))

    # ---- someone else's voice at the head or tail (30 Sep, Sofian: "you can hear me say go at the start of videos")
    if segs and P("video") and P("video").exists() and E.get("audio") and P("audio").exists():
        import offmic
        v = offmic.voices(P("video"), P("audio"))
        c0, c1 = E["cuts"][0], E["cuts"][-1]
        for s0, s1 in v:
            if s1 > c0["in"] and s0 < min(c0["out"], c0["in"] + 1.5):
                fail(f"the director's voice at {s0:.2f}–{s1:.2f} s is in the first cut (starts {c0['in']}) — start after it (pauses.py --edit does)")
            if E.get("mute_after") is not None and s0 >= E["mute_after"] - 0.05: continue   # muted end hold
            if s0 < c1["out"] and s1 > max(c1["in"], c1["out"] - 1.5):   # a warning: a tap on the desk by the camera looks the same (#2)
                warn(f"something off his mic at {s0:.2f}–{s1:.2f} s in the last cut (ends {c1['out']}) — listen: the director's 'good'? end before it")
    if nas and nas.get("at") is not None and to_out(nas["at"]) is None: fail(f"nasheed.at {nas['at']} is not inside a kept cut")
    if E.get("mute_after") is not None and to_out(E["mute_after"]) is None: fail(f"mute_after {E['mute_after']} is not inside a kept cut")
    if cta and cta_t is not None and dur - cta_t < 1.0: fail(f"the end CTA is on screen for only {dur - cta_t:.1f} s (≥ 1.0 s: the words plus the end hold)")

    # ---- pauses as the viewer hears them (Sofian 1 Oct: "improve the pauses", "at the end it's not trimmed properly")
    if segs and E.get("audio") and P("audio").exists():
        import pauses as PZ
        lead, tail, long_ = PZ.audit(E, base, L["cuts"])
        keep = E.get("keep_pauses", [])
        long_ = [(t, d) for t, d in long_ if not any(abs(t - k) < 0.5 for k in keep)]
        if lead > 0.2: fail(f"{lead:.2f} s of silence before his first word (≤ 0.2)")
        if tail > L["cuts"].get("tail_max_s", 0.6): fail(f"{tail:.2f} s of silence after his last word — trim the end (≤ {L['cuts'].get('tail_max_s', 0.6)} s)")
        rv = [(t, d) for t, d in PZ.removed_voice(E, base, L["cuts"]) if not any(abs(t - k) < 0.5 for k in E.get("removed_ok", []))]
        if rv: fail("voiced sound removed with a pause (a clipped word?) at source " + ", ".join(f"{t:.2f}s ({d:.2f})" for t, d in rv[:10])
                    + " — listen; if it's a removed false start or stutter on purpose, list it in removed_ok (source s)")
        if long_: fail("pauses ≥ 0.35 s (out time, length): " + ", ".join(f"{t:.2f}s {d:.2f}" for t, d in long_[:10]) + " — cut them, or list them in keep_pauses (source s) with the reason")

    # ---- title
    hook = E.get("hook")
    if not hook:   # Eyad, 2 Oct: "remove all headers title text" — layout.json hook.required false
        if L["hook"].get("required", True): fail("no title (\"hook\") — frame 1 must carry the title")
    else:
        for line in hook:
            plain = re.sub(r"[*_]", "", line)
            if len(plain) > 22: warn(f"title line '{plain}' is {len(plain)} characters (≤ 22 keeps it big)")
            if "?" in plain and not E.get("hook_question"): fail(f"title line '{plain}' has a question mark — titles have none (Eyad, 1 Oct)")
        if E.get("hook_font", "sans") not in ("sans", "serif"): fail(f"hook_font '{E['hook_font']}' — use sans or serif")
        hu = E.get("hook_until")
        hu_out = to_out(hu) if hu is not None else dur
        if hu is not None and hu_out is None: fail(f"hook_until {hu} is not inside a kept cut")
        elif dur >= N["min_video_s"] and hu_out is not None and hu_out > N["first_s"]:
            warn(f"the title stays until {hu_out:.1f} s — past the first card at {N['first_s']} s (end it with the first sentence)")

    # ---- end CTA
    if words and not cta: warn("no end CTA — fine only if he doesn't say one in this take (qa.py --no-cta, say so in the preview caption)")
    elif cta:
        if cta_t is None: fail(f"cta.at {cta['at']} is not inside a kept cut")
        elif words:
            near = said(cta_t - 0.5, dur)
            if "comment" not in near: warn(f"no 'comment' spoken at cta.at ({cta_t:.1f} s out): '{near[:60]}'")
            if cta["keyword"].lower() not in near: fail(f"CTA keyword '{cta['keyword']}' isn't spoken after cta.at — the underline would never draw")

    # ---- iMessage cards
    spec = E.get("ctas", "auto")
    hist = render.cta_history()["videos"]
    recent = [k for name, ks in list(hist.items())[-N.get("recent_videos", 4):] if name != E.get("name") for k in ks]
    if dur < N["min_video_s"]:
        if isinstance(spec, list) and spec: warn(f"cards in a {dur:.0f} s reel — none under {N['min_video_s']} s")
    elif not isinstance(spec, list) and words:
        picked = render.plan_ctas(E, " ".join(w["word"] for w in kept), dur, cta_t)
        if picked: warn("cards are auto-picked — choose them for what he's saying and write \"ctas\" into edit.json. Auto would give: "
             + ", ".join(f"{k} @ {t:.0f}s" for k, t in picked))
    else:
        stop = cta_t if cta_t is not None else dur
        keys = [c.get("key") or c.get("text") for c in spec]
        if len(set(keys)) < len(keys): warn("the same card twice in one video")
        # cards written for the moment ({"text": …}, 30 Sep: "different in every video") must not repeat another video's
        others = {t for n, ks in hist.items() if n != E.get("name") for t in ks if t.startswith("say:")}
        for c in spec:
            t0 = c.get("at_out", c.get("at"))
            if c.get("text"):
                k = "say:" + re.sub(r"[^a-z0-9]+", "-", c["text"].lower()).strip("-")[:48]
                if k in others: fail(f"card text '{c['text'][:40]}…' is already used in another video — write this one for this moment")
                if "ceowills.com" not in c["text"].lower(): warn(f"card '{c['text'][:40]}…' doesn't end on ceowills.com")
                if t0 is None or t0 < 0 or t0 + N["hold_s"] > stop + 0.01: fail(f"card '{c['text'][:30]}…' at {t0} s runs into the end CTA / end ({stop:.1f} s)")
                continue
            k = c.get("key")
            if k not in render.CTAS: fail(f"card '{k}' is not in ctas.json"); continue
            if t0 is None or t0 < 0 or t0 + N["hold_s"] > stop + 0.01:
                fail(f"card '{k}' at {t0} s runs into the end CTA / end ({stop:.1f} s)"); continue
            tags = [x for x in render.CTAS[k]["tags"] if x != "generic"] if words else []
            ctx = said(t0 - 12, t0 + N["hold_s"])
            if tags and not any(re.search(r"\b" + re.escape(x), ctx) for x in tags) and "generic" not in render.CTAS[k]["tags"]:
                warn(f"card '{k}' at {t0:.0f} s: none of its topics ({', '.join(tags[:5])}) come up around it — is it the right card?")
            if k in recent: warn(f"card '{k}' was used in one of the last {N.get('recent_videos', 4)} videos — switch it up")
        if not spec: warn(f"no cards in a {dur:.0f} s reel (≥ {N['min_video_s']} s gets one every {N['every_s']} s)")

    # ---- hand-set caption chunks
    if E.get("chunks") and words:
        err = io.StringIO()
        with contextlib.redirect_stderr(err): render.chunk(render.caption_words(words, segs, to_out, cta_t), L["caption"], E["chunks"])
        for line in err.getvalue().splitlines(): fail(line)

    for m in WARNS: print(f"WARN  {m}")
    for m in FAILS: print(f"FAIL  {m}")
    print(f"{'OK' if not FAILS else f'{len(FAILS)} FAILED'}  ({dur:.1f} s, {len(segs)} cuts, {len(WARNS)} warnings)")
    sys.exit(1 if FAILS else 0)


if __name__ == "__main__":
    main()
