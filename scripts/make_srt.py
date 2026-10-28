"""timeline.json cues -> .srt (script text verbatim; formatting marks removed). usage: python3 make_srt.py <timeline.json> <out.srt>"""
import json, sys
T = json.load(open(sys.argv[1], encoding='utf8'))
f = lambda t: '%02d:%02d:%02d,%03d' % (t // 3600, t % 3600 // 60, int(t % 60), round((t - int(t)) * 1000) % 1000)
out = []
for i, c in enumerate(T['cues'], 1):
    t1 = min(c['t1'], T['dur']) - (0.05 if i < len(T['cues']) else 0)
    out.append(f"{i}\n{f(c['t0'])} --> {f(t1)}\n{c['srt']}\n")
open(sys.argv[2], 'w', encoding='utf8').write('\n'.join(out)); print(len(out), 'cues ->', sys.argv[2])
