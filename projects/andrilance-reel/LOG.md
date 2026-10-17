# LOG – andrilance-reel
- 17 Oct: Eyad asked to turn vt.tiktok.com/ZSg2HFE1n into a premium motion-graphics reel, merge to main, preview on Telegram.
  Downloaded (yt-dlp needs --impersonate chrome), transcribed, cut one line ("no fancy edits in this video").
- Caption removal: pass 1 missed lines where the white zipper merged with the text (component too tall); pass 2
  drops long vertical runs before grouping. Container reset mid-run once: clean_all.sh now works in resumable chunks.
- Matte only on the 12 type-behind-him ranges (rembg is ~1 s/frame on CPU).
- v1 rendered and sent on Telegram 17 Oct; full file in project files andrilance-reel/.
