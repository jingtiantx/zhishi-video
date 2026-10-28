#!/usr/bin/env python3
"""zhishi-video driver (stdlib only; heavy audio steps run under $ZV_PY).
  zv.py styles                                   list installed styles
  zv.py new <dir> --topic T --angle A [--duration 60] [--bgm path] [--orientation landscape|portrait] [--style zhishi-dashang]
  zv.py timeline <dir> [-o landscape|portrait|both]          timeline.json + STORYBOARD.md only (fast; check pacing first)
  zv.py stills <dir> [-o ...] [--times t1 t2 ...]            preview frames + contact sheet (default: one per shot)
  zv.py build <dir> [-o ...] [--workers N] [--out DIR] [--no-covers]   full film: frames -> mix -> mp4 -> srt -> covers -> QA
  zv.py covers <dir> [-o ...] [--out DIR]
  zv.py qa <dir> [-o ...] [--out DIR]
  zv.py lint <dir>                                optional: run an external AI-tell linter over the script (set ZV_LINTER)
Outputs: <dir>/build_<orient>/ (served page + frames + mix) and deliverables in --out (default <dir>/out/)."""
import argparse, json, os, shutil, subprocess, sys, time, glob
HERE = os.path.dirname(os.path.abspath(__file__)); SKILL = os.path.dirname(HERE); STYLES = os.path.join(SKILL, 'styles')
_VENV = os.path.join(SKILL, '.venv', 'bin', 'python')
PY = os.environ.get('ZV_PY') or (_VENV if os.path.exists(_VENV) else sys.executable)   # python with requirements.txt installed
# optional linter, e.g. ai_tell_linter.py from https://github.com/liuhaisi2026212-maker/taishang-laojun (not bundled)
LINTER = os.environ.get('ZV_LINTER', '')
def run(*cmd, **kw):
    print('$', ' '.join(map(str, cmd))[:220], flush=True); return subprocess.run(list(map(str, cmd)), check=True, **kw)
def load(d): return json.load(open(os.path.join(d, 'project.json'), encoding='utf8'))
def orients(P, o): o = o or P.get('orientation', 'landscape'); return ['landscape', 'portrait'] if o == 'both' else [o]
def style_dir(P):
    s = os.path.join(STYLES, P.get('style', 'zhishi-dashang'))
    if not os.path.exists(os.path.join(s, 'style.json')): sys.exit(f'style not found: {s}')
    return s
def slug(P): return P.get('slug') or 'film'
def prepare(d, P, o):
    """copy style files + project extensions into build_<o>/, analyse BGM, build timeline, subset fonts"""
    sd = style_dir(P); ST = json.load(open(os.path.join(sd, 'style.json'), encoding='utf8')); b = os.path.join(d, 'build_' + o); os.makedirs(b, exist_ok=True)
    for f in ST['files']: shutil.copy(os.path.join(sd, f), b)
    ext = os.path.join(d, P.get('motifs', 'motifs.js'))
    if os.path.exists(ext): shutil.copy(ext, os.path.join(b, 'motifs.js'))
    else: open(os.path.join(b, 'motifs.js'), 'w').write('// no project extensions\n')
    ana = os.path.join(b, 'bgm_analysis.json'); bgm = P.get('bgm'); bgm = bgm.get('path') if isinstance(bgm, dict) else bgm
    if bgm:
        bp = bgm if os.path.isabs(bgm) else os.path.join(d, bgm)
        if not os.path.exists(bp):
            if isinstance(P['bgm'], dict) and P['bgm'].get('optional'): print(f'WARNING: optional BGM not found ({bp}) — rendering with an SFX-only track'); bgm = None
            else: sys.exit(f'BGM not found: {bp}')
    if bgm:
        off = P['bgm'].get('offset', 0) if isinstance(P['bgm'], dict) else 0
        if not os.path.exists(ana) or os.path.getmtime(ana) < os.path.getmtime(bp): run(PY, os.path.join(HERE, 'analyze_bgm.py'), bp, ana, '--offset', off)
    elif os.path.exists(ana): os.remove(ana)
    run(sys.executable, os.path.join(HERE, 'make_timeline.py'), d, sd, b, o, ana)
    run(PY, os.path.join(HERE, 'make_fonts.py'), sd, b)
    return b, sd, ST
def outdir(d, a): o = a.out or os.path.join(d, 'out'); os.makedirs(o, exist_ok=True); return o
def covers(d, P, o, b, ST, od):
    kinds = P.get('covers') or ST['covers'][o]
    run('node', os.path.join(HERE, 'covers.mjs'), b, od, f'{slug(P)}_{o}_', *kinds)
    return [os.path.join(od, f'{slug(P)}_{o}_cover_{k}.png') for k in kinds]
