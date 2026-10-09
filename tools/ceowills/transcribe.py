#!/usr/bin/env python3
"""Word-level transcript with faster-whisper (local, free). Cached by file hash — never re-transcribes.

Usage: transcribe.py <audio-or-video> [...] --out <dir> [--model medium.en]
Writes <out>/<stem>.json = [{"word","start","end","p"}] and prints the sentence-level transcript.
Transcribe the MIC file, not the camera audio (cleaner words, better timings)."""
import argparse, hashlib, json, subprocess
from pathlib import Path


def sha(p):
    h = hashlib.sha1()
    with open(p, "rb") as f:
        for b in iter(lambda: f.read(1 << 20), b""):
            h.update(b)
    return h.hexdigest()[:16]


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("inputs", nargs="+")
    ap.add_argument("--out", required=True)
    ap.add_argument("--model", default="medium.en")
    a = ap.parse_args()
    out = Path(a.out); out.mkdir(parents=True, exist_ok=True)
    cache = out / ".cache"; cache.mkdir(exist_ok=True)
    model = None
    for inp in map(Path, a.inputs):
        key = cache / f"{sha(inp)}.{a.model}.json"
        if key.exists():
            words = json.loads(key.read_text(encoding="utf-8"))
            print(f"cached  {inp.name}")
        else:
            if model is None:
                from faster_whisper import WhisperModel
                model = WhisperModel(a.model, device="cpu", compute_type="int8")
            # decode with ffmpeg and hand Whisper the samples: its own loader goes through PyAV, and PyAV ≥ 15 dropped an
            # argument faster-whisper 1.2 still passes (7 Oct: "open() got an unexpected keyword argument 'metadata_errors'")
            import numpy as np
            pcm = subprocess.run(["ffmpeg", "-v", "error", "-i", str(inp), "-ac", "1", "-ar", "16000", "-f", "f32le", "-"],
                                 check=True, capture_output=True).stdout
            segs, _ = model.transcribe(np.frombuffer(pcm, np.float32), word_timestamps=True, beam_size=5)
            words = [{"word": w.word.strip(), "start": round(w.start, 3), "end": round(w.end, 3), "p": round(w.probability, 2)}
                     for s in segs for w in s.words]
            key.write_text(json.dumps(words))
        (out / f"{inp.stem}.json").write_text(json.dumps(words, indent=0))
        print(f"===== {inp.name}")
        line, t0 = [], None
        for i, w in enumerate(words):
            t0 = w["start"] if t0 is None else t0
            line.append(f'{w["word"]}')
            if w["word"].endswith((".", "?", "!")) or i == len(words) - 1:
                print(f"[{t0:7.2f}–{w['end']:7.2f}] {' '.join(line)}")
                line, t0 = [], None


if __name__ == "__main__":
    main()
