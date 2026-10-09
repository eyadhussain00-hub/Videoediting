"""Graphics layer — SK Media funnel-breakdown style (matches TJR Video 2):
opening headline · red numbered section tag + progress bar · yellow pills · red stat badges (count-up) ·
dimmed-screen quote cards · platform chips / flow · Follow + comment CTA.
Every element returns a box {id, kind, x, y, w, h, overflow, parent} in canvas px for QA."""
from functools import lru_cache
from pathlib import Path
from PIL import Image, ImageDraw, ImageFilter
import render as R

ANTON = str(Path(R.FONT).with_name("Anton.ttf"))
RED = (226, 38, 46); YEL = R.ACC; WHITE = (255, 255, 255); BLACK = (12, 12, 14); BLUE = (29, 155, 240)
MO = R.MO

@lru_cache(maxsize=512)
def anton(px):
    from PIL import ImageFont
    return ImageFont.truetype(ANTON, max(8, int(px)))

@lru_cache(maxsize=512)
def inter(px, w=800): return R.font(px, w)

def ms(k): return MO[k]["ms"] / 1000

def env(t, t0, t1):
    """(k_in, k_out): enter 280 ms ease-out-quint, exit 160 ms ease-in."""
    if t < t0 or t >= t1: return None
    ki = R.ease_out_quint(min(1, (t - t0) / ms("enter")))
    ko = 1 - R.ease_in(min(1, max(0, (t - (t1 - ms("exit"))) / ms("exit"))))
    return ki, ko

def fit(font_fn, text, px, maxw, minpx=10):
    f = font_fn(px)
    while f.getlength(text) > maxw and px > minpx: px *= 0.95; f = font_fn(px)
    return f, px, f.getlength(text) > maxw

class Layer:
    """Draw into a transparent layer, then composite it transformed (y offset, scale, opacity) at an anchor."""
    def __init__(self, w, h): self.im = Image.new("RGBA", (int(w), int(h)), (0, 0, 0, 0)); self.d = ImageDraw.Draw(self.im)
    def paste(self, dst, cx, cy, ki, ko, dy_px):
        a = ki * ko
        box = (cx - self.im.width / 2, cy - self.im.height / 2, self.im.width, self.im.height)
        if a <= 0.001: return box
        sc = MO["enter"]["from"]["scale"] + (1 - MO["enter"]["from"]["scale"]) * ki
        im = self.im
        if abs(sc - 1) > 1e-3: im = im.resize((max(1, int(im.width * sc)), max(1, int(im.height * sc))), Image.BICUBIC)
        if a < 0.999:
            al = im.getchannel("A").point(lambda v: int(v * a)); im = im.copy(); im.putalpha(al)
        y = cy - im.height / 2 + (1 - ki) * MO["enter"]["from"]["y"] * dy_px + (1 - ko) * MO["exit"]["to"]["y"] * dy_px
        dst.alpha_composite(im, (int(cx - im.width / 2), int(y)))
        return box

# ---------------------------------------------------------------- canvas-level
def header(img, t, S, plan, c):
    sec = plan["sections"][c["section"]]; els = []
    if t < R.L["opening_duration_s"]: return opening_headline(img, t, S, plan)
    if not sec.get("num"): return els
    hb = R.rect_at("header", t, S); pb = R.rect_at("progress", t, S)
    age = t - sec["t0"]; k = R.ease_out_quint(min(1, age / ms("section_change")))
    lay = Layer(hb[2], hb[3]); d = lay.d
    h = hb[3]; tag = h * 0.62; f = anton(tag * 0.82)
    num = sec["num"]; tw = f.getlength(num)
    d.rounded_rectangle([0, (h - tag) / 2, tw + tag * 0.5, (h + tag) / 2], radius=int(8 * S), fill=RED)
    d.text((tag * 0.25, h / 2), num, font=f, fill=WHITE, anchor="lm")
    title = sec["title"].upper(); ft, _, over = fit(anton, title, tag * 0.82, hb[2] - tw - tag)
    d.text((tw + tag * 0.5 + 14 * S, h / 2), title, font=ft, fill=WHITE, anchor="lm")
    a = int(255 * k); im = lay.im
    if k < 1:
        im = im.copy(); im.putalpha(im.getchannel("A").point(lambda v: int(v * k)))
        if k < 0.6: im = im.filter(ImageFilter.GaussianBlur(MO["section_change"]["blur_px"] * S * (1 - k / 0.6)))
    img.alpha_composite(im, (int(hb[0]), int(hb[1] + (1 - k) * 16 * S)))
    els.append({"id": "header", "kind": "text", "x": hb[0] / S, "y": hb[1] / S, "w": (tw + tag + 14 * S + ft.getlength(title)) / S, "h": hb[3] / S, "overflow": over, "parent": None})
    # progress bar
    prog = min(1, max(0, age / max(0.1, sec["dur"])))
    d2 = ImageDraw.Draw(img)
    d2.rounded_rectangle([pb[0], pb[1], pb[0] + pb[2], pb[1] + pb[3]], radius=int(2 * S), fill=(255, 255, 255, 40) if False else (40, 40, 46))
    if prog > 0: d2.rounded_rectangle([pb[0], pb[1], pb[0] + max(pb[3], pb[2] * prog), pb[1] + pb[3]], radius=int(2 * S), fill=YEL)
    tot = sum(1 for s in plan["sections"].values() if s.get("num"))
    cnt = f"{sec['num']}/{tot:02d}"; fc = inter(22 * S, 700)
    d2.text((hb[0] + hb[2], hb[1] + hb[3] / 2), cnt, font=fc, fill=(150, 150, 158), anchor="rm")
    els.append({"id": "progress", "kind": "bar", "x": pb[0] / S, "y": pb[1] / S, "w": pb[2] / S, "h": pb[3] / S, "parent": None})
    return els

