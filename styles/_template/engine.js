// MINIMAL STYLE ENGINE — the contract every style must keep (see CHECKLIST.md). Replace the look, keep the API.
//   window.ready : Promise — loads timeline.json, sizes the canvas for T.orientation, loads fonts
//   window.draw(t): pure function of t (seconds) — no Date.now/Math.random; use rng(seed)
//   ZD.scene(name, fn(g, lt, d, t, shot)), ZD.motif(name, fn(g, x, y, s, a, o), {h}), ZD.FX helpers, ZD.T timeline, ZD.L layout
window.ZD = { scenes: {}, motifs: {}, scene(n, f) { this.scenes[n] = f; }, motif(n, f, m = {}) { this.motifs[n] = { draw: f, h: m.h ?? 180 }; } };
(() => {
  const LAYOUTS = {
    landscape: { W: 1920, H: 1080, P: false, CX: 960, AY: 470, BAND_Y: 950, BAND_MAX: 1500, SUB: 58, HOOK_Y: 84 },
    portrait: { W: 1080, H: 1920, P: true, CX: 480, AY: 820, BAND_Y: 1380, BAND_MAX: 790, SUB: 56, HOOK_Y: 296 } };
  const c = document.getElementById('c'), g = c.getContext('2d'); let T, L;
  const clamp = (x, a = 0, b = 1) => Math.max(a, Math.min(b, x)), eo = x => 1 - Math.pow(1 - clamp(x), 3);
  const rng = s => () => (s = (s * 16807) % 2147483647) / 2147483647;
  const font = (px, w = 700) => `${w} ${px}px SerifSC`;
  const INK = '#f2f2f2', ACCENT = '#ffcc33';            // TODO palette
  function rich(g, s, x, y, o = {}) {                    // '/' = line break, [..] = accent colour; o.rev = chars revealed
    const size = o.size || 56, lines = s.split('/'); let n = 0, rev = o.rev ?? 1e9;
    g.font = font(size); g.textBaseline = 'middle';
    lines.forEach((ln, i) => { const segs = ln.split(/(\[[^\]]*\])/).filter(Boolean).map(z => z[0] === '[' ? [z.slice(1, -1), 1] : [z, 0]);
      const w = segs.reduce((a, [z]) => a + g.measureText(z).width, 0); let xx = x - w / 2, yy = y + (i - (lines.length - 1) / 2) * size * 1.3;
      for (const [z, hl] of segs) for (const ch of z) { g.globalAlpha = clamp(rev - n++); g.fillStyle = hl || o.allAccent ? ACCENT : (o.color || INK); g.textAlign = 'left'; g.fillText(ch, xx, yy); xx += g.measureText(ch).width; }
    }); g.globalAlpha = 1; }
  function motif(g, name, x, y, s, a = 1, o = {}) { const m = ZD.motifs[name]; if (!m) throw new Error('unknown motif ' + name); g.save(); g.globalAlpha *= a; m.draw(g, x, y, s, a, o); g.restore(); }
  ZD.FX = { clamp, eo, rng, font, rich, motif, INK, ACCENT, motifH: n => (ZD.motifs[n] || { h: 180 }).h };
  Object.defineProperty(ZD, 'T', { get: () => T }); Object.defineProperty(ZD, 'L', { get: () => L });
  function draw(t) {
    g.setTransform(1, 0, 0, 1, 0, 0); g.fillStyle = '#101418'; g.fillRect(0, 0, L.W, L.H);          // TODO ground
    const sh = T.shots.find(s => t >= s.t0 && t < s.t1) || T.shots[T.shots.length - 1], lt = t - sh.t0;
    g.save(); g.globalAlpha = eo(lt / .35); (ZD.scenes[sh.scene] || ZD.scenes.card)(g, lt, sh.t1 - sh.t0, t, sh); g.restore();
    if (T.hook && sh.scene !== 'title' && !sh.hide_hook) rich(g, T.hook, L.CX, L.HOOK_Y, { size: L.P ? 50 : 44 });
    for (const q of T.cues) if (t >= q.t0 && t < q.t1 && q.style === 'band') rich(g, q.text.replace(/\//g, ''), L.CX, L.BAND_Y, { size: L.SUB, rev: (t - q.t0) * 18 });
    const fo = Math.min(2.2, T.dur * .2); if (t > T.dur - fo) { g.fillStyle = `rgba(0,0,0,${clamp((t - T.dur + fo) / fo)})`; g.fillRect(0, 0, L.W, L.H); }
  }
  window.ready = (async () => {
    T = await (await fetch('timeline.json')).json(); L = LAYOUTS[T.orientation] || LAYOUTS.landscape; c.width = L.W; c.height = L.H;
    T.shots.forEach(s => { s.p = s.params || {}; s.cues = T.cues.filter(q => q.shot === s.id); });
    await Promise.all([document.fonts.load(font(40, 700)), document.fonts.load(font(40, 400))]); await document.fonts.ready;
  })();
  window.draw = draw; window.FX = ZD.FX;
})();
