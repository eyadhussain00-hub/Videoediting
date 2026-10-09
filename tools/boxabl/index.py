#!/usr/bin/env python3
"""Rebuild drive_index.json from Boxabl's shared Drive folder (public folder view, no login needed).

usage: index.py [root_folder_id]     default = the root in drive_index.json
Keeps video/audio files only. Run it when ClipFlow says new footage was added, then commit the index.
"""
import html, json, os, re, sys, urllib.request

HERE = os.path.dirname(os.path.abspath(__file__))
root = sys.argv[1] if len(sys.argv) > 1 else json.load(open(f"{HERE}/drive_index.json"))["root"]
seen, files = set(), []


def ls(fid, path, depth=0):
    if fid in seen or depth > 5:
        return
    seen.add(fid)
    page = urllib.request.urlopen(f"https://drive.google.com/embeddedfolderview?id={fid}").read().decode("utf8", "replace")
    for kind, id_, title in re.findall(
            r'href="https://drive.google.com/(file/d|drive/folders)/([^/"?]+)[^"]*".*?flip-entry-title">([^<]+)', page, re.S):
        title = html.unescape(title)
        if kind == "file/d":
            if title.lower().endswith((".mp4", ".mov", ".m4v", ".mp3", ".wav")):
                files.append({"path": f"{path}/{title}", "id": id_})
        else:
            ls(id_, f"{path}/{title}", depth + 1)


ls(root, "")
files.sort(key=lambda f: f["path"])
json.dump({"root": root, "files": files}, open(f"{HERE}/drive_index.json", "w"), ensure_ascii=False, indent=0)
print(f"{len(files)} media files indexed")
