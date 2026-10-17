"""Word timestamps → plan/words.json ([{w, s, e}], seconds). faster-whisper small.en on a numpy array
(PyAV in this container rejects faster-whisper's own open() arguments).
Usage: python3 scripts/transcribe.py cache/voice16k.wav plan/words.json"""
import json, sys, wave, numpy as np
from faster_whisper import WhisperModel

with wave.open(sys.argv[1]) as wf:
    a = np.frombuffer(wf.readframes(wf.getnframes()), np.int16).astype(np.float32) / 32768
m = WhisperModel("small.en", device="cpu", compute_type="int8")
segs, _ = m.transcribe(a, word_timestamps=True, beam_size=5, vad_filter=False,
                       initial_prompt="Sales call, prospect, rejection, nervous system, adrenaline, cortisol.")
out = [{"w": w.word.strip(), "s": round(w.start, 3), "e": round(w.end, 3)} for s in segs for w in s.words]
json.dump(out, open(sys.argv[2], "w"), indent=0)
print(" ".join(x["w"] for x in out))
