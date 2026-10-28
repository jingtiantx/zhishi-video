"""Subset the style's fonts to the characters actually used (timeline + style/project JS) -> <build>/fonts/*.otf.
Fonts are NOT bundled. Each entry in style.json "fonts" lists candidate file names (+ TTC face index); the first one found wins:
  1. env var named by the entry (e.g. ZV_FONT_BOLD=/path/NotoSerifSC-Bold.otf[#index])
  2. ZV_FONT_DIR, <repo>/fonts/, then the usual system / user font folders (Linux, macOS, Windows)
Noto Serif SC / Noto Serif CJK (SIL Open Font License 1.1): https://github.com/notofonts/noto-cjk  (Source Han Serif works too).
usage: python make_fonts.py <style_dir> <build_dir>   (needs fontTools: pip install fonttools)
       python make_fonts.py --check <style_dir>       only report which font files would be used"""
import json, os, subprocess, sys, glob, shutil
CHECK = sys.argv[1] == '--check'
style_dir, build = (sys.argv[2], None) if CHECK else sys.argv[1:3]
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
ST = json.load(open(os.path.join(style_dir, 'style.json'), encoding='utf8'))
H = os.path.expanduser('~')
DIRS = [os.environ.get('ZV_FONT_DIR'), os.path.join(ROOT, 'fonts'), '/usr/share/fonts', '/usr/local/share/fonts', os.path.join(H, '.fonts'), os.path.join(H, '.local/share/fonts'),
        '/Library/Fonts', '/System/Library/Fonts', os.path.join(H, 'Library/Fonts'), 'C:/Windows/Fonts', os.path.join(os.environ.get('LOCALAPPDATA', ''), 'Microsoft/Windows/Fonts')]
_index = None
def index():
    global _index
    if _index is None:
        _index = {}
        for d in filter(None, DIRS):
            if not os.path.isdir(d): continue
            for r, _, fs in os.walk(d):
                for f in fs: _index.setdefault(f.lower(), os.path.join(r, f))
    return _index
def locate(f):
    if 'src' in f and os.path.exists(f['src']): return f['src'], f.get('index', 0)
    e = os.environ.get(f.get('env', ''), '')
    if e:
        path, _, i = e.partition('#')
        if os.path.exists(path): return path, int(i or (2 if path.lower().endswith('.ttc') else 0))
        sys.exit(f"{f['env']}={e} does not exist")
    for name, i in f.get('candidates', []):
        p = index().get(name.lower())
        if p: return p, i
    sys.exit(f"font for {f['out']} not found. Install Noto Serif CJK / Noto Serif SC (OFL, https://github.com/notofonts/noto-cjk), "
             f"put the file in {os.path.join(ROOT, 'fonts')}/, or set {f.get('env', 'ZV_FONT_DIR')}=/path/to/font. Looked for: " + ', '.join(n for n, _ in f.get('candidates', [])))
if CHECK:
    for f in ST['fonts']: p, i = locate(f); print(f"ok   font {f['out']} <- {p}")
    sys.exit(0)
s = ''.join(open(f, encoding='utf8').read() for f in [os.path.join(build, 'timeline.json')] + glob.glob(os.path.join(build, '*.js')))
chars = set(c for c in s if ord(c) > 127) | set(chr(i) for i in range(32, 127)) | set('？✓·｜“”：，。、！')
os.makedirs(os.path.join(build, 'fonts'), exist_ok=True)
open(os.path.join(build, 'fonts/chars.txt'), 'w', encoding='utf8').write(''.join(sorted(chars)))
sub = [shutil.which('pyftsubset')] if shutil.which('pyftsubset') else [sys.executable, '-m', 'fontTools.subset']
for f in ST['fonts']:
    src, i = locate(f); out = os.path.join(build, 'fonts', f['out'])
    cmd = sub + [src, '--text-file=' + os.path.join(build, 'fonts/chars.txt'), '--output-file=' + out, '--layout-features=*']
    if src.lower().endswith(('.ttc', '.otc')): cmd.append(f'--font-number={i}')
    subprocess.run(cmd, check=True); print(f"{f['out']} <- {src}" + (f' #{i}' if src.lower().endswith('.ttc') else ''))
print(len(chars), 'chars subset')
