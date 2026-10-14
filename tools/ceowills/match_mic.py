#!/usr/bin/env python3
"""Find the lav-mic audio for each camera clip and cut it out with the camera's t=0 and length.

Adnan films on a Sony (usually sideways) and records a separate lav ("MIC 3") as back-to-back 30-minute WAV parts
("MAKE SURE YOU CONNECT THE MICROPHONE FILE"). File names don't say which part holds which take.

Usage:
  match_mic.py <camera.mp4> [...] --mics <dir> --out <dir> [--map mic_map.json] [--mux [--rotate ccw]]
  match_mic.py <camera.mp4> --mics <dir> --out <dir> --mic "<part>.wav" --at 100.333     (offset already known)

Writes <out>/<camera stem>.mic.wav (48 kHz mono s24, same t=0 and length as the camera clip) and, with --mux,
<out>/<camera stem>.synced.mp4 (camera video copied bit-for-bit + the lav at one flat gain, nothing else — the
"synced raw" for review). Prints JSON per clip: status, mic, t0 (mic-part time of the camera's first frame), support.

How it decides: three probes (20/50/80 % into the clip, speech band, 4 kHz) are correlated against every mic part.
A match needs >= 2 probes landing on the same offset (±50 ms). A lav and a camera mic sound different, so true
matches score only ~0.13–0.44 NCC — probe agreement, not the raw score, separates a match from noise (a fixed score
threshold rejected 4 of 16 real matches on the 22 Sep shoot). Parts are ordered by their BWF start time; a clip that
runs past the end of a part continues from the next part when the two are contiguous (BWF time_reference), else it
is padded with silence and flagged. Known offsets (mic_map.json) skip the search entirely: pass --map."""
import argparse, json, re, subprocess, sys
from pathlib import Path
import numpy as np

SR = 4000              # correlation rate
OUT_SR = 48000         # lav parts are 48 kHz
PROBE_MAX = 12.0       # seconds per probe
BAND = "highpass=f=120,lowpass=f=1900"
HERE = Path(__file__).resolve().parent


def pcm(path, sr, start=0.0, dur=None):
    cmd = ["ffmpeg", "-v", "error", "-ss", f"{start:.4f}", "-i", str(path)]
    if dur:
        cmd += ["-t", f"{dur:.4f}"]
    cmd += ["-ac", "1", "-ar", str(sr), "-af", BAND, "-f", "f32le", "-"]
    x = np.frombuffer(subprocess.run(cmd, capture_output=True, check=True).stdout, np.float32).astype(np.float64)
    return (x - x.mean()) / (x.std() + 1e-9)


def fmt(path):
    return json.loads(subprocess.run(["ffprobe", "-v", "error", "-show_format", "-of", "json", str(path)],
                                     capture_output=True, text=True).stdout)["format"]


def norm(name):
    """'Copy of 02 culture leaving daughters out - Mic 1 at 1m40s.MP4' → 'culture leaving daughters out'."""
    s = Path(name).stem.lower().strip()
    s = re.sub(r"^copy of ", "", s)
    s = re.sub(r"^mic \d+ - [\d.]+ - ", "", s)
    s = re.sub(r"^\d{2} ", "", s)
    s = re.sub(r" - (mic \d+ at \w+|no mic file.*)$", "", s)
    return s


class Part:
    def __init__(self, path):
        self.path, f = path, fmt(path)
        self.dur, tags = float(f["duration"]), f.get("tags", {})
        self.key = (tags.get("date", ""), tags.get("creation_time", ""), path.name)     # BWF origination
        self.tref = int(tags["time_reference"]) if tags.get("time_reference", "").isdigit() else None
        self.sig = None

    def ready(self):
        if self.sig is None:
            self.sig = pcm(self.path, SR)
            self.cs = np.concatenate([[0], np.cumsum(self.sig ** 2)])
            self.size = 1 << int(np.ceil(np.log2(len(self.sig) + PROBE_MAX * SR)))
            self.F = np.fft.rfft(self.sig, self.size)

    def ncc(self, probe):
        n, m = len(probe), len(self.sig)
        c = np.fft.irfft(self.F * np.conj(np.fft.rfft(probe, self.size)), self.size)[: m - n + 1]
        s = c / (np.linalg.norm(probe) * np.sqrt(np.maximum(self.cs[n:] - self.cs[:-n], 1e-9)))
        i = int(np.argmax(s))
        return float(s[i]), i / SR


