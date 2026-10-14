#!/usr/bin/env python3
"""Silence-safe pause removal for long takes → the "cuts" list for edit.json.

Usage: pauses.py <mic.wav> <words.json> --blocks "3.0-33.2,50.5-75.12,76.18-118.3" [--video raw.mp4] [--layout layout.json]
       pauses.py --edit edit.json [--out new.edit.json]
         re-tightens a finished job: every cut is a block, re-cut with the current layout.json numbers; card times
         (ctas at_out, in output seconds) move with the new timeline. Prints a before/after summary.

Blocks = the parts of the take you keep (source seconds; put each edge somewhere in the silence around it). Inside
each block, silences ≥ min_pause_s are cut down to keep_pause_s. A cut only lands where both the full band and the
3.5–11 kHz band are quiet (so soft consonants survive), on a video-frame boundary, never inside a word. ASR words
longer than guard_long_s usually swallowed a pause (Adnan pauses mid-sentence and Whisper stretches the word over it),
so only guard_edge_s at each end of those words is protected. Block edges snap to the real speech (energy), not to
Whisper's word times — Whisper stretches first words back into the silence before them.
Prints JSON cuts [{"in","out","punch"}] (every other cut punched in, to hide the jump cuts) and a summary on stderr.
Numbers: layout.json → cuts (min_pause_s, keep_pause_s, quiet_db, hf_band_hz, min_clip_s, guard_long_s, guard_edge_s)."""
import argparse, json, re, subprocess, sys
from pathlib import Path
import numpy as np

HOP = 0.005
SR = 48000


