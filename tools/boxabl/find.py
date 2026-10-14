#!/usr/bin/env python3
"""Exact word times for phrases in a transcript — use them for segment in/out points.

usage: find.py <ws>/words/<key>.json "phrase one" "phrase two" …
       find.py <ws>/words/<key>.json --range 150 161        every word between two source times
Prints "<start> <end>  <phrase>" for every match (start of the first word, end of the last).
"""
import json, re, sys

words = json.load(open(sys.argv[1]))["words"]
norm = lambda t: re.sub(r"[^a-z0-9$]", "", t.lower())
if sys.argv[2] == "--range":
    a, b = float(sys.argv[3]), float(sys.argv[4])
    for w in words:
        if a <= w["s"] <= b:
            print(f"{w['s']:8.2f} {w['e']:8.2f}  {w['w']}")
    sys.exit()
for ph in sys.argv[2:]:
    p = [norm(x) for x in ph.split() if norm(x)]
    hit = False
    for i in range(len(words) - len(p) + 1):
        if all(norm(words[i + k]["w"]) == p[k] for k in range(len(p))):
            print(f"{words[i]['s']:8.2f} {words[i + len(p) - 1]['e']:8.2f}  {ph}"); hit = True
    if not hit:
        print(f"    —        —     {ph}  (not found)")