def cmd_new(a):
    d = a.dir; os.makedirs(d, exist_ok=True)
    if os.path.exists(os.path.join(d, 'project.json')): sys.exit('project.json exists')
    P = {"slug": os.path.basename(os.path.abspath(d)), "style": a.style, "topic": a.topic, "angle": a.angle, "orientation": a.orientation,
         "target_duration": a.duration, "bgm": ({"path": a.bgm, "offset": 0, "fit": "trim"} if a.bgm else None), "snap": "bar" if a.bgm else "beat",
         "forbidden_text": [], "front_blocklist": [], "title": a.topic, "hook": "TODO 顶部钩子：一句「看完能用上」的问题", "covers": None,
         "cover": {"badge": "TODO 4–8 字反常识标签", "title": a.topic, "en": "TODO ENGLISH NAME · YEAR", "q1": "TODO 问题第一行", "q2": "TODO [金色]第二行？", "caption": "TODO 一句话钩子", "motif": "glyph", "glyph": "？"},
         "scenes": [
            {"scene": "hook", "motif": "figure", "lines": [{"text": "TODO 第一句：你身上正在发生的事", "style": "big"}, "TODO 把[关键词]标金"]},
            {"scene": "title", "title": a.topic, "en": "TODO ENGLISH", "tagline": "TODO 一句话定义（出自资料）", "lines": [{"text": "TODO", "style": "none"}]},
            {"scene": "compare", "left": {"label": "你以为", "text": "TODO 常见理解"}, "right": {"label": "其实", "text": "TODO [反转]"}, "lines": ["TODO 常见理解", "TODO 反转"]},
            {"scene": "steps", "items": ["TODO 用法一", "TODO 用法二", "TODO 用法三"], "lines": ["TODO 怎么用"]},
            {"scene": "dawn", "lines": ["TODO 收尾第一行", "TODO [金句]"]}]}
    json.dump(P, open(os.path.join(d, 'project.json'), 'w', encoding='utf8'), ensure_ascii=False, indent=1)
    open(os.path.join(d, 'SOURCES.md'), 'w', encoding='utf8').write(f"# {a.topic} — 资料与事实核对\n\n故事角度：{a.angle}\n\n| # | 画面里的说法 | 出处（作者 年份 标题 DOI/链接） | 原文 / 大意 | 状态 |\n|---|---|---|---|---|\n| 1 | TODO | TODO | 原文 / 大意 | 待核实 |\n\n规则：只用这里列出的事实；转述的引文标「大意」；查不到的写「待核实」并在交付时提出。\n")
    open(os.path.join(d, 'script.txt'), 'w', encoding='utf8').write('# 逐字稿：每行一句字幕（与 project.json scenes[].lines 一致）。跑 zv.py lint 检查 AI 味。\n')
    print('scaffolded', d, '— fill SOURCES.md first, then the script, then project.json scenes')
def cmd_timeline(a):
    P = load(a.dir)
    for o in orients(P, a.orientation): prepare(a.dir, P, o); print(open(os.path.join(a.dir, 'build_' + o, 'STORYBOARD.md'), encoding='utf8').read())
def cmd_stills(a):
    P = load(a.dir)
    for o in orients(P, a.orientation):
        b, sd, ST = prepare(a.dir, P, o); T = json.load(open(os.path.join(b, 'timeline.json'), encoding='utf8'))
        ts = a.times or [round(s['t0'] + .6 * (s['t1'] - s['t0']), 2) for s in T['shots']]
        sdir = os.path.join(b, 'stills'); shutil.rmtree(sdir, ignore_errors=True)
        run('node', os.path.join(HERE, 'render.mjs'), b, 'stills', sdir, *ts)
        run(sys.executable, os.path.join(HERE, 'sheet.py'), os.path.join(b, 'stills_sheet.jpg'), 4 if o == 'landscape' else 6, *sorted(glob.glob(sdir + '/*.jpg'), key=lambda f: float(f.split('t_')[1][:-4])))