def timeline(parts):
    """Global start of each part (parts sorted by BWF time) and whether part k+1 continues part k exactly."""
    starts, contig, t = [], [], 0.0
    for k, p in enumerate(parts):
        starts.append(t); t += p.dur
        nxt = parts[k + 1] if k + 1 < len(parts) else None
        contig.append(bool(nxt and p.tref is not None and nxt.tref is not None
                           and abs(nxt.tref - (p.tref + round(p.dur * OUT_SR))) <= 2))
    return starts, contig


def search(cam, dur, parts, starts):
    plen = min(PROBE_MAX, dur / 4)
    pst = [max(0.0, dur * f - plen / 2) for f in (0.2, 0.5, 0.8)]
    probes = [pcm(cam, SR, s, plen) for s in pst]
    cands = []                                              # (global t0, score, probe #)
    for k, p in enumerate(parts):
        p.ready()
        for j, (pr, s) in enumerate(zip(probes, pst)):
            sc, t = p.ncc(pr)
            cands.append((starts[k] + t - s, sc, j))
    best = None
    for T, _, _ in cands:
        near = {}
        for T2, sc2, j2 in cands:
            if abs(T2 - T) <= 0.05 and sc2 > near.get(j2, (0, -1))[1]:
                near[j2] = (T2, sc2)
        rank = (len(near), sum(v[1] for v in near.values()))
        if best is None or rank > best[0]:
            best = (rank, near)
    (support, _), near = best
    return {"t0_global": float(np.median([v[0] for v in near.values()])), "support": support,
            "score": round(min(v[1] for v in near.values()), 3),
            "probes": [[round(sc, 3), round(T, 3)] for T, sc, j in sorted(cands, key=lambda c: (c[2], -c[1]))[::len(parts)]]}


def locate(T, parts, starts):
    for k in range(len(parts) - 1, -1, -1):
        if T >= starts[k] or k == 0:
            return k, T - starts[k]


def cut(T, dur, parts, starts, contig, dst):
    """Write [T, T+dur] of the global mic timeline to dst, stitching contiguous parts and padding gaps with silence."""
    k, off = locate(T, parts, starts)
    segs, note, t, need = [], [], T, dur
    if off < 0:                                             # camera started before the first part
        segs.append(("pad", -off)); need += off; off = 0.0; note.append(f"{-T:.2f}s before the first mic part → silence")
    while need > 1e-6:
        take = max(0.0, min(need, parts[k].dur - off))
        if take > 0:
            segs.append((k, off, take)); need -= take
        if need > 1e-6:
            if k + 1 < len(parts) and contig[k]:
                k, off = k + 1, 0.0; note.append(f"continues into {parts[k].path.name}")
            else:
                segs.append(("pad", need)); note.append(f"last {need:.2f}s past the end of {parts[k].path.name} → silence"); need = 0
    ins, chains, labels = [], [], []
    for i, s in enumerate(segs):
        if s[0] == "pad":
            chains.append(f"anullsrc=r={OUT_SR}:cl=mono,atrim=end_sample={round(s[1] * OUT_SR)}[s{i}]")
        else:
            ins += ["-i", str(parts[s[0]].path)]
            a = round(s[1] * OUT_SR)
            chains.append(f"[{len(ins) // 2 - 1}:a]aresample={OUT_SR},pan=mono|c0=c0,atrim=start_sample={a}:"
                          f"end_sample={a + round(s[2] * OUT_SR)},asetpts=N/SR/TB[s{i}]")
        labels.append(f"[s{i}]")
    graph = ";".join(chains) + f";{''.join(labels)}concat=n={len(segs)}:v=0:a=1,apad=whole_len={round(dur * OUT_SR)},atrim=end_sample={round(dur * OUT_SR)}[o]"
    subprocess.run(["ffmpeg", "-v", "error", "-y", *ins, "-filter_complex", graph, "-map", "[o]", "-c:a", "pcm_s24le", str(dst)], check=True)
    return note


