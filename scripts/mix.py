"""Audio mix (parameterised by timeline.json):
BGM (user-supplied; offset / trim / loop) + synthesized SFX on cuts & turns -> <out.wav> 48 kHz stereo PCM_24,
music ducked under impacts/stamps, fade-out, integrated -14 LUFS, true peak <= -1.5 dBTP (4x-oversampled limiter).
No BGM -> SFX-only bed (still -14 LUFS). mix.sfx=false and no BGM -> a silent stereo track (so the mp4 always has audio).
usage: python mix.py <timeline.json> <out.wav>   (needs numpy scipy pyloudnorm soundfile — see requirements.txt)"""
import json, subprocess, sys, numpy as np, soundfile as sf
from scipy.signal import butter, sosfilt, fftconvolve, resample_poly
from scipy.ndimage import minimum_filter1d, uniform_filter1d
SR = 48000
T = json.load(open(sys.argv[1], encoding='utf8')); OUT = sys.argv[2]
M = {'lufs': -14.0, 'true_peak': -1.5, 'bgm_gain': .85, 'sfx': True, 'fade_out': 2.2}; M.update(T.get('mix') or {})
DUR = T['dur']; N = int(round(DUR * SR))
B = T.get('bgm') or {}
if B.get('path'):
    cmd = ['ffmpeg', '-v', 'error']
    if B.get('offset'): cmd += ['-ss', str(B['offset'])]
    raw = subprocess.run(cmd + ['-i', B['path'], '-f', 'f32le', '-ac', '2', '-ar', str(SR), '-'], capture_output=True, check=True).stdout
    bgm = np.frombuffer(raw, np.float32).reshape(-1, 2).copy()
    if len(bgm) < N and B.get('fit') == 'loop' and len(bgm):
        bgm = np.concatenate([bgm] * (N // len(bgm) + 1))
    bgm = np.pad(bgm, ((0, max(0, N - len(bgm))), (0, 0)))[:N] * B.get('gain', 1.0)
else:
    bgm = np.zeros((N, 2))
rng = np.random.default_rng(2026)
tt = lambda d: np.arange(int(d * SR)) / SR
def bp(x, lo, hi, o=2): return sosfilt(butter(o, [lo, hi], 'band', fs=SR, output='sos'), x)
def lp(x, f, o=2): return sosfilt(butter(o, f, 'low', fs=SR, output='sos'), x)
def nrm(x): return x / (np.max(np.abs(x)) + 1e-9)
IR = rng.standard_normal(int(2.2 * SR)) * np.exp(-np.arange(int(2.2 * SR)) / SR * 3.2); IR = lp(IR, 6000); IR /= np.sqrt(np.sum(IR ** 2))
def verb(x, wet=.35): y = fftconvolve(x, IR)[:len(x) + int(2.2 * SR)]; return np.pad(x, (0, len(y) - len(x))) * (1 - wet) + y * wet
def impact():
    t = tt(1.6); f = 38 + 70 * np.exp(-t * 18)
    sub = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t * 3.2); tr = bp(rng.standard_normal(len(t)), 120, 2500) * np.exp(-t * 40)
    return verb(nrm(sub + tr * .5), .3) * .55
def whoosh(d=.6):
    t = tt(d); n = rng.standard_normal(len(t)); env = np.sin(np.pi * np.clip(t / d, 0, 1)) ** 2 * (t / d) ** 1.5; y = np.zeros_like(t)
    for k, (lo, hi) in enumerate([(300, 900), (700, 2000), (1500, 4500), (3000, 8000)]): y += bp(n, lo, hi) * np.clip(1 - abs(t / d * 3 - k), 0, 1)
    return verb(nrm(y * env), .25) * .16
def chime(f0=698.46):
    t = tt(3.0); y = np.zeros_like(t)
    for r, a, tau in [(1, 1, 1.4), (2.0, .45, .8), (2.76, .3, .6), (1.5, .35, 1.1), (4.07, .15, .35)]: y += a * np.sin(2 * np.pi * f0 * r * t) * np.exp(-t / tau)
    return verb(nrm(y * np.minimum(1, t / .004)), .45) * .2
def tick():
    t = tt(.12); y = np.sin(2 * np.pi * 1760 * t) * np.exp(-t * 60) + bp(rng.standard_normal(len(t)), 2000, 7000) * np.exp(-t * 90) * .4
    return verb(nrm(y), .3) * .06
def stamp():
    t = tt(.5); f = 70 + 120 * np.exp(-t * 30); y = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t * 9) + bp(rng.standard_normal(len(t)), 400, 3000) * np.exp(-t * 50) * .6
    return verb(nrm(y), .25) * .32
