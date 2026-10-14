#!/usr/bin/env python3
"""Download a job's sources from Boxabl's Drive folder into <ws>/src/<key>.mp4 (via the shared tools/common/fetch.sh).

usage: fetch.py <job.json> --ws <ws>          every key in job["sources"]
       fetch.py --find "<words>"              search drive_index.json (all words must appear in the path)
       fetch.py --get "<path or id>" <key> --ws <ws>   one file
Sources are the paths printed by --find (from drive_index.json). Refresh the index with index.py when Boxabl adds footage.
"""
import json, os, subprocess, sys

HERE = os.path.dirname(os.path.abspath(__file__))
IDX = json.load(open(f"{HERE}/drive_index.json"))
BY_PATH = {f["path"]: f["id"] for f in IDX["files"]}


def resolve(ref):
    if ref in BY_PATH:
        return BY_PATH[ref]
    hits = [p for p in BY_PATH if p.endswith(ref) or p.lstrip("/") == ref.lstrip("/")]
    if len(hits) == 1:
        return BY_PATH[hits[0]]
    if len(ref) > 20 and "/" not in ref and " " not in ref:
        return ref                                   # a raw Drive id
    sys.exit(f"fetch: '{ref}' matches {len(hits)} files in drive_index.json — use fetch.py --find")


def pull(pairs):
    data = b"".join(f"{i}\0{d}\0".encode() for i, d in pairs)
    r = subprocess.run(["bash", f"{HERE}/../common/fetch.sh", "--pairs"], input=data)
    sys.exit(r.returncode)


args = sys.argv[1:]
if args and args[0] == "--find":
    words = [w.lower() for w in " ".join(args[1:]).split()]
    for f in IDX["files"]:
        if all(w in f["path"].lower() for w in words):
            print(f["path"])
    sys.exit(0)
ws = args[args.index("--ws") + 1] if "--ws" in args else sys.exit("fetch: --ws <workspace>")
os.makedirs(f"{ws}/src", exist_ok=True)
if args[0] == "--get":
    pull([(resolve(args[1]), f"{ws}/src/{args[2]}.mp4")])
job = json.load(open(args[0]))
pull([(resolve(ref), f"{ws}/src/{key}.mp4") for key, ref in job["sources"].items()])
