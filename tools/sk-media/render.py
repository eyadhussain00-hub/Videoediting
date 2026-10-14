#!/usr/bin/env python3
"""SK Media reel renderer: plan.json (from plan.py) -> mp4 (+ boxes.json, face_track.json for qa.py).
Usage: render.py plan.json --out final.mp4 --graphics [--draft] [--jobs 4] [--stills 1.0,12.5]
plan.json = {"clips":[{src,in,out,section,screen_src,screen_t0,face_src,face_offset}], "captions":[chunks], "sections":{...}, "graphics":[...]}"""
import argparse, json, subprocess, sys, os, math
from pathlib import Path
from concurrent.futures import ProcessPoolExecutor
import numpy as np
from PIL import Image, ImageDraw, ImageFont, ImageFilter

HERE = Path(__file__).resolve().parent
L = json.loads((HERE / "layout.json").read_text())
FPS = L["canvas"]["fps"]; ST = L["style"]; MO = L["motion"]
FONT = str(HERE / "fonts" / "InterTight.ttf")

def font(px, weight=800):
    f = ImageFont.truetype(FONT, max(8, int(px)))
    f.set_variation_by_axes([weight]); return f

def hexrgb(h): h = h.lstrip("#"); return tuple(int(h[i:i + 2], 16) for i in (0, 2, 4))
BG = hexrgb(L["canvas"]["bg"]); CARD = hexrgb(ST["card_bg"]); ACC = hexrgb(ST["accent"])

def ease_out_quint(x): return 1 - (1 - x) ** 5
def ease_in(x): return x ** 3
def ease_io(x): return 4 * x ** 3 if x < .5 else 1 - (-2 * x + 2) ** 3 / 2
def ease_out_expo(x): return 1 if x >= 1 else 1 - 2 ** (-10 * x)
def lerp(a, b, t): return a + (b - a) * t

def rect_at(name, t, S):
    """Card rect at output time t (layout switch opening->standard animates 300 ms)."""
    op, sd = L["layouts"]["opening"], L["layouts"]["standard"]
    t0 = L["opening_duration_s"]; d = 0.0  # hard switch: animating would slide screen and face cards across each other
    if name not in op: r = sd[name]; return [r["x"] * S, r["y"] * S, r["w"] * S, r["h"] * S]
    if name not in sd: r = op[name]; return [r["x"] * S, r["y"] * S, r["w"] * S, r["h"] * S]
    k = 0 if t < t0 else 1 if t >= t0 + d or d == 0 else ease_io((t - t0) / d)
    a, b = op[name], sd[name]
    return [lerp(a[q], b[q], k) * S for q in ("x", "y", "w", "h")]

def rounded_mask(w, h, r):
    m = Image.new("L", (w, h), 0); ImageDraw.Draw(m).rounded_rectangle([0, 0, w - 1, h - 1], r, fill=255); return m

# ---------------- source readers ----------------
class Reader:
    """Sequential raw frames of one source window."""
    def __init__(self, path, t0, n, crop=None, scale=None):
        vf = []
        if crop: vf.append("crop=%d:%d:%d:%d" % tuple(crop))
        if scale: vf.append("scale=%d:%d:flags=lanczos" % scale)
        self.w, self.h = scale if scale else (crop[0], crop[1])
        self.n = n; self.last = None
        cmd = ["ffmpeg", "-v", "error", "-ss", "%.4f" % max(0, t0), "-i", path, "-frames:v", str(n + 2)]
        if vf: cmd += ["-vf", ",".join(vf)]
        cmd += ["-f", "rawvideo", "-pix_fmt", "rgb24", "-"]
        self.p = subprocess.Popen(cmd, stdout=subprocess.PIPE, stderr=subprocess.DEVNULL)
    def next(self):
        b = self.p.stdout.read(self.w * self.h * 3)
        if len(b) == self.w * self.h * 3: self.last = np.frombuffer(b, np.uint8).reshape(self.h, self.w, 3)
        return self.last  # repeat last real frame rather than ever returning black
    def close(self):
        self.p.stdout.close(); self.p.kill()

