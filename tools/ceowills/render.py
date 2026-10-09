#!/usr/bin/env python3
"""CEOwills reel renderer: edit.json → finished vertical reel (video, hook, mixed-type captions, logo, CTA, mastered audio).

Usage: render.py edit.json [--draft] [--out final.mp4]
  --draft  540x960, fast encode (for the rough-cut gate)

edit.json (paths relative to the file):
{
  "video": "src/clip.mp4",            camera file
  "rotate": "ccw" | "cw" | null,       Adnan's Sony files are often recorded sideways → "ccw"
  "audio": "mic/clip.mic.wav",         lav audio aligned to the camera (match_mic.py); camera audio if missing
  "words": "words/clip.mic.json",      transcribe.py output for that audio
  "cuts": [{"in": 1.16, "out": 5.70, "punch": false}, ...],   source seconds, word-aligned, in order
  "punch_at": [17.42],                 extra in-shot punch-ins (source seconds)
  "hook": ["Muslim business owner?", "*Don't overpay* _IHT_"],   top hook, no box. Plain caps line = tracked eyebrow;
                                       *script words*  _SERIF RED_  plain = sans
  "hook_until": 5.70,                  source time the hook fades out (omit = stays the whole video)
  "keywords": ["legacy", "juggling"],  words set in the big script when spoken (ALL-CAPS / numbers → white bold serif, red underline)
  "cta": {"at": 17.40, "keyword": "IHT", "script": ["below"], "underline": ["IHT"]},   from "at" to the end: the CTA words, larger
  "nasheed": {"file": "nasheed/bika-moulhimi.wav", "start": 0} | null,
  "endcard": null                      omit = layout.json "endcard" (Adnan's follow card after the last word); null = none
}
Also writes, next to the output: captions.txt, boxes.json, edl.json (inputs for qa.py)."""
import argparse, json, math, re, subprocess, sys
from functools import lru_cache
from pathlib import Path
import numpy as np
from PIL import Image, ImageChops, ImageDraw, ImageFilter, ImageFont

HERE = Path(__file__).resolve().parent
L = json.loads((HERE / "layout.json").read_text(encoding="utf-8"))
GLOSS = {k: v for k, v in json.loads((HERE / "glossary.json").read_text(encoding="utf-8")).items() if not k.startswith("_")}


def hex_rgb(h):
    h = h.lstrip("#"); return tuple(int(h[i:i + 2], 16) for i in (0, 2, 4))


RED, WHITE = hex_rgb(L["brand"]["red"]), (255, 255, 255)


def ease_out_cubic(x): x = min(max(x, 0.0), 1.0); return 1 - (1 - x) ** 3
def ease_out_back(x, s=1.70158):
    x = min(max(x, 0.0), 1.0); return 1 + (s + 1) * (x - 1) ** 3 + s * (x - 1) ** 2


def ffpath(p):
    """A file path as an ffmpeg filter option value: forward slashes, drive colon escaped (a Windows drive letter would
    otherwise split the option at its colon; Linux paths come out unchanged)."""
    return Path(p).as_posix().replace(":", r"\:")


def lumetri_vf(g):
    """Approximate Premiere Lumetri 'Basic Correction' + vignette as ffmpeg filters (one tone curve + vignette).
    g = {"exposure", "contrast", "highlights", "shadows", "whites", "blacks", "saturation", "vignette"} in Lumetri units."""
    x = np.linspace(0, 1, 33)
    bump = lambda c, w: np.exp(-((x - c) / w) ** 2)
    y = np.clip(x * 2 ** (g.get("exposure", 0) / 2.2), 0, None)                       # exposure (EV, display space)
    y = np.where(y > 0.85, 0.85 + (1 - 0.85) * np.tanh((y - 0.85) / 0.15), y)          # soft roll-off instead of clipping
    c = g.get("contrast", 0) / 100
    y = y + 0.9 * c * (y - 0.5) * 4 * y * (1 - y)                                      # contrast: S around mid-grey
    y = y + g.get("highlights", 0) / 100 * 0.10 * bump(0.72, 0.16)
    y = y + g.get("whites", 0) / 100 * 0.08 * bump(0.92, 0.10)
    y = y + g.get("shadows", 0) / 100 * 0.22 * bump(0.26, 0.15)
    y = y + g.get("blacks", 0) / 100 * 0.20 * bump(0.08, 0.08)
    y = np.maximum.accumulate(np.clip(y, 0, 1))
    pts = " ".join(f"{a:.4f}/{b:.4f}" for a, b in zip(x, y))
    vf = f"curves=all='{pts}'"
    if g.get("saturation", 100) != 100: vf += f",eq=saturation={g['saturation'] / 100:.3f}"
    v = g.get("vignette", 0)   # Lumetri amount −5…5; negative darkens edges
    if v < 0: vf += f",vignette=angle={min(1.2, 0.18 + abs(v) * 0.22):.3f}:mode=forward"
    return vf


def fit_vf(GF):
    """Grade fitted to a reference frame: a 3D LUT (.cube) if present, else per-channel curves + saturation.
    The vignette is applied separately as a mask (vignette_mask) so text isn't darkened.
    To re-fit: find the source frame of an exported still (edge correlation), fit a 33³ LUT by trilinear splatting raw→still
    with the curves as a weak prior, measure the radial gain outside r=0.55, write .cube (R fastest)."""
    if GF.get("lut") and (HERE / GF["lut"]).exists():
        return f"format=rgb24,lut3d=file='{ffpath(HERE / GF['lut'])}':interp=tetrahedral"
    pts = lambda c: " ".join(f"{i / (len(GF['curves'][c]) - 1):.4f}/{v:.4f}" for i, v in enumerate(GF["curves"][c]))
    return f"curves=r='{pts('r')}':g='{pts('g')}':b='{pts('b')}',eq=saturation={GF.get('saturation', 1):.4f}"


def vignette_mask(GF, W, H):
    """Radial gain measured from the reference (1.0 in the middle, darker toward the corners)."""
    V = GF.get("vignette")
    if not V: return None
    yy, xx = np.mgrid[0:H, 0:W]; r = np.hypot((xx - W / 2) / (W / 2), (yy - H / 2) / (H / 2)) / np.sqrt(2)
    bins = (np.arange(V["r_bins"]) + 0.5) / V["r_bins"]
    g = np.interp(r, bins, V["gain"]); g = np.where(r < V["start_r"], 1.0, np.minimum(g, 1.0))
    return g.astype(np.float32)[..., None]


def run(cmd, **kw):
    return subprocess.run(cmd, check=True, **kw)


def probe(p):
    d = json.loads(subprocess.run(["ffprobe", "-v", "error", "-show_streams", "-of", "json", str(p)], capture_output=True, text=True).stdout)
    v = next(s for s in d["streams"] if s["codec_type"] == "video")
    n, dn = map(int, v["r_frame_rate"].split("/"))
    return int(v["width"]), int(v["height"]), n / dn, v["r_frame_rate"]


# ---------------------------------------------------------------- captions
def apply_glossary(words):
    """Whisper fixes from glossary.json; keys may be 1–3 words ("see our wills" → one word "CEOwills")."""
    out, i = [], 0
    while i < len(words):
        w = words[i]
        for n in (3, 2):
            if i + n <= len(words):
                key = " ".join(x["word"] for x in words[i:i + n]).lower().strip(".,?!")
                if key in GLOSS:
                    last = words[i + n - 1]["word"]
                    out.append({**w, "word": GLOSS[key] + last[len(last.rstrip(".,?!")):], "end": words[i + n - 1]["end"]}); i += n; break
        else:
            core = w["word"].strip(".,?!").lower(); tail = w["word"][len(w["word"].rstrip(".,?!")):]
            out.append({**w, "word": GLOSS[core] + tail} if core in GLOSS else w); i += 1
    return out


