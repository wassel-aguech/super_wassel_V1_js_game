/* Super Wassel - page d'accueil (recréation de la maquette) */
(function () {
  'use strict';
  var W = window.WASSEL, art = W.art;
  var PI = Math.PI, TAU = PI * 2, VW = 800, VH = 448;
  var lin = art.lin, rrect = art.rrect, circle = art.circle, rng = art.rng, FONT = art.FONT;
  var NAVY = '#16306e';

  function tree(ctx, x, y, s, c1, c2, c3) {
    ctx.fillStyle = '#4a2f1a'; ctx.fillRect(x - 2 * s, y - 10 * s, 4 * s, 11 * s);
    var parts = [[0, -24, 13, c1], [-9, -18, 10, c1], [9, -18, 10.5, c1], [0, -14, 11, c2]];
    parts.forEach(function (p) { circle(ctx, x + p[0] * s, y + p[1] * s, p[2] * s); ctx.fillStyle = p[3]; ctx.fill(); });
    circle(ctx, x - 3 * s, y - 28 * s, 6 * s); ctx.fillStyle = c3; ctx.globalAlpha = 0.7; ctx.fill(); ctx.globalAlpha = 1;
  }

  function hill(ctx, cx, base, rx, ry, c0, c1, rim) {
    ctx.beginPath(); ctx.ellipse(cx, base, rx, ry, 0, PI, TAU); ctx.closePath();
    ctx.fillStyle = lin(ctx, 0, base - ry, 0, base, [0, c0, 1, c1]); ctx.fill();
    ctx.lineWidth = 2.5; ctx.strokeStyle = rim; ctx.stroke();
  }
  function hillY(cx, base, rx, ry, x) { var u = (x - cx) / rx; return u * u >= 1 ? base : base - ry * Math.sqrt(1 - u * u); }

  function terrain(ctx, x, y, w, h, th, t) {
    ctx.fillStyle = lin(ctx, 0, y, 0, y + h, [0, '#c98446', 1, '#8f552a']); ctx.fillRect(x, y, w, h);
    var r = rng(x * 3 + y);
    ctx.fillStyle = '#6f4320';
    for (var i = 0; i < w / 14; i++) { ctx.beginPath(); ctx.ellipse(x + r() * w, y + 16 + r() * Math.max(10, h - 20), 3 + r() * 3, 2 + r() * 1.6, r(), 0, TAU); ctx.fill(); }
    ctx.beginPath(); ctx.moveTo(x - 2, y - 3); ctx.lineTo(x + w + 2, y - 3); ctx.lineTo(x + w + 2, y + 12);
    var n = Math.ceil(w / 10);
    for (i = n; i >= 0; i--) ctx.arc(x + (i + 0.5) * (w / n), y + 12, w / n / 2 + 0.5, 0, PI);
    ctx.lineTo(x - 2, y + 12); ctx.closePath();
    ctx.fillStyle = lin(ctx, 0, y - 3, 0, y + 18, [0, '#aef56f', 0.35, '#62d13f', 1, '#32a02a']); ctx.fill();
    ctx.lineWidth = 2.4; ctx.strokeStyle = '#2a6a1c'; ctx.stroke();
    ctx.fillStyle = 'rgba(255,255,255,0.35)'; ctx.fillRect(x + 3, y - 1, w - 6, 2.4);
    ctx.fillStyle = '#2f9a2a';
    for (i = 0; i < w / 36; i++) { var gx = x + 8 + i * 36 + (i % 2) * 8; ctx.beginPath(); ctx.moveTo(gx, y - 2); ctx.lineTo(gx + 2, y - 8); ctx.lineTo(gx + 4, y - 2); ctx.lineTo(gx + 7, y - 7); ctx.lineTo(gx + 8, y - 2); ctx.fill(); }
  }

  function block(ctx, x, y, kind, th, t) {
    var w = 45, h = 45, top = 9;
    var fills = kind === 'q' ? ['#ffe888', '#f7b929', '#e0900f'] : ['#e57a4a', '#d4693a', '#a14a25'];
    ctx.fillStyle = kind === 'q' ? '#ffd45a' : '#f19a6d';
    ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + 7, y - top); ctx.lineTo(x + w + 7, y - top); ctx.lineTo(x + w, y); ctx.closePath(); ctx.fill();
    ctx.lineWidth = 2.2; ctx.strokeStyle = '#3a2412'; ctx.stroke();
    ctx.fillStyle = kind === 'q' ? '#c47a0c' : '#8a3b1d';
    ctx.beginPath(); ctx.moveTo(x + w, y); ctx.lineTo(x + w + 7, y - top); ctx.lineTo(x + w + 7, y + h - top); ctx.lineTo(x + w, y + h); ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.fillStyle = lin(ctx, 0, y, 0, y + h, [0, fills[0], 0.5, fills[1], 1, fills[2]]); ctx.fillRect(x, y, w, h); ctx.strokeRect(x, y, w, h);
    if (kind === 'q') {
      ctx.fillStyle = 'rgba(255,255,255,0.5)'; ctx.fillRect(x + 3, y + 3, w - 6, 3); ctx.fillRect(x + 3, y + 3, 3, h - 6);
      ctx.fillStyle = '#8a5200';
      [[6, 6], [w - 6, 6], [6, h - 6], [w - 6, h - 6]].forEach(function (p) { circle(ctx, x + p[0], y + p[1], 2.2); ctx.fill(); });
      ctx.save(); ctx.font = '36px ' + FONT; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillStyle = '#8a4a00'; ctx.fillText('?', x + w / 2 + 1.5, y + h / 2 + 3);
      ctx.fillStyle = '#fff6c8'; ctx.fillText('?', x + w / 2, y + h / 2 + 1); ctx.restore();
      var ph = (t * 0.5) % 1;
      if (ph < 0.25) { ctx.save(); ctx.beginPath(); ctx.rect(x + 2, y + 2, w - 4, h - 4); ctx.clip(); var sx = x - 14 + ph / 0.25 * (w + 28); ctx.fillStyle = 'rgba(255,255,255,0.55)'; ctx.beginPath(); ctx.moveTo(sx, y + h); ctx.lineTo(sx + 9, y + h); ctx.lineTo(sx + 25, y); ctx.lineTo(sx + 16, y); ctx.fill(); ctx.restore(); }
    } else {
      ctx.fillStyle = '#8a3b1d';
      ctx.fillRect(x, y + 14, w, 2.4); ctx.fillRect(x, y + 29, w, 2.4);
      ctx.fillRect(x + 22, y, 2.4, 15); ctx.fillRect(x + 11, y + 15, 2.4, 15); ctx.fillRect(x + 33, y + 15, 2.4, 15); ctx.fillRect(x + 22, y + 30, 2.4, 15);
      ctx.fillStyle = 'rgba(255,200,160,0.5)'; ctx.fillRect(x + 2, y + 2, 18, 2.4); ctx.fillRect(x + 26, y + 2, 17, 2.4);
    }
  }

  function bigCoin(ctx, cx, cy, t, k) {
    var w = 11 + Math.abs(Math.cos(t * 2.6 + k * 1.1)) * 6;
    ctx.beginPath(); ctx.ellipse(cx, cy, w, 24, 0, 0, TAU);
    ctx.fillStyle = lin(ctx, cx - w, 0, cx + w, 0, [0, '#ffe36a', 0.55, '#ffc61c', 1, '#e29a08']); ctx.fill();
    ctx.lineWidth = 3; ctx.strokeStyle = '#a86a00'; ctx.stroke();
    ctx.beginPath(); ctx.ellipse(cx, cy, w - 4, 19, 0, 0, TAU); ctx.lineWidth = 1.4; ctx.strokeStyle = 'rgba(168,106,0,0.7)'; ctx.stroke();
    ctx.fillStyle = 'rgba(255,255,255,0.7)'; rrect(ctx, cx - 2.2, cy - 12, 4.4, 24, 2); ctx.fill();
  }

  function ctrl(ctx, cx, cy, dir) {
    ctx.save();
    ctx.shadowColor = 'rgba(0,0,0,0.4)'; ctx.shadowBlur = 8; ctx.shadowOffsetY = 3;
    circle(ctx, cx, cy, 36); ctx.fillStyle = lin(ctx, 0, cy - 36, 0, cy + 36, [0, '#3b3029', 1, '#17120f']); ctx.fill();
    ctx.restore();
    ctx.lineWidth = 3.5; ctx.strokeStyle = '#f2f4fb'; circle(ctx, cx, cy, 34); ctx.stroke();
    ctx.lineWidth = 1.5; ctx.strokeStyle = 'rgba(255,255,255,0.25)'; circle(ctx, cx, cy, 29); ctx.stroke();
    ctx.fillStyle = '#fff'; ctx.beginPath();
    if (dir === 'l') { ctx.moveTo(cx - 17, cy); ctx.lineTo(cx + 8, cy - 18); ctx.lineTo(cx + 8, cy + 18); }
    else if (dir === 'r') { ctx.moveTo(cx + 17, cy); ctx.lineTo(cx - 8, cy - 18); ctx.lineTo(cx - 8, cy + 18); }
    else { ctx.moveTo(cx, cy - 20); ctx.lineTo(cx + 19, cy + 2); ctx.lineTo(cx + 7, cy + 2); ctx.lineTo(cx + 7, cy + 18); ctx.lineTo(cx - 7, cy + 18); ctx.lineTo(cx - 7, cy + 2); ctx.lineTo(cx - 19, cy + 2); }
    ctx.closePath(); ctx.fill(); ctx.lineWidth = 2; ctx.lineJoin = 'round'; ctx.strokeStyle = '#d9dcec'; ctx.stroke();
  }

  function crown(ctx, cx, cy, s) {
    ctx.save(); ctx.translate(cx, cy); ctx.scale(s, s); ctx.lineJoin = 'round';
    ctx.beginPath(); ctx.moveTo(-26, 16); ctx.lineTo(-30, -14); ctx.lineTo(-14, 0); ctx.lineTo(0, -22); ctx.lineTo(14, 0); ctx.lineTo(30, -14); ctx.lineTo(26, 16); ctx.closePath();
    ctx.fillStyle = lin(ctx, 0, -22, 0, 16, [0, '#fff08a', 0.4, '#ffc61c', 1, '#e29a08']); ctx.fill();
    ctx.lineWidth = 4.5; ctx.strokeStyle = '#a86a00'; ctx.stroke();
    ctx.fillStyle = '#ffc61c';
    [[-30, -16], [0, -25], [30, -16]].forEach(function (p) { circle(ctx, p[0], p[1], 4.5); ctx.fill(); ctx.lineWidth = 2.2; ctx.stroke(); });
    ctx.fillStyle = '#e63946'; circle(ctx, 0, 6, 4.2); ctx.fill();
    ctx.fillStyle = '#3fb6ff'; circle(ctx, -14, 8, 3); ctx.fill(); circle(ctx, 14, 8, 3); ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,0.55)'; ctx.beginPath(); ctx.moveTo(-24, 12); ctx.lineTo(-27, -8); ctx.lineTo(-20, -3); ctx.lineTo(-20, 12); ctx.fill();
    ctx.restore();
  }

  function titleWord(ctx, txt, cx, cy, size, fill, ext, extCol, lw) {
    ctx.save();
    ctx.font = size + 'px ' + FONT; ctx.textAlign = 'center'; ctx.textBaseline = 'alphabetic';
    ctx.lineJoin = 'round'; ctx.miterLimit = 2;
    ctx.lineWidth = lw; ctx.strokeStyle = extCol; ctx.fillStyle = extCol;
    for (var i = ext; i > 0; i--) { ctx.strokeText(txt, cx, cy + i); ctx.fillText(txt, cx, cy + i); }
    ctx.strokeStyle = NAVY; ctx.strokeText(txt, cx, cy);
    ctx.fillStyle = fill; ctx.fillText(txt, cx, cy);
    ctx.restore();
  }

  function fitSize(ctx, txt, width, font) {
    ctx.save(); ctx.font = '100px ' + font; var w = ctx.measureText(txt).width; ctx.restore();
    return w > 0 ? 100 * width / w : 60;
  }

  function brush(ctx, x, y, w, h, t) {
    var r = rng(11), pts = [], i, n = 26;
    ctx.save();
    ctx.beginPath();
    for (i = 0; i <= n; i++) { var px = x + w * i / n; ctx.lineTo(px, y + (i === 0 || i === n ? h * 0.35 : 0) + (r() - 0.5) * 6 - (i / n) * 6); }
    for (i = n; i >= 0; i--) { px = x + w * i / n; ctx.lineTo(px, y + h + (i === 0 || i === n ? -h * 0.3 : 0) + (r() - 0.5) * 7 - (i / n) * 6); }
    ctx.closePath();
    ctx.fillStyle = lin(ctx, 0, y, 0, y + h, [0, '#f23a3f', 1, '#c4121f']); ctx.fill();
    ctx.clip();
    ctx.strokeStyle = 'rgba(255,255,255,0.16)'; ctx.lineWidth = 1.4;
    for (i = 0; i < 9; i++) { ctx.beginPath(); ctx.moveTo(x - 4, y + 4 + i * (h / 9)); ctx.lineTo(x + w + 4, y + 2 + i * (h / 9) - 4); ctx.stroke(); }
    var sh = ((t * 0.35) % 1.6) - 0.3;
    ctx.fillStyle = 'rgba(255,255,255,0.22)'; ctx.beginPath(); var sx = x + w * sh; ctx.moveTo(sx, y + h); ctx.lineTo(sx + 16, y + h); ctx.lineTo(sx + 36, y); ctx.lineTo(sx + 20, y); ctx.fill();
    ctx.restore();
  }

  art.drawTitle = function (ctx, t, st) {
    var th = art.themes.day, i;
    // ciel
    ctx.fillStyle = lin(ctx, 0, 0, 0, VH, [0, '#1d72e6', 0.45, '#4aa4f7', 1, '#b4e4ff']); ctx.fillRect(0, 0, VW, VH);
    var sg = ctx.createRadialGradient(560, 130, 10, 560, 130, 320);
    sg.addColorStop(0, 'rgba(255,255,255,0.35)'); sg.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = sg; ctx.fillRect(0, 0, VW, VH);
    // montagnes lointaines
    ctx.fillStyle = lin(ctx, 0, 190, 0, 400, [0, '#9dd9ea', 1, '#6bbad0']);
    ctx.beginPath(); ctx.moveTo(430, 400);
    ctx.bezierCurveTo(470, 300, 520, 230, 560, 225); ctx.bezierCurveTo(600, 220, 640, 270, 700, 250); ctx.bezierCurveTo(740, 238, 780, 230, 800, 245); ctx.lineTo(800, 400); ctx.closePath(); ctx.fill();
    ctx.fillStyle = lin(ctx, 0, 220, 0, 400, [0, '#7bc8da', 1, '#52a8c0']);
    ctx.beginPath(); ctx.moveTo(380, 400); ctx.bezierCurveTo(430, 290, 470, 250, 520, 262); ctx.bezierCurveTo(560, 272, 600, 330, 640, 400); ctx.closePath(); ctx.fill();
    // nuages
    var cl = [[-14, 98, 1.25], [14, 130, 0.9], [606, 128, 0.55], [440, 78, 0.7]];
    for (i = 0; i < cl.length; i++) art.cloud(ctx, cl[i][0] + Math.sin(t * 0.3 + i) * 4, cl[i][1], cl[i][2], th);
    // collines : grande colline centrale, forêt gauche
    hill(ctx, 330, 392, 230, 190, '#4ecb5a', '#2c9a42', '#1e7a36');
    hill(ctx, 18, 392, 150, 238, '#3eb556', '#1f8a3c', '#1a6f30');
    hill(ctx, 560, 400, 190, 96, '#58cf5e', '#2f9d44', '#1f7a36');
    var r = rng(77), x, y;
    for (i = 0; i < 16; i++) { x = 14 + r() * 175; y = hillY(18, 392, 150, 238, x) + 14; tree(ctx, x, y + r() * 30, 0.7 + r() * 0.5, '#2a8f45', '#1d6f35', '#6fd47a'); }
    for (i = 0; i < 10; i++) { x = 190 + r() * 300; y = hillY(330, 392, 230, 190, x) + 16; tree(ctx, x, y + r() * 24, 0.6 + r() * 0.5, '#2f9a48', '#1f7a38', '#7fe08a'); }
    ctx.fillStyle = 'rgba(255,255,255,0.12)';
    ctx.beginPath(); ctx.ellipse(300, 250, 90, 46, -0.4, 0, TAU); ctx.fill();
    // colline du château + château
    hill(ctx, 712, 392, 150, 92, '#6bd66a', '#37a64a', '#24843a');
    art.drawCastle(ctx, 631, 372, 1.0, t, 0);
    // petite pastille avatar
    ctx.save(); circle(ctx, 732, 267, 20); ctx.fillStyle = '#d9ecff'; ctx.fill(); ctx.clip();
    if (st.badge && st.badge.complete && st.badge.naturalWidth) ctx.drawImage(st.badge, 712, 247, 40, 40);
    ctx.restore();
    circle(ctx, 732, 267, 20); ctx.lineWidth = 3.5; ctx.strokeStyle = '#ffffff'; ctx.stroke(); circle(ctx, 732, 267, 22); ctx.lineWidth = 2; ctx.strokeStyle = '#2d7be0'; ctx.stroke();
    // terrain
    ctx.fillStyle = '#4b2f1a'; ctx.fillRect(520, 412, 150, 40);
    terrain(ctx, 0, 371, 296, 90, th, t);
    terrain(ctx, 288, 407, 240, 60, th, t);
    terrain(ctx, 514, 338, 134, 120, th, t);
    terrain(ctx, 664, 412, 140, 50, th, t);
    // bloc ? et briques
    block(ctx, -8, 238, 'b', th, t); block(ctx, 44, 238, 'q', th, t); block(ctx, 96, 238, 'b', th, t);
    // pièces
    var coinY = 309 + Math.sin(t * 2) * 3;
    bigCoin(ctx, 329, coinY, t, 0); bigCoin(ctx, 385, coinY + 1, t, 1); bigCoin(ctx, 441, coinY, t, 2);
    // ennemis
    ctx.save(); ctx.translate(427, 408); ctx.scale(2.1, 2.1); ctx.translate(-427, -408);
    art.drawEnemy(ctx, { t: 'slime', x: 413, y: 384, w: 28, h: 24, state: 'walk', dir: -1, vx: 0, shellV: 0 }, t);
    ctx.restore();
    ctx.save(); ctx.translate(560, 340); ctx.scale(2.2, 2.2); ctx.translate(-560, -340);
    art.drawEnemy(ctx, { t: 'shellbug', x: 546, y: 314, w: 28, h: 26, state: 'walk', dir: -1, vx: 0, shellV: 0 }, t);
    ctx.restore();
    // drapeau W
    var px = 688;
    ctx.fillStyle = lin(ctx, px, 0, px + 4, 0, [0, '#ffffff', 1, '#aeb4cc']); ctx.fillRect(px, 342, 4, 72);
    circle(ctx, px + 2, 338, 6); ctx.fillStyle = '#ffc61c'; ctx.fill(); ctx.lineWidth = 2; ctx.strokeStyle = '#8a5200'; ctx.stroke();
    var wv = Math.sin(t * 5) * 2.4;
    ctx.beginPath(); ctx.moveTo(px + 4, 346); ctx.quadraticCurveTo(px + 24, 348 + wv, px + 48, 360 + wv); ctx.quadraticCurveTo(px + 24, 372 - wv, px + 4, 382); ctx.closePath();
    ctx.fillStyle = lin(ctx, 0, 346, 0, 382, [0, '#ff5a64', 1, '#c81f2b']); ctx.fill(); ctx.lineWidth = 2.4; ctx.strokeStyle = '#6e0c12'; ctx.stroke();
    ctx.save(); ctx.font = '22px ' + FONT; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillStyle = '#fff'; ctx.fillText('W', px + 20, 365); ctx.restore();
    // héros
    var hb = Math.sin(t * 2.2) * 5;
    ctx.save();
    ctx.shadowColor = 'rgba(0,30,80,0.3)'; ctx.shadowBlur = 14; ctx.shadowOffsetY = 8;
    art.drawHero(ctx, 184, 399 + hb, 5.25, 1, { pose: 'jump', t: t, power: 1 });
    ctx.restore();
    // ppièces brillantes décoratives
    for (i = 0; i < 6; i++) {
      var a = ((t * 0.6 + i * 0.37) % 1);
      ctx.fillStyle = 'rgba(255,255,255,' + Math.sin(a * PI) * 0.9 + ')';
      art.star(ctx, 330 + i * 24 + (i % 2) * 8, 282 + (i % 3) * 22 - a * 10, 3.5 + (i % 2) * 1.5, t * 2 + i); ctx.fill();
    }
    // titre : bannière + SUPER + couronne
    ctx.save();
    ctx.translate(503, 140); ctx.rotate(-0.045); ctx.translate(-503, -140);
    var bx = 313, by = 100, bw = 382, bh = 92;
    ctx.save(); ctx.shadowColor = 'rgba(0,0,0,0.4)'; ctx.shadowBlur = 10; ctx.shadowOffsetY = 6;
    rrect(ctx, bx, by, bw, bh, 12); ctx.fillStyle = '#7d0d14'; ctx.fill(); ctx.restore();
    rrect(ctx, bx + 3, by + 3, bw - 6, bh - 6, 10); ctx.fillStyle = lin(ctx, 0, by, 0, by + bh, [0, '#ff4b4b', 0.5, '#e5262e', 1, '#c01822']); ctx.fill();
    ctx.save(); rrect(ctx, bx + 3, by + 3, bw - 6, bh - 6, 10); ctx.clip();
    ctx.strokeStyle = 'rgba(120,10,16,0.22)'; ctx.lineWidth = 1.2;
    for (i = 0; i < 8; i++) { ctx.beginPath(); ctx.moveTo(bx, by + 8 + i * 11); ctx.lineTo(bx + bw, by + 6 + i * 11); ctx.stroke(); }
    ctx.fillStyle = 'rgba(255,255,255,0.18)'; ctx.fillRect(bx, by + 3, bw, 8);
    ctx.restore();
    var ws = Math.min(fitSize(ctx, 'WASSEL', 344, FONT), 96);
    titleWord(ctx, 'WASSEL', bx + bw / 2, by + bh - 14, ws, '#ffffff', 5, '#0f2150', 9);
    var ss = Math.min(fitSize(ctx, 'SUPER', 272, FONT), 108);
    titleWord(ctx, 'SUPER', 446, 111, ss, lin(ctx, 0, 40, 0, 112, [0, '#fff27a', 0.5, '#ffd028', 1, '#ffa31a']), 7, '#b45a00', 11);
    ctx.restore();
    crown(ctx, 399, 34 + Math.sin(t * 2) * 1.5, 0.95);
    // Let's Play !
    var pulse = 1 + Math.sin(t * 3.2) * 0.025;
    ctx.save(); ctx.translate(488, 232); ctx.scale(pulse, pulse); ctx.rotate(-0.03);
    brush(ctx, -108, -26, 216, 52, t);
    ctx.font = 'italic ' + Math.min(fitSize(ctx, "Let's Play !", 150, '"Kaushan Script", "Brush Script MT", cursive'), 40) + 'px "Kaushan Script", "Brush Script MT", cursive';
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillStyle = 'rgba(80,0,10,0.45)'; ctx.fillText("Let's Play !", 1.5, 3.5);
    ctx.fillStyle = '#fff'; ctx.fillText("Let's Play !", 0, 1);
    ctx.strokeStyle = '#ffc61c'; ctx.lineWidth = 3.6; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(-64, 19); ctx.quadraticCurveTo(0, 14, 74, 11); ctx.stroke();
    ctx.restore();
    if (st.best > 0) { art.outlineText(ctx, 'Meilleur score : ' + st.best, 488, 282, 15, 'center'); }
    // commandes décoratives
    if (!st.touch) { ctrl(ctx, 55, 402, 'l'); ctrl(ctx, 150, 402, 'r'); ctrl(ctx, 758, 402, 'u'); }
    // HUD identique à la maquette
    art.drawHud(ctx, { lives: 3, hearts: 3, coins: 125, score: 1250, level: '1-1', time: null }, st.avatar, t);
    // léger vignettage
    var vg = ctx.createRadialGradient(VW / 2, VH / 2, 220, VW / 2, VH / 2, 520);
    vg.addColorStop(0, 'rgba(0,20,60,0)'); vg.addColorStop(1, 'rgba(0,20,60,0.28)');
    ctx.fillStyle = vg; ctx.fillRect(0, 0, VW, VH);
  };
})();
