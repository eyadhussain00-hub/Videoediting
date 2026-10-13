#!/usr/bin/env python3
"""Word-level transcript of a clip → [{w, s, e}] JSON.   python3 scripts/transcribe.py <clip> <words.json> [model]
Needs faster-whisper (pip install faster-whisper) and huggingface.co for the first download of the model."""
import json, subprocess, sys
import numpy as np
from faster_whisper import WhisperModel

src, out = sys.argv[1], sys.argv[2]
model = sys.argv[3] if len(sys.argv) > 3 else "small.en"
# decode with ffmpeg: faster-whisper's own loader breaks on newer PyAV
raw = subprocess.run(["ffmpeg", "-v", "error", "-i", src, "-ac", "1", "-ar", "16000", "-f", "s16le", "-"], capture_output=True, check=True).stdout
audio = np.frombuffer(raw, np.int16).astype(np.float32) / 32768
segs, _ = WhisperModel(model, device="cpu", compute_type="int8").transcribe(audio, word_timestamps=True, beam_size=5)
words = [{"w": w.word.strip(), "s": round(w.start, 3), "e": round(w.end, 3)} for s in segs for w in s.words]
json.dump(words, open(out, "w"), indent=0)
print(" ".join(x["w"] for x in words))
