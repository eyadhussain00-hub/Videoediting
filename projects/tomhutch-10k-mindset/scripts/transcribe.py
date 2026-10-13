#!/usr/bin/env python3
"""Word-level transcript of the source reel → cache/words.json"""
import json, sys
from faster_whisper import WhisperModel
import subprocess, numpy as np
def decode(f):  # ffmpeg decode (the installed PyAV is too old for faster-whisper's own loader)
    raw = subprocess.run(["ffmpeg", "-v", "error", "-i", f, "-ac", "1", "-ar", "16000", "-f", "s16le", "-"], capture_output=True, check=True).stdout
    return np.frombuffer(raw, np.int16).astype(np.float32) / 32768
src, out = sys.argv[1], sys.argv[2]
m = WhisperModel("small.en", device="cpu", compute_type="int8")
segs, _ = m.transcribe(decode(src), word_timestamps=True, beam_size=5, vad_filter=False)
words = [{"w": w.word.strip(), "s": round(w.start, 3), "e": round(w.end, 3)} for s in segs for w in s.words]
json.dump(words, open(out, "w"), indent=0)
print(" ".join(f"{x['w']}[{x['s']}]" for x in words))
