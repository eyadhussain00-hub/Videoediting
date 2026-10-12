"""Word-level transcript of the source reel → cache/words.json (faster-whisper)."""
import json, sys
from faster_whisper import WhisperModel
src = sys.argv[1] if len(sys.argv) > 1 else "cache/audio16k.wav"
m = WhisperModel("small.en", device="cpu", compute_type="int8")
segs, _ = m.transcribe(src, word_timestamps=True, beam_size=5, vad_filter=False)
words, text = [], []
for s in segs:
    text.append(s.text.strip())
    for w in s.words:
        words.append({"w": w.word.strip(), "s": round(w.start, 3), "e": round(w.end, 3), "p": round(w.probability, 2)})
json.dump(words, open("cache/words.json", "w"), indent=0)
open("cache/transcript.txt", "w").write("\n".join(text) + "\n")
print("\n".join(text)); print(len(words), "words")
