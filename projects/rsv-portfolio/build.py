#!/usr/bin/env python3
"""Before/after portfolio reel: hook → BEFORE (raw) → AFTER (finished edit) → split screen → end card.
Usage: build.py <reel> <workdir> <outdir>      (reel = a key of reels.json; sources resolved against workdir)
1080x1920 H.264 30 fps, voice only + noise-based SFX (no music), every segment matched to -14 LUFS."""
import json, subprocess, sys, wave
from pathlib import Path
import numpy as np
from PIL import Image, ImageDraw, ImageFont, ImageFilter

HERE = Path(__file__).resolve().parent
REPO = HERE.parents[1]
sys.path.insert(0, str(REPO / "tools/sk-media"))
import sfx as SFX  # noqa: E402  whoosh / pop / tick generators (noise only)

W, H, FPS, SR = 1080, 1920, 30, 48000
INTER = "/usr/share/fonts/opentype/inter/"
F = lambda name, size: ImageFont.truetype(INTER + name, size)
CFG = json.loads((HERE / "reels.json").read_text())
S = CFG["style"]
hexrgb = lambda h, a=255: tuple(int(h[i:i + 2], 16) for i in (1, 3, 5)) + (a,)

def run(cmd): subprocess.run(cmd, check=True)
def nf(sec): return int(round(sec * FPS))

# ---------- drawing helpers ----------
def text_w(font, s, tracking=0):
    return font.getlength(s) + tracking * max(0, len(s) - 1)

def draw_tracked(d, xy, s, font, fill, tracking=0):
    x, y = xy
    for ch in s:
        d.text((x, y), ch, font=font, fill=fill); x += font.getlength(ch) + tracking