# ---------------- captions ----------------
BRAND = {"tjr", "kick", "youtube", "tiktok", "instagram", "twitter", "x", "threads", "island", "tjr's", "£25,000", "25,000"}
def is_hl(w):
    lw = w.lower().strip(".,!?")
    return lw in BRAND or any(ch.isdigit() for ch in lw) or lw in ("billion", "billions")

def draw_caption(img, chunk, t, S, box):
    x, y, w, h = box
    words = chunk["words"]; hl_chunk = any(is_hl(q["w"]) for q in words)
    size = ST["caption"]["size_px"] * S
    f = font(size)
    sp = f.getlength(" ") * 1.3  # extra room so the 1.06 pop never touches its neighbour
    widths = [f.getlength(q["w"]) for q in words]
    total = sum(widths) + sp * (len(words) - 1)
    maxw = w - 40 * S
    overflow = False
    if total > maxw:  # auto-fit
        size *= maxw / total; f = font(size); sp = f.getlength(" ") * 1.3
        widths = [f.getlength(q["w"]) for q in words]; total = sum(widths) + sp * (len(words) - 1)
    # chunk enter: 120 ms fade/rise
    age = t - chunk["start"]; k = min(1, max(0, age / 0.12)); k = ease_out_quint(k)
    cx = x + w / 2; cy = y + h / 2 + (1 - k) * 10 * S
    lay = Image.new("RGBA", img.size, (0, 0, 0, 0)); d = ImageDraw.Draw(lay)
    sh = Image.new("RGBA", img.size, (0, 0, 0, 0)); ds = ImageDraw.Draw(sh)
    px = cx - total / 2
    asc, desc = f.getmetrics()
    cur = max([i for i, q in enumerate(words) if q["s"] <= t] or [-1])  # only the latest started word is active
    for qi, (q, ww) in enumerate(zip(words, widths)):
        active = qi == cur and t < q["e"] + 0.25
        col = ACC if (active or is_hl(q["w"])) else (255, 255, 255)
        sc = 1.0
        if active:
            a2 = (t - q["s"]) / (ST["caption"]["pop_ms"] / 1000)
            sc = 1 + (ST["caption"]["active_scale"] - 1) * min(1, a2)
        ff = f if sc == 1 else font(size * sc)
        wx = px + ww / 2 - ff.getlength(q["w"]) / 2
        ty = cy - (asc + desc) * sc / 2
        alpha = int(255 * k)
        ds.text((wx, ty + 3 * S), q["w"], font=ff, fill=(0, 0, 0, int(140 * k)))
        d.text((wx, ty), q["w"], font=ff, fill=col + (alpha,))
        px += ww + sp
    sh = sh.filter(ImageFilter.GaussianBlur(4 * S))
    img.alpha_composite(sh); img.alpha_composite(lay)
    return {"id": "caption", "kind": "text", "x": cx - total / 2, "y": y, "w": total, "h": h, "overflow": overflow, "parent": None}

