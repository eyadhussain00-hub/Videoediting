#!/usr/bin/env bash
# Usage: fetch.sh ids.txt <dest>    ids.txt lines: <drive_file_id> <filename>  — the shared downloader (tools/common/fetch.sh)
exec bash "$(dirname "$0")/../common/fetch.sh" "$@"
