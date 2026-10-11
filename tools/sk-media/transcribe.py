#!/usr/bin/env python3
"""Local, free word-level transcription (faster-whisper, CPU int8). Caches by file hash.
Usage: uv run --with faster-whisper --with 'av<16' python transcribe.py <media> <out.json> [model=medium.en]
Output: {"text", "words": [{"w","s","e","p"}]}. medium.en keeps false starts that small.en drops — use it for cutting."""
import hashlib, json, shutil, subprocess, sys, tempfile
from pathlib import Path
src, out = sys.argv[1], sys.argv[2]; model = sys.argv[3] if len(sys.argv) > 3 else "medium.en"
h = hashlib.sha1(open(src, "rb").read(1 << 24) + str(Path(src).stat().st_size).encode() + model.encode()).hexdigest()[:16]
cache = Path.home() / ".cache/sk-media/words" / f"{h}.json"
if cache.exists(): shutil.copy(cache, out); print("cached", out); sys.exit()
from faster_whisper import WhisperModel
with tempfile.TemporaryDirectory() as d:
    wav = f"{d}/a.wav"; subprocess.run(["ffmpeg", "-v", "error", "-y", "-i", src, "-ac", "1", "-ar", "16000", wav], check=True)
    segs, _ = WhisperModel(model, device="cpu", compute_type="int8", cpu_threads=4).transcribe(wav, language="en", word_timestamps=True, beam_size=5)
    words, text = [], []
    for s in segs:
        text.append(s.text); words += [{"w": w.word.strip(), "s": round(w.start, 3), "e": round(w.end, 3), "p": round(w.probability, 3)} for w in s.words]
cache.parent.mkdir(parents=True, exist_ok=True); json.dump({"text": "".join(text), "words": words}, open(cache, "w"))
shutil.copy(cache, out); print("words", len(words), "→", out)