def cmd_build(a):
    P = load(a.dir); od = outdir(a.dir, a); res = {}
    for o in orients(P, a.orientation):
        t0 = time.time(); b, sd, ST = prepare(a.dir, P, o); fr = os.path.join(b, 'frames')
        if a.clean: shutil.rmtree(fr, ignore_errors=True)
        run('node', os.path.join(HERE, 'render.mjs'), b, 'frames', fr, a.workers)
        run(PY, os.path.join(HERE, 'mix.py'), os.path.join(b, 'timeline.json'), os.path.join(b, 'mix.wav'))
        mp4 = os.path.join(od, f'{slug(P)}_{o}.mp4')
        run('sh', os.path.join(HERE, 'mux.sh'), fr, os.path.join(b, 'mix.wav'), mp4, P.get('fps', 30))
        run(sys.executable, os.path.join(HERE, 'make_srt.py'), os.path.join(b, 'timeline.json'), mp4[:-4] + '.srt')
        shutil.copy(os.path.join(b, 'STORYBOARD.md'), os.path.join(od, f'{slug(P)}_{o}_STORYBOARD.md'))
        cv = [] if a.no_covers else covers(a.dir, P, o, b, ST, od)
        q = subprocess.run([sys.executable, os.path.join(HERE, 'qa.py'), os.path.join(b, 'timeline.json'), mp4, b, os.path.join(od, f'qa_{o}')] + cv)
        res[o] = dict(mp4=mp4, qa='PASS' if q.returncode == 0 else 'FAIL', secs=round(time.time() - t0))
    print(json.dumps(res, ensure_ascii=False, indent=1))
    if any(r['qa'] != 'PASS' for r in res.values()): sys.exit(1)
def cmd_covers(a):
    P = load(a.dir); od = outdir(a.dir, a)
    for o in orients(P, a.orientation): b, sd, ST = prepare(a.dir, P, o); covers(a.dir, P, o, b, ST, od)
def cmd_qa(a):
    P = load(a.dir); od = outdir(a.dir, a)
    for o in orients(P, a.orientation):
        b = os.path.join(a.dir, 'build_' + o); cv = sorted(glob.glob(os.path.join(od, f'{slug(P)}_{o}_cover_*.png')))
        subprocess.run([sys.executable, os.path.join(HERE, 'qa.py'), os.path.join(b, 'timeline.json'), os.path.join(od, f'{slug(P)}_{o}.mp4'), b, os.path.join(od, f'qa_{o}')] + cv)
def cmd_lint(a):
    P = load(a.dir); txt = os.path.join(a.dir, '.lint_script.txt')
    lines = [P.get('hook', ''), P.get('title', '')] + [l if isinstance(l, str) else l['text'] for s in P['scenes'] for l in s.get('lines', [])]
    open(txt, 'w', encoding='utf8').write('\n'.join(x.replace('/', '').replace('[', '').replace(']', '') for x in lines if x))
    if not LINTER or not os.path.exists(LINTER): sys.exit('no linter configured — set ZV_LINTER=/path/to/ai_tell_linter.py (optional, see README)')
    allow = os.path.join(a.dir, 'lint_allow.txt'); extra = ['--allow', allow] if os.path.exists(allow) else []
    subprocess.run([sys.executable, LINTER, txt] + extra)
def cmd_styles(a):
    for s in sorted(os.listdir(STYLES)):
        f = os.path.join(STYLES, s, 'style.json')
        if os.path.exists(f) and not s.startswith('_'): j = json.load(open(f, encoding='utf8')); print(f"{s:18s} {j.get('display','')}  — {j.get('summary','')}")
ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter); sp = ap.add_subparsers(dest='cmd', required=True)
p = sp.add_parser('styles'); p.set_defaults(f=cmd_styles)
p = sp.add_parser('new'); p.add_argument('dir'); p.add_argument('--topic', required=True); p.add_argument('--angle', required=True); p.add_argument('--duration', type=float, default=60)
p.add_argument('--bgm'); p.add_argument('--orientation', default='landscape', choices=['landscape', 'portrait', 'both']); p.add_argument('--style', default='zhishi-dashang'); p.set_defaults(f=cmd_new)
for n, f in [('timeline', cmd_timeline), ('stills', cmd_stills), ('build', cmd_build), ('covers', cmd_covers), ('qa', cmd_qa), ('lint', cmd_lint)]:
    p = sp.add_parser(n); p.add_argument('dir'); p.add_argument('-o', '--orientation', choices=['landscape', 'portrait', 'both']); p.add_argument('--out')
    p.add_argument('--workers', type=int, default=min(6, max(1, (os.cpu_count() or 4) - 2))); p.add_argument('--times', nargs='*', type=float); p.add_argument('--no-covers', action='store_true'); p.add_argument('--clean', action='store_true', default=True)
    p.set_defaults(f=f)
a = ap.parse_args(); a.f(a)