# ---------------- main per-segment render ----------------
def render_segment(args):
    seg_id, clips, plan, S, graphics, outpath = args
    W, H = int(L["canvas"]["w"] * S), int(L["canvas"]["h"] * S)
    enc = subprocess.Popen(["ffmpeg", "-v", "error", "-y", "-f", "rawvideo", "-pix_fmt", "rgb24", "-s", f"{W}x{H}", "-r", str(FPS), "-i", "-",
                            "-c:v", "libx264", "-preset", "medium" if S == 1 else "veryfast", "-crf", "16" if S == 1 else "22",
                            "-pix_fmt", "yuv420p", "-g", "60", outpath], stdin=subprocess.PIPE)
    caps = plan["captions"]; secs = plan["sections"]; gfx = plan.get("graphics", []) if graphics else []
    boxes, faces = {}, []
    sys.path.insert(0, str(HERE)); import graphics as G
    for c in clips:
        n = c["frames"]
        # screen: decode the Miro region at native res, crop per frame
        sr = None
        if c["screen_src"]:
            sr = Reader(c["screen_src"], c["screen_t0"], n, crop=plan["screen_region"])
        fr = Reader(c["face_src"], c["face_t0"], n, scale=None, crop=[c["face_W"], c["face_H"], 0, 0])
        for k in range(n):
            gi = c["out_f0"] + k; t = gi / FPS
            img = Image.new("RGBA", (W, H), BG + (255,))
            els = []
            # --- screen card
            sx, sy, sw, sh_ = rect_at("screen", t, S)
            card = Image.new("RGBA", (int(round(sw)), int(round(sh_))), CARD + (255,))
            if sr is not None:
                a = sr.next(); ah, aw = a.shape[:2]
                asp = sw / sh_
                cw = aw; ch = cw / asp
                if ch > ah: ch = ah; cw = ch * asp
                z = G.screen_zoom(plan, c, t) if graphics else None
                cx0, cy0 = aw / 2, ah / 2
                if z:
                    zs, (fx, fy) = z; cw /= zs; ch /= zs
                    kz = (zs - 1) / (MO["focus_zoom"]["scale"] - 1)  # 0..1 as the zoom progresses
                    cx0 = lerp(aw / 2, fx * aw, kz); cy0 = lerp(ah / 2, fy * ah, kz)
                x0 = min(max(cx0 - cw / 2, 0), aw - cw); y0 = min(max(cy0 - ch / 2, 0), ah - ch)
                im = Image.fromarray(a).crop((x0, y0, x0 + cw, y0 + ch)).resize(card.size, Image.LANCZOS)
                card.paste(im, (0, 0))
            else:
                for b in G.cta_screen(card, t, S, plan, c) or []:
                    b.update({"x": (sx + b["x"]) / S, "y": (sy + b["y"]) / S, "w": b["w"] / S, "h": b["h"] / S, "parent": "screen"}); els.append(b)
            if graphics: els += G.screen_overlay(card, t, S, plan, c, (sx, sy))
            img.paste(card, (int(round(sx)), int(round(sy))), rounded_mask(card.size[0], card.size[1], int(ST["card_radius"] * S)))
            els.append({"id": "screen", "kind": "card", "x": sx / S, "y": sy / S, "w": sw / S, "h": sh_ / S, "parent": None})
            # --- face card
            fx, fy, fw, fh = rect_at("face", t, S)
            b = fr.next(); bh, bw = b.shape[:2]
            fc = c["face"]  # {"cx","cy","hc"} in source px; hc = crop height at scale 1
            asp = fw / fh
            prog = (t - secs[c["section"]]["t0"]) / max(0.1, secs[c["section"]]["dur"])
            drift = lerp(MO["face_drift"]["from"], MO["face_drift"]["to"], min(1, max(0, prog)))
            zoom = drift * (MO["punch_in"] if c.get("punch") else 1.0)
            ch = fc["hc"] / zoom; cw = ch * asp
            if cw > bw: cw = bw; ch = cw / asp
            if ch > bh: ch = bh; cw = ch * asp
            x0 = min(max(fc["cx"] - cw / 2, 0), bw - cw); y0 = min(max(fc["cy"] - ch / 2, 0), bh - ch)
            im = Image.fromarray(b).crop((x0, y0, x0 + cw, y0 + ch)).resize((int(round(fw)), int(round(fh))), Image.LANCZOS)
            img.paste(im, (int(round(fx)), int(round(fy))), rounded_mask(im.size[0], im.size[1], int(ST["card_radius"] * S)))
            els.append({"id": "face", "kind": "card", "x": fx / S, "y": fy / S, "w": fw / S, "h": fh / S, "parent": None})
            if k == n // 2:
                faces.append({"clip": c["idx"], "section": c["section"], "cx": fc["cx"] - x0, "cy": fc["cy"] - y0, "w": cw, "h": ch})
            # --- header / progress (graphics stage)
            if graphics: els += G.header(img, t, S, plan, c)
            # --- caption
            cb = rect_at("caption", t, S)
            for ch_ in caps:
                if ch_["start"] <= t < ch_["end"]:
                    e = draw_caption(img, ch_, t, S, cb); e.update({k2: v / S for k2, v in e.items() if k2 in "xywh"}); els.append(e); break
            if graphics: els += G.overlays(img, t, S, plan, c)
            boxes[gi] = els
            enc.stdin.write(img.convert("RGB").tobytes())
        if sr: sr.close()
        fr.close()
    enc.stdin.close(); enc.wait()
    return seg_id, boxes, faces