def opening_headline(img, t, S, plan):
    hb = R.rect_at("headline", t, S) if "headline" in R.L["layouts"]["opening"] else None
    if hb is None: return []
    l1, l2 = plan["headline"]
    k = R.ease_out_quint(min(1, t / ms("enter")))
    ko = 1 - R.ease_in(min(1, max(0, (t - (R.L["opening_duration_s"] - ms("exit"))) / ms("exit"))))
    lay = Layer(hb[2], hb[3]); d = lay.d; lh = hb[3] / 2
    over = False
    for i, (txt, col) in enumerate(((l1, WHITE), (l2, YEL))):
        f, _, o = fit(anton, txt, lh * 1.18, hb[2]); over |= o
        d.text((hb[2] / 2, lh * i + lh / 2), txt, font=f, fill=col, anchor="mm")
    lay.paste(img, hb[0] + hb[2] / 2, hb[1] + hb[3] / 2, k, ko, S)
    return [{"id": "headline", "kind": "text", "x": hb[0] / S, "y": hb[1] / S, "w": hb[2] / S, "h": hb[3] / S, "overflow": over, "parent": None}]

def overlays(img, t, S, plan, c): return []

# ---------------------------------------------------------------- screen-card level
def screen_zoom(plan, c, t): return None

def active(plan, t, sec):
    return [g for g in plan.get("graphics", []) if g["t0"] <= t < g["t1"] and g["sec"] == sec]

def screen_overlay(card, t, S, plan, c, origin=(0, 0)):
    W, H = card.size; els = []
    for g in active(plan, t, c["section"]):
        e = env(t, g["t0"], g["t1"]); ki, ko = e
        fn = {"pill": pill, "badge": badge, "quote": quote, "chips": chips, "flow": flow}[g["type"]]
        for b in fn(card, t, S, g, ki, ko) or []:
            b.update({"x": (origin[0] + b["x"]) / S, "y": (origin[1] + b["y"]) / S, "w": b["w"] / S, "h": b["h"] / S, "parent": "screen"})
            els.append(b)
    return els

def dim(card, a):
    ov = Image.new("RGBA", card.size, (8, 8, 10, int(185 * a))); card.alpha_composite(ov)

def pill(card, t, S, g, ki, ko):
    W, H = card.size; txt = g["text"].upper(); pad = 26 * S
    f, px, over = fit(lambda p: inter(p, 800), txt, 36 * S, W - 2 * pad - 60 * S)
    tw = f.getlength(txt); ph = px * 1.7
    lay = Layer(tw + 2 * pad, ph)
    lay.d.rounded_rectangle([0, 0, lay.im.width - 1, ph - 1], radius=int(ph / 2), fill=YEL)
    lay.d.text((lay.im.width / 2, ph / 2), txt, font=f, fill=BLACK, anchor="mm")
    cy = H - 30 * S - ph / 2
    x, y, w, h = lay.paste(card, W / 2, cy, ki, ko, S)
    return [{"id": g["id"], "kind": "text", "x": x, "y": y, "w": w, "h": h, "overflow": over}]

