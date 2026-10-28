// 知识大赏 (zhishi-dashang) engine — warm-black ground, gold line art, serif type, bloom + grain.
// 知识大赏 black-gold look, landscape 1920x1080 and portrait 1080x1920.
// Contract (shared by every style): index.html loads engine.js -> scenes.js -> motifs.js (project, optional);
//   window.ready (Promise) resolves after timeline.json + fonts are loaded; window.draw(t) paints frame t (pure function of t).
// Extension points: ZD.scene(name, fn(g, lt, d, t, shot)) and ZD.motif(name, fn(g, x, y, s, a, o), {h}) — see style.md.
(() => {
'use strict';
const ZD = window.ZD = {
  scenes: {}, motifs: {},
  scene(name, fn) { this.scenes[name] = fn; },
  motif(name, fn, meta = {}) { this.motifs[name] = { draw: fn, h: meta.h ?? 180 }; },   // h = half-height (px) at s = 1
};
const cv = document.getElementById('c'); const ctx = cv.getContext('2d');
// ───────── layouts (numbers taken from the two delivered cuts) ─────────
const LAYOUTS = {
  landscape: { W: 1920, H: 1080, P: false, CX: 960, AX: 960, AY: 470, K: 1, SPAN: 760, BAND_Y: 950, BAND_MAX: 1500, SUB: 58,
    HOOK_Y: 84, HOOK_W: 1200, HOOK_SIZE: 46, BIG: { x: 1340, y: 470, size: 104, maxW: 900 }, ART: { x: 580, y: 600 },
    CENTER_SIZE: 130, CENTER_MAXW: 1500, BG: [960, 480, 1.6, 1, 760] },
  // portrait keeps a short-video-app-safe column: text inside x 72–900, y 170–1480 (bottom 20 % / right 15 % stay clear of app UI)
  portrait: { W: 1080, H: 1920, P: true, CX: 480, AX: 490, AY: 820, K: .8, SPAN: 380, BAND_Y: 1380, BAND_MAX: 790, SUB: 56,
    HOOK_Y: 296, HOOK_W: 790, HOOK_SIZE: 54, BIG: { x: 480, y: 1110, size: 84, maxW: 790 }, ART: { x: 490, y: 700 },
    CENTER_SIZE: 100, CENTER_MAXW: 800, BG: [520, 860, 1, 1, 1050] },
};
let W = 1920, H = 1080, L = LAYOUTS.landscape, T = null, BEAT = .5314, B0 = .07;
// ───────── math ─────────
const mk = (w = W, h = H) => { const c = document.createElement('canvas'); c.width = w; c.height = h; return c; };
const clamp = (x, a = 0, b = 1) => Math.max(a, Math.min(b, x));
const lerp = (a, b, t) => a + (b - a) * t;
const ss = (a, b, x) => { const t = clamp((x - a) / (b - a)); return t * t * (3 - 2 * t); };
const eo = t => 1 - Math.pow(1 - clamp(t), 3);
const eio = t => { t = clamp(t); return t < .5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2; };
function rng(seed) { return () => { seed |= 0; seed = seed + 0x6D2B79F5 | 0; let t = Math.imul(seed ^ seed >>> 15, 1 | seed); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
const TAU = Math.PI * 2;
const INK = '#efe8d8', GOLD = '#dcb86c', GOLD_HI = '#fff1c6', GOLD_DK = '#8f6a32';
const gl = a => `rgba(236,196,118,${a})`;
const font = (s, w = 700) => `${w} ${s}px SerifSC`;
const beatPh = t => (((t - B0) / BEAT) % 1 + 1) % 1;
const pulse = (t, k = 7) => Math.exp(-beatPh(t) * k);
let NEB, VIG, GRAIN = [], STARS = [], DUST = [], LAYER = [], BLOOM, BCTX;
function init() {
  const r = rng(1949);
  NEB = mk(960, 540); const n = NEB.getContext('2d');
  for (let i = 0; i < 46; i++) {
    const x = r() * 960, y = r() * 540, rad = 60 + r() * 220, a = .03 + r() * .07, warm = r();
    const g = n.createRadialGradient(x, y, 0, x, y, rad);
    g.addColorStop(0, warm > .4 ? `rgba(120,82,34,${a})` : `rgba(60,44,30,${a})`); g.addColorStop(1, 'rgba(0,0,0,0)');
    n.fillStyle = g; n.fillRect(0, 0, 960, 540);
  }
  VIG = mk(); const v = VIG.getContext('2d');
  v.save(); v.translate(W / 2, H * .47); if (W > H) v.scale(1, H / W); else v.scale(W / H, 1);
  const R = Math.max(W, H), vg = v.createRadialGradient(0, 0, R * .2, 0, 0, R * .62);
  vg.addColorStop(0, 'rgba(0,0,0,0)'); vg.addColorStop(.6, 'rgba(0,0,0,.35)'); vg.addColorStop(1, 'rgba(0,0,0,.92)');
  v.fillStyle = vg; v.fillRect(-R, -R, R * 2, R * 2); v.restore();
  for (let k = 0; k < 6; k++) {
    const c = mk(960, 540), g = c.getContext('2d'), im = g.createImageData(960, 540), rr2 = rng(77 + k);
    for (let i = 0; i < im.data.length; i += 4) { const val = 128 + (rr2() + rr2() + rr2() - 1.5) * 120; im.data[i] = im.data[i + 1] = im.data[i + 2] = val; im.data[i + 3] = 255; }
    g.putImageData(im, 0, 0); GRAIN.push(c);
  }
  for (let i = 0; i < 200; i++) STARS.push({ x: r() * W, y: r() * H, s: .6 + r() * 1.8, ph: r() * TAU, sp: .5 + r() * 2, z: .2 + r() * .6 });
  for (let i = 0; i < 120; i++) DUST.push({ x: r() * W, y: r() * H, z: .25 + Math.pow(r(), 2.2) * 1.9, ph: r() * TAU, vy: 8 + r() * 30, sw: 10 + r() * 40, fl: .3 + r() * 1.5 });
  LAYER = [mk(), mk()];
  BLOOM = mk(W / 4, H / 4); BCTX = BLOOM.getContext('2d');
}
// ───────── drawing helpers (verbatim from white-bear unless noted) ─────────
function goldLine(g, x0, x1, sheen = .5) {
  const gr = g.createLinearGradient(x0, 0, x1, 0);
  const st = [[0, '#a87b34'], [1, '#b0833a']];
  const s = sheen; [[s - .22, '#e2bd6c'], [s, '#fff4d2'], [s + .22, '#e2bd6c']].forEach(([o, c]) => { if (o > 0 && o < 1) st.push([o, c]); });
  st.push([.5, '#e8c676']);
  st.sort((a, b) => a[0] - b[0]).forEach(([o, c]) => gr.addColorStop(o, c));
  return gr;
}
function glow(g, blur = 18, col = 'rgba(255,196,96,.75)') { g.shadowColor = col; g.shadowBlur = blur; }
function noGlow(g) { g.shadowBlur = 0; g.shadowColor = 'transparent'; }
function parseRich(text) {
  return text.split('/').map(l => { const out = []; let gold = false; for (const ch of l) { if (ch === '[') { gold = true; continue; } if (ch === ']') { gold = false; continue; } out.push({ ch, gold }); } return out; });
}
// NEW: auto line-break for narrow (portrait) columns. Keeps [gold] spans intact across the break; prefers punctuation.
function autoBreak(g, text, size, maxW, weight = 700) {
  if (text.includes('/')) return text;
  g.font = font(size, weight);
  const chars = parseRich(text)[0], w = cs => cs.reduce((a, c) => a + g.measureText(c.ch).width, 0);
  if (w(chars) <= maxW) return text;
  const lines = []; let rest = chars;
  while (rest.length && w(rest) > maxW) {
    let best = -1, bestScore = 1e9;
    for (let i = 2; i < rest.length - 1; i++) {
      const head = rest.slice(0, i), hw = w(head); if (hw > maxW) break;
      const punct = '，、：；。！？,'.includes(rest[i - 1].ch) ? 0 : 1, nLeft = Math.ceil(w(rest.slice(i)) / maxW);
      const score = punct * 3 + Math.abs(hw - w(rest) / (nLeft + 1)) / maxW * 4 + (rest[i - 1].gold && rest[i].gold ? .6 : 0);
      if (score < bestScore) { bestScore = score; best = i; }
    }
    if (best < 0) best = Math.max(1, Math.floor(rest.length / 2));
    lines.push(rest.slice(0, best)); rest = rest.slice(best);
  }
  lines.push(rest);
  return lines.map(l => { let s = '', gold = false; for (const c of l) { if (c.gold !== gold) { s += c.gold ? '[' : ']'; gold = c.gold; } s += c.ch; } return s + (gold ? ']' : ''); }).join('/');
}
function layout(g, text, size, weight, maxW) {
  const lines = parseRich(text); let s = size;
  for (;;) {
    g.font = font(s, weight);
    const ws = lines.map(l => { let x = 0; for (const c of l) { c.w = g.measureText(c.ch).width; x += c.w; } return x; });
    if (Math.max(...ws) <= maxW || s <= 24) return { lines, ws, size: s };
    s -= 2;
  }
}
// rich text: per-character reveal; o = {size, weight, lh, maxW, rev (s since start), stagger, fade, alpha, allGold, sheen, align, glowAmt, color}
function rich(g, text, cx, cy, o = {}) {
  const L0 = layout(g, text, o.size || 56, o.weight || 700, o.maxW || 800);
  const s = L0.size, lh = s * (o.lh || 1.52), n = L0.lines.length;
  const st = o.stagger ?? .035, fd = o.fade ?? .32, rev = o.rev ?? 99, A = o.alpha ?? 1;
  g.font = font(s, o.weight || 700); g.textBaseline = 'middle'; g.textAlign = 'left';
  const base = g.globalAlpha; let k = 0;
  L0.lines.forEach((line, li) => {
    const w = L0.ws[li]; let x = o.align === 'left' ? cx : cx - w / 2; const y = cy + (li - (n - 1) / 2) * lh;
    const gg = goldLine(g, x, x + w, o.sheen ?? .5);
    for (const c of line) {
      const a = clamp((rev - k * st) / fd); k++;
      if (a > 0 && c.ch !== ' ') {
        const dy = (1 - eo(a)) * s * .28;
        g.globalAlpha = base * A * a;
        if (c.gold || o.allGold) { g.fillStyle = gg; glow(g, (o.glowAmt ?? 1) * s * .42, 'rgba(255,190,90,.55)'); }
        else { g.fillStyle = o.color || INK; glow(g, s * .3, 'rgba(0,0,0,.85)'); }
        g.fillText(c.ch, x, y + dy);
      }
      x += c.w;
    }
  });
  noGlow(g); g.globalAlpha = base;
  return { size: s, h: lh * n, ws: L0.ws };
}
function strokeG(g, fn, w = 3, a = 1, blur = 14, col = GOLD) {
  g.save(); g.globalAlpha *= a; g.strokeStyle = col; g.lineWidth = w; g.lineCap = 'round'; g.lineJoin = 'round';
  glow(g, blur); g.beginPath(); fn(g); g.stroke(); g.restore();
}
function rr(g, x, y, w, h, r) { g.moveTo(x + r, y); g.arcTo(x + w, y, x + w, y + h, r); g.arcTo(x + w, y + h, x, y + h, r); g.arcTo(x, y + h, x, y, r); g.arcTo(x, y, x + w, y, r); g.closePath(); }
function sparkle(g, x, y, s, a) {
  g.save(); g.globalAlpha = a; g.globalCompositeOperation = 'lighter';
  const gr = g.createRadialGradient(x, y, 0, x, y, s); gr.addColorStop(0, 'rgba(255,240,200,.9)'); gr.addColorStop(.25, 'rgba(255,200,110,.35)'); gr.addColorStop(1, 'rgba(255,180,80,0)');
  g.fillStyle = gr; g.beginPath(); g.arc(x, y, s, 0, TAU); g.fill();
  g.fillStyle = 'rgba(255,236,190,.85)';
  g.beginPath(); g.moveTo(x - s * 1.6, y); g.lineTo(x, y - s * .06); g.lineTo(x + s * 1.6, y); g.lineTo(x, y + s * .06); g.closePath(); g.fill();
  g.beginPath(); g.moveTo(x, y - s * 1.6); g.lineTo(x + s * .06, y); g.lineTo(x, y + s * 1.6); g.lineTo(x - s * .06, y); g.closePath(); g.fill();
  g.restore();
}
function rays(g, x, y, R, n, rot, a) {
  g.save(); g.globalCompositeOperation = 'lighter'; g.translate(x, y); g.rotate(rot);
  for (let i = 0; i < n; i++) {
    const an = i / n * TAU, w = .05 + .04 * Math.sin(i * 7.3);
    const gr = g.createRadialGradient(0, 0, 0, 0, 0, R); gr.addColorStop(0, `rgba(255,200,110,${a})`); gr.addColorStop(1, 'rgba(255,180,80,0)');
    g.fillStyle = gr; g.beginPath(); g.moveTo(0, 0); g.arc(0, 0, R, an - w, an + w); g.closePath(); g.fill();
  }
  g.restore();
}
function softDisc(g, x, y, R, col, a) {
  const gr = g.createRadialGradient(x, y, 0, x, y, R); gr.addColorStop(0, col.replace('A', a)); gr.addColorStop(1, col.replace('A', 0));
  g.fillStyle = gr; g.beginPath(); g.arc(x, y, R, 0, TAU); g.fill();
}
function checkMark(g, x, y, s, p, a = 1) {
  if (p <= 0) return;
  strokeG(g, c => { const pts = [[-.5, 0], [-.15, .38], [.55, -.45]]; const L1 = .5, tot = 1.6; const d = p * tot;
    c.moveTo(x + pts[0][0] * s, y + pts[0][1] * s);
    const l1 = Math.min(d / L1, 1); c.lineTo(x + lerp(pts[0][0], pts[1][0], l1) * s, y + lerp(pts[0][1], pts[1][1], l1) * s);
    if (d > L1) { const l2 = Math.min((d - L1) / (tot - L1), 1); c.lineTo(x + lerp(pts[1][0], pts[2][0], l2) * s, y + lerp(pts[1][1], pts[2][1], l2) * s); }
  }, s * .14, a, s * .5, GOLD_HI);
}
function crossMark(g, x, y, s, p, a = 1) {   // NEW: gold X drawn on (p 0..1)
  if (p <= 0) return; const e = eo(p);
  strokeG(g, c => { c.moveTo(x - s * e, y - s * .8 * e); c.lineTo(x + s * e, y + s * .8 * e); c.moveTo(x + s * e, y - s * .8 * e); c.lineTo(x - s * e, y + s * .8 * e); }, Math.max(3, s * .1), a, 16, GOLD_HI);
}
function figure(g, x, y, s, a) {   // head + shoulders line figure; (x,y) = bottom of torso
  g.save(); g.globalAlpha *= a;
  const hr = 24 * s, top = y - 150 * s;
  strokeG(g, c => { c.moveTo(x + hr, top + hr); c.arc(x, top + hr, hr, 0, TAU); }, 3.2 * s + .6, 1, 10);
  strokeG(g, c => { c.moveTo(x - 60 * s, y); c.bezierCurveTo(x - 62 * s, top + 70 * s, x - 30 * s, top + 58 * s, x, top + 58 * s); c.bezierCurveTo(x + 30 * s, top + 58 * s, x + 62 * s, top + 70 * s, x + 60 * s, y); }, 3.2 * s + .6, 1, 10);
  g.restore();
}
function silhouette(g, x, y, s, a, rim = 1) {   // "你": filled head-and-shoulders with gold rim light; (x,y) = chin-ish centre
  g.save(); g.globalAlpha *= a;
  const path = c => { c.beginPath(); c.ellipse(x, y - 120 * s, 70 * s, 86 * s, 0, 0, TAU);
    c.moveTo(x - 210 * s, y + 260 * s); c.bezierCurveTo(x - 205 * s, y + 70 * s, x - 120 * s, y + 20 * s, x - 40 * s, y + 6 * s); c.lineTo(x - 34 * s, y - 40 * s); c.lineTo(x + 34 * s, y - 40 * s); c.lineTo(x + 40 * s, y + 6 * s);
    c.bezierCurveTo(x + 120 * s, y + 20 * s, x + 205 * s, y + 70 * s, x + 210 * s, y + 260 * s); c.closePath(); };
  const gr = g.createLinearGradient(x, y - 210 * s, x, y + 260 * s); gr.addColorStop(0, '#2a2013'); gr.addColorStop(1, '#0b0906');
  path(g); g.fillStyle = gr; g.fill();
  g.globalAlpha *= rim; g.strokeStyle = GOLD_HI; g.lineWidth = 2.5; glow(g, 22); path(g); g.stroke();
  g.restore();
}
function astrolabe(g, x, y, R, rot, lit, a, t) {
  g.save(); g.globalAlpha *= a; g.translate(x, y); g.rotate(rot);
  const r2 = R * .72, r3 = R * .26;
  for (let k = 0; k < 12; k++) {
    const Lk = clamp(lit - k); if (Lk <= 0) continue;
    const a0 = k / 12 * TAU, a1 = (k + 1) / 12 * TAU;
    g.fillStyle = gl(.05 + .16 * Lk * (1 - .5 * clamp(lit - k - 1.5))); g.beginPath(); g.arc(0, 0, R, a0, a1); g.arc(0, 0, r2, a1, a0, true); g.closePath(); g.fill();
    sparkle(g, Math.cos((a0 + a1) / 2) * (R + r2) / 2, Math.sin((a0 + a1) / 2) * (R + r2) / 2, 18 * Lk, Lk * (.6 + .4 * Math.sin(t * 3 + k)));
  }
  strokeG(g, c => { c.arc(0, 0, R, 0, TAU); }, 3, 1, 16);
  strokeG(g, c => { c.moveTo(R * 1.06, 0); c.arc(0, 0, R * 1.06, 0, TAU); }, 1.2, .5, 6);
  strokeG(g, c => { c.moveTo(r2, 0); c.arc(0, 0, r2, 0, TAU); c.moveTo(r3, 0); c.arc(0, 0, r3, 0, TAU); }, 2, .9, 12);
  strokeG(g, c => { for (let k = 0; k < 12; k++) { const an = k / 12 * TAU; c.moveTo(Math.cos(an) * r3, Math.sin(an) * r3); c.lineTo(Math.cos(an) * R, Math.sin(an) * R); } }, 1.6, .75, 8);
  strokeG(g, c => { for (let k = 0; k < 72; k++) { const an = k / 72 * TAU, l = k % 6 ? .97 : .93; c.moveTo(Math.cos(an) * R, Math.sin(an) * R); c.lineTo(Math.cos(an) * R * l, Math.sin(an) * R * l); } }, 1.2, .7, 4);
  g.restore();
}
function mirrorFrame(g, x, y, rx, ry, a, t) {
  const shape = (c, k) => c.ellipse(x, y, rx * k, ry * k, 0, 0, TAU);
  strokeG(g, c => shape(c, 1.0), 7, a, 26);
  strokeG(g, c => shape(c, 1.055), 2, a * .8, 10, GOLD_HI);
  strokeG(g, c => shape(c, .965), 1.5, a * .6, 6);
  g.save(); g.globalAlpha *= a;
  for (let i = 0; i < 40; i++) { const an = i / 40 * TAU; const bx = x + Math.cos(an) * rx * 1.1, by = y + Math.sin(an) * ry * 1.1;
    g.fillStyle = gl(.55 + .45 * Math.sin(t * 2 + i * .7)); g.beginPath(); g.arc(bx, by, 3.6, 0, TAU); g.fill(); }
  sparkle(g, x, y - ry * 1.1 - 20, 22, .8 + .2 * Math.sin(t * 3));
  g.restore();
}
function cardShape(g, x, y, w, h, a, tag) {
  g.save(); g.globalAlpha *= a;
  g.fillStyle = 'rgba(18,13,7,.82)'; g.beginPath(); rr(g, x - w / 2, y - h / 2, w, h, 18); g.fill();
  strokeG(g, c => rr(c, x - w / 2, y - h / 2, w, h, 18), 3, 1, 18);
  strokeG(g, c => rr(c, x - w / 2 + 14, y - h / 2 + 14, w - 28, h - 28, 10), 1.2, .55, 4);
  strokeG(g, c => { [[-1, -1], [1, -1], [-1, 1], [1, 1]].forEach(([sx, sy]) => { const cx = x + sx * (w / 2 - 30), cy = y + sy * (h / 2 - 30);
    c.moveTo(cx, cy); c.lineTo(cx - sx * 34, cy); c.moveTo(cx, cy); c.lineTo(cx, cy - sy * 34); }); }, 2, .9, 8, GOLD_HI);
  if (tag) { const tx = x + w / 2 - 110, ty = y - h / 2 + 62;
    g.font = font(28, 400); g.textAlign = 'center'; g.textBaseline = 'middle';
    strokeG(g, c => rr(c, tx - 40, ty - 22, 80, 44, 8), 1.5, .85, 6); g.fillStyle = GOLD; g.fillText(tag, tx, ty + 1); }
  g.restore();
}
function pill(g, text, x, y, size, a = 1) {   // NEW (from the covers' badge): dark capsule with gold rim + text
  g.save(); g.globalAlpha *= a; g.font = font(size); const w = g.measureText(text).width + size * 1.6, h = size * 1.6;
  g.fillStyle = 'rgba(16,11,6,.88)'; g.beginPath(); rr(g, x - w / 2, y - h / 2, w, h, h / 2); g.fill(); g.restore();
  strokeG(g, c => rr(c, x - w / 2, y - h / 2, w, h, h / 2), 2, a * .9, 10);
  g.save(); g.globalAlpha *= a; rich(g, text, x, y + 1, { size, maxW: 2000 }); g.restore();
  return w;
}
function paper(g, x, y, s, rot, a, glowL = 0, same = 0, seed = 1) {
  g.save(); g.translate(x, y); g.rotate(rot); g.globalAlpha *= a;
  const w = 74 * s, h = 52 * s;
  g.fillStyle = `rgba(${lerp(200, 255, glowL)},${lerp(190, 236, glowL)},${lerp(160, 190, glowL)},.92)`; glow(g, 10 + glowL * 30, 'rgba(255,200,110,.6)');
  g.beginPath(); g.moveTo(-w / 2, -h / 2); g.lineTo(w / 2, -h / 2); g.lineTo(w / 2, h / 2); g.lineTo(-w / 2, h / 2); g.closePath(); g.fill(); noGlow(g);
  const r = rng(seed);
  g.strokeStyle = same > 0 ? `rgba(160,110,30,${.6 + .4 * same})` : 'rgba(90,70,40,.7)'; g.lineWidth = 2.2 * s; g.lineCap = 'round';
  for (let i = 0; i < 4; i++) { const yy = -h / 2 + (i + 1) * h / 5, wr = lerp(.45 + r() * .5, [.9, .8, .85, .55][i], same); g.beginPath(); g.moveTo(-w / 2 + 8 * s, yy); g.lineTo(-w / 2 + 8 * s + (w - 16 * s) * wr, yy); g.stroke(); }
  g.restore();
}
function brain(g, x, y, s, a = 1) {
  g.save(); g.translate(x, y); g.scale(s, s);
  strokeG(g, c => { for (let i = 0; i <= 160; i++) { const th = i / 160 * TAU, r = 1 + .045 * Math.sin(th * 9 + 1) + .03 * Math.sin(th * 15); const px = Math.cos(th) * 300 * r; let py = Math.sin(th) * 215 * r; if (py > 120) py = 120 + (py - 120) * .45; i ? c.lineTo(px, py) : c.moveTo(px, py); } }, 4 / s, a, 18, GOLD);
  strokeG(g, c => {
    c.moveTo(-40, -205); c.bezierCurveTo(-10, -120, 40, -60, 10, 20);
    c.moveTo(-250, 20); c.bezierCurveTo(-150, -10, -60, 40, 60, 60); c.bezierCurveTo(140, 70, 200, 40, 280, 60);
    for (let k = 0; k < 6; k++) { const ax = -230 + k * 85, ay = -110 + (k % 2) * 40; c.moveTo(ax, ay); c.bezierCurveTo(ax + 25, ay - 40, ax + 55, ay + 30, ax + 70, ay - 10); }
    c.moveTo(150, 120); c.bezierCurveTo(170, 170, 160, 230, 140, 270);
  }, 2 / s, a * .55, 8, GOLD);
  g.restore();
}
function eye(g, x, y, w, open, look, a = 1) {
  if (a <= 0.003) return;
  const h = w * .42 * open;
  g.save(); g.globalAlpha *= a;
  const almond = c => { c.moveTo(x - w / 2, y); c.quadraticCurveTo(x, y - h * 1.6, x + w / 2, y); c.quadraticCurveTo(x, y + h * 1.6, x - w / 2, y); };
  g.fillStyle = 'rgba(10,7,4,.85)'; g.beginPath(); almond(g); g.fill();
  if (open > .05) { g.save(); g.beginPath(); almond(g); g.clip(); const ix = x + look * w * .22, R = w * .2;
    const ig = g.createRadialGradient(ix, y, 0, ix, y, R); ig.addColorStop(0, '#fff1c6'); ig.addColorStop(.35, '#e8b45a'); ig.addColorStop(.8, '#7a5120'); ig.addColorStop(1, 'rgba(60,40,15,0)');
    g.fillStyle = ig; g.beginPath(); g.arc(ix, y, R, 0, TAU); g.fill(); g.fillStyle = '#0a0705'; g.beginPath(); g.arc(ix, y, R * .36, 0, TAU); g.fill();
    g.fillStyle = 'rgba(255,250,230,.9)'; g.beginPath(); g.arc(ix - R * .3, y - R * .3, R * .12, 0, TAU); g.fill(); g.restore(); }
  g.restore();
  strokeG(g, almond, 3.5, a, 18, GOLD_HI);
  for (let i = 0; i < 9; i++) { const u = (i - 4) / 4, px = x + u * w * .4, py = y - h * 1.6 * (1 - u * u) * .5 - 6; strokeG(g, c => { c.moveTo(px, py); c.lineTo(px + u * 14, py - 22 * open); }, 2, a * .6 * open, 6); }
}
function bellShape(g, x, y, s, a, swing) {
  g.save(); g.globalAlpha *= a; g.translate(x, y); g.rotate(swing); g.scale(s, s);
  const body = c => { c.moveTo(-14, 0); c.bezierCurveTo(-60, 10, -70, 120, -110, 175); c.lineTo(110, 175); c.bezierCurveTo(70, 120, 60, 10, 14, 0); c.closePath(); };
  g.fillStyle = 'rgba(30,20,8,.9)'; g.beginPath(); body(g); g.fill();
  strokeG(g, body, 4 / s, 1, 18, GOLD); strokeG(g, c => { c.moveTo(-100, 160); c.lineTo(100, 160); c.moveTo(0, 0); c.lineTo(0, -24); c.arc(0, -34, 10, Math.PI / 2, Math.PI * 2.5); }, 2.5 / s, 1, 8, GOLD_HI);
  g.save(); g.rotate(-swing * 1.6); g.fillStyle = GOLD_HI; glow(g, 16); g.beginPath(); g.arc(0, 190, 14, 0, TAU); g.fill(); noGlow(g); g.restore();
  g.restore();
}
function frag(g, x, y, w, h, rot, a, sharp = 1, seed = 1, warm = 0) {   // glowing photo-like memory/info card
  if (a <= 0.003) return;
  g.save(); g.translate(x, y); g.rotate(rot); g.globalAlpha *= a;
  if (sharp < .98) g.filter = `blur(${((1 - sharp) * 7).toFixed(1)}px)`;
  const r = rng(seed), kind = Math.floor(r() * 4);
  g.fillStyle = `rgba(${Math.round(lerp(26, 70, warm))},${Math.round(lerp(19, 48, warm))},${Math.round(lerp(10, 22, warm))},.88)`; g.beginPath(); rr(g, -w / 2, -h / 2, w, h, 8); g.fill();
  g.save(); g.beginPath(); rr(g, -w / 2 + 8, -h / 2 + 8, w - 16, h - 16, 4); g.clip();
  const sk = (fn, lw = 2.2, al = .85) => strokeG(g, fn, lw, al, 6, GOLD);
  if (kind === 0) { sk(c => { c.moveTo(-w / 2, h * .2); for (let i = 0; i <= 10; i++) c.lineTo(-w / 2 + i * w / 10, h * .2 - Math.sin(i * 1.3 + r() * 3) * h * .12 - (i % 3) * h * .05); }); g.fillStyle = GOLD_HI; glow(g, 14); g.beginPath(); g.arc(w * .22, -h * .18, h * .1, 0, TAU); g.fill(); noGlow(g); }
  else if (kind === 1) { [-.16, .16].forEach((dx, i) => sk(c => { const cx = dx * w, hh = h * (i ? .22 : .26); c.moveTo(cx + hh * .45, -h * .1); c.arc(cx, -h * .1, hh * .45, 0, TAU); c.moveTo(cx - hh, h * .5); c.quadraticCurveTo(cx, h * .02, cx + hh, h * .5); })); }
  else if (kind === 2) { for (let i = 0; i < 4; i++) sk(c => { const yy = -h * .3 + i * h * .2; c.moveTo(-w * .38, yy); c.lineTo(-w * .38 + w * (.4 + r() * .35), yy); }, 2.5, .6); }
  else { sk(c => { c.moveTo(-w * .3, h * .35); c.lineTo(-w * .3, -h * .1); c.lineTo(0, -h * .32); c.lineTo(w * .3, -h * .1); c.lineTo(w * .3, h * .35); c.moveTo(-w * .08, h * .35); c.lineTo(-w * .08, h * .08); c.lineTo(w * .08, h * .08); c.lineTo(w * .08, h * .35); }); }
  g.restore();
  strokeG(g, c => rr(c, -w / 2, -h / 2, w, h, 8), 2.2, .9, 14, GOLD);
  g.filter = 'none'; g.restore();
}
const FR = (() => { const r = rng(808), a = []; for (let i = 0; i < 40; i++) a.push({ x: r(), y: r(), z: .4 + r() * .9, rot: (r() - .5) * .5, ph: r() * TAU, seed: 100 + i, sp: .3 + r() * .7 }); return a; })();
function drift(g, lt, n, a, opt = {}) {    // background field of blurred fragments (parallax by z); orientation-aware
  const span = W + 380, top = H * .11, hgt = H * .7;
  FR.slice(0, n).forEach(f => { const s = f.z * (L.P ? .8 : 1), x = ((f.x * span + lt * 18 * s * (opt.dir || 1)) % span + span) % span - 190, y = top + f.y * hgt + Math.sin(lt * .5 * f.sp + f.ph) * 20;
    frag(g, x, y, 150 * s, 104 * s, f.rot + Math.sin(lt * .3 + f.ph) * .05, a * (.25 + .35 * f.z), opt.sharp ?? clamp(f.z - .3), f.seed, opt.warm || 0); });
}
function particles(g, x, y, R, n, lt, a, seed = 3, spread = 0) {
  const r = rng(seed);
  for (let i = 0; i < n; i++) { const an = r() * TAU, d = Math.sqrt(r()) * R, up = r(), sp = .5 + r();
    const px = x + Math.cos(an) * d * (1 + spread * 1.6) + Math.sin(lt * sp + i) * 12 * spread, py = y + Math.sin(an) * d * .7 - spread * (120 + 260 * up) * sp;
    const al = a * (1 - spread * (.4 + .6 * up)) * (.5 + .5 * Math.sin(lt * 2 * sp + i));
    if (al > .01) { g.fillStyle = `rgba(255,${200 + Math.round(up * 40)},${130 + Math.round(up * 60)},${al})`; g.beginPath(); g.arc(px, py, 1.4 + r() * 2.4, 0, TAU); g.fill(); } }
}
function ring(g, x, y, R, a, lw = 2, sy = 1) { if (a > .005 && R > 0) strokeG(g, c => { c.ellipse(x, y, R, R * sy, 0, 0, TAU); }, lw, a, 12, GOLD_HI); }
// motif dispatcher: (x,y) = visual centre, s = 1 ≈ 360 px wide. Unknown names throw (typos fail the render, not silently).
function motif(g, name, x, y, s, a = 1, o = {}) {
  if (!name || a <= .003) return; const m = ZD.motifs[name];
  if (!m) throw new Error(`unknown motif "${name}" — register it with ZD.motif() in motifs.js or pick one from style.md`);
  if (o.bright) { softDisc(g, x, y, m.h * s * 1.6, 'rgba(255,205,130,A)', .25 * o.bright * a); }
  g.save(); m.draw(g, x, y, s, a, o); g.restore();
}
const motifH = name => (ZD.motifs[name] || { h: 180 }).h;
// ───────── global layers ─────────
function background(g, t) {
  const [bx, by, sx, sy, R] = L.BG;
  g.fillStyle = '#060504'; g.fillRect(0, 0, W, H);
  g.save(); g.translate(bx, by); g.scale(sx, sy); softDisc(g, 0, 0, R, 'rgba(84,58,26,A)', .5 + .08 * Math.sin(t * .4)); g.restore();
  g.save(); g.globalAlpha = .9; const ox = Math.sin(t * .05) * 80 - 80, oy = Math.cos(t * .04) * 50 - 50; g.drawImage(NEB, ox, oy, W * 1.12, H * 1.12); g.restore();
  STARS.forEach(s => { const x = L.P ? s.x : (s.x - t * 5 * s.z + W) % W, y = L.P ? (s.y - t * 4 * s.z + H) % H : s.y; g.fillStyle = `rgba(230,200,150,${(.1 + .2 * (.5 + .5 * Math.sin(t * s.sp + s.ph))) * s.z})`; g.fillRect(x, y, s.s, s.s); });
}
function dust(g, t) {
  g.save(); g.globalCompositeOperation = 'lighter';
  DUST.forEach(p => {
    const y = ((p.y - t * p.vy * p.z) % (H + 200) + H + 200) % (H + 200) - 100, x = p.x + Math.sin(t * .3 * p.fl + p.ph) * p.sw * p.z + t * 6 * p.z;
    const xx = ((x % (W + 200)) + W + 200) % (W + 200) - 100, fl = .55 + .45 * Math.sin(t * p.fl * 2 + p.ph);
    if (p.z > 1.3) softDisc(g, xx, y, 10 * p.z * p.z, 'rgba(255,200,120,A)', .10 * fl);
    else { g.fillStyle = `rgba(255,214,140,${.55 * fl * p.z})`; g.beginPath(); g.arc(xx, y, 1.1 + p.z * 1.6, 0, TAU); g.fill(); }
  });
  g.restore();
}
// persistent top hook line (hidden while a title card is on screen)
function hook(g, t) {
  if (!T.hook) return;
  let a = 1;
  T.shots.forEach(s => { if (s.scene === 'title' || s.hide_hook) a = Math.min(a, 1 - ss(s.t0 - .1, s.t0 + .3, t) + ss(s.t1 - .2, s.t1 + .4, t)); });
  if (a <= 0) return;
  const y = L.HOOK_Y, hw = L.P ? 330 : 380;
  g.save(); g.globalAlpha = clamp(a);
  if (L.P) softDisc(g, L.CX, y, 520, 'rgba(0,0,0,A)', .45); else { g.save(); g.translate(L.CX, y + 4); g.scale(2.4, 1); softDisc(g, 0, 0, 300, 'rgba(0,0,0,A)', .45); g.restore(); }
  rich(g, T.hook, L.CX, y, { size: L.HOOK_SIZE, allGold: L.P, sheen: (t * .12 % 1.6) - .3, maxW: L.HOOK_W, glowAmt: .6 });
  strokeG(g, c => { c.moveTo(L.CX - hw, y + 44 + (L.P ? 10 : 0)); c.lineTo(L.CX - 18, y + 44 + (L.P ? 10 : 0)); c.moveTo(L.CX + 18, y + 44 + (L.P ? 10 : 0)); c.lineTo(L.CX + hw, y + 44 + (L.P ? 10 : 0)); }, 1.2, .55, 4);
  g.fillStyle = GOLD; g.save(); g.translate(L.CX, y + 44 + (L.P ? 10 : 0)); g.rotate(Math.PI / 4); g.fillRect(-5, -5, 10, 10); g.restore();
  g.restore();
}
// subtitles: style 'band' (default) | 'big' (large text at L.BIG, used by hook shots) | 'center'/'none' (drawn by the scene)
const bandCache = {};
function bandText(g, text, size, maxW) {
  const key = text + size + maxW; if (bandCache[key]) return bandCache[key];
  let best;
  if (L.P) best = autoBreak(g, text, size, maxW);
  else {   // landscape: one line when it fits, else split at the best '/' into two lines
    const parts = text.split('/'); best = parts.join('');
    g.font = font(size); const w = s => g.measureText(s.replace(/[\[\]]/g, '')).width;
    if (w(best) > maxW && parts.length > 1) {
      let bi = 1, bw = 1e9;
      for (let i = 1; i < parts.length; i++) { const m = Math.max(w(parts.slice(0, i).join('')), w(parts.slice(i).join(''))); if (m < bw) { bw = m; bi = i; } }
      best = parts.slice(0, bi).join('') + '/' + parts.slice(bi).join('');
    } else if (w(best) > maxW) best = autoBreak(g, best, size, maxW);
  }
  return (bandCache[key] = best);
}
function subtitles(g, t) {
  T.cues.forEach(c => {
    const st = c.style || 'band';
    if (!(st === 'band' || st === 'big') || t < c.t0 - .01 || t > c.t1 + .3) return;
    const big = st === 'big', first = c.t0 === 0, size = big ? L.BIG.size : L.SUB;
    const out = 1 - ss(c.t1 - .05, c.t1 + .25, t), lt = t - c.t0, maxW = big ? L.BIG.maxW : L.BAND_MAX;
    const text = big ? autoBreak(g, c.text, size, maxW) : bandText(g, c.text, size, maxW);
    const x = big ? L.BIG.x : L.CX, nl = text.split('/').length, y = big ? L.BIG.y : L.BAND_Y - (nl - 1) * (L.P ? 0 : 20);
    if (!big) { g.save(); g.globalAlpha = out;
      if (L.P) softDisc(g, L.CX, y, 560, 'rgba(0,0,0,A)', .5);
      else { const gr = g.createLinearGradient(0, 820, 0, H); gr.addColorStop(0, 'rgba(0,0,0,0)'); gr.addColorStop(.5, 'rgba(0,0,0,.45)'); gr.addColorStop(1, 'rgba(0,0,0,.55)'); g.fillStyle = gr; g.fillRect(0, 820, W, H - 820); }
      g.restore(); }
    const ah = Math.exp(-Math.max(0, lt - .1) * 5);
    rich(g, text, x, y, { size, rev: first ? 99 : lt * 1.25, stagger: .028, fade: .3, alpha: out, maxW, glowAmt: 1 + ah, lh: 1.42 });
  });
}
function flashes(g, t) {
  let a = 0;
  T.sfx.forEach(e => { if (e.kind === 'impact' || e.kind === 'stamp') { const dt = t - e.t; if (dt >= 0 && dt < 1) a = Math.max(a, (e.kind === 'stamp' ? .12 : .2) * Math.exp(-dt * 7)); } });
  if (a > .003) { g.save(); g.globalCompositeOperation = 'lighter'; g.translate(L.BG[0], L.BG[1]); g.scale(L.BG[2], L.BG[3]); softDisc(g, 0, 0, L.P ? 1200 : 800, 'rgba(255,214,150,A)', a); g.restore(); }
  const sh = T.shots.find(s => t >= s.t0 && t < s.t1) || T.shots[T.shots.length - 1];
  const p = (t - sh.t0) / 2.2;
  if (p >= 0 && p < 1 && sh.id > 1) { g.save(); g.globalCompositeOperation = 'lighter'; g.globalAlpha = Math.sin(p * Math.PI) * .5;
    const hw = L.P ? 260 : 300, x = lerp(-400, W + 480, p); const gr = g.createLinearGradient(x - hw, 0, x + hw, 0); gr.addColorStop(0, 'rgba(255,170,80,0)'); gr.addColorStop(.5, 'rgba(255,170,80,.10)'); gr.addColorStop(1, 'rgba(255,170,80,0)');
    g.setTransform(1, 0, -.5, 1, L.P ? 480 : 270, 0); g.fillStyle = gr; g.fillRect(x - hw, 0, hw * 2, H); g.restore(); }
}
function post(t) {
  BCTX.save(); BCTX.filter = 'brightness(1.1) contrast(2.4) blur(5px)'; BCTX.clearRect(0, 0, W / 4, H / 4); BCTX.drawImage(cv, 0, 0, W / 4, H / 4); BCTX.restore();
  ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.globalAlpha = .55; ctx.imageSmoothingQuality = 'high'; ctx.drawImage(BLOOM, 0, 0, W, H); ctx.restore();
  ctx.drawImage(VIG, 0, 0);
  ctx.save(); ctx.globalCompositeOperation = 'overlay'; ctx.globalAlpha = .13; ctx.drawImage(GRAIN[Math.round(t * 30) % GRAIN.length], 0, 0, W, H); ctx.restore();
  const fo = Math.min(2.2, T.dur * .2), end = ss(T.dur - fo, T.dur - .05, t);
  if (end > 0) { ctx.fillStyle = `rgba(0,0,0,${end})`; ctx.fillRect(0, 0, W, H); }
}
function draw(t) {
  t = Math.max(0, Math.min(t, T.dur - 1e-3));
  ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.globalAlpha = 1; ctx.globalCompositeOperation = 'source-over';
  background(ctx, t);
  const act = T.shots.filter(s => t >= s.t0 && t < s.t1 + .35);
  act.forEach((s, i) => {
    const Ly = LAYER[i % 2], g = Ly.getContext('2d'); g.setTransform(1, 0, 0, 1, 0, 0); g.clearRect(0, 0, W, H); g.globalAlpha = 1; g.globalCompositeOperation = 'source-over';
    const lt = t - s.t0, d = s.t1 - s.t0, fn = ZD.scenes[s.scene];
    if (!fn) throw new Error(`unknown scene "${s.scene}"`);
    fn(g, lt, d, t, s);
    const ain = s.id === 1 ? 1 : eo(lt / .35), aout = 1 - ss(d, d + .35, lt);
    const sc = (s.id === 1 ? 1 : lerp(1.05, 1, eo(lt / .6))) * (1 + .05 * ss(d, d + .35, lt));
    ctx.save(); ctx.globalAlpha = ain * aout; ctx.translate(L.AX, L.AY); ctx.scale(sc, sc); ctx.translate(-L.AX, -L.AY); ctx.drawImage(Ly, 0, 0); ctx.restore();
  });
  dust(ctx, t); flashes(ctx, t); subtitles(ctx, t); hook(ctx, t); post(t);
}
ZD.FX = { clamp, lerp, ss, eo, eio, rng, TAU, INK, GOLD, GOLD_HI, GOLD_DK, gl, font, pulse, beatPh, goldLine, glow, noGlow, parseRich, autoBreak, rich, strokeG, rr,
  sparkle, rays, softDisc, checkMark, crossMark, figure, silhouette, astrolabe, mirrorFrame, cardShape, pill, paper, brain, eye, bellShape, frag, drift, particles, ring,
  motif, motifH, get NEB() { return NEB; }, get GRAIN() { return GRAIN; } };
Object.defineProperty(ZD, 'L', { get: () => L }); Object.defineProperty(ZD, 'T', { get: () => T });
Object.defineProperty(ZD, 'BEAT', { get: () => BEAT });
window.ready = (async () => {
  T = await (await fetch('timeline.json')).json();
  L = LAYOUTS[T.orientation] || LAYOUTS.landscape; W = L.W; H = L.H; cv.width = W; cv.height = H;
  BEAT = T.beat || .5; B0 = T.first_beat || 0;
  T.shots.forEach(s => { s.p = s.params || {}; s.cues = T.cues.filter(c => c.shot === s.id); });
  await Promise.all([document.fonts.load('700 60px SerifSC', '知识'), document.fonts.load('400 60px SerifSC', '知识')]);
  await document.fonts.ready;
  init(); if (ZD.onInit) ZD.onInit(); draw(0); window.DUR = T.dur;
  return true;
})();
window.draw = draw; window.render = draw; window.FX = ZD.FX;
})();
