#!/usr/bin/env python3
"""job.json -> finished 1080x1920 Boxabl clip + <name>.captions.txt + <name>.overlays.txt + <name>.post.md

usage: render.py <job.json> --ws <workspace> [--draft]
  sources are read from <ws>/src/<key>.mp4 (fetch.py puts them there), transcripts from <ws>/words/<key>.json
  (transcribe.py), output goes to <ws>/out/. --draft = 540 px wide, fast preset, for looking at frames only.

job schema (see jobs/*.json):
  name        file stem, "NN_short_name"
  title       human title for Telegram / the posting pack
  sources     {key: "<path in drive_index.json>"}   every key used by a segment
  segments    [{v, vs, ve,                video source key and its in/out (source seconds)
                a, as, ae,                optional: audio from another source/range (video is re-timed to fit)
                bed,                      optional: that video's own audio mixed under at this gain (0-1)
                cx, zoom, hf,             crop centre x (0-1), zoom, keep-top fraction (cuts burned-in source captions)
                vol, nocap,               gain; true = no captions for this segment
                home}]                    true = this segment shows the WHOLE home (the brief requires >= 1)
  overlays    [{s, e, text, style?, pos?}]  output seconds; style Top (default) | Tag; *word* = accent colour
  post        {"short": "<TikTok/Reels/Shorts caption with @boxabl>", "x": "<X caption with [TRACKING URL]>"}
  drop_words  words to leave out of captions (e.g. a name said off-mic)
  ok_words    banned-list words that are fine in this job (say why in _why)
"""
import json, os, re, subprocess, sys

HERE = os.path.dirname(os.path.abspath(__file__))
L = json.load(open(f"{HERE}/layout.json"))
G = json.load(open(f"{HERE}/glossary.json"))
W, H, FPS = L["canvas"]["w"], L["canvas"]["h"], L["canvas"]["fps"]
BY, BH = L["band"]["y"], L["band"]["h"]
AW, AH = L["band"]["aspect"]


def fix(t):
    for p, r in G["fixes"]:
        t = re.sub(p, r, t, flags=re.I)
    return t


def run(cmd):
    r = subprocess.run(cmd, capture_output=True, text=True)
    if r.returncode:
        print(" ".join(cmd)[:3000]); print(r.stderr[-2000:]); sys.exit(1)


def has_audio(path):
    return "Audio:" in subprocess.run(["ffmpeg", "-i", path], capture_output=True, text=True).stderr


def seg_times(seg):
    a_src = seg.get("a", seg["v"])
    as_ = seg.get("as", seg["vs"])
    ae = seg.get("ae", seg.get("ve"))
    vs = seg["vs"]
    ve = seg.get("ve", vs + (ae - as_))
    return a_src, as_, ae, vs, ve


def render_segment(ws, seg, out, draft):
    a_src, as_, ae, vs, ve = seg_times(seg)
    v, a = f"{ws}/src/{seg['v']}.mp4", f"{ws}/src/{a_src}.mp4"
    d = ae - as_
    speed = (ve - vs) / d          # >1 = video sped up to fit the audio
    cx, zoom, hf = seg.get("cx", 0.5), seg.get("zoom", 1.0), seg.get("hf", 1.0)
    crop = (f"crop='min(iw,ih*{hf}*{AW}/{AH})/{zoom}':'ih*{hf}/{zoom}':"
            f"'max(0,min(iw-ow,iw*{cx}-ow/2))':'(ih*{hf}-oh)/2'")
    b = L["band"]
    # seek each input to just before its range (-ss before -i) so long 4K sources aren't decoded from 0 every time
    v_off, a_off = max(0.0, vs - 2.0), max(0.0, as_ - 2.0)
    vs, ve, as_, ae = vs - v_off, ve - v_off, as_ - a_off, ae - a_off
    fc = (f"[0:v]trim=start={vs}:end={ve},setpts=(PTS-STARTPTS)/{speed},fps={FPS},split[a1][a2];"
          f"[a1]crop=iw:ih*{hf}:0:0,scale={W}:{H}:force_original_aspect_ratio=increase,crop={W}:{H},"
          f"{b['bg_blur']},eq=brightness={b['bg_brightness']}[bg];"
          f"[a2]{crop},scale={W}:{BH},setsar=1[fg];"
          f"[bg][fg]overlay=0:{BY},format=yuv420p[v];"
          f"[1:a]atrim=start={as_}:end={ae},asetpts=PTS-STARTPTS,volume={seg.get('vol', 1.0)}[sp];")
    if seg.get("bed") and a_src != seg["v"] and has_audio(v):
        fc += (f"[0:a]atrim=start={vs}:end={ve},asetpts=PTS-STARTPTS,atempo={max(0.5, min(2.0, speed))},"
               f"volume={seg['bed']}[bd];[sp][bd]amix=inputs=2:duration=first:normalize=0[au]")
    else:
        fc += "[sp]anull[au]"
    e = L["encode"]
    run(["ffmpeg", "-y", "-v", "error", "-ss", f"{v_off:.3f}", "-i", v, "-ss", f"{a_off:.3f}", "-i", a, "-filter_complex", fc, "-map", "[v]", "-map", "[au]",
         "-t", f"{d:.3f}", "-c:v", "libx264", "-preset", "ultrafast" if draft else e["seg_preset"], "-crf", str(e["seg_crf"]),
         "-c:a", "aac", "-ar", "48000", "-ac", "2", "-b:a", e["abitrate"], out])
    return d