GEN = {'bell': lambda: chime(1046.5) * 1.4, 'impact': impact, 'whoosh_in': whoosh, 'whoosh': whoosh, 'chime': chime, 'tick': tick, 'stamp': stamp}
fx = np.zeros((N + 4 * SR, 2)); ev = T['sfx'] if M['sfx'] else []
for i, e in enumerate(ev):
    if e['kind'] not in GEN: print('unknown sfx', e['kind']); continue
    x = GEN[e['kind']](); start = e['t'] - (.58 if e['kind'] == 'whoosh_in' else 0)
    s = int(max(0, start) * SR); pan = [.5, .35, .65, .45, .55][i % 5] if e['kind'] in ('whoosh_in', 'tick') else .5
    x = x[int(max(0, -start) * SR):]
    fx[s:s + len(x), 0] += x * np.sqrt(1 - pan) * 1.41; fx[s:s + len(x), 1] += x * np.sqrt(pan) * 1.41
fx = fx[:N]
duck = np.ones(N)
for e in ev:
    if e['kind'] in ('impact', 'stamp'):
        s = int(e['t'] * SR); L = int(.6 * SR); seg = 1 - .25 * np.exp(-np.arange(L) / SR * 6); n = max(0, min(L, N - s)); duck[s:s + n] = np.minimum(duck[s:s + n], seg[:n])
mix = bgm * duck[:, None] * M['bgm_gain'] + fx
fo = min(int(M['fade_out'] * SR), int(DUR * .2 * SR)); mix[-fo:] *= np.linspace(1, 0, fo)[:, None] ** 1.6; mix[:64] *= np.linspace(0, 1, 64)[:, None]
if np.max(np.abs(mix)) < 1e-6:
    sf.write(OUT, mix.astype(np.float32), SR, subtype='PCM_24'); print(f'silent track {DUR:.2f}s (no BGM, sfx off)'); sys.exit()
import pyloudnorm as pyln
meter = pyln.Meter(SR); TGT = M['lufs']
L0 = meter.integrated_loudness(mix); mix *= 10 ** ((TGT - L0) / 20)
CEIL = 10 ** (M['true_peak'] / 20)
def tp_env(x): up = resample_poly(x, 4, 1, axis=0); return np.max(np.abs(up), axis=1).reshape(-1, 4).max(1)[:len(x)]
for _ in range(3):
    need = np.minimum(1, CEIL / np.maximum(tp_env(mix), 1e-9)); la = int(.005 * SR)
    g = minimum_filter1d(need, size=2 * la + 1, mode='nearest'); rel = np.exp(-1 / (.08 * SR)); out = np.empty_like(g); cur = 1.0
    for i in range(len(g)):
        cur = g[i] if g[i] < cur else g[i] + (cur - g[i]) * rel; out[i] = cur
    mix *= uniform_filter1d(out, size=la, mode='nearest')[:, None]
    L1 = meter.integrated_loudness(mix); mix *= 10 ** ((TGT - L1) / 20) if L1 < TGT - .3 else 1
pk = tp_env(mix).max()
if pk > CEIL: mix *= CEIL / pk
L2 = meter.integrated_loudness(mix); tp = 20 * np.log10(tp_env(mix).max())
sf.write(OUT, mix.astype(np.float32), SR, subtype='PCM_24')
print(f'{"BGM" if B.get("path") else "SFX-only"} in {L0:.2f} LUFS -> out {L2:.2f} LUFS, true peak {tp:.2f} dBTP, {len(ev)} sfx, {DUR:.2f}s')
