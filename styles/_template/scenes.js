// TODO your scene + motif library. Each scene draws one shot: fn(g, lt = time in shot, d = shot length, t = film time, sh = shot {p: params, cues}).
const F = ZD.FX;
ZD.motif('glyph', (g, x, y, s, a, o) => { F.rich(g, o.text || '？', x, y, { size: 200 * s, allAccent: true }); }, { h: 110 });
ZD.scene('card', (g, lt, d, t, sh) => { F.motif(g, sh.p.motif || 'glyph', ZD.L.CX, ZD.L.AY, 1, F.eo(lt / .6), { text: sh.p.glyph }); });
ZD.scene('big_text', (g, lt, d, t, sh) => { sh.cues.forEach((q, i) => { const at = q.t0 - sh.t0; if (lt >= at) F.rich(g, q.text, ZD.L.CX, ZD.L.AY + (i - (sh.cues.length - 1) / 2) * 160, { size: ZD.L.P ? 96 : 120, rev: (lt - at) * 16 }); }); });