def mux(cam, wav, dst, rotate):
    """Camera video copied untouched + the lav at one flat gain (true peak → -1 dBTP, max +20 dB). No other change."""
    e = subprocess.run(["ffmpeg", "-hide_banner", "-nostats", "-i", str(wav), "-af", "ebur128=peak=true", "-f", "null", "-"],
                       capture_output=True, text=True).stderr
    tp = float(re.findall(r"Peak:\s+(-?[\d.]+) dBFS", e)[-1])
    gain = round(max(0.0, min(20.0, -1.0 - tp)), 1)
    rot = {"ccw": ["-display_rotation:v:0", "90"], "cw": ["-display_rotation:v:0", "-90"]}.get(rotate, [])
    subprocess.run(["ffmpeg", "-v", "error", "-y", *rot, "-i", str(cam), "-i", str(wav), "-map", "0:v:0", "-map", "1:a:0",
                    "-c:v", "copy", "-af", f"volume={gain}dB", "-c:a", "aac", "-b:a", "320k", "-movflags", "+faststart",
                    "-shortest", str(dst)], check=True)
    return gain


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("cameras", nargs="+")
    ap.add_argument("--mics", required=True, help="folder with the lav WAV parts")
    ap.add_argument("--out", required=True)
    ap.add_argument("--map", help="mic_map.json with known offsets (default: next to this script)", nargs="?", const=str(HERE / "mic_map.json"))
    ap.add_argument("--mic", help="with --at: the part the offset refers to")
    ap.add_argument("--at", type=float, help="known offset: mic-part time of the camera's first frame")
    ap.add_argument("--mux", action="store_true", help="also write <stem>.synced.mp4 (video copy + lav, flat gain)")
    ap.add_argument("--rotate", choices=["ccw", "cw", "none"], default="ccw", help="rotation flag for --mux (Sony files are sideways)")
    a = ap.parse_args()
    if (a.at is None) != (a.mic is None) or (a.at is not None and len(a.cameras) > 1):
        sys.exit("--at and --mic go together, for one camera file")

    parts = sorted((Part(p) for p in Path(a.mics).iterdir() if p.suffix.lower() in (".wav", ".mp3", ".m4a")), key=lambda p: p.key)
    if not parts:
        sys.exit("no mic files in " + a.mics)
    starts, contig = timeline(parts)
    by_name = {norm(p.path.name): k for k, p in enumerate(parts)}
    known = {}
    if a.map:
        for shoot in json.loads(Path(a.map).read_text(encoding="utf-8"))["shoots"].values():
            for v in shoot["videos"]:
                if v.get("mic"):
                    known[norm(v["file"])] = (norm(shoot["mic_parts"][v["mic"]]["file"]), v["t0_s"])
    out = Path(a.out); out.mkdir(parents=True, exist_ok=True)
    report = []
    for cam in map(Path, a.cameras):
        dur = float(fmt(cam)["duration"])
        row = {"camera": cam.name}
        if a.at is not None or norm(cam.name) in known:
            part, t = (norm(a.mic), a.at) if a.at is not None else known[norm(cam.name)]
            if part not in by_name:
                row.update(status=f"MIC PART MISSING — download '{part}' into {a.mics}"); report.append(row); continue
            T, row["source"], row["support"] = starts[by_name[part]] + t, ("--at" if a.at is not None else "mic_map.json"), None
        else:
            r = search(cam, dur, parts, starts)
            T = r["t0_global"]; row.update(source="search", support=r["support"], score=r["score"], probes=r["probes"])
            if r["support"] < 2:
                row["status"] = ("NO MATCH — no mic part covers this clip. Check the BWF start times (ffprobe <wav>) for a missing "
                                 "part before/after, or ask for it. Don't use the camera audio silently.")
                report.append(row); continue
        k, off = locate(T, parts, starts)
        row.update(status="ok", mic=parts[k].path.name, t0=round(off, 4))
        wav = out / f"{cam.stem}.mic.wav"
        note = cut(T, dur, parts, starts, contig, wav)
        row["wav"] = str(wav)
        if note:
            row["note"] = "; ".join(note)
        if a.mux:
            dst = out / f"{cam.stem}.synced.mp4"
            row["gain_db"] = mux(cam, wav, dst, a.rotate); row["synced"] = str(dst)
        report.append(row)
        print(f"{row['status']:>2}  {cam.name}  →  {row['mic']} @ {row['t0']:.3f}s  ({row['source']}"
              + (f", {row['support']}/3 probes agree, score {row['score']}" if row["source"] == "search" else "") + ")", file=sys.stderr)
    print(json.dumps(report, indent=2, ensure_ascii=False))


if __name__ == "__main__":
    main()
