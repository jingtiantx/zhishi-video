#!/bin/sh
# Environment check for the zhishi-video pipeline (no network). Run from anywhere.
ROOT=$(cd "$(dirname "$0")/.." && pwd); ok=1
for b in node ffmpeg ffprobe; do command -v $b >/dev/null 2>&1 && echo "ok   $b" || { echo "MISS $b"; ok=0; }; done
if [ -n "$ZV_PY" ]; then PY=$ZV_PY; elif [ -x "$ROOT/.venv/bin/python" ]; then PY=$ROOT/.venv/bin/python; else PY=python3; fi
$PY -c "import numpy, scipy, librosa, pyloudnorm, soundfile, PIL, fontTools" 2>/dev/null && echo "ok   python deps ($PY)" || { echo "MISS python deps in $PY — pip install -r requirements.txt (or set ZV_PY)"; ok=0; }
(cd "$ROOT" && node -e "
const {createRequire}=require('module'),path=require('path');
for(const p of [process.env.ZV_PLAYWRIGHT_FROM,path.join(process.cwd(),'package.json')].filter(Boolean)){
  for(const m of ['playwright-core','playwright']){try{const c=createRequire(p)(m).chromium;const e=process.env.ZV_CHROMIUM||c.executablePath();
    if(!require('fs').existsSync(e)){console.log('MISS chromium binary ('+e+') — npx playwright-core install chromium, or set ZV_CHROMIUM');process.exit(1)}
    console.log('ok   '+m+' via '+p+'\nok   chromium '+e);process.exit(0)}catch(e){}}}
console.log('MISS playwright-core — npm install (or set ZV_PLAYWRIGHT_FROM)');process.exit(1)") || ok=0
$PY "$ROOT/scripts/make_fonts.py" --check "$ROOT/styles/zhishi-dashang" || ok=0
[ $ok = 1 ] && echo "environment OK" || { echo "environment incomplete — see README 'Requirements'"; exit 1; }
