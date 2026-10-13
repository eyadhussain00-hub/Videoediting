"""Word-level transcript → plan/words.json  ([{w, s, e}], seconds on the 24 fps conformed timeline)."""
import sys, json
from faster_whisper import WhisperModel
m = WhisperModel("small.en", device="cpu", compute_type="int8")
import numpy as np, soundfile as sf
audio, sr = sf.read(sys.argv[1], dtype="float32")  # 16 kHz mono (decode_audio trips on some PyAV versions)
segs, _ = m.transcribe(audio, word_timestamps=True, vad_filter=False, beam_size=5)
words = [{"w": w.word.strip(), "s": round(w.start, 3), "e": round(w.end, 3)} for s in segs for w in s.words]
json.dump(words, open(sys.argv[2], "w"), indent=0)
print(" ".join(x["w"] for x in words))
