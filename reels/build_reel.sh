#!/usr/bin/env bash
# Build one daily reel. Usage: reels/build_reel.sh path/to/reel.json OUT_DIR
# Needs: node, ffmpeg, a Chromium path in CHROME (or the Playwright one), and the
# my-voice-clone skill (VOICE_SKILL dir) already set up (~/.voice-clone-venv).
set -euo pipefail
REEL_JSON=$(realpath "$1"); OUT=$(realpath -m "$2"); mkdir -p "$OUT"
HERE=$(cd "$(dirname "$0")" && pwd); T="$HERE/template"
CHROME=${CHROME:-$(node -e "console.log(require('playwright').chromium.executablePath())" 2>/dev/null || true)}
: "${VOICE_SKILL:?set VOICE_SKILL to the my-voice-clone skill folder}"

# 1. Voice script: one scene per paragraph
python3 - "$REEL_JSON" "$OUT/script.txt" <<'PY'
import json,sys
r=json.load(open(sys.argv[1])); open(sys.argv[2],"w").write("\n\n".join(s["voice"].strip() for s in r["scenes"])+"\n")
PY
~/.voice-clone-venv/bin/python "$VOICE_SKILL/scripts/speak.py" --script-file "$OUT/script.txt" --out "$OUT/voiceover.wav" --exaggeration 0.55

# 2. Timings and template inputs
cp "$REEL_JSON" "$T/public/reel.json"; cp "$OUT/voiceover.wav" "$T/public/voiceover.wav"
python3 "$HERE/make_timings.py" "$REEL_JSON" "$OUT/voiceover.wav.timings.json" "$T/public/timings.json"

# 3. Render, then compress to stay under ~3 MB for the Drive upload
cd "$T"; [ -d node_modules ] || npm install --no-audit --no-fund
npx remotion render src/index.jsx Reel "$OUT/reel_full.mp4" --codec=h264 --crf=20 ${CHROME:+--browser-executable="$CHROME"} --log=error
CRF=28
while :; do
  ffmpeg -loglevel error -y -i "$OUT/reel_full.mp4" -c:v libx264 -preset slow -crf $CRF -pix_fmt yuv420p -c:a aac -b:a 96k -movflags +faststart "$OUT/reel.mp4"
  [ "$(stat -c%s "$OUT/reel.mp4")" -lt 3000000 ] || [ $CRF -ge 34 ] && break; CRF=$((CRF+2))
done
echo "REEL=$OUT/reel.mp4 SIZE=$(stat -c%s "$OUT/reel.mp4") CRF=$CRF"