def label_pill(text, color, scale=1.0):
    """Series label: dark pill, coloured dot, tracked caps. Returns RGBA image."""
    f = F("Inter-ExtraBold.otf", int(40 * scale)); tr = int(7 * scale)
    tw = text_w(f, text, tr); dot = int(18 * scale); pad = int(30 * scale); gap = int(18 * scale)
    h = int(74 * scale); w = int(pad + dot + gap + tw + pad)
    im = Image.new("RGBA", (w + 40, h + 40), (0, 0, 0, 0))
    sh = Image.new("RGBA", im.size, (0, 0, 0, 0)); ImageDraw.Draw(sh).rounded_rectangle((20, 26, 20 + w, 26 + h), h // 2, fill=(0, 0, 0, 150))
    im.alpha_composite(sh.filter(ImageFilter.GaussianBlur(10)))
    d = ImageDraw.Draw(im)
    d.rounded_rectangle((20, 20, 20 + w, 20 + h), h // 2, fill=hexrgb(S["night"], 225), outline=hexrgb(color, 255), width=max(2, int(3 * scale)))
    cy = 20 + h // 2
    d.ellipse((20 + pad, cy - dot // 2, 20 + pad + dot, cy + dot // 2), fill=hexrgb(color))
    asc, desc = f.getmetrics()
    draw_tracked(d, (20 + pad + dot + gap, cy - (asc - desc * 0.15) / 2 - 2), text, f, hexrgb(S["ink"]), tr)
    return im

def wrap(words, font, maxw):
    lines, cur = [], []
    for w in words:
        if cur and font.getlength(" ".join(cur + [w])) > maxw: lines.append(cur); cur = [w]
        else: cur.append(w)
    return lines + [cur] if cur else lines

def hook_img(text, highlight):
    f = F("InterDisplay-Black.otf", 96)
    lines = wrap(text.split(), f, 900)
    lh = 104; im = Image.new("RGBA", (W, lh * len(lines) + 80), (0, 0, 0, 0))
    glow = Image.new("RGBA", im.size, (0, 0, 0, 0)); gd = ImageDraw.Draw(glow)
    d = ImageDraw.Draw(im)
    for pass_ in (0, 1):
        y = 30
        for ln in lines:
            s = " ".join(ln); x = (W - f.getlength(s)) / 2
            for w in ln:
                col = hexrgb(S["after"]) if w.strip(".,").lower() == highlight.lower() else hexrgb(S["ink"])
                if pass_ == 0: gd.text((x, y + 6), w, font=f, fill=(0, 0, 0, 200))
                else: d.text((x, y), w, font=f, fill=col)
                x += f.getlength(w + " ")
            y += lh
        if pass_ == 0:
            glow = glow.filter(ImageFilter.GaussianBlur(14)); im.alpha_composite(glow); d = ImageDraw.Draw(im)
    return im

def caption_img(text):
    f = F("Inter-ExtraBold.otf", 66)
    lines = wrap(text.split(), f, 860)
    lh = 82; pad = 26
    widths = [f.getlength(" ".join(l)) for l in lines]
    bw = int(max(widths) + 2 * pad); bh = lh * len(lines) + 2 * pad - 10
    im = Image.new("RGBA", (bw + 40, bh + 40), (0, 0, 0, 0)); d = ImageDraw.Draw(im)
    d.rounded_rectangle((20, 20, 20 + bw, 20 + bh), 22, fill=hexrgb(S["night"], 190))
    y = 20 + pad - 8
    for l, wdt in zip(lines, widths):
        d.text((20 + (bw - wdt) / 2, y), " ".join(l), font=f, fill=hexrgb(S["ink"])); y += lh
    return im

def endcard_img():
    bg = Image.open(REPO / "brand/rsv/backgrounds/marble-dark.jpg").convert("RGB")
    s = max(W / bg.width, H / bg.height); bg = bg.resize((int(bg.width * s) + 1, int(bg.height * s) + 1))
    l, t = (bg.width - W) // 2, (bg.height - H) // 2; bg = bg.crop((l, t, l + W, t + H)).convert("RGBA")
    bg.alpha_composite(Image.new("RGBA", (W, H), hexrgb(S["night"], 150)))
    d = ImageDraw.Draw(bg)
    title, line, cta = S["endcard"]
    # eyebrow: the two series dots
    fe = F("Inter-ExtraBold.otf", 34); eb = "BEFORE  →  AFTER"; tr = 6
    ew = text_w(fe, eb, tr); draw_tracked(d, ((W - ew) / 2, 640), eb, fe, hexrgb(S["ink_soft"]), tr)
    ft = F("InterDisplay-Black.otf", 150); tw = ft.getlength(title)
    d.text(((W - tw) / 2, 700), title, font=ft, fill=hexrgb(S["ink"]))
    d.rounded_rectangle((W / 2 - 60, 900, W / 2 + 60, 908), 4, fill=hexrgb(S["after"]))
    fl = F("Inter-SemiBold.otf", 58); y = 960
    a_, _, b_ = line.partition(" & ")  # balanced two lines: "Reels for finance &" / "business creators"
    for s_ in ([a_ + " &", b_] if b_ else [line]):
        d.text(((W - fl.getlength(s_)) / 2, y), s_, font=fl, fill=hexrgb(S["ink"])); y += 74
    fc = F("Inter-ExtraBold.otf", 56); cw = fc.getlength(cta); ph = 112; pw = cw + 110; py = y + 50
    d.rounded_rectangle(((W - pw) / 2, py, (W + pw) / 2, py + ph), ph // 2, fill=hexrgb(S["after"]))
    asc, desc = fc.getmetrics()
    d.text(((W - cw) / 2, py + (ph - asc - desc * 0.3) / 2), cta, font=fc, fill=hexrgb(S["night"]))
    return bg

def scrim_top(h=820, a=200):
    g = np.zeros((H, W, 4), np.uint8); g[..., :3] = hexrgb(S["night"])[:3]
    ramp = np.clip(1 - np.arange(H) / h, 0, 1) ** 1.4 * a; g[..., 3] = ramp[:, None].astype(np.uint8)
    return Image.fromarray(g, "RGBA")

# ---------- captions from word timings ----------
def chunks(words, t0, t1, fix, maxw=3):
    ws = []
    for w in words:
        if w["s"] >= t1 or w["e"] <= t0: continue
        txt = fix.get(w["w"], w["w"])
        if not txt: continue
        ws.append(dict(w=txt, s=max(w["s"], t0) - t0, e=min(w["e"], t1) - t0))
    out, cur = [], []
    for i, w in enumerate(ws):
        cur.append(w)
        gap = ws[i + 1]["s"] - w["e"] if i + 1 < len(ws) else 9
        if len(cur) >= maxw or w["w"][-1] in ".,?!" or gap > 0.45:
            out.append(dict(text=" ".join(c["w"] for c in cur), s=cur[0]["s"], e=w["e"] if gap > 0.45 else ws[i + 1]["s"] if i + 1 < len(ws) else w["e"])); cur = []
    if cur: out.append(dict(text=" ".join(c["w"] for c in cur), s=cur[0]["s"], e=cur[-1]["e"]))
    for c in out: c["e"] = max(c["e"], c["s"] + 0.35)
    return out

# ---------- audio ----------
def lufs(wav):
    r = subprocess.run(["ffmpeg", "-nostats", "-i", wav, "-af", "ebur128=peak=true", "-f", "null", "-"], capture_output=True, text=True).stderr
    tail = r[r.rfind("Summary:"):]
    I = float(tail.split("I:")[1].split("LUFS")[0]); P = float(tail.split("Peak:")[1].split("dBFS")[0])
    return I, P

def seg_audio(src, pieces, out, target=-14.0):
    """Cut pieces from src, join them, match loudness to target (one flat gain). Mono 48 kHz float."""
    parts = []
    for i, (a, b) in enumerate(pieces):
        p = f"{out}.{i}.wav"; run(["ffmpeg", "-v", "error", "-y", "-ss", f"{a}", "-t", f"{b - a}", "-i", src, "-vn", "-ac", "1", "-ar", str(SR),
                                    "-af", "afade=t=in:d=0.012,areverse,afade=t=in:d=0.012,areverse", "-c:a", "pcm_f32le", p]); parts.append(p)
    x = np.concatenate([read_wav(p) for p in parts]); [Path(p).unlink() for p in parts]
    # raw camera audio is peaky: gain → limit → re-measure until the limited segment sits on target
    write_wav(out, x)
    for _ in range(4):
        I, _ = lufs(out)
        if abs(I - target) < 0.15: break
        write_wav(out, read_wav(out) * 10 ** ((target - I) / 20))
        run(["ffmpeg", "-v", "error", "-y", "-i", out, "-af", "alimiter=limit=0.79:attack=3:release=60:level=disabled", "-c:a", "pcm_f32le", out + ".l.wav"])
        Path(out + ".l.wav").replace(out)
    return read_wav(out)

def read_wav(p):
    r = subprocess.run(["ffmpeg", "-v", "error", "-i", p, "-ac", "1", "-ar", str(SR), "-f", "f32le", "-"], capture_output=True, check=True).stdout
    return np.frombuffer(r, np.float32).astype(np.float64)

def write_wav(p, x):
    subprocess.run(["ffmpeg", "-v", "error", "-y", "-f", "f32le", "-ar", str(SR), "-ac", "1", "-i", "-", "-c:a", "pcm_f32le", p],
                   input=np.asarray(x, np.float32).tobytes(), check=True)

def fit(x, n):
    return np.pad(x, (0, max(0, n - len(x))))[:n]

# ---------- video ----------
def frames(cmd, n):
    """Yield n RGB frames (H, W, 3) from an ffmpeg command writing rawvideo to stdout."""
    p = subprocess.Popen(cmd + ["-f", "rawvideo", "-pix_fmt", "rgb24", "-"], stdout=subprocess.PIPE, stderr=subprocess.DEVNULL)
    last = None
    for _ in range(n):
        b = p.stdout.read(W * H * 3)
        if len(b) == W * H * 3: last = np.frombuffer(b, np.uint8).reshape(H, W, 3)
        yield last
    p.stdout.close(); p.wait()

def trim_vf(a, b): return f"trim=start={a}:end={b},setpts=PTS-STARTPTS"

def blend(base, ov, x=0, y=0, alpha=1.0):
    """Alpha-composite RGBA PIL image onto an RGB uint8 array in place (clipped to frame)."""
    o = np.asarray(ov, np.float32); h, w = o.shape[:2]
    x0, y0 = max(0, x), max(0, y); x1, y1 = min(W, x + w), min(H, y + h)
    if x1 <= x0 or y1 <= y0: return
    sub = o[y0 - y:y1 - y, x0 - x:x1 - x]; a = sub[..., 3:4] / 255 * alpha
    region = base[y0:y1, x0:x1].astype(np.float32)
    base[y0:y1, x0:x1] = (region * (1 - a) + sub[..., :3] * a).astype(np.uint8)

def ease(t): t = min(max(t, 0), 1); return 1 - (1 - t) ** 3

def scaled(img, s):
    if abs(s - 1) < 1e-3: return img
    return img.resize((max(1, int(img.width * s)), max(1, int(img.height * s))), Image.LANCZOS)

def build(key, work, outdir):
    R = CFG["reels"][key]; work = Path(work); outdir = Path(outdir); outdir.mkdir(parents=True, exist_ok=True)
    tmp = outdir / f".{key}_tmp"; tmp.mkdir(exist_ok=True)
    raw, edit = str(work / R["raw"]["file"]), str(work / R["edit"]["file"])
    b0, b1 = R["before"]; a0, a1 = R["after"]; s0, s1 = R["split"]["edit"]; left = R["split"]["left"]
    nB, nA, nS, nE = nf(b1 - b0), nf(a1 - a0), nf(s1 - s0), nf(2.0)
    N = nB + nA + nS + nE; tA, tS, tE = nB / FPS, (nB + nA) / FPS, (nB + nA + nS) / FPS
    night = S["night"].replace("#", "0x")
    # base video sources (ffmpeg does trimming/scaling; Python composites overlays)
    before_cmd = ["ffmpeg", "-v", "error", "-ss", f"{b0}", "-t", f"{b1 - b0 + 0.5}", "-i", raw, "-vf",
                  f"{R['raw']['vf']},pad={W}:{H}:(ow-iw)/2:(oh-ih)/2:color={night},fps={FPS},setsar=1"]
    after_cmd = ["ffmpeg", "-v", "error", "-ss", f"{a0}", "-t", f"{a1 - a0 + 0.5}", "-i", edit, "-vf", f"scale={W}:{H},fps={FPS},setsar=1"]
    # split: two 9:16 panels side by side
    PW, PH, PY = 516, 918, 440
    lx, rx = 16, W - 16 - PW
    lp = "".join(f"[0:v]{trim_vf(a, b)}[l{i}];" for i, (a, b) in enumerate(left))
    lcat = "".join(f"[l{i}]" for i in range(len(left))) + f"concat=n={len(left)}:v=1:a=0[lc];"
    rawpanel = f"[lc]{R['raw']['vf']},scale={PW}:{PH}:force_original_aspect_ratio=decrease,pad={PW}:{PH}:(ow-iw)/2:(oh-ih)/2:color=black,fps={FPS}[L];"
    split_fc = (lp + lcat + rawpanel +
                f"[1:v]{trim_vf(s0, s1 + 0.5)},scale={PW}:{PH},fps={FPS}[Rr];"
                f"color=c={night}:s={W}x{H}:r={FPS}:d={s1 - s0 + 0.5}[bg];[bg][L]overlay={lx}:{PY}[t];[t][Rr]overlay={rx}:{PY},setsar=1[v]")
    split_cmd = ["ffmpeg", "-v", "error", "-i", raw, "-i", edit, "-filter_complex", split_fc, "-map", "[v]"]

    # overlays
    hook = hook_img(R["hook"], R["highlight"]); scrim = scrim_top()
    lb_before, lb_after = label_pill("BEFORE", S["before"]), label_pill("AFTER", S["after"])
    sl_before, sl_after = label_pill("BEFORE", S["before"], 0.72), label_pill("AFTER", S["after"], 0.72)
    endc = np.asarray(endcard_img().convert("RGB"))
    words_raw = json.loads((work / R["raw"]["words"]).read_text()); words_edit = json.loads((work / R["edit"]["words"]).read_text())
    fix = R.get("caption_fix", {})
    capB = chunks(words_raw, b0, b1, fix); capS = chunks(words_edit, s0, s1, fix)
    capB_img = [caption_img(c["text"]) for c in capB]; capS_img = [caption_img(c["text"]) for c in capS]
    LABEL_Y = 200; HOOK_Y = 245; CAP_CY = 1400; CAP_S_CY = PY + PH + 95
    def put_center(base, img, cy, alpha=1.0, s=1.0):
        im = scaled(img, s); blend(base, im, (W - im.width) // 2, int(cy - im.height / 2), alpha)
    def caption(base, caps, imgs, t, cy):
        for c, im in zip(caps, imgs):
            if c["s"] - 0.03 <= t < c["e"]:
                k = ease((t - c["s"] + 0.03) / 0.12); put_center(base, im, cy + (1 - k) * 14, k, 0.96 + 0.04 * k)

    enc = subprocess.Popen(["ffmpeg", "-v", "error", "-y", "-f", "rawvideo", "-pix_fmt", "rgb24", "-s", f"{W}x{H}", "-r", str(FPS), "-i", "-",
                            "-c:v", "libx264", "-preset", "medium", "-crf", "14", "-pix_fmt", "yuv420p", str(tmp / "video.mp4")], stdin=subprocess.PIPE)
    i = 0
    for f in frames(before_cmd, nB):
        fr = f.copy(); t = i / FPS
        if t < 2.0:
            fade = 1 - ease((t - 1.8) / 0.2) if t > 1.8 else 1
            blend(fr, scrim, 0, 0, fade)
            k = ease(t / 0.18); put_center(fr, hook, HOOK_Y + hook.height / 2, fade * min(1, 0.4 + k), 0.9 + 0.1 * k)
        k = ease(t / 0.15); put_center(fr, lb_before, LABEL_Y, k, 0.85 + 0.15 * k)
        caption(fr, capB, capB_img, t, CAP_CY)
        enc.stdin.write(fr.tobytes()); i += 1
    for j, f in enumerate(frames(after_cmd, nA)):
        fr = f.copy(); t = j / FPS
        k = ease(t / 0.18); put_center(fr, lb_after, LABEL_Y, k, 0.8 + 0.2 * k)
        enc.stdin.write(fr.tobytes()); i += 1
    for j, f in enumerate(frames(split_cmd, nS)):
        fr = f.copy(); t = j / FPS
        k = ease(t / 0.2)
        blend(fr, scaled(sl_before, 1), lx + (PW - sl_before.width) // 2, PY - sl_before.height + 6, k)
        blend(fr, scaled(sl_after, 1), rx + (PW - sl_after.width) // 2, PY - sl_after.height + 6, k)
        caption(fr, capS, capS_img, t, CAP_S_CY)
        enc.stdin.write(fr.tobytes()); i += 1
    for j in range(nE):
        t = j / FPS; k = ease(t / 0.3)
        fr = (endc.astype(np.float32) * (0.25 + 0.75 * k)).astype(np.uint8) if k < 1 else endc
        enc.stdin.write(np.ascontiguousarray(fr).tobytes()); i += 1
    enc.stdin.close(); enc.wait()

    # audio: each voice segment matched to -14 LUFS, SFX at the joins, limiter
    aB = fit(seg_audio(raw, [[b0, b1]], str(tmp / "b.wav")), nB * SR // FPS)
    aA = fit(seg_audio(edit, [[a0, a1]], str(tmp / "a.wav")), nA * SR // FPS)
    aS = fit(seg_audio(edit, [[s0, s1]], str(tmp / "s.wav")), nS * SR // FPS)
    aE = np.zeros(nE * SR // FPS)
    for seg in (aB, aA, aS):  # soft edges so joins don't click
        r = int(0.015 * SR); seg[:r] *= np.linspace(0, 1, r); seg[-r:] *= np.linspace(1, 0, r)
    voice = np.concatenate([aB, aA, aS, aE])
    vref = np.percentile(np.abs(voice[np.abs(voice) > 1e-3]), 99); lvl = vref * 10 ** (-18 / 20) * 2.0
    cues = [(0.02, "pop", 0.7), (tA, "whoosh", 1.0), (tA + 0.02, "pop", 0.7), (tS, "whoosh", 1.0), (tE, "whoosh", 0.9), (tE + 0.3, "pop", 0.8)]
    fx = np.zeros_like(voice)
    for t, kind, g in cues:
        snd = {"whoosh": SFX.whoosh, "pop": SFX.pop, "tick": SFX.tick}[kind]()
        st = int(max(0, t - (0.2 if kind == "whoosh" else 0)) * SR); seg = snd[:max(0, len(fx) - st)] * lvl * g; fx[st:st + len(seg)] += seg
    write_wav(str(tmp / "mix.wav"), voice + fx)
    out = outdir / R["out"]
    run(["ffmpeg", "-v", "error", "-y", "-i", str(tmp / "video.mp4"), "-i", str(tmp / "mix.wav"),
         "-af", "alimiter=limit=0.84:attack=3:release=60:level=disabled,aformat=channel_layouts=stereo",
         "-c:v", "copy", "-c:a", "aac", "-b:a", "192k", "-ar", "48000", "-movflags", "+faststart", "-shortest", str(out)])
    meta = dict(reel=key, frames=N, duration=N / FPS, segments=dict(before=[0, tA], after=[tA, tS], split=[tS, tE], end=[tE, N / FPS]),
                captions_before=capB, captions_split=capS)
    (outdir / f"{key}.timeline.json").write_text(json.dumps(meta, indent=1))
    print(f"{key}: {out} ({N / FPS:.2f} s)")

if __name__ == "__main__":
    build(sys.argv[1], sys.argv[2], sys.argv[3])
