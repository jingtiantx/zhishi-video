"""project.json (+ bgm_analysis.json) -> timeline.json + STORYBOARD.md — the single source of truth for render, mix, srt and QA.
Cues get a reading-speed duration, cuts snap to the BGM bar grid,
intra-shot lines snap to beats, SFX are placed on cuts/turns. Length follows the script; target_duration only stretches pacing.
usage: python3 make_timeline.py <project_dir> <style_dir> <build_dir> <orientation> [bgm_analysis.json]"""
import json, math, os, re, sys
proj_dir, style_dir, build, orient = sys.argv[1:5]
ana = json.load(open(sys.argv[5])) if len(sys.argv) > 5 and os.path.exists(sys.argv[5]) else None
PJ = json.load(open(os.path.join(proj_dir, 'project.json'), encoding='utf8'))
ST = json.load(open(os.path.join(style_dir, 'style.json'), encoding='utf8'))
TM = dict(ST.get('timing', {})); TM.update(PJ.get('timing', {}))
RATE, MINL, BIGX, TAIL = TM.get('rate', 3.8), TM.get('min_line', 1.8), TM.get('big_extra', .8), TM.get('tail', 2.0)
SNAP = PJ.get('snap', TM.get('snap', 'bar'))
fps = PJ.get('fps', ST.get('fps', 30)); W, H = ST['sizes'][orient]
# ── forbidden text: hard fail before anything is rendered
FORBID = ST.get('forbidden_text', []) + PJ.get('forbidden_text', [])
blob = json.dumps({k: v for k, v in PJ.items() if k not in ('forbidden_text', 'front_blocklist')}, ensure_ascii=False)
for f in FORBID:
    if f and f.lower() in blob.lower(): sys.exit(f'FORBIDDEN TEXT "{f}" found in project.json — remove it (listed in forbidden_text).')
# ── beat grid
if ana:
    P = ana['beat_period']; OFF = ana['bars'][0] if ana['bars'] else ana['first_beat']; B0 = ana['first_beat']
else:
    P, OFF, B0 = 60 / PJ.get('virtual_bpm', 112), 0.0, 0.0
BAR = 4 * P
def snap(x, unit):
    if x <= 0.001: return 0.0
    if SNAP == 'none' or unit == 'none': return round(math.ceil(x * 10 - .5) / 10, 3)
    step = BAR if (unit == 'bar' and SNAP == 'bar') else P
    k = math.ceil((x - OFF) / step - 0.04)            # 4 % tolerance so a hair over doesn't cost a whole bar
    return round(max(0.0, OFF + k * step), 3)
plain = lambda s: s.replace('/', '').replace('[', '').replace(']', '')
units = lambda s: len(re.findall(r'[\u4e00-\u9fff]', s)) + len(re.findall(r'[A-Za-z0-9]+', s))
DEFAULT_STYLE = {'big_text': 'center', 'dawn': 'center'}
KNOWN = {'scene', 'lines', 'accent', 'min', 'params', 'hide_hook', 'note'}
def norm_lines(sc):
    out = []
    for i, l in enumerate(sc.get('lines', [])):
        l = {'text': l} if isinstance(l, str) else dict(l)
        if 'style' not in l:
            l['style'] = 'big' if (sc['scene'] == 'hook' and i == 0) else DEFAULT_STYLE.get(sc['scene'], 'band')
        out.append(l)
    return out
SC = PJ['scenes']; LINES = [norm_lines(s) for s in SC]
def need(l, k): return l.get('hold') or (max(MINL, units(l['text']) / RATE) + (BIGX if l['style'] != 'band' else 0)) * k
def build_tl(k):
    t, shots, cues = 0.0, [], []
    for i, (sc, ls) in enumerate(zip(SC, LINES)):
        t0 = snap(t, 'bar'); cur = t0; mine = []
        for j, l in enumerate(ls):
            c0 = cur if j == 0 else snap(cur, 'beat'); e = c0 + need(l, k)
            mine.append([c0, e, l]); cur = e
        if i == len(SC) - 1: cur += TAIL
        t1 = snap(max(cur, t0 + sc.get('min', 3.0 if sc['scene'] == 'title' else 2.0) * k), 'bar')
        if mine: mine[-1][1] = t1
        for j in range(len(mine) - 1): mine[j][1] = mine[j + 1][0]
        params = dict(sc.get('params', {})); params.update({kk: v for kk, v in sc.items() if kk not in KNOWN})
        shots.append(dict(id=i + 1, scene=sc['scene'], t0=t0, t1=t1, params=params, hide_hook=bool(sc.get('hide_hook')), accent=sc.get('accent')))
        for c0, c1, l in mine:
            n = units(l['text'])
            cues.append(dict(shot=i + 1, t0=round(c0, 3), t1=round(c1, 3), text=l['text'], style=l['style'], srt=plain(l['text']), units=n, rate=round(n / max(.01, c1 - c0), 2), stamp=bool(l.get('stamp'))))
        t = t1
    return shots, cues, t