def badge(card, t, S, g, ki, ko):
    W, H = card.size
    big = g["big"]
    if g.get("count"):  # count-up with tabular digits, ease-out-expo, done at g["count_end"]
        k = R.ease_out_expo(min(1, max(0, (t - g["t0"]) / max(0.05, g["count_end"] - g["t0"]))))
        val = int(round(g["count"] * k)); big = g.get("prefix", "") + f"{val:,}" + g.get("suffix", "")
    fb = anton(118 * S); fs = inter(24 * S, 800)
    digit_w = max(fb.getlength(ch) for ch in "0123456789")
    def width(s): return sum(digit_w if ch.isdigit() else fb.getlength(ch) for ch in s)
    ref = g.get("prefix", "") + f"{g.get('count', 0):,}" + g.get("suffix", "") if g.get("count") else big
    bw_text = max(width(ref), fs.getlength(g["sub"].upper()))
    over = bw_text > W - 120 * S
    bw = min(W - 80 * S, bw_text + 70 * S)
    cap_h = fb.getbbox("0")[3] - fb.getbbox("0")[1]  # digit height
    base = 22 * S + cap_h; bh = base + 58 * S
    lay = Layer(bw, bh); d = lay.d
    d.rounded_rectangle([0, 0, bw - 1, bh - 1], radius=int(22 * S), fill=RED)
    x = (bw - width(big)) / 2
    for ch in big:  # fixed-width digit cells → no jitter while counting; shared baseline keeps commas low
        cw = digit_w if ch.isdigit() else fb.getlength(ch)
        d.text((x + cw / 2, base), ch, font=fb, fill=WHITE, anchor="ms"); x += cw
    d.text((bw / 2, base + 32 * S), g["sub"].upper(), font=fs, fill=WHITE, anchor="mm")
    x, y, w, h = lay.paste(card, W / 2, H - 30 * S - bh / 2, ki, ko, S)
    return [{"id": g["id"], "kind": "text", "x": x, "y": y, "w": w, "h": h, "overflow": over}]

def quote(card, t, S, g, ki, ko):
    W, H = card.size; dim(card, ki * ko)
    lines = [(g["l1"].upper(), WHITE)] + ([(g["l2"].upper(), YEL)] if g.get("l2") else [])
    px = 104 * S; maxw = W - 100 * S; over = False
    fs = []
    for txt, _ in lines:
        f, p, o = fit(anton, txt, px, maxw); fs.append(f); px = min(px, p); over |= o
    f = anton(px); lh = px * 1.08; th = lh * len(lines)
    lay = Layer(W - 60 * S, th + 20 * S)
    for i, (txt, col) in enumerate(lines):
        lay.d.text((lay.im.width / 2, 10 * S + lh * i + lh / 2), txt, font=f, fill=col, anchor="mm")
    x, y, w, h = lay.paste(card, W / 2, H / 2, ki, ko, S)
    return [{"id": g["id"], "kind": "text", "x": x, "y": y, "w": w, "h": h, "overflow": over}]

def _chip(txt, S, px=46):
    f = anton(px * S); tw = f.getlength(txt); ch = px * S * 1.5; cw = tw + 44 * S
    lay = Layer(cw, ch); lay.d.rounded_rectangle([0, 0, cw - 1, ch - 1], radius=int(ch / 2), fill=WHITE)
    lay.d.text((cw / 2, ch / 2), txt, font=f, fill=BLACK, anchor="mm"); return lay

def chips(card, t, S, g, ki, ko):
    """Items pop in one by one at their spoken times, laid out in centred rows."""
    W, H = card.size; dim(card, ki * ko)
    items = [(it, at) for it, at in zip(g["items"], g["times"])]
    lays = [_chip(it.upper(), S) for it, _ in items]
    rows, cur, cw = [], [], 0; gap = 18 * S; maxw = W - 80 * S
    for i, l in enumerate(lays):
        if cur and cw + gap + l.im.width > maxw: rows.append(cur); cur, cw = [], 0
        cur.append(i); cw += (gap if cw else 0) + l.im.width
    if cur: rows.append(cur)
    rh = lays[0].im.height + gap; y0 = H / 2 - rh * len(rows) / 2 + rh / 2; out = []
    for r, idx in enumerate(rows):
        rw = sum(lays[i].im.width for i in idx) + gap * (len(idx) - 1); x = W / 2 - rw / 2
        for i in idx:
            at = items[i][1]
            if t >= at:
                kin = R.ease_out_quint(min(1, (t - at) / ms("enter")))
                b = lays[i].paste(card, x + lays[i].im.width / 2, y0 + r * rh, kin, ko, S)
                out.append({"id": f'{g["id"]}.{i}', "kind": "chip", "x": b[0], "y": b[1], "w": b[2], "h": b[3], "overflow": False})
            x += lays[i].im.width + gap
    return out

def flow(card, t, S, g, ki, ko):
    """Vertical chain: chip ↓ chip ↓ chip, each step appearing when it's said."""
    W, H = card.size; dim(card, ki * ko)
    lays = [_chip(it.upper(), S, 44) for it in g["items"]]
    ch = lays[0].im.height; arrow = 40 * S; tot = ch * len(lays) + arrow * (len(lays) - 1)
    y = H / 2 - tot / 2; out = []; d = ImageDraw.Draw(card)
    for i, (l, at) in enumerate(zip(lays, g["times"])):
        if t >= at:
            kin = R.ease_out_quint(min(1, (t - at) / ms("enter")))
            if i:
                a = int(255 * kin * ko); ay = y - arrow / 2
                d.polygon([(W / 2 - 12 * S, ay - 8 * S), (W / 2 + 12 * S, ay - 8 * S), (W / 2, ay + 10 * S)], fill=YEL + (a,))
            b = l.paste(card, W / 2, y + ch / 2, kin, ko, S)
            out.append({"id": f'{g["id"]}.{i}', "kind": "chip", "x": b[0], "y": b[1], "w": b[2], "h": b[3], "overflow": False})
        y += ch + arrow
    return out

