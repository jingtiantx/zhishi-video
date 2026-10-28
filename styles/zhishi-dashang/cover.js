// 知识大赏 covers — window.drawCover(kind) with kind '3x4' (1080x1440) | '4x3' (1440x1080) | '9x16' (1080x1920) -> PNG data URL.
// Layout = the 墨菲定律 reference / delivered barnum + white-bear covers: pill badge -> giant bevelled gold effect name ->
// spaced English line -> question title (ivory line + gold line) -> motif on a glowing horizon with cards fanned around -> small caption.
// All words come from timeline.cover (project.json "cover"); no fixed branding is drawn (use forbidden_text to guard names you never want on screen).
window.drawCover = async (kind) => {
  await window.ready;
  const F = window.FX, C = ZD.T.cover || {}, TAU = Math.PI * 2;
  const SZ = { '3x4': [1080, 1440], '4x3': [1440, 1080], '9x16': [1080, 1920] }[kind]; if (!SZ) throw new Error('cover kind ' + kind);
  const [W, H] = SZ, tx = W / 2;
  const L = { '3x4': { badge: 150, head: 330, hf: 196, en: 485, q: 600, qf: 86, by: 1150, bs: 1.25, cap: 1345 },
              '4x3': { badge: 105, head: 255, hf: 176, en: 390, q: 490, qf: 76, by: 880, bs: 1.0, cap: 1012 },
              '9x16': { badge: 300, head: 500, hf: 196, en: 660, q: 800, qf: 96, by: 1560, bs: 1.45, cap: 1765 } }[kind];
  const twoQ = !!(C.q1 && C.q2), qGap = L.qf * 1.3;
  if (twoQ && kind !== '9x16') L.by += kind === '3x4' ? 40 : 30;
  const c = document.getElementById('cov'); c.width = W; c.height = H; const g = c.getContext('2d'), hy = L.by;
  // ── background
  const bg = g.createLinearGradient(0, 0, 0, H); bg.addColorStop(0, '#0b0806'); bg.addColorStop(.5, '#22170a'); bg.addColorStop(hy / H, '#4a3214'); bg.addColorStop(1, '#080605');
  g.fillStyle = bg; g.fillRect(0, 0, W, H);
  g.globalAlpha = .8; g.drawImage(F.NEB, -40, -40, W + 80, H + 80); g.globalAlpha = 1;
  g.save(); g.strokeStyle = 'rgba(220,184,108,.05)'; g.lineWidth = 1; for (let x = 0; x < W; x += 36) { g.beginPath(); g.moveTo(x, 0); g.lineTo(x, H); g.stroke(); } for (let y = 0; y < H; y += 36) { g.beginPath(); g.moveTo(0, y); g.lineTo(W, y); g.stroke(); } g.restore();
  const r = F.rng(7); for (let i = 0; i < 150; i++) { g.fillStyle = `rgba(230,200,150,${.08 + r() * .3})`; const s = .6 + r() * 2.2; g.fillRect(r() * W, r() * H, s, s); }
  // ── illustration: motif standing on a glowing horizon, cards fanned behind it
  const m = C.motif || 'glyph', s = L.bs * (C.motif_scale || 1), mh = F.motifH(m) * s, cy = hy - mh;
  g.save(); g.translate(tx, cy); g.scale(1.7, 1); F.softDisc(g, 0, 0, 380 * L.bs, 'rgba(255,190,100,A)', .42); g.restore();
  F.rays(g, tx, cy, 900, 22, .09, .08);
  if (C.cards !== false) { const fr = F.rng(41), N = 9;
    for (let i = 0; i < N; i++) { const a = Math.PI + (i / (N - 1)) * Math.PI, d = (kind === '3x4' ? 380 : kind === '9x16' ? 400 : 360) + fr() * 70;
      const px = tx + Math.cos(a) * d * (kind === '4x3' ? 1.45 : 1.05), py = cy + Math.sin(a) * d * (kind === '4x3' ? .5 : .62) + 30;
      F.strokeG(g, k => { k.moveTo(px, py); k.lineTo(tx + (px - tx) * .6, py + (cy - py) * .4); }, 1.2, .25, 8, '#fff1c6');
      F.frag(g, px, py, 92 + fr() * 30, 64 + fr() * 20, (fr() - .5) * .5, .75, .8, 300 + i, .4); } }
  g.fillStyle = 'rgba(8,6,4,.9)'; g.fillRect(0, hy + 6, W, H - hy - 6);
  F.strokeG(g, k => { k.moveTo(0, hy + 6); k.lineTo(W, hy + 6); }, 2, .7, 10);
  F.strokeG(g, k => { for (let i = -12; i <= 12; i++) { k.moveTo(tx + i * 40, hy + 6); k.lineTo(tx + i * 240, H); } }, 1, .1, 0);
  F.motif(g, m, tx, cy, s, 1, Object.assign({ fill: .85, bright: 1, glowAmt: 1.4, t: 1.3, lit: 1, text: C.glyph }, C.motif_opts || {}));
  g.save(); g.globalAlpha = .18; g.translate(tx, hy + 12); g.scale(1, -.35); F.motif(g, m, 0, mh, s, 1, { glowAmt: .4, t: 1.3, text: C.glyph }); g.restore();   // reflection
  F.sparkle(g, tx + mh * 1.1, cy - mh * .5, 44, .9); F.sparkle(g, tx - mh * 1.2, cy - mh * .8, 30, .6);
  // ── text stack
  const center = (font, ls) => { g.font = font; g.textAlign = 'center'; g.textBaseline = 'middle'; g.letterSpacing = ls + 'px'; };
  if (C.badge) { const txt = C.badge, fs = kind === '4x3' ? 36 : 42, ls = 10; center(F.font(fs, 700), ls); const w = g.measureText(txt).width + 90, h = fs + 38;
    g.save(); g.fillStyle = 'rgba(20,14,7,.85)'; g.beginPath(); g.roundRect(tx - w / 2, L.badge - h / 2, w, h, h / 2); g.fill(); g.restore();
    F.strokeG(g, k => k.roundRect(tx - w / 2, L.badge - h / 2, w, h, h / 2), 2.5, 1, 14, '#e8c47c');
    F.strokeG(g, k => k.roundRect(tx - w / 2 + 6, L.badge - h / 2 + 6, w - 12, h - 12, (h - 12) / 2), 1, .4, 0, '#fff1c6');
    g.fillStyle = F.goldLine(g, tx - w / 2, tx + w / 2, .4); F.glow(g, 12); g.fillText(txt, tx + ls / 2, L.badge + 2); F.noGlow(g); }
  { const txt = C.title || ZD.T.title || '', ls = 12; let fs = L.hf; center(F.font(fs, 700), ls);
    while (g.measureText(txt).width > W - 140 && fs > 80) { fs -= 4; center(F.font(fs, 700), ls); }
    const x = tx + ls / 2, y = L.head, top = y - fs * .5, bot = y + fs * .5, tw = g.measureText(txt).width;
    g.save(); F.glow(g, 60, 'rgba(255,170,70,.45)'); g.fillStyle = '#5a3a14'; g.fillText(txt, x, y + 4); g.restore();
    for (let i = 12; i >= 1; i--) { g.fillStyle = `rgb(${50 + i * 4},${32 + i * 2},${12 + i})`; g.fillText(txt, x, y + i); }
    g.save(); g.shadowColor = 'rgba(0,0,0,.7)'; g.shadowBlur = 24; g.shadowOffsetY = 10; g.fillStyle = '#1a1006'; g.fillText(txt, x, y + 12); g.restore();
    const gr = g.createLinearGradient(0, top, 0, bot); gr.addColorStop(0, '#fffbe8'); gr.addColorStop(.28, '#ffe39e'); gr.addColorStop(.5, '#e6b45c'); gr.addColorStop(.52, '#c48a36'); gr.addColorStop(.8, '#f0c870'); gr.addColorStop(1, '#a8742c');
    g.fillStyle = gr; g.fillText(txt, x, y);
    g.lineWidth = 1.6; g.strokeStyle = 'rgba(255,246,214,.55)'; g.strokeText(txt, x, y - 1);
    g.save(); g.globalCompositeOperation = 'lighter'; const sh = g.createLinearGradient(tx - 450, top, tx + 450, bot); sh.addColorStop(.3, 'rgba(255,240,200,0)'); sh.addColorStop(.42, 'rgba(255,240,200,.35)'); sh.addColorStop(.5, 'rgba(255,240,200,0)');
    g.fillStyle = sh; g.fillText(txt, x, y); g.restore();
    F.sparkle(g, tx + tw / 2 + 10, top + 24, 44, .9); }
  if (C.en) { const ls = 12, txt = C.en; center(F.font(kind === '4x3' ? 30 : 32, 400), ls); g.fillStyle = '#d9cdb0'; F.glow(g, 10, 'rgba(0,0,0,.8)'); g.fillText(txt, tx + ls / 2, L.en); F.noGlow(g);
    const w = g.measureText(txt).width / 2 + 36;
    F.strokeG(g, k => { k.moveTo(tx - w, L.en); k.lineTo(tx - w - 80, L.en); k.moveTo(tx + w, L.en); k.lineTo(tx + w + 80, L.en); }, 1.4, .7, 6); }
  g.letterSpacing = '0px';
  if (twoQ) {
    center(F.font(L.qf, 700), 0); g.save(); g.shadowColor = 'rgba(0,0,0,.9)'; g.shadowBlur = 24; g.shadowOffsetY = 6; g.fillStyle = '#f4ecda'; g.fillText(C.q1, tx, L.q); g.restore();
    g.fillStyle = '#f4ecda'; g.fillText(C.q1, tx, L.q);
    F.rich(g, C.q2, tx, L.q + qGap, { size: Math.round(L.qf * 1.25), allGold: true, sheen: .5, maxW: W - 100, glowAmt: 1.35 });
  } else if (C.q || C.q2 || C.q1) F.rich(g, C.q || C.q2 || C.q1, tx, L.q, { size: L.qf, sheen: .5, maxW: W - 80, glowAmt: 1.3 });
  if (C.caption) { const txt = C.caption, ls = 3; center(F.font(kind === '4x3' ? 32 : 34, 400), ls); g.fillStyle = '#efe6d2'; F.glow(g, 14, 'rgba(0,0,0,.9)'); g.fillText(txt, tx + ls / 2, L.cap); F.noGlow(g); g.letterSpacing = '0px'; }
  const vg = g.createRadialGradient(W / 2, H / 2, Math.min(W, H) * .38, W / 2, H / 2, Math.max(W, H) * .8); vg.addColorStop(0, 'rgba(0,0,0,0)'); vg.addColorStop(1, 'rgba(0,0,0,.78)'); g.fillStyle = vg; g.fillRect(0, 0, W, H);
  g.save(); g.globalCompositeOperation = 'overlay'; g.globalAlpha = .1; g.drawImage(F.GRAIN[0], 0, 0, W, H); g.restore();
  return c.toDataURL('image/png');
};
