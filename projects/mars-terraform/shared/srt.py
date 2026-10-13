"""timeline.json → .srt (title, captions, end card). Usage: python srt.py timeline.json out.srt"""
import json, sys
d = json.load(open(sys.argv[1]))
cues = [d['title']] + d['captions'] + [d['endcard']]
ts = lambda t: f"{int(t // 3600):02d}:{int(t % 3600 // 60):02d}:{int(t % 60):02d},{int(round(t % 1 * 1000)) % 1000:03d}"
with open(sys.argv[2], 'w') as f:
    for i, c in enumerate(sorted(cues, key=lambda c: c['t0']), 1): f.write(f"{i}\n{ts(c['t0'])} --> {ts(c['t1'])}\n{c['text']}\n\n")
print(sys.argv[2], len(cues), 'cues')
