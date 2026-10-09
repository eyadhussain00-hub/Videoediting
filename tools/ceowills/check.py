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
    # Adnan's rotation (7 Oct): a new nasheed every 3–4 videos, then reuse the same 3 → tracker.json says which one per video
    row = next((v for v in json.loads((HERE / "tracker.json").read_text(encoding="utf-8"))["videos"]
                if Path(v.get("job", "")).name == E_path.name), None)
    if row and row.get("nasheed") and (not nas or Path(nas["file"]).stem != row["nasheed"]):
        fail(f"nasheed should be '{row['nasheed']}' (tracker.json rotation), job has {nas and Path(nas['file']).stem}")
    ec = E["endcard"] if "endcard" in E else L.get("endcard")
    if ec and not (HERE / ec["file"]).exists(): fail(f"end card missing: {ec['file']}")
    elif not ec: warn("no end card — Adnan wants his follow card at the end of every video (7 Oct)")

    # ---- timeline (render.py's own code, so the check sees exactly what the render will)
    fps = 25.0
    if P("video") and P("video").exists():
        try: fps = render.probe(P("video"))[2]
        except Exception: fail(f"raw video won't open (incomplete download?): {E['video']}")
    for i, c in enumerate(E.get("cuts", [])):
        if c["out"] <= c["in"]: fail(f"cut {i}: out {c['out']} ≤ in {c['in']}")
        elif c["out"] - c["in"] < L["cuts"]["min_clip_s"]: warn(f"cut {i} is only {c['out'] - c['in']:.2f} s — a flash cut?")
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

    # ---- title
    hook = E.get("hook")
    if not hook: fail("no title (\"hook\") — frame 1 must carry the title")
    else:
        for line in hook:
            plain = re.sub(r"[*_]", "", line)
            if len(plain) > 22: warn(f"title line '{plain}' is {len(plain)} characters (≤ 22 keeps it big)")
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
        for c in spec:
            k, t0 = c.get("key"), c.get("at_out", c.get("at"))
            if c.get("text"):   # a card written for this moment (30 Sep): only its timing and its link can be checked here
                if t0 is None or t0 < 0 or t0 + N["hold_s"] > stop + 0.01: fail(f"card '{c['text'][:30]}…' at {t0} s runs into the end CTA / end ({stop:.1f} s)")
                if "ceowills.com" not in c["text"].lower(): warn(f"card '{c['text'][:30]}…' doesn't end on ceowills.com")
                continue
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