shots, cues, dur = build_tl(1.0)
natural = dur; target = PJ.get('target_duration'); stretch = 1.0; warn = []
if target and target > natural * 1.03:
    best = (abs(dur - target), 1.0, shots, cues, dur); k = 1.0
    while k < 1.6:                                     # snapping makes dur a step function of k: keep the closest fit
        k = round(k + .025, 3); r = build_tl(k)
        if abs(r[2] - target) < best[0]: best = (abs(r[2] - target), k, *r)
        if r[2] > target * 1.1: break
    _, stretch, shots, cues, dur = best
if target and natural > target * 1.15:
    warn.append(f'script needs {natural:.1f}s but target is {target}s — length follows the script; trim lines if the target matters')
bgm = PJ.get('bgm') or None
if isinstance(bgm, str): bgm = {'path': bgm}
if bgm and bgm.get('path') and not os.path.isabs(bgm['path']): bgm['path'] = os.path.normpath(os.path.join(proj_dir, bgm['path']))
if bgm and bgm.get('path') and not os.path.exists(bgm['path']) and bgm.get('optional'): bgm = None
if ana and bgm and ana['dur'] + .05 < dur and bgm.get('fit', 'trim') == 'trim':
    warn.append(f'BGM is {ana["dur"]:.1f}s but the film needs {dur:.1f}s — set bgm.fit to "loop" or pick a longer track')
# ── SFX on cuts and turns (white-bear grammar)
ACC = ST.get('accents', {}); sfx = []
for s in shots:
    acc = s.pop('accent') or (ST.get('first_shot_accent') if s['id'] == 1 else ACC.get(s['scene']))
    if s['id'] > 1: sfx.append(dict(t=s['t0'], kind='whoosh_in'))
    if acc and acc != 'none': sfx.append(dict(t=s['t0'], kind=acc))
starts = {s['t0'] for s in shots}
for c in cues:
    if c['t0'] not in starts: sfx.append(dict(t=c['t0'], kind='tick'))
    if c['stamp']: sfx.append(dict(t=c['t0'] + .45, kind='stamp'))
T = dict(dur=round(dur, 3), fps=fps, orientation=orient, W=W, H=H, style=ST['name'], bpm=round(60 / P, 3), beat=P, bar=BAR, first_beat=B0, bar0=OFF,
         target_duration=target, natural_duration=round(natural, 2), stretch=round(stretch, 3),
         hook=PJ.get('hook', ''), title=PJ.get('title', ''), cover=PJ.get('cover', {}), bgm=bgm, mix=PJ.get('mix', {}),
         forbidden=FORBID, front_blocklist=PJ.get('front_blocklist', []), shots=shots, cues=cues, sfx=sorted(sfx, key=lambda e: e['t']), warnings=warn)
os.makedirs(build, exist_ok=True)
json.dump(T, open(os.path.join(build, 'timeline.json'), 'w', encoding='utf8'), ensure_ascii=False, indent=1)
# storyboard (human-readable, next to the outputs)
sb = [f"# {PJ.get('title','')} — 分镜（STORYBOARD, auto）", '', f"{W}×{H} · {fps} fps · {T['dur']:.2f}s（文案自然长度 {natural:.1f}s，目标 {target or '跟随文案'}，拉伸 ×{stretch:.2f}） · 网格 {T['bpm']:.1f} BPM，snap={SNAP}", '',
      '| # | 时间 | 场景 | 参数 | 字幕 | 音效 |', '|---|---|---|---|---|---|']
for s in shots:
    cs = ' <br> '.join(f"[{c['style']}] {c['srt']}" for c in cues if c['shot'] == s['id'])
    fx = ', '.join(f"{e['kind']}@{e['t']:.1f}s" for e in T['sfx'] if s['t0'] <= e['t'] < s['t1'])
    sb.append(f"| {s['id']} | {s['t0']:.2f}–{s['t1']:.2f}s | {s['scene']} | {json.dumps(s['params'], ensure_ascii=False)[:80]} | {cs} | {fx} |")
if warn: sb += ['', '## 警告'] + [f'- {w}' for w in warn]
open(os.path.join(build, 'STORYBOARD.md'), 'w', encoding='utf8').write('\n'.join(sb) + '\n')
for c in cues: print('%6.2f-%6.2f %4.1fs %5.2f u/s [%s] %s' % (c['t0'], c['t1'], c['t1'] - c['t0'], c['rate'], c['style'], c['srt']))
print(f"dur {T['dur']}s (natural {natural:.2f}s, stretch {stretch:.2f}) shots {len(shots)} cues {len(cues)} sfx {len(sfx)}")
for w in warn: print('WARNING:', w)
