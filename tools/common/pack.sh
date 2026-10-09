#!/usr/bin/env bash
# Usage: pack.sh <client>   (ceowills | sk-media | boxabl)  → output/ceowills-media.zip / output/sk-media.zip / output/boxabl-media.zip
# Builds the client's toolkit zip from what's COMMITTED (git archive — exact bytes, LF line endings even on a Windows
# checkout), so the Drive copy can't drift from the branch: tools/<client>/ + tools/common/ + tools/tg.sh (+ the client's
# skill). Downloaded fonts and caches aren't in git, so they're never in the zip. Commit first, then pack.
# Put the zip in the client's Drive "Files" folder, replacing the old one in place (Make 7680385, same link).
set -euo pipefail
C="${1:?client: ceowills | sk-media | boxabl}"; HERE="$(cd "$(dirname "$0")" && pwd)"; REPO="$(cd "$HERE/../.." && pwd)"
case "$C" in ceowills) Z="ceowills-media"; SKILL=".claude/skills/ceowills-reel" ;; sk-media) Z="sk-media"; SKILL="" ;;
  boxabl) Z="boxabl-media"; SKILL=".claude/skills/boxabl-clips" ;;
  *) echo "unknown client $C" >&2; exit 2 ;; esac
cd "$REPO"; mkdir -p output
[ -z "$(git status --porcelain -- "tools/$C" tools/common tools/tg.sh ${SKILL:+"$SKILL"})" ] \
  || echo "pack: uncommitted changes in the toolkit — the zip has the last commit, not them" >&2
git -c core.autocrlf=false -c core.eol=lf archive --format=zip --prefix="$Z/" -o "output/$Z.zip" HEAD "tools/$C" tools/common tools/tg.sh ${SKILL:+"$SKILL"}
echo "output/$Z.zip  ($(du -h "output/$Z.zip" | cut -f1), $(git rev-parse --short HEAD))"
