"""Premium theme for SK Media series (job "theme": "premium"; first used for the Vinh Giang batch, Oct 2026).
Same stack, coordinates and rules as the house style; adds polish on top:
  · living background: deep gradient with two slow glows (pre-rendered tall plate, cropped per frame) + film grain
  · cards: soft drop shadow + hairline border; screen card gets a slow push-in per section
  · badges/tags: gradient fill + light sweep on entry; quotes get an underline that draws in
  · new beat types: stat3 (three count-up tiles), funnel (TOF/MOF/BOF tiers), dm (Instagram DM thread with typing dots)
  · opening: series kicker on the screen card ("PART 1/4 · SHORT-FORM")
Everything returns QA boxes like graphics.py. Nothing here runs unless the plan's theme is "premium"."""
from functools import lru_cache
import math
import numpy as np
from PIL import Image, ImageDraw, ImageFilter
import render as R
import graphics as G

YEL, RED, WHITE, BLACK = G.YEL, G.RED, G.WHITE, G.BLACK
INK = (16, 16, 22); SOFT = (150, 150, 162); IGBLUE = (55, 151, 240); DMGREY = (38, 38, 44)

def on(plan): return plan.get("theme") == "premium"

# ---------------------------------------------------------------- background + grain
@lru_cache(maxsize=4)
def _plate(W, H):
    """Tall background plate: vertical gradient + warm and cool glows + vignette. Cropped with a slow drift per frame."""
    PH = int(H * 1.18)
    y = np.linspace(0, 1, PH)[:, None]; x = np.linspace(0, 1, W)[None, :]
    top, bot = np.array([12, 12, 18]), np.array([9, 8, 13])
    img = top[None, None, :] * (1 - y[..., None]) + bot[None, None, :] * y[..., None]
    def glow(cx, cy, r, col, a):
        d = np.sqrt(((x - cx) * W) ** 2 + ((y - cy) * PH) ** 2) / (r * W)
        return np.exp(-d ** 2)[..., None] * np.array(col)[None, None, :] * a
    img = img + glow(0.10, 0.16, 0.85, (255, 214, 10), 0.15) + glow(0.95, 0.60, 0.9, (226, 38, 46), 0.14) \
              + glow(0.35, 0.98, 0.8, (90, 80, 200), 0.13)
    vig = 1 - 0.35 * (((x - 0.5) * 1.6) ** 2 + ((y - 0.5) * 1.1) ** 2)
    img = np.clip(img * vig[..., None], 0, 255).astype(np.uint8)
    return Image.fromarray(img, "RGB").convert("RGBA")

def background(t, S):
    W, H = int(1080 * S), int(1920 * S); p = _plate(W, H)
    off = (p.height - H) / 2 * (1 + math.sin(t / 9.0)) ; off = int(min(max(off, 0), p.height - H))
    return p.crop((0, off, W, off + H)).copy()

