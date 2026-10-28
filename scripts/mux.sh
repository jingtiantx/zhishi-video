#!/bin/sh
# frames (jpg) + mix.wav -> mp4 (H.264 yuv420p tv-range + AAC 256k 48 kHz)
# usage: sh mux.sh <frames_dir> <mix.wav> <out.mp4> [fps]
set -e
FR=${4:-30}
ffmpeg -y -v error -framerate "$FR" -i "$1/f_%06d.jpg" -i "$2" -map 0:v -map 1:a \
  -vf "scale=in_range=pc:out_range=tv,format=yuv420p" -c:v libx264 -preset slow -crf 21 -pix_fmt yuv420p -color_range tv -profile:v high -level 4.2 -movflags +faststart \
  -c:a aac -b:a 256k -ar 48000 -shortest "$3"
echo "muxed $3"
