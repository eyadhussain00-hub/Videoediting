#!/usr/bin/env python3
"""Word-level transcript of a source with faster-whisper, cached by file hash.

usage: transcribe.py <ws>/src/<key>.mp4 [--out <ws>/words] [--model small.en] [--lang en]
  -> <out>/<key>.json {"model", "sha", "words": [{w, s, e}], "segments": [{s, e, text}]} + <key>.txt (readable)
small.en is enough for clip captions (we pick sentences, not stutter-level cuts); non-English sources: --lang tr --model small.
"""
import hashlib, json, os, sys

args = sys.argv[1:]
src = args[0]
opt = lambda k, d: args[args.index(k) + 1] if k in args else d
key = os.path.splitext(os.path.basename(src))[0]
out = opt("--out", os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(src))), "words"))
model_name, lang = opt("--model", "small.en"), opt("--lang", "en")
os.makedirs(out, exist_ok=True)

h = hashlib.sha1()
with open(src, "rb") as f:
    h.update(f.read(8 << 20)); f.seek(0, 2); h.update(str(f.tell()).encode())
sha = h.hexdigest()
dst = f"{out}/{key}.json"
if os.path.exists(dst):
    old = json.load(open(dst))
    if old.get("sha") == sha and old.get("model") == model_name:
        print(f"cached  {dst}"); sys.exit(0)

from faster_whisper import WhisperModel
m = WhisperModel(model_name, device="cpu", compute_type="int8", cpu_threads=os.cpu_count() or 4)
segs, _ = m.transcribe(src, language=lang, word_timestamps=True, vad_filter=True,
                       initial_prompt="BOXABL, Casita, Baby Box, Elon Musk, Galiano Tiramani, Paolo Tiramani.")
words, segments = [], []
for s in segs:
    segments.append({"s": round(s.start, 2), "e": round(s.end, 2), "text": s.text.strip()})
    words += [{"w": w.word.strip(), "s": round(w.start, 2), "e": round(w.end, 2)} for w in (s.words or [])]
json.dump({"model": model_name, "sha": sha, "words": words, "segments": segments}, open(dst, "w"))
with open(f"{out}/{key}.txt", "w") as f:
    for s in segments:
        f.write(f"[{s['s']:7.1f}-{s['e']:7.1f}] {s['text']}\n")
print(f"done    {dst} ({len(words)} words)")