# ---------------------------------------------------------------- CTA screen
_bg_cache = {}
def cta_screen(card, t, S, plan, c):
    """Dimmed Miro backdrop + Follow button + comment box typing the keyword (TJR Video 2 CTA style)."""
    W, H = card.size; key = (W, H)
    if key not in _bg_cache:
        bg = Image.open(plan["cta_backdrop"]).convert("RGBA")
        asp = W / H; bw, bh = bg.size
        cw = min(bw, bh * asp); chh = cw / asp
        bg = bg.crop(((bw - cw) / 2, (bh - chh) / 2, (bw + cw) / 2, (bh + chh) / 2)).resize((W, H), Image.LANCZOS)
        _bg_cache[key] = bg
    card.alpha_composite(_bg_cache[key]); dim(card, 1.0)
    cta = plan["cta"]; out = []
    # Follow button
    if t >= cta["follow_t"]:
        ki = R.ease_out_quint(min(1, (t - cta["follow_t"]) / ms("enter")))
        press = t - cta["follow_t"] - 0.45
        fb = inter(46 * S, 800); bw, bh = fb.getlength("Follow") + 90 * S, 86 * S
        lay = Layer(bw, bh)
        pressed = press > 0
        lay.d.rounded_rectangle([0, 0, bw - 1, bh - 1], radius=int(bh / 2), fill=(60, 60, 66) if pressed else BLUE)
        lay.d.text((bw / 2, bh / 2), "Following" if pressed else "Follow", font=fb if not pressed else inter(40 * S, 800), fill=WHITE, anchor="mm")
        b = lay.paste(card, W / 2, H * 0.22, ki, 1, S)
        out.append({"id": "cta.follow", "kind": "button", "x": b[0], "y": b[1], "w": b[2], "h": b[3], "overflow": False})
    # comment box
    if t >= cta["comment_t"] - 0.35:
        ki = R.ease_out_quint(min(1, (t - cta["comment_t"] + 0.35) / ms("enter")))
        bw, bh = W - 140 * S, 104 * S
        lay = Layer(bw, bh); d = lay.d
        d.rounded_rectangle([0, 0, bw - 1, bh - 1], radius=int(bh / 2), fill=WHITE)
        n = int(max(0, min(len(cta["keyword"]), (t - cta["comment_t"]) / 0.12 + 1))) if t >= cta["comment_t"] else 0
        typed = cta["keyword"][:n]
        fk = inter(44 * S, 800)
        d.ellipse([22 * S, bh / 2 - 26 * S, 74 * S, bh / 2 + 26 * S], fill=YEL)
        d.text((96 * S, bh / 2), typed if typed else "Add a comment…", font=fk if typed else inter(38 * S, 600),
               fill=BLACK if typed else (150, 150, 150), anchor="lm")
        if typed and int(t * 2.5) % 2 == 0:
            cx = 96 * S + fk.getlength(typed) + 6 * S; d.rectangle([cx, bh / 2 - 26 * S, cx + 4 * S, bh / 2 + 26 * S], fill=BLUE)
        d.text((bw - 40 * S, bh / 2), "Post", font=inter(38 * S, 800), fill=BLUE if typed else (180, 200, 220), anchor="rm")
        b = lay.paste(card, W / 2, H * 0.50, ki, 1, S)
        out.append({"id": "cta.comment", "kind": "input", "x": b[0], "y": b[1], "w": b[2], "h": b[3], "overflow": False})
    if t >= cta["full_t"]:
        ki = R.ease_out_quint(min(1, (t - cta["full_t"]) / ms("enter")))
        lay = Layer(W - 80 * S, 90 * S); f = anton(66 * S)
        parts = [("FOR THE ", WHITE), ("FULL", YEL), (" BREAKDOWN", WHITE)]
        tw = sum(f.getlength(p) for p, _ in parts); x = lay.im.width / 2 - tw / 2
        for p, col in parts: lay.d.text((x, 45 * S), p, font=f, fill=col, anchor="lm"); x += f.getlength(p)
        b = lay.paste(card, W / 2, H * 0.78, ki, 1, S)
        out.append({"id": "cta.full", "kind": "text", "x": b[0], "y": b[1], "w": b[2], "h": b[3], "overflow": tw > lay.im.width})
    return out
