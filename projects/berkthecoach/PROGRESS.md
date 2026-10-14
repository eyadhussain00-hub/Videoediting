# PROGRESS – berkthecoach   (updated 2026-10-14)
Phase: preview (v2 sent on Telegram)
Current version: v2 → renders/final/berkthecoach_v2.mp4 (1080×1920, 30 fps, 55.5 s, -14 LUFS; not committed).
  Telegram preview: renders/previews/berkthecoach_v2_preview.mp4.
  v2 notes (Eyad, 14 Oct): "everything is good, only change the beginning": hook keeps the footage at its normal window
  size (no drop / breakout, no zoom-in) and the بركة / رزق words are gone. Everything after the hook is unchanged.

Done:
- Source: instagram.com/reel/DdY7PJfos7B (@berkthecoach, "3 sins destroying your barakah as a Muslim coach", 52.4 s).
  Spec edit: a pitch piece, not for publishing without his permission.
- The original is a 1080×864 band (y 528–1392 of the frame) between a title pill and captions, so the band is clean:
  no caption removal. It's shown in a rounded window on a designed backdrop; the speaker breaks out of it in the finale.
- Transcript (plan/words.json → scripts/fix_words.py → src/words.json), storyboard (plan/storyboard.md), all scenes,
  speaker matte, Demucs voice + synthesised D Hijaz score and SFX (public/mix.wav), v1 render, Telegram preview.

Next step: Eyad's notes on v2.

Rebuild from scratch (fresh container), from this folder:
  npm ci · pip install yt-dlp faster-whisper opencv-python-headless rembg onnxruntime scipy fonttools brotli ·
  pip install torch torchaudio --index-url https://download.pytorch.org/whl/cpu · pip install demucs soundfile ·
  yt-dlp -o cache/src.mp4 https://www.instagram.com/reel/DdY7PJfos7B/ ·
  ffmpeg -i cache/src.mp4 -vf crop=1080:864:0:528 -c:v libx264 -crf 12 -an cache/band.mp4 ·
  ffmpeg -i cache/band.mp4 -vf "eq=contrast=1.07:saturation=0.92:gamma=0.98,colorbalance=rs=-0.03:bs=0.04:rh=0.05:gh=0.02:bh=-0.04,unsharp=5:5:0.6" -c:v libx264 -crf 12 -pix_fmt yuv420p cache/graded.mp4 ·
  ln -f cache/graded.mp4 public/graded.mp4 ·
  ffmpeg -i cache/graded.mp4 -vf "scale=-2:1920,crop=1080:1920,gblur=sigma=40,eq=brightness=-0.12:saturation=0.7" -c:v libx264 -crf 22 public/bg.mp4 ·
  python3 scripts/matte.py cache/band.mp4 cache/matte.mp4 (~25 min) ·
  ffmpeg -i cache/graded.mp4 -i cache/matte.mp4 -filter_complex "[1:v]format=gray,lut=y='clip((val-80)*1.5\,0\,255)',erosion,erosion,gblur=sigma=1.3[m];[0:v][m]alphamerge,format=yuva420p" -c:v libvpx-vp9 -pix_fmt yuva420p -b:v 0 -crf 22 -row-mt 1 -an public/fg.webm ·
  ffmpeg -i cache/src.mp4 -vn -ac 1 -ar 16000 cache/voice16k.wav · python3 scripts/transcribe.py cache/voice16k.wav plan/words.json · python3 scripts/fix_words.py ·
  ffmpeg -i cache/src.mp4 -vn -ac 2 -ar 44100 cache/orig.wav · python3 -m demucs --two-stems=vocals -n htdemucs -o cache/demucs cache/orig.wav ·
  python3 scripts/audio.py cache/demucs/htdemucs/orig/vocals.wav public/mix.wav ·
  npx remotion render Reel cache/v1_raw.mp4 --concurrency=4 (~30 min) → ffmpeg re-encode (see LOG.md).
  Stills: bash scripts/stills.sh 0.6 9 27.6 … → cache/stills/sheet.jpg.

Key decisions: gold/ivory on night ink with a khatam lattice; the sins become chapter cards because he never says
  them; Qur'an 20:132 and 63:9 and the hadith (Sahih al-Bukhari 2079) shown with Arabic + the meaning lit word by word;
  his loud music bed replaced by our own score; end card added from his caption's CTA (comment "BARAKAH").
Gotchas: public/ must hold real files (hardlinks), not symlinks. Large Amiri text with stacked harakat (shadda+fatha)
  renders the marks detached under background-clip:text, so big Arabic words are set with few or no harakat.
  The matte needs choking (lut + 2× erosion) or the white wardrobe haloes his head in the breakout.
Key files: src/data.ts (timings), src/scenes/{stage,depth,front,captions,fx}.tsx, scripts/*.py, plan/storyboard.md
