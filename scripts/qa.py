"""QA gate for one built orientation. Hard failures exit 1; warnings are printed and saved.
checks: resolution / fps / codec / pix_fmt / duration vs timeline, audio stream present (AAC 48 kHz stereo), loudness (ebur128: I ≈ -14 LUFS, TP ≤ -1 dBTP),
forbidden text (style + project forbidden_text lists) in every text artefact, front_blocklist words in title/hook/cover/first line, reading speed,
duration vs target, cover sizes, frame extraction (one per shot + last) -> contact sheet, black-frame check.
usage: python3 qa.py <timeline.json> <video.mp4> <build_dir> <qa_dir> [cover.png ...]"""
import json, os, re, subprocess, sys, glob
tl, mp4, build, qd = sys.argv[1:5]; covers = sys.argv[5:]
T = json.load(open(tl, encoding='utf8')); os.makedirs(qd, exist_ok=True)
HARD, WARN, INFO = [], list(T.get('warnings', [])), {}
pr = json.loads(subprocess.run(['ffprobe', '-v', 'error', '-show_streams', '-show_format', '-of', 'json', mp4], capture_output=True, text=True, check=True).stdout)
v = [s for s in pr['streams'] if s['codec_type'] == 'video']; a = [s for s in pr['streams'] if s['codec_type'] == 'audio']
if not v: HARD.append('no video stream')
else:
    v = v[0]; fr = eval(v['avg_frame_rate']) if '/' in v['avg_frame_rate'] else float(v['avg_frame_rate'])
    INFO['video'] = f"{v['codec_name']} {v['width']}x{v['height']} {fr:.2f}fps {v.get('pix_fmt')}"
    if (v['width'], v['height']) != (T['W'], T['H']): HARD.append(f"resolution {v['width']}x{v['height']} != {T['W']}x{T['H']}")
    if abs(fr - T['fps']) > .01: HARD.append(f'fps {fr}')
    if v.get('pix_fmt') != 'yuv420p': HARD.append(f"pix_fmt {v.get('pix_fmt')}")
d = float(pr['format']['duration']); INFO['duration'] = round(d, 3)
if abs(d - T['dur']) > .2: HARD.append(f"duration {d:.2f}s != timeline {T['dur']:.2f}s")
if T.get('target_duration'):
    INFO['target'] = T['target_duration']
    if abs(d - T['target_duration']) > max(3, .15 * T['target_duration']): WARN.append(f"duration {d:.1f}s vs target {T['target_duration']}s (length follows the script)")
if not a: HARD.append('no audio stream')
else:
    a = a[0]; INFO['audio'] = f"{a['codec_name']} {a['sample_rate']}Hz {a['channels']}ch"
    if a['channels'] != 2 or a['sample_rate'] != '48000': WARN.append('audio not 48 kHz stereo: ' + INFO['audio'])
    e = subprocess.run(['ffmpeg', '-hide_banner', '-nostats', '-i', mp4, '-map', '0:a', '-af', 'ebur128=peak=true', '-f', 'null', '-'], capture_output=True, text=True).stderr
    I = re.findall(r'I:\s+(-?[\d.]+|-inf) LUFS', e); P = re.findall(r'Peak:\s+(-?[\d.]+|-inf) dBFS', e)
    if I:
        li = float(I[-1]) if I[-1] != '-inf' else -99; INFO['loudness_LUFS'] = li
        if P: INFO['true_peak_dBTP'] = float(P[-1]) if P[-1] != '-inf' else -99
        if li < -70: WARN.append('audio track is silent (no BGM supplied?)')
        elif abs(li + 14) > 1.0: WARN.append(f'loudness {li} LUFS (target -14)')
        if INFO.get('true_peak_dBTP', -99) > -1.0: WARN.append(f"true peak {INFO['true_peak_dBTP']} dBTP > -1")
# forbidden text — every text artefact that can reach the screen or the upload
FORB = [f for f in T.get('forbidden', []) if f]
files = [tl] + glob.glob(os.path.join(build, '*.js')) + glob.glob(os.path.join(build, '*.html')) + glob.glob(os.path.join(os.path.dirname(mp4), '*.srt'))
for f in files:
    if f == tl: s = json.dumps({k: v for k, v in T.items() if k != 'forbidden'}, ensure_ascii=False).lower()   # the list itself isn't content
    else: s = open(f, encoding='utf8', errors='ignore').read().lower()
    for w in FORB:
        if w.lower() in s: HARD.append(f'forbidden text "{w}" in {os.path.basename(f)}')
# optional: words to keep out of the front (title / hook / cover / first line) — project.json "front_blocklist"
first = T['cues'][0]['srt'] if T['cues'] else ''
front = ' '.join([T.get('title', ''), T.get('hook', ''), first, json.dumps(T.get('cover', {}), ensure_ascii=False)]).lower()
for w in T.get('front_blocklist', []):
    if w and w.lower() in front: WARN.append(f'"{w}" appears in title / hook / cover / first line (front_blocklist)')
fast = [c for c in T['cues'] if c['rate'] > 4.6]
for c in fast: WARN.append(f"reading speed {c['rate']} 字/s at {c['t0']}s: {c['srt']}")
# covers
try:
    from PIL import Image, ImageStat
    EXP = {'3x4': (1080, 1440), '4x3': (1440, 1080), '9x16': (1080, 1920)}
    for c in covers:
        k = re.search(r'cover_(\w+)\.png', c).group(1); sz = Image.open(c).size; INFO['cover_' + k] = '%dx%d' % sz
        if sz != EXP.get(k, sz): HARD.append(f'cover {k} is {sz}')
except ImportError: Image = None
# frames: one per shot (60 % in, after the crossfade) + 1 s before the end
fd = os.path.join(qd, 'frames'); os.makedirs(fd, exist_ok=True); [os.remove(f) for f in glob.glob(fd + '/*.jpg')]
ts = [round(s['t0'] + .6 * (s['t1'] - s['t0']), 2) for s in T['shots']] + [round(max(0, T['dur'] - 1), 2)]
outs = []
for t in ts:
    o = os.path.join(fd, f't_{t:07.2f}.jpg'); subprocess.run(['ffmpeg', '-v', 'error', '-y', '-ss', str(t), '-i', mp4, '-frames:v', '1', '-q:v', '3', o], check=True); outs.append(o)
if Image:
    for o in outs[:-1]:
        m = ImageStat.Stat(Image.open(o).convert('L')).mean[0]
        if m < 4: WARN.append(f'near-black frame {os.path.basename(o)} (mean {m:.1f})')
sheet = os.path.join(qd, 'contact.jpg')
subprocess.run([sys.executable, os.path.join(os.path.dirname(__file__), 'sheet.py'), sheet, '4' if T['W'] > T['H'] else '6'] + outs, check=False, capture_output=True)
rep = dict(ok=not HARD, hard=HARD, warnings=WARN, info=INFO, frames=outs, contact_sheet=sheet)
json.dump(rep, open(os.path.join(qd, 'report.json'), 'w', encoding='utf8'), ensure_ascii=False, indent=1)
print('QA', 'PASS' if not HARD else 'FAIL', json.dumps(INFO, ensure_ascii=False))
for h in HARD: print('  HARD:', h)
for w in WARN: print('  warn:', w)
print('  contact sheet:', sheet)
sys.exit(1 if HARD else 0)
