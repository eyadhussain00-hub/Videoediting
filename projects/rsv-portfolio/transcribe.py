import sys, json
from faster_whisper import WhisperModel
m = WhisperModel("medium.en", device="cpu", compute_type="int8")
for f in sys.argv[1:]:
    import wave, numpy as np; w_=wave.open(f); a=np.frombuffer(w_.readframes(w_.getnframes()),np.int16).astype(np.float32)/32768
    segs, _ = m.transcribe(a, word_timestamps=True, vad_filter=False)
    words = [dict(w=w.word.strip(), s=round(w.start,2), e=round(w.end,2)) for s in segs for w in s.words]
    json.dump(words, open(f.replace('.wav','.words.json'),'w'))
    print(f, ' '.join(f"{w['w']}@{w['s']}" for w in words))