def chunk(words, C, manual=None):
    """Phrase-aware chunking. `manual` (edit.json "chunks") = list of caption strings; each consumes that many words."""
    if manual:  # match each hand-set chunk to the transcript by text, so a dropped/extra word can't shift every caption
        norm = lambda x: re.sub(r"[^\w]", "", x.lower().replace("\u2019", "'").replace("'", ""))
        out, i = [], 0
        for text in manual:
            toks = text.split()
            j = i
            while j < len(words) and j < i + 4 and norm(words[j]["word"]) != norm(toks[0]): j += 1
            if j < len(words) and norm(words[j]["word"]) == norm(toks[0]): i = j
            else: print(f"caption chunk '{text}' doesn't match the transcript at '{words[i]['word'] if i < len(words) else 'END'}'", file=sys.stderr)
            out.append([{**w, "word": t} for w, t in zip(words[i:i + len(toks)], toks)]); i += len(toks)
        if i < len(words): out.append(words[i:])
        return [c for c in out if c]
    # 1) split into phrases at punctuation / pauses, 2) split each phrase into balanced chunks (no orphans)
    phrases, cur = [], []
    for w in words:
        if cur and (w["start"] - cur[-1]["end"] > 0.35): phrases.append(cur); cur = []
        cur.append(w)
        if w["word"].endswith((",", ".", "?", "!")): phrases.append(cur); cur = []
    if cur: phrases.append(cur)
    out = []
    for ph in phrases:
        k = 1
        while True:
            size = math.ceil(len(ph) / k)
            parts = [ph[round(j * len(ph) / k):round((j + 1) * len(ph) / k)] for j in range(k)]
            if all(len(p) <= C["max_words"] and sum(len(w["word"]) + 1 for w in p) - 1 <= C["max_chars"] for p in parts) or size == 1: break
            k += 1
        out += [p for p in parts if p]
    return out


def display_word(w):
    return w.rstrip(".,").replace("'", "\u2019")  # keep ? and !, drop trailing . and , (cleaner); curly apostrophes


# ---------------------------------------------------------------- drawing
# Type system (after the other editor's 1-minute edit, made calmer): filler words in a small bold sans, the words that
# matter in a large copperplate script, acronyms/numbers in a bold white serif with a red underline. No boxes, no pills.
@lru_cache(None)
def face(style, px):
    F = L["fonts"][style]; path = HERE / F["file"]
    if not path.exists():
        path.parent.mkdir(parents=True, exist_ok=True); subprocess.run(["curl", "-sL", "-o", str(path), F["url"]], check=True)
    f = ImageFont.truetype(str(path), px)
    if F.get("weight"):
        try: f.set_variation_by_axes([F["weight"]])
        except Exception: pass
    return f


def style_of(word, keys):
    if L["caption"].get("single_style"): return L["caption"]["single_style"]   # 27 Sep: one font only (superseded by no_script)
    core = re.sub(r"[^\w£%]", "", word)
    if core in L["caption"].get("plain_caps", []): return "sans"   # honorifics (SWT…) aren't acronyms to shout with a red underline
    if re.search(r"[\d£%]", word) or (len(core) >= 2 and core.isupper()): return "serif"
    if core.lower() in keys and not L["caption"].get("no_script"): return "script"   # 27 Sep, Eyad: no script font
    return "sans"


def glow(layer, passes):
    """Soft shadows under white text so it stays readable on bright backgrounds. passes = [(blur, alpha[, dy])];
    dy drops the shadow down (a drop shadow rather than a glow)."""
    out = Image.new("RGBA", layer.size, (0, 0, 0, 0)); a = np.array(layer.split()[-1]).astype(np.float32)
    for blur, alpha, *dy in passes:
        sh = Image.new("RGBA", layer.size, (0, 0, 0, 0)); sh.putalpha(Image.fromarray((a * alpha / 255).astype(np.uint8)))
        sh = sh.filter(ImageFilter.GaussianBlur(blur))
        if dy and dy[0]: sh = ImageChops.offset(sh, 0, int(dy[0]))
        out = Image.alpha_composite(out, sh)
    return Image.alpha_composite(out, layer)


