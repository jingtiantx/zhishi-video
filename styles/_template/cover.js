// window.drawCover(kind) -> PNG data URL for kind '3x4' (1080x1440) | '4x3' (1440x1080) | '9x16' (1080x1920). Words from ZD.T.cover. Draw only T.cover fields (no hard-coded branding).
window.drawCover = async (kind) => {
  await window.ready; const C = ZD.T.cover || {}, F = ZD.FX;
  const [W, H] = { '3x4': [1080, 1440], '4x3': [1440, 1080], '9x16': [1080, 1920] }[kind];
  const c = document.getElementById('cov'); c.width = W; c.height = H; const g = c.getContext('2d');
  g.fillStyle = '#101418'; g.fillRect(0, 0, W, H);                                         // TODO ground
  if (C.badge) F.rich(g, C.badge, W / 2, H * .12, { size: 40 });
  F.rich(g, C.title || ZD.T.title, W / 2, H * .28, { size: Math.min(200, W * .8 / Math.max(1, (C.title || '').length)), allAccent: true });
  if (C.q1) F.rich(g, C.q1, W / 2, H * .45, { size: 80 }); if (C.q2) F.rich(g, C.q2, W / 2, H * .53, { size: 90 });
  if (C.motif) F.motif(g, C.motif, W / 2, H * .75, 1.2, 1, { text: C.glyph });
  if (C.caption) F.rich(g, C.caption, W / 2, H * .94, { size: 32 });
  return c.toDataURL('image/png');
};
