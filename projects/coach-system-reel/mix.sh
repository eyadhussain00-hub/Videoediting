#!/usr/bin/env bash
# Mixes the reel's voice (out/voice.wav) with the synthesised score and effects, then muxes the picture.
# The music ducks under the voice, then comes up for the end card. Loudness: −14 LUFS, −1.2 dBTP (Instagram).
set -euo pipefail
cd "$(dirname "$0")"
ffmpeg -v error -y -i out/voice.wav -i out/music.wav -i out/sfx.wav -filter_complex "\
[0:a]aformat=sample_rates=48000:channel_layouts=stereo,asplit=2[v][vsc];\
[1:a]volume='0.38*(1+1.3*min(1,max(0,(t-47.9)/0.5)))':eval=frame[m];\
[m][vsc]sidechaincompress=threshold=0.025:ratio=5:attack=20:release=400[md];\
[2:a]volume=0.5[s];\
[v][md][s]amix=inputs=3:normalize=0:duration=longest,loudnorm=I=-14:TP=-1.2:LRA=11,aresample=48000" \
  -c:a pcm_s16le out/mix.wav
ffmpeg -v error -y -i out/video.mp4 -i out/mix.wav -map 0:v -map 1:a -c:v libx264 -crf 20 -preset slow -pix_fmt yuv420p -c:a aac -b:a 256k -movflags +faststart -shortest coach-system-reel.mp4
echo "coach-system-reel.mp4"
