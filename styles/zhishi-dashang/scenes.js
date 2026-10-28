// 知识大赏 scene + motif library. Every scene: fn(g, lt, d, t, shot) — lt = seconds into the shot, d = shot length,
// shot.p = params from project.json, shot.cues = this shot's cues (absolute t0/t1). Coordinates come from ZD.L so one
// scene works in both 1920x1080 and 1080x1920. Names in brackets are the scene's original working names.
(() => {
'use strict';
const F = ZD.FX, { clamp, lerp, ss, eo, eio, rng, TAU, INK, GOLD, GOLD_HI } = F;
const cueT = (sh, k, fb) => sh.cues[k] ? sh.cues[k].t0 - sh.t0 : fb;     // relative start of the k-th cue in the shot
// ───────── motifs (centred; s = 1 ≈ 360 px wide; h = half-height at s = 1) ─────────
ZD.motif('silhouette', (g, x, y, s, a, o) => { const k = s * .85; F.silhouette(g, x, y - 27 * k, k, a, o.rim ?? 1); }, { h: 200 });   // “你”
ZD.motif('figure', (g, x, y, s, a) => { const k = s * 2.2; F.figure(g, x, y + 75 * k, k, a); }, { h: 165 });
ZD.motif('brain', (g, x, y, s, a) => F.brain(g, x, y, s * .6, a), { h: 135 });
ZD.motif('eye', (g, x, y, s, a, o) => F.eye(g, x, y, 340 * s, o.open ?? 1, o.look ?? Math.sin((o.t || 0) * .8) * .6, a), { h: 110 });
ZD.motif('bell', (g, x, y, s, a, o) => { const k = s * 1.4; F.bellShape(g, x, y - 100 * k, k, a, o.swing || 0); }, { h: 150 });
ZD.motif('card', (g, x, y, s, a, o) => { F.cardShape(g, x, y, 380 * s, 260 * s, a, o.tag);
  F.strokeG(g, c => { for (let i = 0; i < 3; i++) { const yy = y - 50 * s + i * 50 * s; c.moveTo(x - 120 * s, yy); c.lineTo(x + (i === 2 ? 40 : 120) * s, yy); } }, 4 * s, a * .8, 10); }, { h: 130 });
ZD.motif('frag', (g, x, y, s, a, o) => F.frag(g, x, y, 360 * s, 250 * s, o.rot || 0, a, o.sharp ?? 1, o.seed ?? 7, o.warm ?? .3), { h: 125 });
ZD.motif('astrolabe', (g, x, y, s, a, o) => F.astrolabe(g, x, y, 170 * s, (o.t || 0) * .1, o.lit ?? 12, a, o.t || 0), { h: 180 });
ZD.motif('mirror', (g, x, y, s, a, o) => F.mirrorFrame(g, x, y, 140 * s, 190 * s, a, o.t || 0), { h: 210 });
ZD.motif('clock', (g, x, y, s, a, o) => { const R = 170 * s, t = o.t || 0;
  F.strokeG(g, c => c.arc(x, y, R, 0, TAU), 3, a, 14);
  F.strokeG(g, c => { for (let i = 0; i < 60; i++) { const an = i / 60 * TAU, l = i % 5 ? 10 : 24; c.moveTo(x + Math.cos(an) * (R - 8), y + Math.sin(an) * (R - 8)); c.lineTo(x + Math.cos(an) * (R - 8 - l * s), y + Math.sin(an) * (R - 8 - l * s)); } }, 1.6, a * .6, 4);
  const hm = t * (o.speed ?? .8), hh = hm / 12; F.strokeG(g, c => { c.moveTo(x, y); c.lineTo(x + Math.sin(hm) * R * .72, y - Math.cos(hm) * R * .72); c.moveTo(x, y); c.lineTo(x + Math.sin(hh) * R * .45, y - Math.cos(hh) * R * .45); }, 4, a, 12, GOLD_HI);
  g.save(); g.globalAlpha *= a; g.fillStyle = GOLD_HI; g.beginPath(); g.arc(x, y, 7 * s + 2, 0, TAU); g.fill(); g.restore(); }, { h: 170 });
ZD.motif('bulb', (g, x, y, s, a, o) => { const R = 110 * s, cy = y - 40 * s;
  if (o.lit) { F.softDisc(g, x, cy, R * 2.4, 'rgba(255,215,140,A)', .35 * o.lit * a); }
  F.strokeG(g, c => { c.arc(x, cy, R, Math.PI * .78, Math.PI * 2.22); c.lineTo(x + R * .38, cy + R * 1.25); c.lineTo(x - R * .38, cy + R * 1.25); c.closePath(); }, 4, a, 18);
  F.strokeG(g, c => { for (let i = 0; i < 3; i++) { const yy = cy + R * (1.42 + i * .2); c.moveTo(x - R * .34, yy); c.lineTo(x + R * .34, yy); } }, 3, a * .85, 8);
  F.strokeG(g, c => { c.moveTo(x - R * .3, cy + R * 1.1); c.lineTo(x - R * .2, cy); c.lineTo(x - R * .1, cy + R * .2); c.lineTo(x, cy - R * .05); c.lineTo(x + R * .1, cy + R * .2); c.lineTo(x + R * .2, cy); c.lineTo(x + R * .3, cy + R * 1.1); }, 2.5, a * (.6 + .4 * (o.lit || 0)), 12, GOLD_HI); }, { h: 170 });
ZD.motif('phone', (g, x, y, s, a, o) => { const w = 190 * s, h = 360 * s;
  g.save(); g.globalAlpha *= a; g.fillStyle = 'rgba(14,10,6,.9)'; g.beginPath(); F.rr(g, x - w / 2, y - h / 2, w, h, 26 * s); g.fill();
  const sg = g.createLinearGradient(0, y - h / 2, 0, y + h / 2); sg.addColorStop(0, `rgba(255,205,130,${.12 + .2 * (o.lit || 0)})`); sg.addColorStop(1, 'rgba(255,205,130,.02)'); g.fillStyle = sg; g.beginPath(); F.rr(g, x - w / 2 + 12 * s, y - h / 2 + 34 * s, w - 24 * s, h - 68 * s, 8 * s); g.fill(); g.restore();
  F.strokeG(g, c => F.rr(c, x - w / 2, y - h / 2, w, h, 26 * s), 3.5, a, 16);
  F.strokeG(g, c => { c.moveTo(x - 24 * s, y - h / 2 + 18 * s); c.lineTo(x + 24 * s, y - h / 2 + 18 * s); for (let i = 0; i < 4; i++) { const yy = y - h * .25 + i * 46 * s; c.moveTo(x - w * .32, yy); c.lineTo(x + w * (i % 2 ? .1 : .3), yy); } }, 3, a * .8, 8); }, { h: 180 });
ZD.motif('glyph', (g, x, y, s, a, o) => { F.ring(g, x, y, 165 * s, a * .9, 3); F.ring(g, x, y, 180 * s, a * .4, 1.2);
  g.save(); g.globalAlpha *= a; F.rich(g, o.text || '？', x, y + 6 * s, { size: 200 * s, allGold: true, maxW: 300 * s, glowAmt: 1.3 }); g.restore(); }, { h: 180 });
ZD.motif('none', () => {}, { h: 0 });
// ───────── scenes ─────────
const P = () => ZD.L.P;
// [whisper] hook: motif drawn on with expanding rings; first cue normally style 'big' (big text beside/below the art)
ZD.scene('hook', (g, lt, d, t, sh) => {
  const L = ZD.L, p = sh.p, x = L.ART.x, y = L.ART.y, s = (p.size || 1.1) * L.K, pr = lerp(.8, 1, eo(lt / 1.4)), pu = F.pulse(t), mh = F.motifH(p.motif || 'silhouette') * s;
  F.drift(g, lt, 14, .5);
  F.softDisc(g, x, y, 460 * L.K, 'rgba(170,120,50,A)', .22 + .1 * pu);
  for (let i = 0; i < 6; i++) { const R = ((lt * 70 + i * 120) % 720) + 60; F.ring(g, x, y, R * L.K, .16 * (1 - R / 780), 1.4, .55); }
  g.save(); g.globalAlpha = eo(lt / .9); F.motif(g, p.motif || 'silhouette', x, y, s * lerp(.92, 1, eo(lt / 1.4)), 1, { p: pr, fill: .8, bright: .35 + .25 * pu, glowAmt: 1.3, t, lit: 6 + lt * 2 }); g.restore();
  F.strokeG(g, c => { c.moveTo(0, y + mh + 10); c.lineTo(L.W, y + mh + 10); }, 1.2, .25, 6);
  if (lt < 1.4) F.sparkle(g, x + mh * .9, y - mh * .6, 46, .95 * (1 - lt / 1.4));
});
// [fragments] memories/info cards drift; the centre one sharpens around “你”
ZD.scene('fragments', (g, lt, d, t, sh) => {
  const L = ZD.L, p = sh.p, CX = L.AX, AY = L.AY, c2 = cueT(sh, 1, d * .45), sharp = ss(c2 - .5, c2 + 2.6, lt), z = lerp(.75, 1.15, eo(lt / d)) * L.K;
  F.drift(g, lt, 26, .7, { sharp: .2 });
  F.softDisc(g, CX, AY, 520 * z, 'rgba(255,200,120,A)', .12 + .25 * sharp);
  F.frag(g, CX, AY, 460 * z, 320 * z, -.04 + .03 * Math.sin(lt * .6), .6 + .4 * sharp, .35 + .65 * sharp, 102, .3 * sharp);
  g.save(); g.globalAlpha = .25 + .75 * sharp; F.motif(g, p.motif || 'silhouette', CX + 20 * z, AY + 30 * z, .6 * z, 1, { rim: sharp, t }); g.restore();
  if (sharp > .6) for (let i = 0; i < 4; i++) { const c = [[-1, -1], [1, -1], [1, 1], [-1, 1]][i]; F.sparkle(g, CX + c[0] * 230 * z, AY + c[1] * 160 * z, 30, (sharp - .6) * 2 * (.6 + .4 * Math.sin(lt * 4 + i))); }
  for (let i = 0; i < 3; i++) { const q = (lt * .35 + i / 3) % 1; F.ring(g, CX, AY, lerp(140, 420, q) * z, (1 - q) * .25 * sharp, 1.5, .72); }
});
// [suppress] word pills (p.words) press in on the motif from both sides; it glows brighter with each push; copies appear on cue 2
ZD.scene('pressure', (g, lt, d, t, sh) => {
  const L = ZD.L, p = sh.p, CX = L.AX, by = L.AY + 120 * L.K, words = p.words || ['别想了', '放下吧'], c2 = cueT(sh, 1, d * .5);
  const N = p.pushes || 7, PUSH = [...Array(N)].map((_, i) => .12 * d + i * (.75 * d / N));
  let sq = 0, done = 0; PUSH.forEach(tp => { if (lt >= tp) { done++; sq = Math.max(sq, Math.exp(-(lt - tp) * 5)); } });
  const bright = done / N, s = (1.15 * (1 - .14 * sq) + .025 * done) * L.K, m = p.motif || 'silhouette';
  F.drift(g, lt, 12, .35);
  F.softDisc(g, CX, by, 380 + 60 * bright, 'rgba(255,205,130,A)', .1 + .3 * bright);
  if (p.copies !== false && lt > c2) { const r = rng(55), pos = L.P ? [[150, 520], [830, 500], [170, 1180], [820, 1160]] : [[330, 380], [1590, 360], [420, 720], [1500, 700], [700, 260], [1240, 250]];
    pos.forEach(([px, py], i) => { const e = ss(c2 + .3 + i * .5, c2 + .7 + i * .5, lt); F.motif(g, m, px, py, (.32 + r() * .08) * L.K, e * (.35 + .25 * Math.sin(lt * 3 + i)), { t, glowAmt: .6 }); }); }
  F.motif(g, m, CX, by, s, 1, { fill: .85, bright: .15 + .7 * bright, glowAmt: 1 + bright, t, lit: done * 2 });
  PUSH.forEach(tp => { const k = lt - tp; if (k > 0 && k < 1.2) F.ring(g, CX, by, 150 + k * 520 * L.K, (1 - k / 1.2) * .5, 2.5, .6); });
  const wy = L.P ? by - 330 : 280;
  PUSH.slice(0, Math.min(N, 4)).forEach((tp, i) => { const k = (lt - tp + .55) / .55; if (k > 0 && k < 1.6) { const side = i % 2 ? 1 : -1, e = eo(Math.min(1, k)), x = CX + side * lerp(L.SPAN * 1.1, L.SPAN * .45, e), al = k < 1 ? e : 1 - (k - 1) / .6;
      F.pill(g, words[i % words.length], x, wy, L.P ? 44 : 50, al); } });
});
// [title] effect-name card: gold wipe-in title + tagline, rays, faint motif behind (hook line hides during this shot)
ZD.scene('title', (g, lt, d, t, sh) => {
  const L = ZD.L, p = sh.p, CX = L.CX, ty = L.P ? 700 : 390, fs = L.P ? 170 : 220, wW = L.P ? 860 : 1040;
  F.rays(g, CX, ty + 80, 1300, 24, lt * .06, .07);
  if (p.motif) F.motif(g, p.motif, CX + 40, L.P ? 1180 : 860, 1.6 * L.K, .12 + .05 * F.pulse(t), { lw: 5, glowAmt: .6, t });
  F.softDisc(g, CX, ty + 10, 700, 'rgba(170,110,40,A)', .3);
  const wp = eo(lt / 1.1);
  g.save(); g.beginPath(); g.rect(CX - wW / 2, ty - 160, wW * wp, 340); g.clip();
  F.rich(g, p.title || ZD.T.title, CX, ty, { size: fs, allGold: true, sheen: (lt * .4 % 1.6) - .3, maxW: wW, glowAmt: 1.2 }); g.restore();
  if (wp < 1) { const x = CX - wW / 2 + wW * wp; g.save(); g.globalCompositeOperation = 'lighter'; g.fillStyle = 'rgba(255,230,170,.8)'; F.glow(g, 30); g.fillRect(x - 2, ty - 130, 4, 270); g.restore(); }
  const u = eo((lt - .9) / .9), ly = ty + fs * .72, lw = L.P ? 340 : 420; F.strokeG(g, c => { c.moveTo(CX - lw * u, ly); c.lineTo(CX + lw * u, ly); }, 1.8, .9, 10, GOLD_HI);
  if (p.en) { g.save(); g.globalAlpha = ss(.8, 1.4, lt); g.font = F.font(L.P ? 30 : 32, 400); g.letterSpacing = '12px'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillStyle = '#d9cdb0'; g.fillText(p.en, CX + 6, ly + 44); g.letterSpacing = '0px'; g.restore(); }
  if (p.tagline) F.rich(g, p.tagline, CX, ly + (p.en ? 130 : 92), { size: L.P ? 60 : 68, rev: lt - 1.1, stagger: .07, fade: .4, maxW: L.P ? 820 : 1200 });
});
// [lab] a person with a thought bubble holding p.motif; optional strike-through on cue 2 (p.strike) and a session timer ring (p.timer)
ZD.scene('thought', (g, lt, d, t, sh) => {
  const L = ZD.L, p = sh.p, c2 = cueT(sh, 1, d * .45), Pt = L.P;
  const px = Pt ? 300 : 560, py = Pt ? 1010 : 560, ps = Pt ? .75 : 1;
  F.softDisc(g, px, py, 380 * ps, 'rgba(150,100,40,A)', .2);
  F.strokeG(g, c => { c.moveTo(px - 150 * ps, py + 60 * ps); c.lineTo(px - 150 * ps, py + 290 * ps); c.moveTo(px - 150 * ps, py + 160 * ps); c.lineTo(px + 130 * ps, py + 160 * ps); c.lineTo(px + 130 * ps, py + 290 * ps); c.moveTo(px - 150 * ps, py + 60 * ps); c.lineTo(px - 170 * ps, py - 140 * ps); }, 4, .8, 12);
  F.silhouette(g, px, py, ps, 1, 1);
  const bx = Pt ? 620 : 1000, by = Pt ? 600 : 300, bw = Pt ? 220 : 250, bh = Pt ? 140 : 150, ba = ss(.4, 1.1, lt);
  [[px + 120 * ps, py - 170 * ps, 14], [px + 190 * ps, py - 220 * ps, 22]].forEach(([x, y, r]) => { g.save(); g.globalAlpha = ba; F.strokeG(g, c => c.arc(x, y, r, 0, TAU), 2.5, 1, 10); g.restore(); });
  g.save(); g.globalAlpha = ba; g.fillStyle = 'rgba(14,10,6,.85)'; g.beginPath(); g.ellipse(bx, by, bw, bh, 0, 0, TAU); g.fill(); g.restore();
  F.strokeG(g, c => { for (let i = 0; i <= 120; i++) { const th = i / 120 * TAU, r = 1 + .06 * Math.sin(th * 10); const x = bx + Math.cos(th) * bw * r, y = by + Math.sin(th) * bh * r; i ? c.lineTo(x, y) : c.moveTo(x, y); } }, 3, ba, 14);
  if (p.bubble_text) { g.save(); g.globalAlpha = ba; F.rich(g, p.bubble_text, bx, by, { size: Pt ? 44 : 52, maxW: bw * 1.6, rev: (lt - .6) * 1.3 }); g.restore(); }
  else F.motif(g, p.motif || 'glyph', bx, by, .55, ba, { p: ss(.6, 2.2, lt), fill: .6, t, text: p.glyph });
  if (p.strike) F.crossMark(g, bx, by, bw * .7, (lt - c2 - .6) / .5, .95);
  if (p.timer) { const tx = Pt ? 790 : 1490, ty = Pt ? 1060 : 520, R = Pt ? 110 : 190, sw = clamp((lt - c2) / (d - c2));
    F.strokeG(g, c => c.arc(tx, ty, R, 0, TAU), 2, .45, 6);
    for (let i = 0; i < 60; i++) { const an = i / 60 * TAU - Math.PI / 2, l = (i % 5 ? 10 : 24) * R / 190; F.strokeG(g, c => { c.moveTo(tx + Math.cos(an) * (R - 8), ty + Math.sin(an) * (R - 8)); c.lineTo(tx + Math.cos(an) * (R - 8 - l), ty + Math.sin(an) * (R - 8 - l)); }, i % 5 ? 1.2 : 2.4, .55, 4); }
    if (sw > 0) { F.strokeG(g, c => c.arc(tx, ty, R + 16, -Math.PI / 2, -Math.PI / 2 + TAU * sw), 6, 1, 20, GOLD_HI); const an = -Math.PI / 2 + TAU * sw; F.sparkle(g, tx + Math.cos(an) * (R + 16), ty + Math.sin(an) * (R + 16), 34, .9); }
    const ha = -Math.PI / 2 + TAU * (lt * .08 % 1); F.strokeG(g, c => { c.moveTo(tx, ty); c.lineTo(tx + Math.cos(ha) * (R - 50 * R / 190), ty + Math.sin(ha) * (R - 50 * R / 190)); }, 4, .9, 12, GOLD_HI); }
});
// [bell] repeated returns: p.motif pops up again and again, each time brighter, with an optional bell ring
ZD.scene('repeat', (g, lt, d, t, sh) => {
  const L = ZD.L, p = sh.p, n = p.times || 4, BT = [...Array(n)].map((_, i) => .17 * d + i * (.7 * d / n)), Pt = L.P;
  F.silhouette(g, Pt ? 250 : 420, Pt ? 1150 : 600, Pt ? .6 : .8, .9, .8);
  let sw = 0; BT.forEach(b => { const k = lt - b; if (k > 0) sw += Math.sin(k * 14) * Math.exp(-k * 3) * .35; });
  const bx = Pt ? 800 : 1560, by = Pt ? 480 : 250;
  if (p.bell !== false) { F.bellShape(g, bx, by, Pt ? .6 : .9, 1, sw); BT.forEach(b => { const k = lt - b; if (k > 0 && k < 1.4) F.ring(g, bx, by + 120, 120 + k * 380 * L.K, (1 - k / 1.4) * .5, 2.5, .8); }); }
  const POS = Pt ? [[300, 640, .5], [700, 900, .55], [260, 860, .42], [560, 720, .8]] : [[820, 420, .55], [1150, 700, .6], [640, 300, .45], [1000, 560, .85]];
  BT.forEach((b, i) => { const k = lt - b + .25; if (k > 0) { const [x, y, s] = POS[i % POS.length], e = eo(k / .5), br = (i + 1) / n;
      F.softDisc(g, x, y, 300 * s, 'rgba(255,215,150,A)', .25 * br * e);
      F.motif(g, p.motif || 'glyph', x, y, s * lerp(.7, 1, e), e * (i === n - 1 ? 1 : .55 + .1 * i), { fill: .7, bright: br * .8, glowAmt: .6 + br, t, text: p.glyph }); } });
});
// [monitor] brain with a radar sweep; an eye opens and looks around; p.reveal motif appears where it looks on cue 2
ZD.scene('brain_eye', (g, lt, d, t, sh) => {
  const L = ZD.L, p = sh.p, CX = L.AX, AY = L.AY, c2 = cueT(sh, 1, d * .5), z = lerp(1.05, 1.15, lt / d) * L.K;
  F.softDisc(g, CX, AY, 700 * L.K, 'rgba(120,80,30,A)', .3);
  F.brain(g, CX, AY, z, ss(0, .8, lt));
  g.save(); g.beginPath(); g.ellipse(CX, AY, 300 * z, 210 * z, 0, 0, TAU); g.clip();
  const an = lt * 1.6; for (let k = 0; k < 24; k++) { const a2 = an - k * .03; g.strokeStyle = F.gl(.25 * (1 - k / 24)); g.lineWidth = 3; g.beginPath(); g.moveTo(CX, AY); g.lineTo(CX + Math.cos(a2) * 400, AY + Math.sin(a2) * 400); g.stroke(); }
  for (let i = 1; i <= 3; i++) F.ring(g, CX, AY, i * 80 * z, .15, 1, .72);
  g.restore();
  const look = lt < c2 ? Math.sin(lt * 1.3) * .8 : lerp(Math.sin(c2 * 1.3) * .8, .9, eo((lt - c2) / .5));
  F.eye(g, CX, AY - 10, 260 * z, ss(.8, 1.6, lt) * (1 + .25 * ss(c2, c2 + .4, lt)), look, 1);
  if (p.reveal && lt > c2) { const e = eo((lt - c2) / .6), x = CX + 210 * z, y = AY + 60 * z; F.motif(g, p.reveal, x, y, .3 * L.K, e, { fill: .6, bright: .4, t, text: p.glyph }); }
});
// [scan] a reticle hops between items inside the brain and ticks each one (“反复检查、反复确认”)
ZD.scene('scan', (g, lt, d, t, sh) => {
  const L = ZD.L, p = sh.p, CX = L.AX, AY = L.AY, z = 1.25 * L.K, c2 = cueT(sh, 1, d * .4), BEAT = ZD.BEAT;
  F.brain(g, CX, AY, z, 1);
  const pts = [[-200, -60, 0], [-40, -120, 1], [150, -40, 2], [40, 80, 3], [-150, 70, 4]].map(([x, y, i]) => [CX + x * z, AY + y * z, i]);
  pts.forEach(([x, y, i]) => { if (i === 2 && p.motif) F.motif(g, p.motif, x, y, .3 * L.K, .9, { fill: .7, bright: .5, t, text: p.glyph }); else F.frag(g, x, y, 130 * L.K, 90 * L.K, (i - 2) * .08, .75, .8, 500 + i, .2); });
  if (lt > c2 - .2) { const k = (lt - c2) / BEAT, idx = Math.max(0, Math.floor(k)), f = k - idx, order = [2, 0, 2, 3, 2, 1, 2, 4, 2];
    const A2 = pts[order[idx % order.length]], B2 = pts[order[(idx + 1) % order.length]], e = eio(clamp(f / .45)), x = lerp(A2[0], B2[0], e), y = lerp(A2[1], B2[1], e);
    F.strokeG(g, c => { const r = (70 + 10 * Math.exp(-f * 6)) * L.K; c.arc(x, y, r, 0, TAU); for (let q = 0; q < 4; q++) { const an = q * Math.PI / 2; c.moveTo(x + Math.cos(an) * (r - 18), y + Math.sin(an) * (r - 18)); c.lineTo(x + Math.cos(an) * (r + 20), y + Math.sin(an) * (r + 20)); } }, 3, 1, 16, GOLD_HI);
    for (let j = 0; j <= idx && j < 9; j++) { const P2 = pts[order[(j + 1) % order.length]], cp = clamp((k - j - .5) / .3); if (cp > 0) F.checkMark(g, P2[0] + 70 * L.K, P2[1] - 60 * L.K, 34 * L.K, cp, .9); } }
});
// [focus] spotlight iris closes on p.motif, which brightens
ZD.scene('focus', (g, lt, d, t, sh) => {
  const L = ZD.L, p = sh.p, CX = L.AX, AY = L.AY, k = eo(lt / d), R = lerp(820, 330, k) * L.K;
  g.save(); g.fillStyle = 'rgba(0,0,0,.6)'; g.beginPath(); g.rect(0, 0, L.W, L.H); g.ellipse(CX, AY, R * 1.35, R, 0, 0, TAU, true); g.fill('evenodd'); g.restore();
  for (let i = 0; i < 8; i++) { const an = i / 8 * TAU + k * .9; F.strokeG(g, c => { c.moveTo(CX + Math.cos(an) * R * 1.35, AY + Math.sin(an) * R); c.lineTo(CX + Math.cos(an + .7) * R * .98, AY + Math.sin(an + .7) * R * .72); }, 2, .4, 8); }
  F.ring(g, CX, AY, R * 1.35, .8, 3, 1 / 1.35);
  for (let i = 0; i < 3; i++) { const q = (lt * .5 + i / 3) % 1; F.ring(g, CX, AY, lerp(R * 1.3, 120, q), .35 * q, 1.5, .74); }
  F.drift(g, lt, 14, .3 * (1 - k));
  const s = lerp(.6, 1.05, k) * L.K; F.softDisc(g, CX, AY, (260 + 200 * k) * L.K, 'rgba(255,215,150,A)', .2 + .3 * k);
  F.motif(g, p.motif || 'glyph', CX, AY, s, 1, { fill: .7, bright: .2 + .8 * k, glowAmt: 1 + k, t, text: p.glyph, lit: k });
});
// [life] the motif shrinks to a point and cards burst out radially; p.labels (≤ 9 short words) are printed on the cards
const ICON = [[-1, -.6], [-.55, -.9], [.1, -1], [.6, -.85], [1, -.5], [-.95, .25], [.95, .3], [-.5, .55], [.5, .6]];
ZD.scene('burst', (g, lt, d, t, sh) => {
  const L = ZD.L, p = sh.p, CX = L.AX, AY = L.AY, shrink = ss(0, .8, lt), burst = eo((lt - .5) / 1.4), labels = p.labels || [];
  if (p.motif) F.motif(g, p.motif, CX, AY + 60 * (1 - shrink), lerp(.9, .18, shrink) * L.K, 1 - .3 * shrink, { fill: .7, bright: .6, t, text: p.glyph });
  F.softDisc(g, CX, AY, 300, 'rgba(255,215,150,A)', .4 * Math.exp(-Math.max(0, lt - .5) * 2));
  if (burst > 0) { F.rays(g, CX, AY, 1100, 18, lt * .1, .08 * burst);
    const n = labels.length ? Math.min(9, labels.length) : 9, sx = L.SPAN * .95, sy = L.P ? 430 : 330, fw = L.P ? 210 : 190, fh = L.P ? 120 : 130;
    for (let i = 0; i < n; i++) { const [dx, dy] = ICON[i], x = CX + dx * sx * burst * (L.P ? .78 : 1), y = AY + dy * sy * burst;
      F.strokeG(g, c => { c.moveTo(CX, AY); c.lineTo(x, y); }, 1, .2 * burst, 6);
      F.frag(g, x, y, fw, fh, labels.length ? 0 : dx * .08, labels.length ? burst * .55 : burst, .5 + .5 * burst, 700 + i, .25);
      if (labels[i]) { g.save(); g.globalAlpha = burst; F.rich(g, labels[i], x, y, { size: L.P ? 40 : 42, maxW: fw - 20, allGold: false }); g.restore(); } } }
});
// [versus] big centred lines: every cue with style 'center' in this shot is stacked and revealed on its own cue
ZD.scene('big_text', (g, lt, d, t, sh) => {
  const L = ZD.L, p = sh.p, CX = L.CX, lines = sh.cues.filter(c => c.style === 'center'), n = Math.max(1, lines.length), gap = L.P ? 200 : 240;
  F.softDisc(g, CX, L.AY, 700, 'rgba(150,100,40,A)', .3);
  if (p.motif) F.motif(g, p.motif, L.P ? 760 : 330, L.P ? 1240 : 820, .5 * L.K, .35 + .3 * ss(.5, 1, lt / d), { bright: .5, t, text: p.glyph });
  lines.forEach((c, i) => { const y = L.AY + (i - (n - 1) / 2) * gap, rel = lt - (c.t0 - sh.t0);
    F.rich(g, F.autoBreak(g, c.text, L.CENTER_SIZE, L.CENTER_MAXW), CX, y, { size: L.CENTER_SIZE, rev: rel * 1.3, stagger: .06, fade: .35, maxW: L.CENTER_MAXW, glowAmt: 1.2 });
    const st = rel - .45; if (st > 0) F.softDisc(g, CX, y, 600, 'rgba(255,210,140,A)', .25 * Math.exp(-st * 4)); });
});
// NEW — the classic twist “你以为 X → 其实 Y”: left/top card = the common belief (dims + struck), right/bottom = the truth (glows)
ZD.scene('compare', (g, lt, d, t, sh) => {
  const L = ZD.L, p = sh.p, Pt = L.P, c2 = cueT(sh, 1, d * .45);
  const A = p.left || { label: '你以为', text: '' }, B = p.right || { label: '其实', text: '' };
  const cw = Pt ? 760 : 720, ch = Pt ? 330 : 440, pos = Pt ? [[L.CX, L.AY - 170], [L.CX, L.AY + 250]] : [[L.AX - 420, L.AY + 10], [L.AX + 420, L.AY + 10]];
  const inA = eo(lt / .6), inB = eo((lt - c2) / .6), dim = ss(c2, c2 + .6, lt), ts = Pt ? 54 : 58;
  [[A, pos[0], inA, 1 - .55 * dim], [B, pos[1], inB, 1]].forEach(([X, [x, y], e, al], i) => { if (e <= 0) return;
    const yy = y + (1 - e) * 40;
    g.save(); g.globalAlpha = e * al; if (i === 1) F.softDisc(g, x, yy, cw * .7, 'rgba(255,205,130,A)', .22 * e);
    g.fillStyle = 'rgba(16,11,6,.86)'; g.beginPath(); F.rr(g, x - cw / 2, yy - ch / 2, cw, ch, 22); g.fill(); g.restore();
    F.strokeG(g, c => F.rr(c, x - cw / 2, yy - ch / 2, cw, ch, 22), i ? 3.5 : 2.2, e * al, i ? 22 : 8, i ? GOLD_HI : GOLD);
    F.pill(g, X.label, x, yy - ch / 2, Pt ? 38 : 40, e * al);
    g.save(); g.globalAlpha = e * al; F.rich(g, F.autoBreak(g, X.text, ts, cw - 90), x, yy + 14, { size: ts, maxW: cw - 90, rev: (lt - (i ? c2 : 0)) * 1.4, stagger: .04, glowAmt: i ? 1.3 : .6, color: i ? INK : '#bfb39b' }); g.restore();
    if (i === 0 && dim > 0) F.strokeG(g, c => { c.moveTo(x - cw * .42, yy + 14); c.lineTo(x - cw * .42 + cw * .84 * eo(dim), yy + 14); }, 4, .8 * dim, 10, GOLD_HI);
  });
  if (inB > 0) { const [a0, b0] = pos, mx = (a0[0] + b0[0]) / 2, my = (a0[1] + b0[1]) / 2;
    F.strokeG(g, c => { if (Pt) { c.moveTo(mx, my - 22); c.lineTo(mx, my + 22); c.moveTo(mx - 16, my + 6); c.lineTo(mx, my + 22); c.lineTo(mx + 16, my + 6); } else { c.moveTo(mx - 26, my); c.lineTo(mx + 26, my); c.moveTo(mx + 8, my - 18); c.lineTo(mx + 26, my); c.lineTo(mx + 8, my + 18); } }, 4, inB, 14, GOLD_HI); }
});
// NEW — practical takeaway list (“看完能用上”): p.items [{title}|string], revealed one per cue (or evenly)
ZD.scene('steps', (g, lt, d, t, sh) => {
  const L = ZD.L, p = sh.p, Pt = L.P, items = (p.items || []).map(x => typeof x === 'string' ? { title: x } : x), n = items.length || 1;
  const gap = Pt ? 160 : 132, x0 = Pt ? 150 : L.AX - 520, ts = Pt ? 50 : 56, y0 = L.AY - (n - 1) / 2 * gap;
  F.softDisc(g, L.AX, L.AY, 700 * L.K, 'rgba(150,100,40,A)', .25);
  items.forEach((it, i) => { const at = sh.cues.length === n ? sh.cues[i].t0 - sh.t0 : .2 + i * (d * .75 / n), e = eo((lt - at) / .5); if (e <= 0) return;
    const y = y0 + i * gap, cur = i === items.findLastIndex((_, j) => (sh.cues.length === n ? sh.cues[j].t0 - sh.t0 : .2 + j * (d * .75 / n)) <= lt);
    F.ring(g, x0, y, 44, e, cur ? 3.5 : 2.2); if (cur) F.softDisc(g, x0, y, 120, 'rgba(255,210,140,A)', .3 * e);
    g.save(); g.globalAlpha = e; F.rich(g, String(i + 1), x0, y + 2, { size: 50, allGold: true, maxW: 80 }); g.restore();
    g.save(); g.globalAlpha = e * (cur ? 1 : .75); F.rich(g, it.title, x0 + 80 + (1 - e) * 30, y, { size: ts, align: 'left', maxW: Pt ? 700 : 1100, rev: (lt - at) * 1.4, glowAmt: cur ? 1.2 : .6 }); g.restore();
    if (i < n - 1) F.strokeG(g, c => { c.moveTo(x0, y + 52); c.lineTo(x0, y + gap - 52); }, 1.4, .4 * e, 4); });
});
// NEW — a single number from the brief (p.value, p.unit, p.label); counts up if numeric. Never invent numbers: SOURCES.md only.
ZD.scene('stat', (g, lt, d, t, sh) => {
  const L = ZD.L, p = sh.p, CX = L.CX, y = L.AY - (L.P ? 40 : 30), e = eo(lt / 1.2), v = String(p.value ?? '');
  const num = /^\d+(\.\d+)?$/.test(v), shown = num ? (v.includes('.') ? (parseFloat(v) * e).toFixed(v.split('.')[1].length) : String(Math.round(parseFloat(v) * e))) : v;
  F.rays(g, CX, y, 1100, 20, lt * .05, .06); F.softDisc(g, CX, y, 600 * L.K, 'rgba(255,200,120,A)', .25);
  F.ring(g, CX, y, (L.P ? 300 : 260), .5 * e, 2); F.strokeG(g, c => c.arc(CX, y, (L.P ? 320 : 280), -Math.PI / 2, -Math.PI / 2 + TAU * e), 5, 1, 18, GOLD_HI);
  const fs = (L.P ? 200 : 210) * Math.min(1, 3 / Math.max(1, shown.length));
  F.rich(g, shown, CX, y - (p.unit ? 34 : 0), { size: fs, allGold: true, maxW: L.P ? 520 : 460, glowAmt: 1.3 });
  if (p.unit) F.rich(g, p.unit, CX, y + fs * .5 + 20, { size: L.P ? 60 : 62, rev: (lt - .5) * 1.5, maxW: 420, color: INK });
  if (p.label) F.rich(g, p.label, CX, y + (L.P ? 420 : 350), { size: L.P ? 54 : 56, rev: (lt - .8) * 1.3, maxW: L.P ? 800 : 1300 });
});
// [release] the motif holds, then comes apart into rising light particles (letting go / ending)
ZD.scene('release', (g, lt, d, t, sh) => {
  const L = ZD.L, p = sh.p, CX = L.AX, AY = L.AY, disp = clamp((lt - d * .35) / (d * .6)), hold = 1 - ss(0, .8, disp);
  F.softDisc(g, CX, AY, 700 * L.K, 'rgba(150,100,40,A)', .25);
  F.motif(g, p.motif || 'glyph', CX, AY + 60 * L.K, .8 * L.K, hold, { fill: .5 * hold, bright: .3 * hold, t, text: p.glyph });
  if (disp > 0) F.particles(g, CX, AY, 420 * L.K, 260, lt, .9 * (1 - ss(.75, 1, disp) * .7), 5, eo(disp));
});
// [dawn] ending: sunrise over a horizon; cues with style 'center' become the big closing words (last one all-gold);
// p.motif (optional) walks toward the light and fades
ZD.scene('dawn', (g, lt, d, t, sh) => {
  const L = ZD.L, p = sh.p, CX = L.CX, W = L.W, hy = L.P ? 1250 : 820, rise = eo(lt / d);
  const sky = g.createLinearGradient(0, hy - 620, 0, hy); sky.addColorStop(0, 'rgba(0,0,0,0)'); sky.addColorStop(1, `rgba(190,120,50,${.25 + .25 * rise})`); g.fillStyle = sky; g.fillRect(0, hy - 620, W, 620);
  const sy = hy + 60 - 170 * rise; F.softDisc(g, L.AX, sy, 700, 'rgba(255,190,110,A)', .35 + .2 * rise);
  g.save(); g.beginPath(); g.rect(0, 0, W, hy); g.clip(); g.fillStyle = '#ffe2a8'; F.glow(g, 60, 'rgba(255,190,100,.9)'); g.beginPath(); g.arc(L.AX, sy, 110, 0, TAU); g.fill(); F.noGlow(g); g.restore();
  F.rays(g, L.AX, sy, 1300, 20, lt * .03, .05 + .05 * rise);
  g.fillStyle = 'rgba(8,6,4,.85)'; g.fillRect(0, hy, W, L.H - hy); F.strokeG(g, c => { c.moveTo(0, hy); c.lineTo(W, hy); }, 2, .8, 12, GOLD_HI);
  for (let i = 0; i < 6; i++) { const y = hy + 22 + i * 18; g.fillStyle = F.gl(.18 - i * .025); g.fillRect(L.AX - 160 - i * 50, y, 320 + i * 100, 2); }
  if (p.motif) { const s = .5 * L.K, wx = lerp(L.P ? 200 : 560, L.P ? 880 : 1500, ss(0, d, lt)), fa = 1 - ss(d - 4, d - 1.2, lt); F.motif(g, p.motif, wx, hy - 3 - F.motifH(p.motif) * s, s, .9 * fa, { fill: .9, bright: .3, glowAmt: .8, t, text: p.glyph }); }
  F.particles(g, L.AX, hy - 300, 700 * L.K, 120, lt, .4, 13, .3 + .2 * Math.sin(lt * .2));
  const lines = sh.cues.filter(c => c.style === 'center'), y0 = L.P ? 640 : 300, gap = L.P ? 190 : 170;
  lines.forEach((c, i) => { const rel = lt - (c.t0 - sh.t0), k = ss(-.2, .6, rel), last = i === lines.length - 1 && lines.length > 1; if (k <= 0) return;
    g.save(); g.globalAlpha = k; F.rich(g, F.autoBreak(g, c.text, last ? (L.P ? 120 : 150) : (L.P ? 76 : 92), L.CENTER_MAXW), CX, y0 + i * gap + (last ? 10 : 0), { size: last ? (L.P ? 120 : 150) : (L.P ? 76 : 92), rev: rel * 1.3, stagger: last ? .1 : .07, fade: .45, allGold: last, sheen: (lt * .25 % 1.6) - .3, maxW: L.CENTER_MAXW, glowAmt: last ? 1.3 : 1 }); g.restore(); });
});
})();