def fade_rise(img, p, rise, scale_from=1.0):
    """Entrance: opacity 0→1, y +rise→0, optional scale_from→1 (about the centre)."""
    p = ease_out_cubic(p)
    if p >= 1: return img, 0
    if scale_from != 1.0:
        s = scale_from + (1 - scale_from) * p; w, h = img.size
        sc = img.resize((max(1, int(w * s)), max(1, int(h * s))), Image.LANCZOS)
        img = Image.new("RGBA", (w, h), (0, 0, 0, 0)); img.alpha_composite(sc, ((w - sc.width) // 2, (h - sc.height) // 2))
    a = np.array(img).astype(np.float32); a[..., 3] *= p
    return Image.fromarray(a.astype(np.uint8)), int(rise * (1 - p))


def word_sprite(text, style, scale=1.0):
    """One word as a tight RGBA sprite + its baseline offset. Colour by style."""
    C = L["caption"]; px = int(C["px"][style] * scale); f = face(style, px)
    col = WHITE
    x0, y0, x1, y1 = f.getbbox(text, anchor="ls")
    pad = 64; w, h = x1 - x0 + 2 * pad, y1 - y0 + 2 * pad  # room for the drop shadow
    img = Image.new("RGBA", (int(w), int(h)), (0, 0, 0, 0))
    ImageDraw.Draw(img).text((pad - x0, pad - y0), text, font=f, fill=col, anchor="ls")
    img = glow(img, C["shadow"] if C.get("shadow") else [(3, 170), (14, 120)] if style == "script" else [(2, 150), (12, 110)])
    return img, pad - y0, pad, x1 - x0  # sprite, baseline y in sprite, ink left x in sprite, ink width (script swashes overhang their advance)


@lru_cache(None)
def chunk_layout(texts, styles, scale):
    """Lay a chunk out once (all words), so positions never shift as words appear.
    Returns (sprites, [(x, baseline_y)] in canvas px, scale actually used, widest line px)."""
    C = L["caption"]; W = L["canvas"]["w"]
    sprites = [word_sprite(t, s, scale) for t, s in zip(texts, styles)]
    gap = C["word_gap"] * scale
    adv = [sp[3] for sp in sprites]
    # a little more air either side of a script word (its swashes read as tighter than they measure)
    after = [gap + (C["script_gap_extra"] * scale if "script" in (styles[i], styles[i + 1] if i + 1 < len(styles) else "") else 0) for i in range(len(adv))]
    width = lambda line: sum(adv[i] for i in line) + sum(after[i] for i in line[:-1])
    lines = [list(range(len(texts)))]
    if width(lines[0]) > C["max_w"] and len(adv) > 1:   # two lines, split where the wider line is narrowest
        k = min(range(1, len(adv)), key=lambda k: max(width(range(k)), width(range(k, len(adv)))))
        lines = [list(range(k)), list(range(k, len(adv)))]
    widest = max(width(l) for l in lines)
    if widest > C["max_w"] + 1:   # still too wide (e.g. "Comment DAUGHTERS below" at CTA size ran off both edges) → shrink to fit
        return chunk_layout(texts, styles, scale * C["max_w"] / widest)
    lh = C["line_h"] * scale; base = C["baseline_y"] - (len(lines) - 1) * lh / 2
    pos = [None] * len(texts)
    for li, line in enumerate(lines):
        x = (W - width(line)) / 2
        for i in line: pos[i] = (x, base + li * lh); x += adv[i] + after[i]
    LAYOUT_W.append(widest)
    return sprites, pos, scale, widest


LAYOUT_W = []   # widest caption line laid out in this render (→ boxes.json, checked by qa.py)


def draw_chunk(canvas, texts, styles, starts, t, scale=1.0, underline=()):
    """Draw a caption chunk onto the RGBA canvas at time t: each word enters when it is spoken."""
    C = L["caption"]; sprites, pos, scale, _ = chunk_layout(tuple(texts), tuple(styles), scale)
    for i, ((img, by, ox, adv), (x, y)) in enumerate(zip(sprites, pos)):
        if t < starts[i]: continue
        p = (t - starts[i]) * 1000 / C["enter_ms"]
        im, dy = fade_rise(img, p, C["rise_px"], C["script_scale_from"] if styles[i] == "script" else 1.0)
        canvas.alpha_composite(im, (int(x - ox), int(y - by + dy)))
        if texts[i] in underline or (styles[i] == "serif" and C.get("serif_underline")):  # red stroke that draws itself under acronyms / the CTA keyword
            q = ease_out_cubic((t - starts[i] - 0.12) * 1000 / C["underline_ms"])
            if q > 0:
                d = ImageDraw.Draw(canvas); uy = y + 34 * scale
                d.line([(x, uy), (x + adv * q, uy)], fill=RED + (255,), width=max(3, int(6 * scale)))


def hook_bars(lines, W):
    """Top hook as solid CEOwills-red bars, white bold caps, one bar per line (Sofian/Adnan, 27 Sep: 'make the top text
    clearer… white text on a red background', like the ExamQA title bars). Markup is dropped; a line without markup is
    the eyebrow and gets a smaller bar. Each line shrinks until it fits hook.bar.max_w."""
    B = L["hook"]["bar"]; img = Image.new("RGBA", (W, 700), (0, 0, 0, 0)); bars = Image.new("RGBA", img.size, (0, 0, 0, 0))
    d = ImageDraw.Draw(bars); y = B["top"]; tr = B.get("tracking", 0)
    for line in lines:
        eyebrow = "*" not in line and "_" not in line
        text = re.sub(r"[*_]", "", line).upper().replace("'", "’")
        px = B["eyebrow_px"] if eyebrow else B["px"]
        while True:
            f = face("sans", px); w = sum(f.getlength(c) for c in text) + tr * (len(text) - 1)
            if w + 2 * B["pad_x"] <= B["max_w"] or px <= 24: break
            px -= 2
        cap = -f.getbbox("H", anchor="ls")[1]; bh = cap + 2 * B["pad_y"]; x0 = (W - w) / 2 - B["pad_x"]
        d.rectangle([x0, y, x0 + w + 2 * B["pad_x"], y + bh], fill=hex_rgb(B["color"]) + (255,))
        x = x0 + B["pad_x"]
        for c in text: d.text((x, y + B["pad_y"] + cap), c, font=f, fill=WHITE + (255,), anchor="ls"); x += f.getlength(c) + tr
        y += bh + B["gap"]
    blur, alpha = B.get("shadow", (8, 110))
    sh = Image.new("RGBA", img.size, (0, 0, 0, 0)); sh.putalpha(Image.fromarray((np.array(bars.split()[-1]) * (alpha / 255)).astype(np.uint8)))
    img.alpha_composite(sh.filter(ImageFilter.GaussianBlur(blur)), (0, 4)); img.alpha_composite(bars)
    return img.crop((0, 0, W, int(y + blur * 2)))


def bottom_gradient(W, H):
    """Black fade behind the logo and the platform UI (Sofian, 27 Sep: 'a black gradient like we used to do for ExamQA')."""
    G = L["logo"].get("gradient")
    if not G: return None, 0
    h = H - G["top"]; a = np.linspace(0, 1, h) ** G["power"] * G["alpha"] / 255
    a = (1 - (1 - a) ** G.get("passes", 1)) * 255   # passes 2 = the layer duplicated (Eyad: "slightly stronger")
    a = a.astype(np.uint8)
    img = Image.new("RGBA", (W, h), (0, 0, 0, 255)); img.putalpha(Image.fromarray(np.repeat(a[:, None], W, 1)))
    return img, G["top"]


def hook_layer(lines, W):
    """Top hook. style 'bar' (default since 27 Sep) → hook_bars. style 'type': no box, a soft top scrim + tracked sans
    eyebrow + script/serif line. Markup: *script*  _SERIF_."""
    if L["hook"].get("style") == "bar": return hook_bars(lines, W)
    Hk = L["hook"]; img = Image.new("RGBA", (W, Hk["scrim_h"]), (0, 0, 0, 0))
    grad = (np.linspace(1, 0, Hk["scrim_h"]) ** 1.6 * Hk["scrim_alpha"]).astype(np.uint8)
    img.putalpha(Image.fromarray(np.repeat(grad[:, None], W, 1)))
    txt = Image.new("RGBA", img.size, (0, 0, 0, 0)); d = ImageDraw.Draw(txt)
    y = Hk["top"]
    U = Hk.get("uniform")
    if U:   # 30 Sep, Sofian: "the question mark and text are different size" → every line, the question included, one size
        f = face("sans", U["px"])
        for line in lines:
            segs = [(a or b or c, bool(b)) for a, b, c in re.findall(r"\*([^*]+)\*|_([^_]+)_|([^*_]+)", line)]
            text = "".join(s for s, _ in segs).replace("'", "’"); x0, _, x1, _ = f.getbbox(text, anchor="ls")
            x = (W - (x1 - x0)) / 2 - x0; d.text((x, y), text, font=f, fill=WHITE, anchor="ls")
            for s, red in segs:   # _MARKED_ words keep their red underline
                w = f.getlength(s.replace("'", "’"))
                if red: d.line([(x, y + 14), (x + w, y + 14)], fill=RED + (255,), width=6)
                x += w
            y += U["line_gap"]
        img.alpha_composite(glow(txt, [(3, 150), (14, 110)]))
        return img
    for line in lines:
        if "*" not in line and "_" not in line:  # eyebrow: tracked caps sans
            f = face("sans", Hk["eyebrow_px"]); tr = Hk["eyebrow_tracking"]; text = line.upper()
            w = sum(f.getlength(c) for c in text) + tr * (len(text) - 1); x = (W - w) / 2
            for c in text: d.text((x, y), c, font=f, fill=(255, 255, 255, 235), anchor="ls"); x += f.getlength(c) + tr
            y += Hk["eyebrow_gap"]; continue
        parts = re.findall(r"\*([^*]+)\*|_([^_]+)_|([^*_]+)", line)
        segs = [(a, "script") if a else (b, "serif") if b else (c.strip(), "sans") for a, b, c in parts if (a or b or c.strip())]
        sa = Hk.get("script_as")   # 27 Sep, Eyad: no script font → *marked* words in a bigger sans
        fa = Hk.get("serif_as")   # 27 Sep, Eyad: "get rid of that serif text" in the title → sans, keeps the red underline
        fonts = [face(sa["style"], sa["px"]) if (st == "script" and sa) else face(fa["style"], fa["px"]) if (st == "serif" and fa)
                 else face(st, Hk["px"][st]) for _, st in segs]
        boxes = [f.getbbox(tx.replace("'", "’"), anchor="ls") for (tx, _), f in zip(segs, fonts)]
        widths = [b[2] - b[0] for b in boxes]  # ink widths: script swashes overhang their advance
        x = (W - sum(widths) - Hk["gap"] * (len(segs) - 1)) / 2
        for (tx, st), f, w, b in zip(segs, fonts, widths, boxes):
            d.text((x - b[0], y), tx.replace("'", "’"), font=f, fill=WHITE, anchor="ls")
            if st == "serif": d.line([(x, y + 16), (x + w, y + 16)], fill=RED + (255,), width=6)  # acronym: white + red underline
            x += w + Hk["gap"]
        y += Hk["line_gap"]
    img.alpha_composite(glow(txt, [(3, 150), (14, 110)]))
    return img


def logo_layer(W):
    """CEOwills wordmark exactly like the account's other edits: red Arial-style bold, tight tracking, lower third."""
    G = L["logo"]; f = face("logo", G["px"]); text = G["text"]
    adv = [f.getlength(c) for c in text]; tr = (G["width"] - sum(adv)) / (len(text) - 1)
    img = Image.new("RGBA", (W, G["px"] + 80), (0, 0, 0, 0)); d = ImageDraw.Draw(img)
    x = G["center_x"] - G["width"] / 2; base = 40 + G["px"] * 0.78
    for c, a in zip(text, adv): d.text((x, base), c, font=f, fill=hex_rgb(G["color"]) + (255,), anchor="ls"); x += a + tr
    # centre the visible ink exactly (Eyad 27 Sep: "centre the logo perfectly"; advances left it 1.5 px left of centre)
    bb = img.getbbox(); dx = round(G["center_x"] - (bb[0] + bb[2]) / 2)
    if dx: img = ImageChops.offset(img, dx, 0)
    return glow(img, [(6, 90)]), int(G["baseline_y"] - base)



# ---------------------------------------------------------------- iMessage CTAs (Adnan's PNGs)
CTAS = {k: v for k, v in json.loads((HERE / "ctas.json").read_text(encoding="utf-8")).items() if not k.startswith("_")}


def cta_png(key):
    p = HERE / ".cache" / "cta" / f"{key}.png"
    if not p.exists():
        p.parent.mkdir(parents=True, exist_ok=True)
        subprocess.run(["curl", "-sL", "--retry", "3", "-o", str(p),
                        f"https://drive.usercontent.google.com/download?id={CTAS[key]['id']}&export=download&confirm=t"], check=True)
    return p


def plan_ctas(E, words_text, dur, end_cta_t):
    """[(key, t_out)] — explicit list from edit.json, or auto: one every `every_s`, most relevant unused CTA first."""
    N = L["notify"]; spec = E.get("ctas", "auto")
    if isinstance(spec, list):
        out = []
        for c in spec:   # {"key": …} = a card from ctas.json; {"text": …} = a card written for this moment of this video
            k = c.get("key") or "say:" + re.sub(r"[^a-z0-9]+", "-", c["text"].lower()).strip("-")[:48]
            if c.get("text"): CTAS[k] = {**CTAS.get(k, {}), "text": c["text"], "tags": []}
            out.append((k, c["at_out"] if "at_out" in c else c["at"]))
        return out
    if spec != "auto" or dur < N["min_video_s"]: return []
    stop = end_cta_t if end_cta_t is not None else dur
    times, t = [], N["first_s"]
    while t + N["hold_s"] + 1.0 <= stop: times.append(t); t += N["every_s"]
    # Eyad, 29 Sep: "don't use the exact same iMessage CTA — switch it up, and pay attention to what he's talking about;
    # good CTAs make Adnan money". Score = how often the card's topic words come up in what he says, minus a penalty
    # for every use in the last `recent_videos` videos (cta_history.json), so the account doesn't repeat one card.
    words = re.findall(r"[a-z]+", words_text.lower())
    hist = cta_history()["videos"]; recent = [k for v in list(hist.values())[-N.get("recent_videos", 4):] for k in v]
    def score(k):
        tags = set(CTAS[k]["tags"]); topic = sum(min(words.count(t), 3) for t in tags if t != "generic")
        return topic - (1 if "generic" in tags else 0) - N.get("repeat_penalty", 3) * recent.count(k)
    ranked = sorted(CTAS, key=score, reverse=True)
    return [(ranked[i % len(ranked)], tt) for i, tt in enumerate(times)]


def cta_history():
    p = HERE / "cta_history.json"
    return json.loads(p.read_text(encoding="utf-8")) if p.exists() else {"_comment": "", "videos": {}}


def log_ctas(name, keys):
    """Record which iMessage cards a final render used (read by plan_ctas to avoid repeats across videos)."""
    h = cta_history(); h["_comment"] = ("iMessage CTA cards used per video, oldest first (render.py writes this on every "
                                       "final render; plan_ctas penalises cards used in the last few videos).")
    h["videos"].pop(name, None); h["videos"][name] = keys
    (HERE / "cta_history.json").write_text(json.dumps(h, indent=1, ensure_ascii=False) + "\n", encoding="utf-8")


# iPhone notification card (30 Sep, Sofian: "instead of making it so small so it looks unrealistic, zoom into Adnan a little
# and move the canvas down, so he has space above his head for the same CTA at the same size"; Eyad: bigger, realistic).
# notify.style "ios" draws a real-size iOS banner (contact photo + Messages badge, "Adnan · now", frosted glass) from the
# card's text; "png" uses Adnan's original PNG cards. Text per card comes from ctas.json or an edit's {"text": …} card.
AVATAR = {"img": None}


def ui_font(px, wght):
    F = L["fonts"]["ui"]; path = HERE / F["file"]
    if not path.exists():
        path.parent.mkdir(parents=True, exist_ok=True); subprocess.run(["curl", "-sL", "-o", str(path), F["url"]], check=True)
    f = ImageFont.truetype(str(path), px)
    try: f.set_variation_by_axes([min(32, max(14, px / 2.7)), wght])   # Inter: optical size (pt), weight
    except Exception: pass
    return f


def make_avatar(video, t, rot):
    """Adnan's face from this video as the round contact photo (Haar face → square crop with some hair and shoulders)."""
    import cv2
    raw = subprocess.run(["ffmpeg", "-v", "error", "-ss", f"{t:.2f}", "-i", str(video), "-frames:v", "1", "-vf", f"{rot}scale=1080:-2",
                          "-f", "image2pipe", "-vcodec", "png", "-"], capture_output=True).stdout
    im = Image.open(__import__("io").BytesIO(raw)).convert("RGB"); g = np.asarray(im.convert("L"))
    casc = cv2.CascadeClassifier(cv2.data.haarcascades + "haarcascade_frontalface_default.xml")
    fs = casc.detectMultiScale(g, 1.1, 6, minSize=(im.width // 8, im.width // 8))
    if len(fs): x, y, w, h = max(fs, key=lambda f: f[2] * f[3]); cx, cy, side = x + w / 2, y + h * 0.42, w * 1.35
    else: cx, cy, side = im.width / 2, im.height * 0.3, im.width * 0.45
    AVATAR["img"] = im.crop((int(cx - side / 2), int(cy - side / 2), int(cx + side / 2), int(cy + side / 2)))


def messages_icon(px):
    """The green Messages app icon (rounded square, white speech bubble), drawn at 4× then scaled down."""
    k = 4; S = px * k; ic = Image.new("RGBA", (S, S), (0, 0, 0, 0)); d = ImageDraw.Draw(ic)
    grad = Image.new("RGBA", (1, S)); [grad.putpixel((0, y), (int(95 - 83 * y / S), int(245 - 55 * y / S), int(110 - 70 * y / S), 255)) for y in range(S)]
    m = Image.new("L", (S, S), 0); ImageDraw.Draw(m).rounded_rectangle((0, 0, S - 1, S - 1), radius=int(S * 0.225), fill=255)
    ic.paste(grad.resize((S, S)), (0, 0), m)
    d.ellipse((S * 0.17, S * 0.22, S * 0.83, S * 0.74), fill="white")
    d.polygon([(S * 0.27, S * 0.62), (S * 0.20, S * 0.83), (S * 0.43, S * 0.71)], fill="white")
    return ic.resize((px, px), Image.LANCZOS)


def ios_card(text, CW):
    """→ (RGBA layer W wide with soft shadow, rounded-rect mask of the glass (same size), top of the glass in the layer)."""
    N = L["notify"]; s = CW / 377; pad = round(14 * s); SH = round(16 * s); W = L["canvas"]["w"]
    av = round(38 * s); tx = pad + av + round(11 * s); tw = CW - tx - pad
    f_t, f_now, f_b, f_link = ui_font(round(15 * s), 600), ui_font(round(13.5 * s), 400), ui_font(round(15 * s), 400), ui_font(round(15 * s), 600)
    lh = round(20 * s); words = text.split(); lines, cur = [], ""
    for w in words:
        t = (cur + " " + w).strip()
        if f_b.getlength(t) <= tw or not cur: cur = t
        else: lines.append(cur); cur = w
    if cur: lines.append(cur)
    h = pad + round(19 * s) + len(lines) * lh + round(12 * s)
    x0 = (W - CW) // 2; lay = Image.new("RGBA", (W, h + 2 * SH), (0, 0, 0, 0))
    sh = Image.new("L", lay.size, 0); ImageDraw.Draw(sh).rounded_rectangle((x0, SH + round(5 * s), x0 + CW, SH + h + round(5 * s)), radius=round(21 * s), fill=int(255 * N.get("shadow_alpha", 0.28)))
    sh = sh.filter(ImageFilter.GaussianBlur(round(9 * s))); lay.putalpha(sh)          # black shadow (rgb stays 0)
    mask = Image.new("L", lay.size, 0); ImageDraw.Draw(mask).rounded_rectangle((x0, SH, x0 + CW, SH + h), radius=round(21 * s), fill=255)
    glass = Image.new("RGBA", lay.size, tuple(N.get("glass_rgb", [246, 246, 248])) + (0,)); glass.putalpha(mask.point(lambda v: int(v * N.get("glass_alpha", 0.74))))
    lay = Image.alpha_composite(lay, glass); d = ImageDraw.Draw(lay)
    # contact photo (Adnan) with the Messages badge at its lower right
    ay = SH + (h - av) // 2
    if AVATAR["img"] is not None:
        ph = AVATAR["img"].resize((av * 4, av * 4), Image.LANCZOS); cm = Image.new("L", ph.size, 0); ImageDraw.Draw(cm).ellipse((0, 0, av * 4 - 1, av * 4 - 1), fill=255)
        ph.putalpha(cm); lay.alpha_composite(ph.resize((av, av), Image.LANCZOS), (x0 + pad, ay))
    else: d.ellipse((x0 + pad, ay, x0 + pad + av, ay + av), fill=(160, 160, 166, 255))
    bd = round(17 * s); ring = round(1.6 * s); bx, by = x0 + pad + av - bd + round(3 * s), ay + av - bd + round(3 * s)
    d.rounded_rectangle((bx - ring, by - ring, bx + bd + ring, by + bd + ring), radius=int((bd + 2 * ring) * 0.26), fill=(246, 246, 248, 255))
    lay.alpha_composite(messages_icon(bd), (bx, by))
    # "Adnan" + "now", then the message; ceowills.com in CEOwills red (as on Adnan's own cards)
    ty = SH + pad - round(1 * s); d.text((x0 + tx, ty), N.get("sender", "Adnan"), font=f_t, fill=(0, 0, 0, 255))
    d.text((x0 + CW - pad, ty + round(1 * s)), "now", font=f_now, fill=(60, 60, 67, 165), anchor="ra")
    y = ty + round(20 * s)
    for ln in lines:
        x = x0 + tx
        for i, w in enumerate(ln.split(" ")):
            link = "ceowills.com" in w.lower()
            f = f_link if link else f_b; col = tuple(L["logo"].get("color_rgb", [235, 21, 25])) + (255,) if link else (0, 0, 0, 255)
            tok = w + (" " if i < len(ln.split(" ")) - 1 else "")
            d.text((x, y), tok, font=f, fill=col); x += f.getlength(tok)
        y += lh
    return lay, mask, SH


def card_text(key): return CTAS[key]["text"]


@lru_cache(None)
def cta_layer(key, W):
    """→ (layer, glass mask or None, top of the visible card inside the layer)."""
    N = L["notify"]
    if N.get("style") == "ios":
        lay, mask, top = ios_card(card_text(key), N["width"]); return lay, mask, top
    im = Image.open(cta_png(key)).convert("RGBA")
    im = im.resize((N["width"], int(im.height * N["width"] / im.width)), Image.LANCZOS)
    layer = Image.new("RGBA", (W, im.height), (0, 0, 0, 0)); layer.alpha_composite(im, ((W - im.width) // 2, 0))
    return layer, None, 0


def card_height(key, W):
    lay, mask, top = cta_layer(key, W)
    return (lay.height - 2 * top) if mask is not None else lay.height


def cta_frame(key, t, t0, W):
    """Slide down from above (ease-out-back), hold, slide back up + fade. Returns (img, y, glass mask, opacity) or None."""
    N = L["notify"]; dt = t - t0; hold = N["hold_s"]
    if dt < 0 or dt > hold: return None
    img, mask, top = cta_layer(key, W); h = img.height; y_on, y_off = N["y"] - top, -h - 20; op = 1.0
    pin, pout = dt * 1000 / N["in_ms"], (hold - dt) * 1000 / N["out_ms"]
    if pin < 1: y = y_off + (y_on - y_off) * ease_out_back(pin, 1.2)
    elif pout < 1:
        q = ease_out_cubic(1 - pout); y = y_on + (y_off - y_on) * q * 0.6; op = 1 - q
        a = np.array(img).astype(np.float32); a[..., 3] *= op; img = Image.fromarray(a.astype(np.uint8))
    else: y = y_on
    return img, int(y), mask, op


# ---------------------------------------------------------------- timeline (shared with check.py)
def timeline(cuts, fps):
    """Cuts → (segments with output start t0 and frame count n, output duration, source→output time map)."""
    t_acc, segs = 0.0, []
    for c in cuts:
        n = int(round((c["out"] - c["in"]) * fps)); segs.append({**c, "t0": t_acc, "n": n}); t_acc += n / fps
    dur = sum(s["n"] for s in segs) / fps

    def to_out(t):
        for s in segs:
            if s["in"] - 1e-6 <= t <= s["out"] + 1e-6: return s["t0"] + (t - s["in"])
        return None
    return segs, dur, to_out


def caption_words(words, segs, to_out, cta_t):
    """The words that get running captions, in output time (the end-CTA words are drawn separately)."""
    kept = []
    for w in words:
        o0, o1 = to_out(w["start"]), to_out(w["end"])
        if o0 is None and o1 is None:  # Whisper drifts early at the head of a take: a word ending ≤0.25 s before a cut-in is really inside it
            seg = next((sg for sg in segs if 0 <= sg["in"] - w["end"] <= 0.25), None)
            if seg: o0 = o1 = seg["t0"]
        if o0 is not None and o1 is None:  # Whisper stretched the word over the pause after it, and that pause was cut
            seg = next(sg for sg in segs if sg["in"] - 1e-6 <= w["start"] <= sg["out"] + 1e-6); o1 = seg["t0"] + seg["out"] - seg["in"]
        if o0 is None and o1 is not None:  # word stretched back across the cut-in → start it at the cut
            seg = next(sg for sg in segs if sg["in"] <= w["end"] <= sg["out"] + 1e-6); o0 = seg["t0"]
        if o0 is None or o1 is None: continue
        if cta_t is not None and o0 >= cta_t - 0.05: continue
        kept.append({**w, "start": o0, "end": o1})
    kept.sort(key=lambda w: w["start"])   # cuts may reorder the source ("1 plus 1 million" → "1 million plus")
    return kept


# ---------------------------------------------------------------- main
def main():
    ap = argparse.ArgumentParser(); ap.add_argument("edit"); ap.add_argument("--draft", action="store_true"); ap.add_argument("--out")
    a = ap.parse_args()
    E_path = Path(a.edit).resolve(); base = E_path.parent; E = json.loads(E_path.read_text(encoding="utf-8"))
    if E.get("notify"): L["notify"].update(E["notify"])   # per-job card override, e.g. {"width": 540} when he stands tall
    P = lambda k: (base / E[k]) if E.get(k) else None
    out = Path(a.out).resolve() if a.out else base / ("draft.mp4" if a.draft else "final.mp4")
    W, H = L["canvas"]["w"], L["canvas"]["h"]
    sw, sh, fps, fps_s = probe(P("video"))
    segs, dur, to_out = timeline(E["cuts"], fps); total_n = sum(s["n"] for s in segs)
    EC = E["endcard"] if "endcard" in E else L.get("endcard")   # follow card after the last word (7 Oct)
    if EC and not (HERE / EC["file"]).exists(): sys.exit(f"end card missing: {EC['file']}")
    ec_n = int(round(EC["hold_s"] * fps)) if EC else 0; full = dur + ec_n / fps
    (out.parent / "edl.json").write_text(json.dumps([{k: s[k] for k in ("in", "out", "t0", "n")} for s in segs], indent=1), encoding="utf-8")

    # ---- captions
    words = json.loads(P("words").read_text(encoding="utf-8")) if E.get("words") else []
    words = apply_glossary(words)
    cta = E.get("cta"); cta_t = to_out(cta["at"]) if cta else None
    kept = caption_words(words, segs, to_out, cta_t)
    C = L["caption"]; chunks = chunk(kept, C, E.get("chunks"))
    keys = {k.lower() for k in E.get("keywords", [])}
    spans = []
    for i, ch in enumerate(chunks):
        st = ch[0]["start"]
        nxt = chunks[i + 1][0]["start"] if i + 1 < len(chunks) else (cta_t if cta_t else dur)
        en = min(nxt, ch[-1]["end"] + C["tail_ms"] / 1000)
        en = max(en, min(nxt, st + C["min_ms"] / 1000))
        for sg in segs[1:]:  # never let a caption bleed across a cut into the next shot
            if ch[-1]["end"] <= sg["t0"] + 0.02 < en: en = sg["t0"]
        spans.append((st, en, ch))
    (out.parent / "captions.txt").write_text("\n".join(f"{s:6.2f}-{e:6.2f}  " + " ".join(display_word(w['word']) for w in ch) for s, e, ch in spans)
                                               + (f"\n{cta_t:6.2f}-{dur:6.2f}  [CTA] " + " ".join(display_word(w["word"]) for w in words if (to_out(w["start"]) or -1) >= cta_t - 0.05) if cta else "") + "\n", encoding="utf-8")

    # ---- static layers
    hook = hook_layer(E["hook"], W) if E.get("hook") else None
    hook_until = to_out(E["hook_until"]) if E.get("hook_until") is not None else None
    logo, logo_y = logo_layer(W)
    grad, grad_y = bottom_gradient(W, H)
    styles = [[style_of(display_word(w["word"]), keys) for w in ch] for _, _, ch in spans]
    cta_words = []
    if cta:
        for w in words:
            o0 = to_out(w["start"])
            if o0 is not None and o0 >= cta_t - 0.05: cta_words.append({**w, "start": o0})
        cta_keys = keys | {k.lower() for k in cta.get("script", [])}
        cta_texts = [display_word(w["word"]).rstrip("!?") for w in cta_words]
        # the spoken keyword takes the job's spelling (Whisper writes "calculator", the CTA shows CALCULATOR + underline)
        cta_texts = [cta["keyword"] if tx.lower() == cta["keyword"].lower() else tx for tx in cta_texts]
        cta_styles = [style_of(tx, cta_keys) for tx in cta_texts]
    boxes = {"title": [0, hook.height if hook is not None else 0], "caption_baseline": C["baseline_y"], "logo_baseline": L["logo"]["baseline_y"], "safe": L["safe"]}
    def ink_top(texts, sts, scale=1.0):   # top of the caption's ink on the canvas (qa.py: must be below his chin)
        sprites, pos, _, _ = chunk_layout(tuple(texts), tuple(sts), scale)
        return int(min(y - by + ox for (_, by, ox, _), (_, y) in zip(sprites, pos)))   # sprite pad = ox = distance to ink top
    boxes["captions"] = [[round(s, 2), round(e, 2), ink_top([display_word(w["word"]) for w in ch], st)] for (s, e, ch), st in zip(spans, styles)]
    if cta and cta_words: boxes["captions"].append([round(cta_t, 2), round(dur, 2), ink_top(cta_texts, cta_styles, L["cta"]["scale"])])
    FRb = {**L.get("frame", {}), **E.get("frame", {})}
    if FRb.get("on") and FRb["shift_y"] > 0: boxes["seam_end"] = FRb["shift_y"] + FRb["feather"]   # rows above this are (partly) the blurred fill
    if hook is not None:   # where the title's text really is (rows with near-opaque ink; the scrim tops out at scrim_alpha) — qa.py checks it against his head
        rows = np.where(np.asarray(hook)[..., 3].max(axis=1) >= 250)[0]
        if len(rows): boxes["title_ink"] = {"top": int(rows[0]), "bottom": int(rows[-1]), "until": hook_until if hook_until is not None else dur}

    # ---- audio (runs while video renders)
    aud = out.with_suffix(".audio.wav")
    ctas = plan_ctas(E, " ".join(w["word"] for w in kept), dur, cta_t)
    if ctas and L["notify"].get("style") == "ios":
        make_avatar(P("video"), E["cuts"][0]["in"] + 1.0, {"ccw": "transpose=2,", "cw": "transpose=1,"}.get(E.get("rotate"), ""))
    if ctas: print("ctas: " + ", ".join(f"{k} @ {t:.1f}s" for k, t in ctas))
    boxes["cards"] = [{"key": k, "in": t0, "out": t0 + L["notify"]["hold_s"], "top": L["notify"]["y"],
                       "bottom": L["notify"]["y"] + card_height(k, W)} for k, t0 in ctas]
    if not a.draft: log_ctas(E.get("name", E_path.stem), [k for k, _ in ctas])
    if EC: boxes["endcard"] = [round(dur, 3), round(full, 3)]   # qa.py: no face/caption/freeze checks on the card
    build_audio(E, base, segs, full, aud, sfx=[t for _, t in ctas])   # the voice ends at dur; the nasheed runs on under the card

    # ---- video
    ow, oh = (W // 2, H // 2) if a.draft else (W, H)
    enc = subprocess.Popen(["ffmpeg", "-v", "error", "-y", "-f", "rawvideo", "-pix_fmt", "rgb24", "-s", f"{W}x{H}", "-r", fps_s, "-i", "-",
                            "-i", str(aud), "-map", "0:v", "-map", "1:a",
                            "-vf", f"scale={ow}:{oh}:flags=lanczos", "-c:v", "libx264", "-preset", "veryfast" if a.draft else "slow",
                            "-crf", "23" if a.draft else "16", "-pix_fmt", "yuv420p", "-profile:v", "high", "-movflags", "+faststart",
                            "-c:a", "aac", "-b:a", "192k", "-shortest", str(out)], stdin=subprocess.PIPE)
    GFm = E.get("grade_fit") or L.get("grade_fit"); vmask = vignette_mask(GFm, W, H) if GFm else None
    rot = {"ccw": "transpose=2,", "cw": "transpose=1,", None: "", "": ""}[E.get("rotate")]
    M = L["motion"]; zcx, zcy = M["zoom_center"]; punch_at = E.get("punch_at", [])
    FR = {**L.get("frame", {}), **E.get("frame", {})}; FR = FR if FR.get("on") else None
    FILL = bool(FR and FR["shift_y"] > 0)   # shift_y 0 (a job without cards, e.g. #14): keep the zoom, no move-down, no fill
    if FILL:   # rows at/under shift_y show the shot, fading in over `feather` px from the blurred fill above
        yy = np.arange(H, dtype=np.float32)[:, None, None]; fmask = np.clip((yy - FR["shift_y"]) / FR["feather"], 0, 1)
    cache = {}; card_cache = {}; glass_cache = {}; cache_chunk = [None]
    import cv2

    def evict(chunk):   # caption bands are only reused within one chunk — drop the last chunk's, or long videos run out of memory
        if cache_chunk[0] != chunk: cache.clear(); cache_chunk[0] = chunk

    def premult(img):   # RGBA → (colour × alpha, 1 − alpha) as float32, so compositing is one multiply + one add
        arr = np.asarray(img, dtype=np.float32); al = arr[..., 3:4] / 255.0
        return arr[..., :3] * al, 1 - al

    def over(frame, pair, y0):   # alpha-over a premultiplied layer whose top row is y0 (may hang off the frame)
        c, tr = pair; y1 = min(H, y0 + c.shape[0]); ys = max(0, y0)
        if y1 <= ys: return   # fully off-screen (e.g. a card still above the frame)
        sl = frame[ys:y1]; sl *= tr[ys - y0:y1 - y0]; sl += c[ys - y0:y1 - y0]

    def static(with_hook):   # vignette + title + bottom gradient + logo folded into one (gain, add) pair — built once
        gain = np.ones((H, W, 1), np.float32); add = np.zeros((H, W, 3), np.float32)
        for img, y0 in ([(hook, 0)] if with_hook else []) + ([(grad, grad_y)] if grad is not None else []) + [(logo, logo_y)]:
            c, tr = premult(img); y1 = min(H, y0 + c.shape[0]); ys = max(0, y0)
            if y1 <= ys: continue
            add[ys:y1] = add[ys:y1] * tr[ys - y0:y1 - y0] + c[ys - y0:y1 - y0]; gain[ys:y1] *= tr[ys - y0:y1 - y0]
        return (gain * vmask if vmask is not None else gain), add
    ST = {True: static(True), False: static(False)} if hook is not None else {False: static(False)}
    fi = 0
    for s in segs:
        seg_d = s["n"] / fps
        base_z = M["punch"] if s.get("punch") else 1.0
        # zoom expression (ffmpeg per-frame): drift across the cut + step punch-ins inside it
        tog = M["punch"] if base_z == 1.0 else 1 / M["punch"]  # an in-shot punch toggles: in on a wide cut, back out on a punched one
        steps = "".join(f"*if(gte(t,{p - s['in']:.3f}),{tog:.5f},1)" for p in punch_at if s["in"] < p < s["out"])
        Z = f"({base_z}*{FR['zoom'] if FR else 1}*(1+{M['drift']}*t/{seg_d:.3f}){steps})"
        GF = E.get("grade_fit") or L.get("grade_fit")
        grade = fit_vf(GF) if GF else lumetri_vf(E["lumetri"]) if E.get("lumetri") else lumetri_vf(L["lumetri"]) if L.get("lumetri") else L["grade"]
        vf = (f"{rot}{grade},scale={W}:{H}:force_original_aspect_ratio=increase,crop={W}:{H},"
              f"scale=w='trunc({W}*{Z}/2)*2':h='trunc({H}*{Z}/2)*2':eval=frame:flags=lanczos,"
              f"crop={W}:{H}:x='(iw-{W})*{zcx}':y='(ih-{H})*{zcy}',format=rgb24")
        if FILL:   # second picture under the first: the same frame, zoomed and blurred, to fill the space above his head
            vf += (f",split[fg][b];[b]scale={W * FR['bg_zoom']:.0f}:-2,crop={W}:{H}:(iw-{W})/2:0,"
                   f"gblur=sigma={FR['bg_blur']},eq=brightness={FR.get('bg_brightness', -0.04)}[bg];[bg][fg]vstack")
        dec = subprocess.Popen(["ffmpeg", "-v", "error", "-ss", f"{s['in']:.3f}", "-i", str(P("video")), "-t", f"{seg_d:.4f}",
                                "-vf", vf, "-r", fps_s, "-an", "-f", "rawvideo", "-pix_fmt", "rgb24", "-"], stdout=subprocess.PIPE)
        fsz = W * H * 3 * (2 if FILL else 1); got = 0; last = None
        while got < s["n"]:
            buf = dec.stdout.read(fsz)
            if len(buf) < fsz:
                if last is None: sys.exit(f"decoder gave no frames for cut {s}")
                buf = last  # pad with the last real frame (never black)
            last = buf
            if FILL:
                both = np.frombuffer(buf, np.uint8).reshape(2 * H, W, 3); frame = both[:H].astype(np.float32)   # blurred fill
                S = FR["shift_y"]; fg = both[H:2 * H - S].astype(np.float32)
                frame[S:] += (fg - frame[S:]) * fmask[S:]
            else: frame = np.frombuffer(buf, np.uint8).reshape(H, W, 3).astype(np.float32)
            t = fi / fps
            ha = 0.0 if hook is None else 1.0 if hook_until is None else min(1.0, max(0.0, (hook_until - t) / 0.3))
            if ha in (0.0, 1.0):   # steady state: vignette + title (or not) + gradient + logo in one pass
                gain, add = ST[ha == 1.0]; frame *= gain; frame += add
            else:                  # the title's 0.3 s fade: same layers one by one, title alpha scaled
                if vmask is not None: frame *= vmask
                hk = np.array(hook).astype(np.float32); hk[..., 3] *= ha
                for img, y0 in [(Image.fromarray(hk.astype(np.uint8)), 0)] + ([(grad, grad_y)] if grad is not None else []) + [(logo, logo_y)]:
                    over(frame, premult(img), y0)
            layers = []
            for key, t0 in ctas:  # iMessage CTA slides over the top of the frame, above the hook area
                fr = cta_frame(key, t, t0, W)
                if fr:
                    img, y0, gm, op = fr
                    if gm is not None:   # frosted glass: blur the frame behind the card (inside its rounded rect)
                        if key not in glass_cache: glass_cache[key] = np.asarray(gm, np.float32)[..., None] / 255.0
                        m = glass_cache[key]; ys, ye = max(0, y0), min(H, y0 + m.shape[0])
                        if ye > ys:
                            reg = frame[ys:ye]; mm = m[ys - y0:ye - y0] * op
                            bl = cv2.GaussianBlur(reg, (0, 0), L["notify"].get("glass_blur", 28))
                            reg += (bl - reg) * mm
                    if img is cta_layer(key, W)[0]:   # holding still: convert once
                        if key not in card_cache: card_cache[key] = premult(img)
                        layers.append((card_cache[key], y0))
                    else: layers.append((premult(img), y0))
            # captions: one RGBA band around the caption baseline, cached per animation state
            band_top = int(C["baseline_y"] - C["band_up"]); band = None
            if cta_t is not None and t >= cta_t - 1e-6:
                starts = [w["start"] for w in cta_words]
                state = ("cta",) + tuple(min(int((t - s0) * fps), 40) if t >= s0 else -1 for s0 in starts); evict(("cta",))
                if state not in cache:
                    cv = Image.new("RGBA", (W, H), (0, 0, 0, 0))
                    draw_chunk(cv, cta_texts, cta_styles, starts, t, L["cta"]["scale"], underline=set(cta.get("underline", [cta["keyword"]])))
                    cache[state] = premult(cv.crop((0, band_top, W, band_top + C["band_h"])))
                band = cache[state]
            else:
                for i, (st, en, ch) in enumerate(spans):
                    if st <= t < en:
                        starts = [w["start"] for w in ch]
                        state = ("cap", i) + tuple(min(int((t - s0) * fps), 20) if t >= s0 else -1 for s0 in starts); evict(("cap", i))
                        if state not in cache:
                            cv = Image.new("RGBA", (W, H), (0, 0, 0, 0))
                            draw_chunk(cv, [display_word(w["word"]) for w in ch], styles[i], starts, t)
                            cache[state] = premult(cv.crop((0, band_top, W, band_top + C["band_h"])))
                        band = cache[state]; break
            if band is not None: layers.append((band, band_top))
            for pair, y0 in layers: over(frame, pair, y0)
            enc.stdin.write(frame.astype(np.uint8).tobytes())
            got += 1; fi += 1; prev = frame
        dec.stdout.close(); dec.wait()
    if EC:   # Adnan's follow card: cross-fade in from the last frame, then a slow push-in (a still would read as frozen)
        im = Image.open(HERE / EC["file"]).convert("RGB")
        s = max(W / im.width, H / im.height); im = im.resize((round(im.width * s), round(im.height * s)), Image.LANCZOS)
        card = np.asarray(im.crop(((im.width - W) // 2, (im.height - H) // 2, (im.width - W) // 2 + W, (im.height - H) // 2 + H)), np.float32)
        nf = max(1, int(round(EC.get("fade_s", 0.3) * fps)))
        for k in range(ec_n):
            z = 1 + (EC.get("zoom", 1.0) - 1) * ease_out_cubic(k / max(1, ec_n - 1))
            zw, zh = int(round(W * z)), int(round(H * z))
            f = cv2.resize(card, (zw, zh), interpolation=cv2.INTER_LINEAR)[(zh - H) // 2:(zh - H) // 2 + H, (zw - W) // 2:(zw - W) // 2 + W]
            if k < nf: f = prev + (f - prev) * ease_out_cubic((k + 1) / nf)
            enc.stdin.write(np.clip(f, 0, 255).astype(np.uint8).tobytes())
    enc.stdin.close(); enc.wait()
    boxes["max_line_w"] = round(max(LAYOUT_W, default=0))
    (out.parent / "boxes.json").write_text(json.dumps(boxes, indent=1, default=list), encoding="utf-8")
    aud.unlink(missing_ok=True)
    print(f"rendered {out}  {full:.2f}s  {total_n + ec_n} frames @ {fps:g}fps  {len(spans)} caption chunks" + (f"  (+{ec_n / fps:.1f}s end card)" if EC else ""))
    # drafts stay in the session — Eyad only wants the finished video on Telegram, as a preview (deliver.sh)


def voice_chain():
    """Lav clean-up tuned on Adnan's MIC 3 (v9): the raw lav is dark (presence 12–21 dB down), a little boomy, ~28 dB over
    the room, with faint 50/100/150 Hz hum. Chain: HPF + hum notches → RNNoise (speech-aware denoise) → clarity EQ
    (−4 dB @220, +7 @2.5k, +6 @5k, +7 shelf @8k) → light spectral denoise for the lifted hiss → soft expander between
    words → de-esser → compressor. Result: broadcast balance (1–3k ≈ −6, 3–6k ≈ −13 vs 300–1k), ~39 dB voice-to-room."""
    A = L["audio"]; model = HERE / A.get("rnnoise_model", "models/sh.rnnn")
    hum = ",".join(f"bandreject=f={f}:width_type=h:w=4" for f in (50, 100, 150))
    dn = f"aresample=48000,arnndn=m='{ffpath(model)}':mix=1," if model.exists() else "afftdn=nf=-32:nt=w:tn=1,"
    return (f"highpass=f=100,{hum},{dn}"
            "equalizer=f=220:t=q:w=1:g=-4,equalizer=f=2500:t=q:w=0.8:g=7,equalizer=f=5000:t=q:w=1:g=6,treble=g=7:f=8000,"
            "afftdn=nf=-40:nt=w:tn=1,agate=threshold=0.012:ratio=2:range=0.3:attack=8:release=180:knee=4,"
            "deesser=i=0.5:m=0.5:f=0.5,acompressor=threshold=-20dB:ratio=3:attack=5:release=80:makeup=2")


def build_audio(E, base, segs, dur, dst, sfx=()):
    A = L["audio"]; src = base / E["audio"] if E.get("audio") else base / E["video"]
    fade = A["edge_fade_ms"] / 1000
    filt, labels = [], []
    for i, s in enumerate(segs):
        d = s["out"] - s["in"]
        filt.append(f"[0:a]atrim={s['in']:.4f}:{s['in'] + d:.4f},asetpts=PTS-STARTPTS,aformat=sample_rates=48000:channel_layouts=mono,"
                    f"afade=t=in:d={fade},afade=t=out:st={max(0, d - fade):.4f}:d={fade}[a{i}]")
        labels.append(f"[a{i}]")
    filt.append("".join(labels) + f"concat=n={len(segs)}:v=0:a=1,apad=whole_dur={dur:.4f},atrim=0:{dur:.4f}[cat]")
    pre = voice_chain()
    raw = dst.with_suffix(".cut.wav")
    run(["ffmpeg", "-v", "error", "-y", "-i", str(src), "-filter_complex", ";".join(filt), "-map", "[cat]", "-c:a", "pcm_s24le", str(raw)])
    I, TP, LRA = A["lufs"], A["true_peak"], A["lra"]
    m = subprocess.run(["ffmpeg", "-hide_banner", "-nostats", "-i", str(raw), "-af", f"{pre},loudnorm=I={I}:TP={TP}:LRA={LRA}:print_format=json",
                        "-f", "null", "-"], capture_output=True, text=True).stderr
    j = json.loads(m[m.rindex("{"):m.rindex("}") + 1])
    ln = (f"loudnorm=I={I}:TP={TP}:LRA={LRA}:measured_I={j['input_i']}:measured_TP={j['input_tp']}:measured_LRA={j['input_lra']}:"
          f"measured_thresh={j['input_thresh']}:offset={j['target_offset']}:linear=true")
    voice = dst.with_suffix(".voice.wav"); tmp = dst.with_suffix(".ln.wav")
    run(["ffmpeg", "-v", "error", "-y", "-i", str(raw), "-af", f"{pre},{ln}", "-ar", "48000", "-c:a", "pcm_s24le", str(tmp)])
    # short, punchy clips: linear loudnorm is peak-bound and lands under target → make up the gap with gain + limiter
    e = subprocess.run(["ffmpeg", "-hide_banner", "-nostats", "-i", str(tmp), "-af", "ebur128", "-f", "null", "-"], capture_output=True, text=True).stderr
    got = float(re.findall(r"I:\s+(-?[\d.]+) LUFS", e)[-1])
    lim = 10 ** ((TP - 1.0) / 20)
    run(["ffmpeg", "-v", "error", "-y", "-i", str(tmp), "-af", f"volume={I - got + 0.2:.2f}dB,alimiter=limit={lim:.4f}:attack=2:release=40:level=false",
         "-ar", "48000", "-c:a", "pcm_s24le", str(voice)])
    raw.unlink(missing_ok=True); tmp.unlink(missing_ok=True)
    N = E.get("nasheed")
    if N and (base / N["file"]).exists():
        lvl = I - A["nasheed_db_under_voice"]
        # "from": source second the bed comes in at (30 Sep, Sofian on #14: "start the nasheed after he says pause so
        # everything before that is quiet") → silence until then, then the usual fade-in
        d0 = 0.0
        if N.get("from") is not None:
            d0 = next((s["t0"] + N["from"] - s["in"] for s in segs if s["in"] - 1e-6 <= N["from"] <= s["out"] + 1e-6), None)
            if d0 is None: sys.exit(f"nasheed.from {N['from']} is not inside a kept cut")
        bed = (f"[1:a]atrim=start={N.get('start', 0)},asetpts=PTS-STARTPTS,aformat=sample_rates=48000:channel_layouts=mono,"
               f"loudnorm=I={lvl}:TP=-6:LRA=7,atrim=0:{dur - d0:.4f},afade=t=in:d={A['nasheed_fade_in_s']},"
               f"adelay={int(d0 * 1000)}:all=1,apad,atrim=0:{dur:.4f},"
               f"afade=t=out:st={max(0, dur - A['nasheed_fade_out_s']):.3f}:d={A['nasheed_fade_out_s']}[bed];"
               f"[0:a]asplit[v][sc];[bed][sc]sidechaincompress=threshold=0.05:ratio={A['nasheed_duck_ratio']}:attack=30:release=400:level_sc=1[duck];"
               f"[v][duck]amix=inputs=2:normalize=0:duration=first,alimiter=limit={10 ** (TP / 20):.3f}[mix]")
        mixed = dst.with_suffix(".mix.wav")
        run(["ffmpeg", "-v", "error", "-y", "-i", str(voice), "-stream_loop", "-1", "-i", str(base / N["file"]), "-filter_complex", bed,
             "-map", "[mix]", "-c:a", "pcm_s24le", str(mixed)])
        # the bed adds loudness and inter-sample peaks → re-trim to target with extra limiter headroom (AAC adds ~1 dB of overs)
        e = subprocess.run(["ffmpeg", "-hide_banner", "-nostats", "-i", str(mixed), "-af", "ebur128", "-f", "null", "-"], capture_output=True, text=True).stderr
        got = float(re.findall(r"I:\s+(-?[\d.]+) LUFS", e)[-1])
        run(["ffmpeg", "-v", "error", "-y", "-i", str(mixed), "-af", f"volume={I - got:.2f}dB,alimiter=limit={10 ** ((TP - 1.3) / 20):.4f}:attack=1:release=40:level=false",
             "-c:a", "pcm_s24le", str(dst)])
        voice.unlink(missing_ok=True); mixed.unlink(missing_ok=True)
    else:
        if N: print(f"nasheed file missing: {N['file']} — rendering voice only", file=sys.stderr)
        voice.rename(dst)
    if sfx:  # notification sound for each CTA, then re-limit
        sf = HERE / L["notify"].get("sfx_file", "sfx/notify.wav"); tmp = dst.with_suffix(".sfx.wav"); dst.rename(tmp)
        g = 10 ** (L["notify"]["sfx_db"] / 20)
        fc = f"[1:a]asplit={len(sfx)}" + "".join(f"[r{i}]" for i in range(len(sfx))) + ";" if len(sfx) > 1 else "[1:a]anull[r0];"
        fc += "".join(f"[r{i}]adelay={int(t * 1000)}:all=1,volume={g:.3f}[s{i}];" for i, t in enumerate(sfx))
        fc += "[0:a]" + "".join(f"[s{i}]" for i in range(len(sfx))) + f"amix=inputs={len(sfx) + 1}:normalize=0:duration=first,alimiter=limit={10 ** ((TP - 1.3) / 20):.4f}:level=false[o]"
        run(["ffmpeg", "-v", "error", "-y", "-i", str(tmp), "-i", str(sf), "-filter_complex", fc, "-map", "[o]", "-c:a", "pcm_s24le", str(dst)])
        tmp.unlink(missing_ok=True)
    # loudness lock: every stage above sets its gain and then limits, and on long, peaky speech the limiter eats loudness
    # afterwards ("culture leaving daughters out": -15.2 LUFS instead of -14) → measure, correct, re-limit, up to 3 times
    for _ in range(3):
        e = subprocess.run(["ffmpeg", "-hide_banner", "-nostats", "-i", str(dst), "-af", "ebur128", "-f", "null", "-"], capture_output=True, text=True).stderr
        got = float(re.findall(r"I:\s+(-?[\d.]+) LUFS", e)[-1])
        if abs(I - got) <= 0.3: break
        tmp = dst.with_suffix(".lock.wav"); dst.rename(tmp)
        run(["ffmpeg", "-v", "error", "-y", "-i", str(tmp), "-af", f"volume={I - got:.2f}dB,alimiter=limit={10 ** ((TP - 1.3) / 20):.4f}:attack=1:release=40:level=false",
             "-c:a", "pcm_s24le", str(dst)])
        tmp.unlink(missing_ok=True)
    # true-peak guard, oversampled 4× so it catches inter-sample peaks: voice-only reels (no nasheed, no card ping — 5 Oct)
    # skipped every later re-limit and AAC pushed #16 to −0.4 dBTP
    tmp = dst.with_suffix(".tp.wav"); dst.rename(tmp)
    run(["ffmpeg", "-v", "error", "-y", "-i", str(tmp), "-af", f"aresample=192000,alimiter=limit={10 ** ((TP - 1.5) / 20):.4f}:attack=1:release=40:level=false,"
         "aresample=48000", "-c:a", "pcm_s24le", str(dst)])
    tmp.unlink(missing_ok=True)


if __name__ == "__main__":
    main()
