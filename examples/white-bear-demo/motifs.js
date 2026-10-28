// Project extension: the white-bear signature motif (the author's own white-bear film).
// Register any per-topic art with ZD.motif(name, fn(g, x, y, s, a, o), {h}) — (x, y) is the motif's visual centre, ~360 px wide at s = 1.
(() => {
  const F = ZD.FX, { strokeG, ss, clamp, GOLD, GOLD_HI, TAU } = F;
  const BEAR_K = [[-205,-125],[-190,-160],[-150,-186],[-80,-196],[0,-192],[60,-201],[102,-190],[132,-170],[160,-176],[172,-194],[188,-191],[192,-176],[210,-168],[240,-150],[258,-141],[261,-130],[246,-122],[212,-118],[172,-110],[152,-90],[146,-50],[149,-6],[170,0],[118,0],[112,-52],[60,-70],[-40,-72],[-88,-60],[-94,-6],[-76,0],[-140,0],[-150,-40],[-176,-82],[-200,-108]];
  const BEAR = (() => { const P = [], n = BEAR_K.length;
    for (let i = 0; i < n; i++) { const p0 = BEAR_K[(i - 1 + n) % n], p1 = BEAR_K[i], p2 = BEAR_K[(i + 1) % n], p3 = BEAR_K[(i + 2) % n];
      for (let k = 0; k < 6; k++) { const t = k / 6, t2 = t * t, t3 = t2 * t;
        P.push([0, 1].map(j => .5 * (2 * p1[j] + (-p0[j] + p2[j]) * t + (2 * p0[j] - 5 * p1[j] + 4 * p2[j] - p3[j]) * t2 + (-p0[j] + 3 * p1[j] - 3 * p2[j] + p3[j]) * t3) - (j ? 0 : 28))); } }
    P.push(P[0]); return P; })();
  function bear(g, x, y, s, a = 1, o = {}) {      // origin = between the feet
    if (a <= 0.003) return;
    const p = o.p ?? 1, n = Math.max(2, Math.floor(BEAR.length * clamp(p)));
    g.save(); g.translate(x, y); g.scale(s * (o.flip ? -1 : 1), s);
    const path = c => { c.moveTo(BEAR[0][0], BEAR[0][1]); for (let i = 1; i < n; i++) c.lineTo(BEAR[i][0], BEAR[i][1]); };
    if (o.fill) { g.save(); g.globalAlpha *= a * o.fill * ss(.9, 1, p); g.fillStyle = '#0d0905'; g.beginPath(); path(g); g.fill(); g.restore(); }
    if (o.bright) { g.save(); g.globalAlpha *= a * o.bright * ss(.9, 1, p); g.beginPath(); path(g); g.clip(); const rg = g.createRadialGradient(40, -110, 10, 40, -110, 260); rg.addColorStop(0, 'rgba(255,240,205,.75)'); rg.addColorStop(1, 'rgba(255,200,120,.08)'); g.fillStyle = rg; g.fillRect(-260, -260, 560, 300); g.restore(); }
    const lw = (o.lw || 4) / s;
    strokeG(g, path, lw, a, (o.glowAmt ?? 1) * 20 / Math.max(.4, s), o.col || GOLD);
    strokeG(g, path, lw * .35, a * .8, 4 / s, GOLD_HI);
    const d = ss(.85, 1, p) * a;
    if (d > 0) {
      strokeG(g, c => { c.moveTo(150, -178); c.quadraticCurveTo(158, -170, 162, -160); c.moveTo(60, -150); c.quadraticCurveTo(100, -130, 112, -95); }, lw * .55, d * .4, 6 / s, GOLD);
      g.fillStyle = GOLD_HI; g.globalAlpha = d; g.beginPath(); g.arc(180, -152, 4.5, 0, TAU); g.arc(231, -136, 5.5, 0, TAU); g.fill();
    }
    g.restore();
  }
  // centred wrapper: the bear is ~470 wide × 200 tall -> scale .77 to the 360-px motif convention, centre = feet - 100
  ZD.motif('bear', (g, x, y, s, a, o) => { const k = s * .77; bear(g, x - 10 * k, y + 100 * k, k, a, Object.assign({ fill: .8, bright: .6 }, o)); }, { h: 80 });
  F.bear = bear;
})();