@lru_cache(maxsize=4)
def _grains(W, H, n=6):
    rng = np.random.default_rng(11); out = []
    for _ in range(n):
        g = rng.normal(0, 1, (H // 2, W // 2)); a = np.clip(np.abs(g) * 5, 0, 11).astype(np.uint8)
        v = np.where(g > 0, 255, 0).astype(np.uint8)
        im = Image.fromarray(np.dstack([v, v, v, a]), "RGBA").resize((W, H), Image.NEAREST); out.append(im)
    return out

def grain(img, fi):
    gs = _grains(img.width, img.height); img.alpha_composite(gs[fi % len(gs)])

@lru_cache(maxsize=16)
def _shadow(w, h, r, S):
    pad = int(40 * S); im = Image.new("RGBA", (w + 2 * pad, h + 2 * pad), (0, 0, 0, 0))
    ImageDraw.Draw(im).rounded_rectangle([pad, pad + 14 * S, pad + w, pad + h + 14 * S], r, fill=(0, 0, 0, 150))
    return im.filter(ImageFilter.GaussianBlur(22 * S)), pad

def card_shadow(img, rect, S):
    x, y, w, h = [int(round(v)) for v in rect]; sh, pad = _shadow(w, h, int(R.ST["card_radius"] * S), S)
    img.alpha_composite(sh, (x - pad, y - pad))

def card_border(img, rect, S):
    x, y, w, h = rect; d = ImageDraw.Draw(img)
    d.rounded_rectangle([x, y, x + w - 1, y + h - 1], int(R.ST["card_radius"] * S), outline=(255, 255, 255, 30), width=max(1, int(2 * S)))

def push(plan, c, t):
    """Slow push-in on the screen card across each section (1.00 → 1.045)."""
    sec = plan["sections"][c["section"]]; k = min(1, max(0, (t - sec["t0"]) / max(0.1, sec["dur"])))
    return 1.0 + 0.045 * R.ease_io(k)

# ---------------------------------------------------------------- shared bits
def shine(lay, t, t0, S, dur=0.75, delay=0.12):
    """Diagonal light sweep across a layer's opaque pixels, once, shortly after entry."""
    k = (t - t0 - delay) / dur
    if not 0 <= k <= 1: return
    W, H = lay.im.size; band = Image.new("L", (W, H), 0); d = ImageDraw.Draw(band)
    x = -0.4 * W + 1.8 * W * R.ease_io(k); bw = max(20 * S, 0.16 * W)
    d.polygon([(x, 0), (x + bw, 0), (x + bw - H * 0.6, H), (x - H * 0.6, H)], fill=110)
    band = band.filter(ImageFilter.GaussianBlur(6 * S))
    al = np.minimum(np.asarray(band), np.asarray(lay.im.getchannel("A")))
    white = Image.new("RGBA", (W, H), (255, 255, 255, 0)); white.putalpha(Image.fromarray(al))
    lay.im.alpha_composite(white)

def grad_rr(lay, box, r, c1, c2):
    """Rounded rect with a vertical gradient c1→c2 plus a 1-px top highlight."""
    x0, y0, x1, y1 = [int(v) for v in box]; w, h = x1 - x0, y1 - y0
    g = np.linspace(0, 1, h)[:, None, None]; arr = (np.array(c1) * (1 - g) + np.array(c2) * g) * np.ones((1, w, 1))
    im = Image.fromarray(arr.astype(np.uint8), "RGB").convert("RGBA")
    m = Image.new("L", (w, h), 0); ImageDraw.Draw(m).rounded_rectangle([0, 0, w - 1, h - 1], r, fill=255); im.putalpha(m)
    lay.im.alpha_composite(im, (x0, y0))
    ImageDraw.Draw(lay.im).rounded_rectangle([x0 + 1, y0 + 1, x1 - 2, y1 - 2], r, outline=(255, 255, 255, 46), width=1)

def drop(card, lay, cx, cy, ki, ko, S, blur=14, alpha=120, dy=10):
    """Soft shadow under a Layer at its final position (fades with the element)."""
    a = ki * ko
    if a <= 0.01: return
    sh = Image.new("RGBA", (lay.im.width + 60, lay.im.height + 60), (0, 0, 0, 0))
    m = lay.im.getchannel("A").point(lambda v: int(min(v, 255) * alpha / 255 * a))
    blk = Image.new("RGBA", lay.im.size, (0, 0, 0, 255)); blk.putalpha(m); sh.alpha_composite(blk, (30, 30))
    sh = sh.filter(ImageFilter.GaussianBlur(blur * S))
    card.alpha_composite(sh, (int(cx - lay.im.width / 2 - 30), int(cy - lay.im.height / 2 - 30 + dy * S + (1 - ki) * 24 * S)))

# ---------------------------------------------------------------- upgraded house elements
def badge(card, t, S, g, ki, ko):
    W, H = card.size; big = g["big"]
    if g.get("count"):
        k = R.ease_out_expo(min(1, max(0, (t - g["t0"]) / max(0.05, g["count_end"] - g["t0"]))))
        val = int(round(g["count"] * k)); big = g.get("prefix", "") + f"{val:,}" + g.get("suffix", "")
    fb = G.anton(118 * S); fs = G.inter(24 * S, 800)
    digit_w = max(fb.getlength(ch) for ch in "0123456789")
    width = lambda s: sum(digit_w if ch.isdigit() else fb.getlength(ch) for ch in s)
    ref = g.get("prefix", "") + f"{g.get('count', 0):,}" + g.get("suffix", "") if g.get("count") else big
    bw_text = max(width(ref), fs.getlength(g["sub"].upper())); over = bw_text > W - 120 * S
    bw = min(W - 80 * S, bw_text + 80 * S); cap_h = fb.getbbox("0")[3] - fb.getbbox("0")[1]
    base = 24 * S + cap_h; bh = base + 60 * S
    lay = G.Layer(bw, bh); grad_rr(lay, [0, 0, bw, bh], int(24 * S), (240, 52, 58), (176, 20, 30)); d = lay.d
    x = (bw - width(big)) / 2
    for ch in big:
        cw = digit_w if ch.isdigit() else fb.getlength(ch); d.text((x + cw / 2, base), ch, font=fb, fill=WHITE, anchor="ms"); x += cw
    d.text((bw / 2, base + 33 * S), g["sub"].upper(), font=fs, fill=(255, 236, 236), anchor="mm")
    shine(lay, t, g["t0"], S)
    cy = H - 34 * S - bh / 2; drop(card, lay, W / 2, cy, ki, ko, S)
    x, y, w, h = lay.paste(card, W / 2, cy, ki, ko, S)
    return [{"id": g["id"], "kind": "text", "x": x, "y": y, "w": w, "h": h, "overflow": over}]

def pill(card, t, S, g, ki, ko):
    W, H = card.size; txt = g["text"].upper(); pad = 28 * S
    f, px, over = G.fit(lambda p: G.inter(p, 800), txt, 36 * S, W - 2 * pad - 60 * S)
    tw = f.getlength(txt); ph = px * 1.75
    lay = G.Layer(tw + 2 * pad, ph); grad_rr(lay, [0, 0, lay.im.width, ph], int(ph / 2), (255, 222, 40), (245, 196, 0))
    lay.d.text((lay.im.width / 2, ph / 2), txt, font=f, fill=BLACK, anchor="mm"); shine(lay, t, g["t0"], S, 0.6)
    cy = H - 34 * S - ph / 2; drop(card, lay, W / 2, cy, ki, ko, S, 10, 110, 6)
    x, y, w, h = lay.paste(card, W / 2, cy, ki, ko, S)
    return [{"id": g["id"], "kind": "text", "x": x, "y": y, "w": w, "h": h, "overflow": over}]

def quote(card, t, S, g, ki, ko):
    out = G.quote(card, t, S, g, ki, ko)
    if g.get("l2") and out:   # yellow underline draws in under the second line
        b = out[0]; k = R.ease_out_quint(min(1, max(0, (t - g["t0"] - 0.18) / 0.45))) * ko
        if k > 0:
            W = card.size[0]; uw = min(b["w"] * 0.55, W - 160 * S) * k; y = b["y"] + b["h"] + 4 * S
            ImageDraw.Draw(card).rounded_rectangle([W / 2 - uw / 2, y, W / 2 + uw / 2, y + 8 * S], int(4 * S), fill=YEL + (int(255 * ko),))
    return out

# ---------------------------------------------------------------- new beat types
def stat3(card, t, S, g, ki, ko):
    """Three stat tiles side by side; each pops in on its word and counts up from 0 in 350 ms (tabular digits)."""
    W, H = card.size; G.dim(card, ki * ko); n = len(g["items"]); gap = 22 * S
    tw = (W - 70 * S - gap * (n - 1)) / n; th = min(H * 0.62, tw * 1.45); out = []
    fb = G.anton(min(170 * S, th * 0.5)); x = W / 2 - (tw * n + gap * (n - 1)) / 2
    for i, (it, at) in enumerate(zip(g["items"], g["times"])):
        if t >= at:
            kin = R.ease_out_quint(min(1, (t - at) / G.ms("enter")))
            lay = G.Layer(tw, th); grad_rr(lay, [0, 0, tw, th], int(26 * S), (34, 34, 42), (20, 20, 26))
            kc = R.ease_out_expo(min(1, (t - at) / 0.35)); val = it.get("prefix", "") + f'{int(round(it["n"] * kc)):,}' + it.get("suffix", "")
            ref = it.get("prefix", "") + f'{it["n"]:,}' + it.get("suffix", "")   # size from the final value so digits don't jump
            fv, _, _ = G.fit(G.anton, ref, min(170 * S, th * 0.5), tw - 30 * S)
            lay.d.text((tw / 2, th * 0.50), val, font=fv, fill=YEL, anchor="ms")
            f, _, o = G.fit(lambda p: G.inter(p, 800), it["label"].upper(), 30 * S, tw - 24 * S)
            lay.d.text((tw / 2, th * 0.70), it["label"].upper(), font=f, fill=WHITE, anchor="mm")
            if it.get("sub"):
                fs, _, _ = G.fit(lambda p: G.inter(p, 600), it["sub"], 22 * S, tw - 24 * S)
                lay.d.text((tw / 2, th * 0.84), it["sub"], font=fs, fill=SOFT, anchor="mm")
            lay.d.rounded_rectangle([tw * 0.3, th - 10 * S, tw * 0.7, th - 5 * S], int(3 * S), fill=YEL)
            shine(lay, t, at, S, 0.6)
            drop(card, lay, x + tw / 2, H / 2, kin, ko, S)
            b = lay.paste(card, x + tw / 2, H / 2, kin, ko, S)
            out.append({"id": f'{g["id"]}.{i}', "kind": "chip", "x": b[0], "y": b[1], "w": b[2], "h": b[3], "overflow": o})
        x += tw + gap
    return out

def funnel(card, t, S, g, ki, ko):
    """Funnel tiers (widest on top), each sliding in on its word: [tag, text] per item (text may be "").
    "shape": "pyramid" flips it (narrowest on top), e.g. Schwartz's 5 levels of awareness listed from most aware down."""
    W, H = card.size; G.dim(card, ki * ko); n = len(g["items"]); gap = (14 if n <= 3 else 10) * S
    th = min(118 * S, (H - 80 * S - gap * (n - 1)) / n); top = W - 90 * S; bot = W * (0.46 if n <= 3 else 0.36)
    pyr = g.get("shape") == "pyramid"
    cols = [((255, 222, 40), (240, 190, 0), BLACK), ((255, 150, 40), (236, 110, 20), BLACK), ((240, 52, 58), (176, 20, 30), WHITE)]
    if n > 3:   # yellow -> orange -> red across the tiers
        stops = [c[:2] for c in cols]; cols = []
        for i in range(n):
            u = i / (n - 1) * 2; a, b = stops[min(int(u), 1)], stops[min(int(u), 1) + 1]; f = u - min(int(u), 1)
            mix = lambda p, q: tuple(int(p[k] + (q[k] - p[k]) * f) for k in range(3))
            cols.append((mix(a[0], b[0]), mix(a[1], b[1]), BLACK if u < 1.4 else WHITE))
    y = H / 2 - (th * n + gap * (n - 1)) / 2; out = []
    for i, ((tag, txt), at) in enumerate(zip(g["items"], g["times"])):
        w0 = top - (top - bot) * i / n; w1 = top - (top - bot) * (i + 1) / n
        if pyr: w0, w1 = bot + (top - bot) * (i + 1) / n, bot + (top - bot) * i / n   # w0 = widest edge (layer width)
        if t >= at:
            kin = R.ease_out_quint(min(1, (t - at) / G.ms("enter")))
            lay = G.Layer(w0, th); c1, c2, fg = cols[i % len(cols)]
            m = Image.new("L", lay.im.size, 0); inset = (w0 - w1) / 2
            poly = [(inset, 0), (w0 - inset, 0), (w0, th), (0, th)] if pyr else [(0, 0), (w0, 0), (w0 - inset, th), (inset, th)]
            ImageDraw.Draw(m).polygon(poly, fill=255)
            gr = np.linspace(0, 1, int(th))[:, None, None]
            arr = (np.array(c1) * (1 - gr) + np.array(c2) * gr) * np.ones((1, int(w0), 1))
            im = Image.fromarray(arr.astype(np.uint8), "RGB").convert("RGBA").resize(lay.im.size); im.putalpha(m)
            lay.im.alpha_composite(im)
            if txt:
                ft, _, o1 = G.fit(G.anton, tag.upper(), th * 0.36, min(w0, w1) - 40 * S)
                lay.d.text((w0 / 2, th * 0.36), tag.upper(), font=ft, fill=fg, anchor="mm")
                f2, _, o = G.fit(lambda p: G.inter(p, 700), txt, th * 0.24, min(w0, w1) - 40 * S); o = o or o1
                lay.d.text((w0 / 2, th * 0.72), txt, font=f2, fill=fg, anchor="mm")
            else:      # tag only, centred
                ft, _, o = G.fit(G.anton, tag.upper(), th * 0.44, min(w0, w1) - 36 * S)
                lay.d.text((w0 / 2, th * 0.52), tag.upper(), font=ft, fill=fg, anchor="mm")
            shine(lay, t, at, S, 0.55)
            b = lay.paste(card, W / 2, y + th / 2, kin, ko, S)
            out.append({"id": f'{g["id"]}.{i}', "kind": "chip", "x": b[0], "y": b[1], "w": b[2], "h": b[3], "overflow": o})
        y += th + gap
    return out

_avatar = {}
def _avatar_img(path, d):
    if (path, d) not in _avatar:
        try:
            a = Image.open(path).convert("RGBA").resize((d, d), Image.LANCZOS)
        except Exception:
            a = Image.new("RGBA", (d, d), YEL + (255,))
        m = Image.new("L", (d, d), 0); ImageDraw.Draw(m).ellipse([0, 0, d - 1, d - 1], fill=255); a.putalpha(m); _avatar[(path, d)] = a
    return _avatar[(path, d)]

def _wrap(text, f, maxw):
    lines, cur = [], ""
    for w in text.split():
        if cur and f.getlength(cur + " " + w) > maxw: lines.append(cur); cur = w
        else: cur = (cur + " " + w).strip()
    return lines + ([cur] if cur else [])

def dm(card, t, S, g, ki, ko):
    """Instagram DM thread: header (avatar, handle, tag) + bubbles appearing at their words; 'them' bubbles are
    preceded by 450 ms of typing dots. msgs: [{"from": "me"|"them", "text": ...}]."""
    W, H = card.size; G.dim(card, ki * ko)
    pw = W - 110 * S; fb = G.inter(36 * S, 600); maxw = pw * 0.74; av = int(64 * S)
    need = 22 * S + av + 40 * S + sum(46 * S * len(_wrap(m["text"], fb, maxw - 44 * S)) + 34 * S + 18 * S + (30 * S if m.get("label") else 0)
                                      for m in g["msgs"]) + 20 * S
    ph = min(H - 70 * S, max(need, H * 0.5)); lay = G.Layer(pw, ph); d = lay.d
    d.rounded_rectangle([0, 0, pw - 1, ph - 1], int(30 * S), fill=(14, 14, 18, 250), outline=(255, 255, 255, 34), width=max(1, int(2 * S)))
    lay.im.alpha_composite(_avatar_img(g.get("avatar", ""), av), (int(26 * S), int(22 * S)))
    fh = G.inter(32 * S, 800); d.text((26 * S + av + 18 * S, 22 * S + av * 0.34), g.get("title", ""), font=fh, fill=WHITE, anchor="lm")
    tx = 26 * S + av + 18 * S + fh.getlength(g.get("title", "")) + 12 * S
    d.ellipse([tx, 22 * S + av * 0.34 - 11 * S, tx + 22 * S, 22 * S + av * 0.34 + 11 * S], fill=IGBLUE)   # verified dot
    d.line([(tx + 6 * S, 22 * S + av * 0.34), (tx + 10 * S, 22 * S + av * 0.34 + 4 * S), (tx + 16 * S, 22 * S + av * 0.34 - 5 * S)], fill=WHITE, width=max(1, int(3 * S)))
    if g.get("tag"):
        ft = G.inter(22 * S, 700); d.text((26 * S + av + 18 * S, 22 * S + av * 0.78), g["tag"], font=ft, fill=SOFT, anchor="lm")
    d.line([(0, 22 * S + av + 18 * S), (pw, 22 * S + av + 18 * S)], fill=(255, 255, 255, 26), width=1)
    y = 22 * S + av + 40 * S; out = []
    for i, (m, at) in enumerate(zip(g["msgs"], g["times"])):
        them = m["from"] == "them"; show = at + (0.45 if them else 0)
        if t < at: break
        if them and t < show:   # typing dots
            bw, bh = 110 * S, 62 * S; bx = 26 * S
            d.rounded_rectangle([bx, y, bx + bw, y + bh], int(bh / 2), fill=DMGREY)
            for j in range(3):
                a = 0.35 + 0.65 * (0.5 + 0.5 * math.sin((t - at) * 14 - j * 0.9))
                cx = bx + 30 * S + j * 25 * S; d.ellipse([cx - 7 * S, y + bh / 2 - 7 * S, cx + 7 * S, y + bh / 2 + 7 * S], fill=(200, 200, 208, int(255 * a)))
            break
        lines = _wrap(m["text"], fb, maxw - 44 * S); lh = 46 * S; bh = lh * len(lines) + 34 * S
        bw = max(fb.getlength(l) for l in lines) + 44 * S
        k = R.ease_out_quint(min(1, (t - show) / 0.25)); bx = 26 * S if them else pw - 26 * S - bw
        yy = y + (1 - k) * 14 * S
        bub = Image.new("RGBA", (int(bw), int(bh)), (0, 0, 0, 0)); bd = ImageDraw.Draw(bub)
        if them: bd.rounded_rectangle([0, 0, bw - 1, bh - 1], int(min(30 * S, bh / 2)), fill=DMGREY)
        else:
            gr = np.linspace(0, 1, int(bw))[None, :, None]
            arr = (np.array((131, 58, 180)) * (1 - gr) + np.array((64, 93, 230)) * gr) * np.ones((int(bh), 1, 1))
            bub = Image.fromarray(arr.astype(np.uint8), "RGB").convert("RGBA")
            mk = Image.new("L", bub.size, 0); ImageDraw.Draw(mk).rounded_rectangle([0, 0, bw - 1, bh - 1], int(min(30 * S, bh / 2)), fill=255); bub.putalpha(mk)
            bd = ImageDraw.Draw(bub)
        for j, l in enumerate(lines): bd.text((22 * S, 17 * S + lh * j + lh / 2), l, font=fb, fill=WHITE, anchor="lm")
        if k < 1: bub.putalpha(bub.getchannel("A").point(lambda v: int(v * k)))
        lay.im.alpha_composite(bub, (int(bx), int(yy)))
        if m.get("label"):
            fl = G.inter(20 * S, 700); d.text((bx + (0 if them else bw), y + bh + 18 * S), m["label"].upper(), font=fl, fill=YEL, anchor="lm" if them else "rm")
            y += 30 * S
        y += bh + 18 * S
    over = y > ph
    b = lay.paste(card, W / 2, H / 2, ki, ko, S)
    out.append({"id": g["id"], "kind": "panel", "x": b[0], "y": b[1], "w": b[2], "h": b[3], "overflow": over})
    return out

def kicker(card, t, S, plan):
    """Opening only: series kicker pill top-left of the screen card."""
    txt = plan.get("series", "")
    if not txt or t >= R.L["opening_duration_s"]: return []
    k = R.ease_out_quint(min(1, t / 0.35)); ko = 1 - R.ease_in(min(1, max(0, (t - (R.L["opening_duration_s"] - 0.16)) / 0.16)))
    f = G.inter(26 * S, 800); pad = 18 * S; ph = 50 * S; lay = G.Layer(f.getlength(txt.upper()) + 2 * pad + 26 * S, ph)
    lay.d.rounded_rectangle([0, 0, lay.im.width - 1, ph - 1], int(ph / 2), fill=(12, 12, 16, 225), outline=(255, 255, 255, 50), width=1)
    lay.d.ellipse([pad, ph / 2 - 7 * S, pad + 14 * S, ph / 2 + 7 * S], fill=RED)
    lay.d.text((pad + 26 * S, ph / 2), txt.upper(), font=f, fill=WHITE, anchor="lm")
    cx, cy = 24 * S + lay.im.width / 2, 24 * S + ph / 2
    b = lay.paste(card, cx, cy, k, ko, S)
    return [{"id": "kicker", "kind": "text", "x": b[0], "y": b[1], "w": b[2], "h": b[3], "overflow": False}]

TYPES = {"badge": badge, "pill": pill, "quote": quote, "stat3": stat3, "funnel": funnel, "dm": dm}
