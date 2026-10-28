"""BGM analysis:
tempo, beat grid (linear fit), downbeat phase (bar lines), per-bar RMS + chroma novelty.
usage: python analyze_bgm.py <bgm.(mp3|wav|m4a)> <out.json> [--offset SEC] [-v]"""
import json, sys, argparse, numpy as np, librosa
ap = argparse.ArgumentParser(); ap.add_argument('bgm'); ap.add_argument('out'); ap.add_argument('--offset', type=float, default=0.0); ap.add_argument('-v', action='store_true')
a = ap.parse_args()
y, sr = librosa.load(a.bgm, sr=22050, mono=True, offset=a.offset)
dur = len(y) / sr
oenv = librosa.onset.onset_strength(y=y, sr=sr)
tempo, beats = librosa.beat.beat_track(onset_envelope=oenv, sr=sr, units='time')
tempo = float(np.atleast_1d(tempo)[0]); beats = np.array(beats)
if len(beats) < 8:   # ambient / beatless track: fall back to a 120 BPM virtual grid
    beats = np.arange(0, dur, 0.5)
idx = np.arange(len(beats)); p = np.polyfit(idx, beats, 1); period = float(p[0]); bpm = 60 / period
S = np.abs(librosa.stft(y)); low = librosa.onset.onset_strength(S=librosa.amplitude_to_db(S[:40]), sr=sr)
times = librosa.times_like(low, sr=sr)
def strength(ts, env): v = [env[np.argmin(abs(times - t))] for t in ts if t < dur]; return float(np.mean(v)) if v else 0.0
grid = p[1] + period * np.arange(-4, int(dur / period) + 4); grid = grid[(grid >= -0.01)]
scores = [strength(grid[k::4], low) for k in range(4)]; ph = int(np.argmax(scores)); bars = grid[ph::4]
rms = librosa.feature.rms(y=y)[0]; rt = librosa.times_like(rms, sr=sr)
bar_rms = [float(np.mean(rms[(rt >= b) & (rt < b + 4 * period)])) for b in bars if b < dur]
oo = librosa.onset.onset_detect(onset_envelope=oenv, sr=sr, units='time'); first_onset = float(oo[0]) if len(oo) else 0.0
out = dict(file=a.bgm, offset=a.offset, dur=dur, librosa_tempo=tempo, bpm=bpm, beat_period=period, first_beat=float(beats[0]), grid_offset=float(p[1]),
           first_onset=first_onset, downbeat_phase=ph, bars=[float(b) for b in bars if b < dur], bar_rms=bar_rms, beats=[float(b) for b in beats])
json.dump(out, open(a.out, 'w'), indent=1)
print('bgm %.2fs  fit %.2f BPM  beat %.4fs  bar %.4fs  first bar %.3fs' % (dur, bpm, period, 4 * period, out['bars'][0] if out['bars'] else 0))
if a.v:
    for i, (b, r) in enumerate(zip(bars, bar_rms)): print('bar %3d %7.3f rms %.3f %s' % (i, b, r, '#' * int(r * 200)))