def band_db(x, lo=None, hi=None):
    n, hop = int(SR * HOP) * 2, int(SR * HOP)
    frames = np.lib.stride_tricks.sliding_window_view(np.pad(x, (n // 2, n)), n)[::hop]
    spec = np.abs(np.fft.rfft(frames * np.hanning(n), axis=1)) ** 2
    f = np.fft.rfftfreq(n, 1 / SR)
    sel = np.ones_like(f, bool) if lo is None else (f >= lo) & (f <= hi)
    return 10 * np.log10(spec[:, sel].sum(1) + 1e-12)


def audit(E, base, C, quiet_db=22):
    """What the viewer hears: silence before his first word, after his last, and every mid pause ≥ 0.35 s
    (out time, length) in the kept lav audio — joins included. Used by check.py."""
    fps = video_fps(base / E["video"]); SR_ = 16000; h = int(0.01 * SR_)
    x = np.frombuffer(subprocess.run(["ffmpeg", "-v", "error", "-i", str(base / E["audio"]), "-ac", "1", "-ar", str(SR_), "-f", "f32le", "-"],
                                     capture_output=True, check=True).stdout, np.float32)
    def lv(a, b):
        y = x[int(a * SR_):int(b * SR_)]; m = len(y) // h
        return 10 * np.log10((y[:m * h].reshape(m, h) ** 2).mean(1) + 1e-12) if m else np.zeros(0)
    if E.get("mute_after") is not None:   # the muted end is silent in the render
        x = x.copy(); x[int(E["mute_after"] * SR_):] = 0
    parts, t, times = [], 0.0, []
    for c in E["cuts"]:
        e = lv(c["in"], c["out"]); parts.append(e); times.append(t + np.arange(len(e)) * 0.01); t += round((c["out"] - c["in"]) * fps) / fps
    e = np.concatenate(parts); tt = np.concatenate(times); q = e < np.percentile(e, 90) - quiet_db
    runs, k = [], 0
    while k < len(q):
        if q[k]:
            j = k
            while j < len(q) and q[j]: j += 1
            runs.append((tt[k], (j - k) * 0.01)); k = j
        else: k += 1
    lead = runs[0][1] if runs and runs[0][0] < 0.02 else 0.0
    tail = runs[-1][1] if runs and runs[-1][0] + runs[-1][1] >= t - 0.05 else 0.0
    mid = [(round(a, 2), round(d, 2)) for a, d in runs if a > 0.02 and a + d < t - 0.05 and d >= 0.35]
    return lead, tail, mid


def word_voiced(low, rl, C):
    """Voiced frames that belong to a word: voiced (80–400 Hz within voiced_db of his speech) and part of a run that reaches
    voiced_peak_db of it, or within 30 ms of such a frame (a word's fade-out flickers round the threshold). A soft "the"
    peaks 6 dB under his speech (#6); the hum he breathes out between phrases stays 20+ dB under it and is a pause
    (#2 "so when … they" kept 0.38 s of it, 1 Oct)."""
    v = low > rl - C.get("voiced_db", 22); strong = low > rl - C.get("voiced_peak_db", 16)
    near = np.convolve(strong.astype(float), np.ones(13), "same") > 0   # ±30 ms at 5 ms frames
    out = np.zeros_like(v); idx = np.flatnonzero(v)
    if len(idx):
        for r in np.split(idx, np.flatnonzero(np.diff(idx) > 3) + 1):   # bridge 5–10 ms flickers
            if strong[r[0]:r[-1] + 1].any(): out[r[0]:r[-1] + 1] = v[r[0]:r[-1] + 1]
    return out | (v & near)


def removed_voice(E, base, C, max_gap=1.0):
    """Voiced sound inside the pauses an edit removes (gaps < max_gap between consecutive cuts): a clipped soft word
    ("the", the "b" of "bad") shows up here (1 Oct, #6/#16). → [(source s, voiced length s)]"""
    x = np.frombuffer(subprocess.run(["ffmpeg", "-v", "error", "-i", str(base / E["audio"]), "-ac", "1", "-ar", str(SR), "-f", "f32le", "-"],
                                     capture_output=True, check=True).stdout, np.float32).astype(np.float64)
    low, full = band_db(x, 80, 400), band_db(x)
    cuts = E["cuts"]
    sel = np.concatenate([np.arange(int(c["in"] / HOP), min(int(c["out"] / HOP), len(low) - 1)) for c in cuts])
    rl, rf = np.percentile(low[sel], 90), np.percentile(full[sel], 90)
    wv = word_voiced(low, rl, C); out = []
    for a, b in zip(cuts, cuts[1:]):
        if not (0 < b["in"] - a["out"] < max_gap): continue
        seg = wv[int(a["out"] / HOP):int(b["in"] / HOP)] & (full[int(a["out"] / HOP):int(b["in"] / HOP)] > rf - 26)
        if seg.sum() * HOP >= 0.04: out.append((round(a["out"], 2), round(seg.sum() * HOP, 2)))
    return out


def video_fps(video):
    if not video: return 25.0
    r = subprocess.run(["ffprobe", "-v", "error", "-select_streams", "v:0", "-show_entries", "stream=r_frame_rate", "-of", "csv=p=0",
                        str(video)], capture_output=True, text=True).stdout.strip()
    n, d = map(float, r.split("/")); return n / d


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("audio", nargs="?"); ap.add_argument("words", nargs="?")
    ap.add_argument("--blocks", help='"in-out,in-out,…" in source seconds')
    ap.add_argument("--video", help="camera file (for its frame rate); default 25 fps")
    ap.add_argument("--layout", default=str(Path(__file__).with_name("layout.json")))
    ap.add_argument("--edit", help="re-tighten this edit.json (its cuts are the blocks)"); ap.add_argument("--out")
    a = ap.parse_args()
    C = json.loads(Path(a.layout).read_text(encoding="utf-8"))["cuts"]
    if a.edit: return retighten(a, C)
    blocks = [tuple(map(float, b.split("-"))) for b in a.blocks.split(",")]
    cuts, removed = cut_blocks(a.audio, a.words, blocks, video_fps(a.video), C)
    print(json.dumps(cuts))
    print(f"{len(cuts)} cuts, {sum(c['out'] - c['in'] for c in cuts):.1f} s kept, {removed:.1f} s of pauses removed", file=sys.stderr)


def retighten(a, C):
    """Every cut of a finished job → re-cut with today's numbers. Cards are placed in output seconds, so each card's time is
    taken back to the source through the old timeline and forward through the new one."""
    ep = Path(a.edit).resolve(); base = ep.parent; E = json.loads(ep.read_text(encoding="utf-8"))
    fps = video_fps(base / E["video"])
    def timeline(cuts):
        t, segs = 0.0, []
        for c in cuts: n = int(round((c["out"] - c["in"]) * fps)); segs.append((c["in"], c["out"], t)); t += n / fps
        return segs, t
    old, old_d = timeline(E["cuts"])
    blocks = [[c["in"], c["out"]] for c in E["cuts"]]
    # 30 Sep (Sofian: "you can hear me say go at the start of videos"): the video starts after the director's last word
    # and the end hold stops before his "good" — offmic.py tells his voice from Adnan's by the camera/lav balance
    import offmic
    v = offmic.voices(base / E["video"], base / E["audio"])
    hold = blocks[-1][1]
    for s0, s1 in v:
        if s1 > blocks[0][0] - 0.1 and s0 < blocks[0][0] + 1.5: blocks[0][0] = max(blocks[0][0], s1 + 0.02)
        if s0 < blocks[-1][1] + 0.1 and s1 > blocks[-1][1] - 1.5: blocks[-1][1] = min(blocks[-1][1], s0 - 0.02)
    cuts, removed = cut_blocks(base / E["audio"], base / E["words"], blocks, fps, C)
    # the end: tail_hold_s after his last word (Sofian 1 Oct: "at the end it's not trimmed properly" — the old silent
    # holds ran 0.8–1.5 s); if something off his mic falls in that, his mic is muted from there
    if blocks[-1][1] < hold - 0.05: E["mute_after"] = round(blocks[-1][1], 2)
    else: E.pop("mute_after", None)
    # tail_hold_s after his last word: from the word itself (when the end was pulled in before an off-mic sound, the mic
    # is muted there and the picture still holds the usual time — #2's CTA)
    last_w = max((w["end"] for w in json.loads((base / E["words"]).read_text(encoding="utf-8")) if w["end"] <= cuts[-1]["out"] + 0.05), default=cuts[-1]["out"])
    end = max(cuts[-1]["out"] + max(0.0, C.get("tail_hold_s", 0.35) - C.get("pad_after_s", 0.12)), last_w + C.get("tail_hold_s", 0.35))
    cuts[-1]["out"] = round(min(hold, max(cuts[-1]["out"], np.ceil(end * fps) / fps)), 2)
    if E.get("mute_after") is not None and E["mute_after"] >= cuts[-1]["out"] - 0.02: E.pop("mute_after")
    cuts = tighten_edges(cuts, base / E["audio"], fps, C, json.loads((base / E["words"]).read_text(encoding="utf-8")))
    cuts = merge_short(cuts, base / E["audio"], C)
    cuts = assign_zoom(cuts, C)
    new, new_d = timeline(cuts)
    def remap(t_out):
        src = next((i + (t_out - t0) for i, o, t0 in old if t0 <= t_out <= t0 + (o - i) + 1e-6), None)
        if src is None: return t_out
        for i, o, t0 in new:   # a time that fell in a removed pause moves to the next kept frame
            if src <= o: return round(t0 + max(0.0, src - i), 2)
        return round(new_d, 2)
    def keep(t, later):   # a source time that fell in a removed pause → the nearest kept frame (next or previous)
        if t is None or any(c["in"] - 1e-6 <= t <= c["out"] + 1e-6 for c in cuts): return t
        if later: return min((c["in"] for c in cuts if c["in"] > t), default=t)
        return max((c["out"] for c in cuts if c["out"] < t), default=t)
    if E.get("hook_until") is not None: E["hook_until"] = keep(E["hook_until"], False)
    if E.get("cta"): E["cta"]["at"] = keep(E["cta"]["at"], True)
    if E.get("nasheed") and E["nasheed"].get("at") is not None: E["nasheed"]["at"] = keep(E["nasheed"]["at"], True)
    E["punch_at"] = [keep(p, True) for p in E.get("punch_at", [])]
    if isinstance(E.get("ctas"), list):
        for c in E["ctas"]:
            if "at_out" in c: c["at_out"] = remap(c["at_out"])
    E["cuts"] = cuts
    out = Path(a.out) if a.out else ep
    out.write_text(json.dumps(E, indent=1, ensure_ascii=False) + "\n", encoding="utf-8")
    print(f"{ep.name}: {len(old)} → {len(cuts)} cuts, {old_d:.2f} → {new_d:.2f} s ({removed:.1f} s of air removed); "
          f"first cut in {old[0][0]:.2f} → {cuts[0]['in']:.2f}; cards " + ", ".join(str(c.get("at_out")) for c in (E.get("ctas") or []) if isinstance(c, dict)))


def breath_mask(full, hf, low, REF, words, i0, i1, C):
    """Frames i0:i1 that are breath (pause), not speech. 1 Oct (Sofian: "improve the pauses"): anything breath_db under his
    speech in the full band, unvoiced (no 80–400 Hz voice energy: a soft voiced syllable keeps it) and not a fricative (an
    "s"/"sh"/"f" is quiet overall but strong at 3.5–11 kHz: #14's "So" lost its S in a first try). A hissy in-breath is
    strong up there too: it counts as breath when the words either side have no s/z/x/f/sh/ch/th at that edge (#9)."""
    seg_f, seg_h, seg_l = full[i0:i1], hf[i0:i1], low[i0:i1]; bd = C.get("breath_db", 99)
    breath = (seg_f < REF["f"] - bd) & (seg_l < REF["l"] - bd - 4) & (seg_h < REF["h"] - C.get("breath_hf_db", 12))
    hiss = (seg_f < REF["f"] - bd) & (seg_l < REF["l"] - bd - 8) & ~breath
    k_ = 0
    while k_ < len(hiss):
        if hiss[k_]:
            j_ = k_
            while j_ < len(hiss) and hiss[j_]: j_ += 1
            a_ = (i0 + k_) * HOP
            if (j_ - k_) * HOP >= 0.12:
                b_ = (i0 + j_) * HOP; cl = lambda w: re.sub(r"[^a-z]", "", w["word"].lower())
                ends_f = lambda t: t[-1:] in tuple("sxzf") or t.endswith(("sh", "ch", "ce", "se", "ze"))
                starts_f = lambda t: t[:1] in tuple("szfx") or t.startswith(("sh", "ch", "ce", "ci", "cy"))
                # Whisper's word times are loose (#14 put "so" 0.1 s before the real S, the word's start 0.8 s early): any
                # word reaching within 0.3 s of the hiss, either edge of it
                fric = any(w["start"] <= b_ + 0.3 and w["end"] >= a_ - 0.3 and (ends_f(cl(w)) or starts_f(cl(w))) for w in words)
                if not fric: breath[k_:j_] = True
            k_ = j_
        else: k_ += 1
    return breath


def tighten_edges(cuts, audio, fps, C, words=()):
    """Every piece ends edge_after_s after his last sound and starts edge_before_s before his first (1 Oct: the padding on
    both sides of a join added up to 0.4 s of air, #10 "not you." → "Comment MORE"). A sound = within voice_db of his
    speech level, or a fricative (strong at 3.5–11 kHz). The last cut keeps its end (the end hold is set separately)."""
    x = np.frombuffer(subprocess.run(["ffmpeg", "-v", "error", "-i", str(audio), "-ac", "1", "-ar", str(SR), "-f", "f32le", "-"],
                                     capture_output=True, check=True).stdout, np.float32).astype(np.float64)
    full, hf, low = band_db(x), band_db(x, *C["hf_band_hz"]), band_db(x, 80, 400)
    sel = np.concatenate([np.arange(int(c["in"] / HOP), min(int(c["out"] / HOP), len(full) - 1)) for c in cuts])
    REF = {"f": np.percentile(full[sel], 90), "h": np.percentile(hf[sel], 90), "l": np.percentile(low[sel], 90)}
    # voice: loud enough, or a fricative, or voiced at all (a soft unstressed "the"/"a" is quiet but voiced: #6's
    # "the liquidity, the funds" lost its second "the" without this, 1 Oct)
    voice = ((full > REF["f"] - C.get("voice_db", 20)) | (hf > REF["h"] - C.get("breath_hf_db", 12))
             | word_voiced(low, REF["l"], C)) & ~breath_mask(full, hf, low, REF, words, 0, len(full), C)
    ea, eb = C.get("edge_after_s", 0.1), C.get("edge_before_s", 0.05)
    out = [dict(c) for c in cuts]
    voiced = low > REF["l"] - C.get("voiced_db", 22)
    bl, gs, ge = C.get("edge_blip_s", 0.12), C.get("edge_blip_gap_s", 0.15), C.get("edge_blip_gap_end_s", 0.2)
    for i, c in enumerate(out):
        i0, i1 = int(c["in"] / HOP), int(c["out"] / HOP); v = np.flatnonzero(voice[i0:i1])
        if not len(v): continue
        # a lone unvoiced click/smack/sniff at an edge, cut off from the speech by air, isn't a word: the piece starts
        # (ends) at the speech (1 Oct, #12 opened on 0.3 s of a lip smack and air before "If")
        runs = np.split(v, np.flatnonzero(np.diff(v) > 3) + 1)   # 5–10 ms flickers don't split a sound
        cl = lambda w: re.sub(r"[^a-z]", "", w["word"].lower())
        def lone(r, nxt, gap, edge):   # unvoiced, short, air between it and the speech, and no consonant-led word there
            if (r[-1] - r[0] + 1) * HOP > bl or (abs(nxt - (r[0] if edge == "end" else r[-1])) - 1) * HOP < gap or voiced[i0 + r].sum() * HOP >= 0.03: return False   # a click has a few voiced frames, a soft word more
            a_, b_ = (i0 + min(r[0], nxt)) * HOP, (i0 + max(r[-1], nxt)) * HOP
            # only next to a word that starts (ends) on a vowel or a soft consonant: a T/K/S/F/H/Th edge has its own short
            # burst or hiss apart from the vowel ("Start", "hate," — 1 Oct, the T of #7's "hate" sits 0.15 s after the vowel)
            soft = tuple("aeiouywlmnr")
            if edge == "start":
                # the word he starts with: the first one not over before the blip (Whisper may put it a little early)
                w = min((w for w in words if w["end"] > a_ - 0.05 and w["start"] <= b_ + 0.3 and cl(w)), key=lambda w: w["start"], default=None)
                return w is not None and cl(w)[:1] in soft
            fin = lambda t: t[:-1] if len(t) > 2 and t.endswith("e") else t   # "hate" ends on its T, "time" on its M
            # the word he ends on: the last one begun before the blip ends
            w = max((w for w in words if w["start"] < b_ + 0.05 and w["end"] >= a_ - 0.3 and cl(w)), key=lambda w: w["start"], default=None)
            return w is not None and fin(cl(w))[-1:] in soft
        while len(runs) > 1 and lone(runs[0], runs[1][0], gs, "start"): runs = runs[1:]
        while len(runs) > 1 and i + 1 < len(out) and lone(runs[-1], runs[-2][-1], ge, "end"): runs = runs[:-1]
        first, last = (i0 + runs[0][0]) * HOP, (i0 + runs[-1][-1] + 1) * HOP
        if i + 1 < len(out):
            new_out = np.ceil((last + ea) * fps) / fps
            if new_out < c["out"] - 0.03: c["out"] = round(new_out, 2)
        if True:   # the first piece too: the video opens on his first sound, not on air before it
            new_in = np.floor((first - eb) * fps) / fps
            if new_in > c["in"] + 0.03: c["in"] = round(new_in, 2)
    return [c for c in out if c["out"] - c["in"] > 0.05]


def assign_zoom(cuts, C):
    """Zoom pattern on the final cuts: the zoom changes at a cut once the shot has run min_shot_s; sooner, the cut keeps the
    zoom ("join": "smooth", the drift carries on). A last shot shorter than min_shot_s keeps the previous zoom too."""
    out, z, run = [], False, 0.0
    for i, c in enumerate(cuts):
        c = {k: v for k, v in c.items() if k not in ("join", "punch")}
        if i:
            if run >= C.get("min_shot_s", 0.8): z = not z; run = 0.0
            else: c["join"] = "smooth"
        run += c["out"] - c["in"]
        if z: c["punch"] = True
        out.append(c)
    if len(out) > 1:   # the last shot: if it's short, it keeps the zoom before it
        k = max(i for i, c in enumerate(out) if i == 0 or c.get("join") != "smooth")
        if k and sum(c["out"] - c["in"] for c in out[k:]) < C.get("min_shot_s", 0.8):
            for c in out[k:]:
                c["join"] = "smooth"; c.pop("punch", None)
                if out[k - 1].get("punch"): c["punch"] = True
    return out


def merge_short(cuts, audio, C):
    """A real shot shorter than min_shot_s next to a ≤ merge_gap_s join reads as a flash cut (#2 v7 at 1:25, Eyad 1 Oct)
    → that join becomes smooth (same zoom, dissolve), keeping the pause cut — only when the join is silent on the lav,
    so it's a pause and not a word the edit removed. Re-ordered cuts (negative gap) stay real cuts. Then zoom
    alternates per shot (a smooth piece takes its shot's zoom)."""
    x = np.frombuffer(subprocess.run(["ffmpeg", "-v", "error", "-i", str(audio), "-ac", "1", "-ar", "16000", "-f", "f32le", "-"],
                                     capture_output=True, check=True).stdout, np.float32)
    lvl = lambda a, b: 10 * np.log10(np.mean(x[int(a * 16000):max(int(b * 16000), int(a * 16000) + 1)] ** 2) + 1e-12)
    speech = np.percentile([lvl(c["in"], c["out"]) for c in cuts], 50)
    cuts = [dict(c) for c in cuts]
    def shots():
        out, cur = [], []
        for i, c in enumerate(cuts):
            if cur and c.get("join") != "smooth": out.append(cur); cur = []
            cur.append(i)
        return out + [cur]
    changed = True
    while changed:
        changed = False
        for sh in shots():
            d = sum(cuts[i]["out"] - cuts[i]["in"] for i in sh)
            if d >= C.get("min_shot_s", 0.8): continue
            a, b = sh[0], sh[-1]; opts = []
            if a and 0 <= cuts[a]["in"] - cuts[a - 1]["out"] <= C.get("merge_gap_s", 0.35): opts.append((cuts[a]["in"] - cuts[a - 1]["out"], a))
            if b + 1 < len(cuts) and 0 <= cuts[b + 1]["in"] - cuts[b]["out"] <= C.get("merge_gap_s", 0.35): opts.append((cuts[b + 1]["in"] - cuts[b]["out"], b + 1))
            for gap, j in sorted(opts):
                if lvl(cuts[j - 1]["out"], cuts[j]["in"]) < speech - 18:   # the join is a pause, not a removed word
                    cuts[j]["join"] = "smooth"; changed = True; break
            if changed: break
    p = False
    for i, c in enumerate(cuts):
        if i and c.get("join") != "smooth": p = not p
        c.pop("punch", None)
        if p: c["punch"] = True
    return cuts


def cut_blocks(audio, words_path, blocks, fps, C):
    x = np.frombuffer(subprocess.run(["ffmpeg", "-v", "error", "-i", str(audio), "-ac", "1", "-ar", str(SR), "-f", "f32le", "-"],
                                     capture_output=True, check=True).stdout, np.float32).astype(np.float64)
    full, hf, low = band_db(x), band_db(x, *C["hf_band_hz"]), band_db(x, 80, 400)
    words = json.loads(Path(words_path).read_text(encoding="utf-8"))
    edge, long_ = C.get("guard_edge_s", 0.2), C.get("guard_long_s", 0.5)
    # his speech level over every kept block (1 Oct: a quiet block judged against itself kept the low tail after "wills."
    # in #2 as "voice"; the viewer hears it against the whole video)
    sel = np.concatenate([np.arange(int(a / HOP), min(int(b / HOP), len(full) - 1)) for a, b in blocks])
    REF = {"f": np.percentile(full[sel], 90), "h": np.percentile(hf[sel], 90), "l": np.percentile(low[sel], 90)}
    pieces_all, removed = [], 0.0; WV = word_voiced(low, REF["l"], C)
    for t0, t1 in blocks:
        i0, i1 = int(t0 / HOP), min(int(t1 / HOP), len(full) - 1)
        seg_f, seg_h = full[i0:i1], hf[i0:i1]
        quiet = (seg_f < REF["f"] - C["quiet_db"]) & (seg_h < REF["h"] - C["quiet_db"])
        # 1 Oct (Sofian: "improve the pauses"): breaths are pauses too — anything breath_db under his speech in the full band
        # (a breath sits 18–28 dB down; word-final s/x/sh only 10–15 dB down) counts as pause, and the take starts/ends on
        # his voice, not on an in-breath
        seg_l = low[i0:i1]
        breath = breath_mask(full, hf, low, REF, words, i0, i1, C)
        voiced = WV[i0:i1]   # a soft "the"/"a" is quiet but voiced (#6, 1 Oct)
        lm = ~(quiet | breath) | (voiced & ~breath); k_ = 0   # speech edges ignore clicks: loud runs shorter than 30 ms (#2: a 5 ms tick at 12.155 s held 0.5 s)
        while k_ < len(lm):
            if lm[k_]:
                j_ = k_
                while j_ < len(lm) and lm[j_]: j_ += 1
                if j_ - k_ < 6: lm[k_:j_] = False
                k_ = j_
            else: k_ += 1
        loud = np.flatnonzero(lm)
        if not len(loud):
            continue
        guard = quiet.copy()
        for w in words:
            if not (t0 <= w["start"] < t1):
                continue
            spans = [(w["start"], w["end"])]
            if w["end"] - w["start"] > long_:
                spans = [(w["start"], w["start"] + edge), (w["end"] - edge, w["end"])]
            for ws, we in spans:
                guard[max(0, int(ws / HOP) - i0): max(0, min(int(we / HOP), i1) - i0)] = False
        # 30 Sep ("the trimming isn't fast like ExamQA"): Whisper stretches words over his pauses, so the word guard kept
        # 5–8 s of real silence per video. Audio this far under his speech in both bands is a pause, whatever Whisper says.
        dq = C.get("deep_quiet_db")
        extra = breath.copy()
        if dq: guard |= (seg_f < REF["f"] - dq) & (seg_h < REF["h"] - C.get("deep_quiet_hf_db", dq)) & ~voiced   # true silence: always a pause
        guard |= extra   # an unvoiced breath ≥ min_pause_s isn't inside a word, even when Whisper's span says so (#16 "and", #6 "for")
        guard &= ~voiced   # a word's voiced fade-out is never pause (#16: the cut fell 0.04 s into the tail of "turmoil")
        energy = seg_f + seg_h

        def boundary(lo, hi, mask, pick="quietest"):
            """Frame boundary in [lo, hi] that lies in silence: the quietest, or the first / last one (inside a pause the cut
            goes in as early and comes out as late as the margins allow — 'quietest' left 0.04 s cuts that were skipped, 1 Oct)."""
            c = [k / fps for k in range(int(np.ceil(lo * fps - 1e-6)), int(np.floor(hi * fps + 1e-6)) + 1)]
            c = [t for t in c if 0 <= int(round(t / HOP)) - i0 < len(mask) and mask[int(round(t / HOP)) - i0]]
            if not c: return None
            return c[0] if pick == "first" else c[-1] if pick == "last" else min(c, key=lambda t: energy[int(round(t / HOP)) - i0])

        first, last = (i0 + loud[0]) * HOP, (i0 + loud[-1] + 1) * HOP        # real speech edges (energy)
        # at least pad_before/pad_after of air, so soft onsets and final consonants survive ("sorted" has a quiet "d"
        # release 0.15 s after its voiced part), then the quietest frame within the next 0.25 s
        pb, pa, sw = C.get("pad_before_s", 0.1), C.get("pad_after_s", 0.12), C.get("edge_search_s", 0.25)
        s = boundary(max(t0, first - pb - sw), first - pb, quiet) or max(t0, np.floor((first - pb) * fps) / fps)
        e = boundary(last + pa, min(t1, last + pa + sw), quiet) or min(t1, np.ceil((last + pa) * fps) / fps)
        pieces, cur, k, n = [], s, 0, len(guard)
        while k < n:
            if guard[k]:
                j = k
                while j < n and (guard[j] or (j + 2 < n and guard[j + 1:j + 3].any() and guard[j - 1])): j += 1   # bridge ≤ 10 ms blips
                p0, p1 = (i0 + k) * HOP, (i0 + j) * HOP
                if p1 - p0 >= C["min_pause_s"] and p0 > s and p1 < e:
                    half = C["keep_pause_s"] / 2; m = C.get("pause_edge_s", 0.04)   # keep m at each edge (decaying consonants, soft onsets)
                    # each window spans more than one video frame (it was 0.03 s wide: with frames every 0.04 s a quarter of
                    # the pauses found no cut point and were silently kept — 1 Oct)
                    fw = 1.0 / fps + 0.01
                    cin, cout = boundary(p0 + m, p0 + max(m, half) + fw, guard, "first"), boundary(p1 - max(m, half) - fw, p1 - m, guard, "last")
                    if cin and cout and cout - cin > 0.05:
                        pieces.append((cur, cin)); removed += cout - cin; cur = cout
                k = j
            else:
                k += 1
        pieces.append((cur, e))
        merged = []
        has_voice = lambda a_, b_: (full[int(a_ / HOP):int(b_ / HOP)] > REF["f"] - C.get("voice_db", 18)).any()
        pieces = [p for p in pieces if p[1] - p[0] >= C["min_clip_s"] or has_voice(*p)]   # a sliver of breath noise alone: drop it (#2 at 63.7 s)
        for p in pieces:          # fold micro-clips back into their neighbour
            if merged and (p[1] - p[0] < C["min_clip_s"] or merged[-1][1] - merged[-1][0] < C["min_clip_s"]):
                removed -= p[0] - merged[-1][1]; merged[-1] = (merged[-1][0], p[1])
            else:
                merged.append(p)
        pieces_all += [(p, q, k > 0) for k, (p, q) in enumerate(merged)]
    # zoom changes at a cut once the shot has run min_shot_s (ExamQA-style punch-ins hide the jump); a cut that comes sooner
    # keeps the zoom and the drift carries on ("join": "smooth") — a short shot between two zoom changes is the flash cut
    # Eyad called a stutter (1 Oct); a dissolve instead left a double image of his face
    cuts, z, run = [], False, 0.0
    for i, (p, q, _) in enumerate(pieces_all):
        smooth = False
        if i:
            if run >= C.get("min_shot_s", 0.8): z = not z; run = 0.0
            else: smooth = True
        run += q - p
        cuts.append({"in": round(p, 2), "out": round(q, 2), **({"join": "smooth"} if smooth else {}), **({"punch": True} if z else {})})
    return cuts, removed


if __name__ == "__main__":
    main()
