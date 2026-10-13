#!/usr/bin/env bash
# One job file in, one 1080×1920 Instagram reel out:   bash scripts/reel.sh jobs/<name>.json
#   1. prep   the source → trimmed, cropped to 9:16, graded, 30 fps footage + a cleaned-up voice track
#   2. words  the job's transcript, or faster-whisper if it has none
#   3. props  job + words → work/<name>/props.json (cuts, cards, captions, end card, sound cues)
#   4. render the picture (Remotion, muted)
#   5. sound  synthesised score + effects, mixed under the voice to −14 LUFS, muxed → renders/<name>.mp4
# Steps whose output already exists are skipped; FRESH=1 redoes everything. Extra args go to remotion render.
set -euo pipefail
cd "$(dirname "$0")/.."
JOB=${1:?usage: scripts/reel.sh jobs/<name>.json [remotion render args]}; shift
q() { node -e "const j=require(require('path').resolve('$JOB')); const v=($1); process.stdout.write(v===undefined||v===null?'':String(v))"; }
NAME=$(q j.name)
SRC=$(q j.source); [[ "$SRC" = /* ]] || SRC="$(cd "$(dirname "$JOB")" && realpath "$SRC")"
T0=$(q "(j.trim||[0])[0]"); T1=$(q "(j.trim||[])[1]")
W=work/$NAME; PUB=public/jobs/$NAME; mkdir -p "$W" "$PUB" renders
[[ "${FRESH:-}" == 1 ]] && rm -f "$W"/* "$PUB"/*
TRIM=(-ss "$T0"); [[ -n "$T1" ]] && TRIM+=(-to "$T1")

if [[ ! -s $PUB/footage.mp4 ]]; then
  echo "▸ prep: picture"
  GRADE="eq=contrast=1.10:saturation=0.86:gamma=0.96:brightness=-0.015,colorbalance=rs=-0.03:bs=0.05:rh=0.03:bh=-0.03,unsharp=5:5:0.45,"
  [[ $(q "j.grade===false") == true ]] && GRADE=""
  ffmpeg -v error -y "${TRIM[@]}" -i "$SRC" -an \
    -vf "fps=30,scale=1080:1920:force_original_aspect_ratio=increase:flags=lanczos,crop=1080:1920,${GRADE}format=yuv420p" \
    -c:v libx264 -crf 14 -preset slow -g 15 "$PUB/footage.mp4"
fi
if [[ ! -s $W/voice.wav ]]; then
  echo "▸ prep: voice"
  CLEAN="highpass=f=85,lowpass=f=14500,equalizer=f=250:t=q:w=1.2:g=-2.5,equalizer=f=3200:t=q:w=1.0:g=2.2,equalizer=f=9000:t=h:w=1:g=1.5,acompressor=threshold=-20dB:ratio=3.2:attack=6:release=120:makeup=4,alimiter=limit=0.9,"
  [[ $(q "j.voice&&j.voice.clean===false") == true ]] && CLEAN=""
  ffmpeg -v error -y "${TRIM[@]}" -i "$SRC" -vn -af "${CLEAN}aresample=48000" -ac 2 "$W/voice.wav"
fi

if [[ ! -s $W/words.json ]]; then
  WORDS=$(q j.words)
  if [[ -n "$WORDS" ]]; then
    cp "$(dirname "$JOB")/$WORDS" "$W/words.json"
  else
    echo "▸ words: transcribing (faster-whisper)"
    # the job's trim is applied in props.mjs, so transcribe the whole source
    python3 scripts/transcribe.py "$SRC" "$W/words.json" "$(q "j.whisperModel||'small.en'")"
  fi
fi

echo "▸ props"
node scripts/props.mjs "$JOB" "$W/words.json" "$W/props.json" "$(ffprobe -v error -show_entries format=duration -of csv=p=0 "$PUB/footage.mp4")"

echo "▸ render (picture)"
npx remotion render CoachReel "$W/video.mp4" --props="$W/props.json" --codec=h264 --crf=15 --muted "$@"

echo "▸ sound"
node scripts/sound.mjs "$W/props.json" "$W"
read -r MUSIC MG SG END < <(node -e "const p=require(require('path').resolve('$W/props.json')); console.log(p.audio.music?1:0, p.audio.musicGain, p.audio.sfxGain, p.end.from)")
[[ $MUSIC == 1 ]] || MG=0
# the music ducks under the voice, then comes up for the end card; −14 LUFS, −1.2 dBTP (Instagram)
ffmpeg -v error -y -i "$W/voice.wav" -i "$W/music.wav" -i "$W/sfx.wav" -filter_complex "\
[0:a]aformat=sample_rates=48000:channel_layouts=stereo,asplit=2[v][vsc];\
[1:a]volume='$MG*(1+1.3*min(1,max(0,(t-($END-0.1))/0.5)))':eval=frame[m];\
[m][vsc]sidechaincompress=threshold=0.025:ratio=5:attack=20:release=400[md];\
[2:a]volume=$SG[s];\
[v][md][s]amix=inputs=3:normalize=0:duration=longest,loudnorm=I=-14:TP=-1.2:LRA=11,aresample=48000" \
  -c:a pcm_s16le "$W/mix.wav"
ffmpeg -v error -y -i "$W/video.mp4" -i "$W/mix.wav" -map 0:v -map 1:a -c:v libx264 -crf 20 -preset slow -pix_fmt yuv420p \
  -c:a aac -b:a 256k -movflags +faststart -shortest "renders/$NAME.mp4"
echo "✓ renders/$NAME.mp4"