def caption_words(job, ws, timeline):
    words = []
    for si, (seg, t0, d) in enumerate(timeline):
        if seg.get("nocap"):
            continue
        a_src, as_, _, _, _ = seg_times(seg)
        p = f"{ws}/words/{a_src}.json"
        if not os.path.exists(p):
            print(f"render: no transcript {p} — segment {si} gets no captions (run transcribe.py)", file=sys.stderr)
            continue
        for w in json.load(open(p))["words"]:
            if w["s"] >= as_ - 0.05 and w["e"] <= as_ + d + 0.15:
                txt = fix(w["w"].strip()).rstrip(",.")
                if txt:
                    words.append({"w": txt, "s": t0 + w["s"] - as_, "e": t0 + min(w["e"], as_ + d) - as_, "seg": si})
    merged = []
    for w in words:
        prev = merged[-1] if merged else None
        if prev and re.match(r"^[,.]?\d", w["w"]) and re.search(r"\d$", prev["w"]) and w["s"] - prev["e"] < 0.3:
            prev["w"] += w["w"] if w["w"][0] in ",." else "," + w["w"]; prev["e"] = w["e"]   # "$50" ",000"
        elif prev and w["w"].startswith("-"):
            prev["w"] += w["w"]; prev["e"] = w["e"]                                             # "400" "-foot"
        else:
            merged.append(w)
    drop = {x.lower() for x in job.get("drop_words", [])}
    return [w for w in merged if w["w"].lower().strip(",.!?") not in drop]


def loudnorm(src):
    """two-pass loudnorm filter string: measure, then apply linearly (one pass undershoots by 1.5-2 LU)"""
    a = L["audio"]
    base = f"loudnorm=I={a['lufs']}:TP={a['tp']}:LRA={a['lra']}"
    err = subprocess.run(["ffmpeg", "-hide_banner", "-i", src, "-af", base + ":print_format=json", "-vn", "-f", "null", "-"],
                         capture_output=True, text=True).stderr
    m = json.loads(err[err.rindex("{"):err.rindex("}") + 1])
    return (base + f":measured_I={m['input_i']}:measured_TP={m['input_tp']}:measured_LRA={m['input_lra']}"
            f":measured_thresh={m['input_thresh']}:offset={m['target_offset']}:linear=true")


def ass_time(t):
    t = max(0.0, t)
    return f"{int(t // 3600)}:{int(t % 3600 // 60):02d}:{t % 60:05.2f}"


def esc(t):
    return t.replace("{", "(").replace("}", ")")