def main():
    ap = argparse.ArgumentParser(); ap.add_argument("plan"); ap.add_argument("--out", required=True)
    ap.add_argument("--draft", action="store_true"); ap.add_argument("--graphics", action="store_true"); ap.add_argument("--jobs", type=int, default=4)
    ap.add_argument("--only", help="comma list of sections to render (preview)")
    ap.add_argument("--stills", help="comma list of output times: render single PNG frames to <out>_<t>.png and exit")
    a = ap.parse_args()
    plan = json.loads(Path(a.plan).read_text()); S = L["canvas"]["draft_scale"] if a.draft else 1.0
    if a.stills:
        jobs = []
        for ts in a.stills.split(","):
            f = int(round(float(ts) * FPS))
            c = next(c for c in plan["clips"] if c["out_f0"] <= f < c["out_f0"] + c["frames"])
            k = f - c["out_f0"]; one = dict(c, frames=1, out_f0=f, screen_t0=c["screen_t0"] + k / FPS, face_t0=c["face_t0"] + k / FPS)
            jobs.append((ts, [one], plan, S, a.graphics, f"{a.out}_{ts}.mp4"))
        with ProcessPoolExecutor(a.jobs) as ex:
            for ts, *_ in ex.map(render_segment, jobs):
                subprocess.run(["ffmpeg", "-v", "error", "-y", "-i", f"{a.out}_{ts}.mp4", "-frames:v", "1", f"{a.out}_{ts}.png"]); os.remove(f"{a.out}_{ts}.mp4")
        return
    clips = plan["clips"]
    # split into ~equal work chunks along clip boundaries
    total = sum(c["frames"] for c in clips); per = total / (a.jobs * 2)
    segs, cur, acc = [], [], 0
    for c in clips:
        cur.append(c); acc += c["frames"]
        if acc >= per: segs.append(cur); cur, acc = [], 0
    if cur: segs.append(cur)
    tmp = Path(a.out).with_suffix(".parts"); tmp.mkdir(exist_ok=True)
    jobs = [(i, s, plan, S, a.graphics, str(tmp / f"p{i:03d}.mp4")) for i, s in enumerate(segs)]
    boxes, faces = {}, []
    with ProcessPoolExecutor(a.jobs) as ex:
        for sid, b, f in ex.map(render_segment, jobs):
            boxes.update(b); faces += f; print(f"  segment {sid + 1}/{len(jobs)} done", file=sys.stderr)
    (tmp / "list.txt").write_text("".join(f"file 'p{i:03d}.mp4'\n" for i in range(len(jobs))))
    vid = str(tmp / "video.mp4")
    subprocess.run(["ffmpeg", "-v", "error", "-y", "-f", "concat", "-safe", "0", "-i", str(tmp / "list.txt"), "-c", "copy", vid], check=True)
    audio = plan["audio_master"]
    subprocess.run(["ffmpeg", "-v", "error", "-y", "-i", vid, "-i", audio, "-map", "0:v", "-map", "1:a", "-c:v", "copy", "-c:a", "aac", "-b:a", "192k",
                    "-shortest", "-movflags", "+faststart", a.out], check=True)
    if not a.draft:
        Path(a.out).with_name("boxes.json").write_text(json.dumps({str(k): v for k, v in sorted(boxes.items())}))
    faces.sort(key=lambda f: f["clip"])
    Path(a.out).with_name("face_track.json").write_text(json.dumps(faces, indent=0))
    print("rendered", a.out, file=sys.stderr)

if __name__ == "__main__": main()