def build_ass(job, words, path):
    c, ti, tg, col = L["caption"], L["title"], L["tag"], L["colors"]
    acc, txt_c = col["accent"], col["text"]
    lines, chunks, cur = [], [], []
    for w in words:
        if cur and (len(cur) >= c["max_words"] or w["s"] - cur[-1]["e"] > c["gap_break"]
                    or cur[-1]["w"][-1:] in ".?!" or cur[-1]["seg"] != w["seg"]):
            chunks.append(cur); cur = []
        cur.append(w)
    if cur:
        chunks.append(cur)
    cap_lines = []
    for ci, ch in enumerate(chunks):
        end = ch[-1]["e"] + c["tail"]
        if ci + 1 < len(chunks):
            end = min(end, chunks[ci + 1][0]["s"])
        cap_lines.append(f"{ch[0]['s']:7.2f} {' '.join(x['w'] for x in ch)}")
        for k, w in enumerate(ch):
            we = ch[k + 1]["s"] if k + 1 < len(ch) else end
            t = " ".join((f"{{\\c{acc}}}" + esc(x["w"]).upper() + f"{{\\c{txt_c}}}") if j == k else esc(x["w"]).upper()
                         for j, x in enumerate(ch))
            lines.append(f"Dialogue: 1,{ass_time(w['s'])},{ass_time(we)},Cap,,0,0,0,,{{\\pos({W // 2},{c['y']})}}{t}")
    for o in job.get("overlays", []):
        style = o.get("style", "Top")
        pos = o.get("pos") or ([W // 2, ti["baseline_y"]] if style == "Top" else None)
        tag = f"{{\\pos({pos[0]},{pos[1]})}}" if pos else ""
        t = esc(o["text"]).replace("\n", "\\N")
        t = re.sub(r"\*(.+?)\*", rf"{{\\c{acc}}}\1{{\\c{txt_c}}}", t)
        lines.append(f"Dialogue: 2,{ass_time(o['s'])},{ass_time(o['e'])},{style},,0,0,0,,{tag}{t}")
    f = L["fonts"]
    head = f"""[Script Info]
ScriptType: v4.00+
PlayResX: {W}
PlayResY: {H}
WrapStyle: 0

[V4+ Styles]
Format: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding
Style: Cap,{f['caption']},{c['size']},&H00FFFFFF,&H00FFFFFF,&H00000000,&H80000000,0,0,0,0,100,100,0,0,1,{c['outline']},{c['shadow']},5,40,40,0,1
Style: Top,{f['title']},{ti['size']},&H00FFFFFF,&H00FFFFFF,&H00000000,&H80000000,0,0,0,0,100,100,{ti['spacing']},0,1,{ti['outline']},{ti['shadow']},2,60,60,0,1
Style: Tag,{f['tag']},{tg['size']},&H00FFFFFF,&H00FFFFFF,&H00000000,&HC0000000,0,0,0,0,100,100,2,0,3,{tg['box_pad']},0,5,40,40,0,1

[Events]
Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text
"""
    open(path, "w").write(head + "\n".join(lines) + "\n")
    return cap_lines


def main():
    args = sys.argv[1:]
    job_path = args[0]
    ws = args[args.index("--ws") + 1] if "--ws" in args else os.environ.get("BOXABL_WS", "")
    if not ws:
        sys.exit("render: pass --ws <workspace> (or set BOXABL_WS)")
    draft = "--draft" in args
    job = json.load(open(job_path))
    name = job["name"] + ("-draft" if draft else "")
    work, out_dir = f"{ws}/work/{name}", f"{ws}/out"
    os.makedirs(work, exist_ok=True); os.makedirs(out_dir, exist_ok=True)
    timeline, t, parts = [], 0.0, []
    for i, seg in enumerate(job["segments"]):
        p = f"{work}/seg{i:02d}.mp4"
        d = render_segment(ws, seg, p, draft)
        timeline.append((seg, t, d)); t += d; parts.append(p)
    open(f"{work}/list.txt", "w").write("".join(f"file '{p}'\n" for p in parts))
    run(["ffmpeg", "-y", "-v", "error", "-f", "concat", "-safe", "0", "-i", f"{work}/list.txt", "-c", "copy", f"{work}/body.mp4"])
    cap_lines = build_ass(job, caption_words(job, ws, timeline), f"{work}/subs.ass")
    final = f"{out_dir}/{name}.mp4"
    a, e = L["audio"], L["encode"]
    vf = f"subtitles={work}/subs.ass:fontsdir={HERE}/fonts" + (",scale=540:-2" if draft else "")
    run(["ffmpeg", "-y", "-v", "error", "-i", f"{work}/body.mp4", "-vf", vf,
         "-af", loudnorm(f"{work}/body.mp4"), "-c:v", "libx264",
         "-preset", "ultrafast" if draft else e["preset"], "-crf", str(e["crf"]), "-pix_fmt", "yuv420p",
         "-c:a", "aac", "-b:a", e["abitrate"], "-ar", "48000", "-movflags", "+faststart", final])
    open(f"{out_dir}/{name}.captions.txt", "w").write("\n".join(cap_lines) + "\n")
    open(f"{out_dir}/{name}.overlays.txt", "w").write(
        "\n".join(f"{o['s']:6.2f}-{o['e']:6.2f} {o['text']}".replace("\n", " / ") for o in job.get("overlays", [])) + "\n")
    post = job.get("post", {})
    open(f"{out_dir}/{name}.post.md", "w").write(
        f"## {job.get('title', name)}\n\n**TikTok / Reels / Shorts**\n> {post.get('short', '')}\n\n**X**\n> {post.get('x', '')}\n")
    print(f"{final} {t:.1f}s")


if __name__ == "__main__":
    main()
