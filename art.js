/* Super Wassel - graphismes : personnage, ennemis, blocs, décors, château, HUD */
(function () {
  'use strict';
  var W = window.WASSEL = window.WASSEL || {};
  var art = W.art = {};
  var PI = Math.PI, TAU = PI * 2, VW = 800, VH = 448, T = 32;
  var INK = '#14152b';
  art.VW = VW; art.VH = VH;

  function clamp(v, a, b) { return v < a ? a : v > b ? b : v; }
  function rrect(ctx, x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + w - r, y); ctx.quadraticCurveTo(x + w, y, x + w, y + r);
    ctx.lineTo(x + w, y + h - r); ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
    ctx.lineTo(x + r, y + h); ctx.quadraticCurveTo(x, y + h, x, y + h - r);
    ctx.lineTo(x, y + r); ctx.quadraticCurveTo(x, y, x + r, y);
    ctx.closePath();
  }
  function circle(ctx, x, y, r) { ctx.beginPath(); ctx.arc(x, y, r, 0, TAU); }
  function rng(seed) { var s = (seed >>> 0) || 1; return function () { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; }; }
  function lin(ctx, x0, y0, x1, y1, stops) {
    var g = ctx.createLinearGradient(x0, y0, x1, y1);
    for (var i = 0; i < stops.length; i += 2) g.addColorStop(stops[i], stops[i + 1]);
    return g;
  }
  art.rrect = rrect; art.rng = rng; art.lin = lin; art.circle = circle;

  var FONT = '"Lilita One", "Trebuchet MS", system-ui, sans-serif';
  art.FONT = FONT;
  function outlineText(ctx, txt, x, y, size, align, fill, stroke) {
    ctx.save();
    ctx.font = size + 'px ' + FONT;
    ctx.textAlign = align || 'left'; ctx.textBaseline = 'alphabetic';
    ctx.lineJoin = 'round'; ctx.miterLimit = 2;
    ctx.lineWidth = Math.max(3, size / 4.5);
    ctx.strokeStyle = stroke || '#14306e'; ctx.strokeText(txt, x, y);
    ctx.fillStyle = fill || '#ffffff'; ctx.fillText(txt, x, y);
    ctx.restore();
  }
  art.outlineText = outlineText;

  function star(ctx, x, y, r, rot) {
    ctx.beginPath();
    for (var i = 0; i < 10; i++) {
      var a = rot + i * PI / 5 - PI / 2, rr = i % 2 ? r * 0.45 : r;
      ctx.lineTo(x + Math.cos(a) * rr, y + Math.sin(a) * rr);
    }
    ctx.closePath();
  }
  art.star = star;

  /* ------------------------------------------------------------- thèmes */
  art.themes = {
    day: {
      id: 'day', skyTop: '#1f78e6', skyMid: '#55b0f7', skyBot: '#c3ebff',
      far: '#7fbfe4', farB: '#b6e0f4', farRim: '#9ad0ec', mid: '#3fb05c', midB: '#2a9248', midRim: '#1f7a3b',
      tree: '#2f9a4d', treeL: '#68d46f', treeD: '#1c6f35', near: '#5fcf58', nearB: '#37a846', nearRim: '#2a8b39',
      cloud: '#ffffff', cloudSh: '#cfe5fb', base: 392,
      grass: '#62d13f', grassL: '#a4f26e', grassD: '#33a02b', dirtT: '#c98446', dirtB: '#935a2b', dirtD: '#6f4320',
      brick: '#d4693a', brickL: '#f19a6d', brickD: '#8a3b1d', stone: '#cdb89a', stoneL: '#f2e5cc', stoneD: '#8e7956', outline: '#3a2412'
    },
    night: {
      id: 'night', skyTop: '#050720', skyMid: '#141a4c', skyBot: '#2d3b7d',
      far: '#1b2c63', farB: '#2c4285', farRim: '#3a5399', mid: '#1b5a66', midB: '#123f4f', midRim: '#2f8c8a',
      tree: '#14504f', treeL: '#2f8f7c', treeD: '#0b2e35', near: '#2a8a76', nearB: '#1b6659', nearRim: '#46c2a2',
      cloud: '#46549b', cloudSh: '#2f3a78', base: 392,
      grass: '#41d4ad', grassL: '#8af5cf', grassD: '#1f8a75', dirtT: '#5d4b92', dirtB: '#352a60', dirtD: '#251d47',
      brick: '#7b69cb', brickL: '#a798ef', brickD: '#41367f', stone: '#6677aa', stoneL: '#9aabdb', stoneD: '#38436c', outline: '#090921'
    },
    dusk: {
      id: 'dusk', skyTop: '#392078', skyMid: '#c24f7d', skyBot: '#ffb86d',
      far: '#8c4a8f', farB: '#b3639a', farRim: '#d17aa6', mid: '#9d4a7c', midB: '#6f3472', midRim: '#df8a8a',
      tree: '#7f3a6c', treeL: '#c3688a', treeD: '#4c2358', near: '#d27a4d', nearB: '#a24d4a', nearRim: '#f1a85c',
      cloud: '#ffd3a8', cloudSh: '#f09a8c', base: 392,
      grass: '#e8b94b', grassL: '#fbe381', grassD: '#aa7a22', dirtT: '#aa6150', dirtB: '#6e3a42', dirtD: '#4c2733',
      brick: '#dc7450', brickL: '#fba67d', brickD: '#8d3a2b', stone: '#cdb7ca', stoneL: '#f4e5f0', stoneD: '#8c7592', outline: '#2a1020'
    }
  };

  /* ---------------------------------------------------------- personnage */
  function limb(ctx, pts, w, fill, ow) {
    ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    ctx.beginPath(); ctx.moveTo(pts[0][0], pts[0][1]);
    for (var i = 1; i < pts.length; i++) ctx.lineTo(pts[i][0], pts[i][1]);
    ctx.strokeStyle = INK; ctx.lineWidth = w + ow * 2; ctx.stroke();
    ctx.strokeStyle = fill; ctx.lineWidth = w; ctx.stroke();
  }

  function drawHead(ctx, ow, o) {
    var skin = lin(ctx, -8, -8, 10, 10, [0, '#f6c9a0', 1, '#d99870']);
    var bd = '#2b201d';
    // cou
    ctx.fillStyle = '#d0906a'; rrect(ctx, -3.5, 8, 8, 7, 2); ctx.fill();
    // tête
    ctx.beginPath(); ctx.ellipse(0.5, 0, 11.3, 11.9, 0, 0, TAU);
    ctx.fillStyle = skin; ctx.fill(); ctx.lineWidth = ow; ctx.strokeStyle = INK; ctx.stroke();
    // oreille
    ctx.beginPath(); ctx.ellipse(-8.4, 1.2, 2.5, 3.3, 0, 0, TAU);
    ctx.fillStyle = '#e2a27b'; ctx.fill(); ctx.lineWidth = ow * 0.8; ctx.stroke();
    // barbe
    ctx.beginPath();
    ctx.moveTo(-10.9, 0.5);
    ctx.bezierCurveTo(-11.4, 8, -5.5, 13.4, 1, 13.6);
    ctx.bezierCurveTo(7.4, 13.6, 11.2, 9, 11.4, 1.5);
    ctx.bezierCurveTo(9.6, 3.4, 6.6, 4, 3.4, 4.1);
    ctx.lineTo(-3, 4.1);
    ctx.bezierCurveTo(-6.6, 4, -9.6, 3, -10.9, 0.5);
    ctx.closePath();
    ctx.fillStyle = lin(ctx, 0, 3, 0, 14, [0, '#3a2c27', 1, bd]); ctx.fill();
    ctx.lineWidth = ow * 0.7; ctx.strokeStyle = INK; ctx.stroke();
    ctx.fillStyle = 'rgba(255,255,255,0.10)';
    ctx.beginPath(); ctx.ellipse(-3, 9.5, 4, 1.6, -0.3, 0, TAU); ctx.fill();
    // bouche
    if (o.dead) {
      ctx.fillStyle = '#4a1414'; ctx.beginPath(); ctx.ellipse(5.2, 7.6, 2.8, 3.2, 0, 0, TAU); ctx.fill();
    } else {
      ctx.beginPath(); ctx.moveTo(1.8, 6.5); ctx.quadraticCurveTo(5.4, 10.8, 9, 6.3); ctx.quadraticCurveTo(5.4, 7.6, 1.8, 6.5);
      ctx.fillStyle = '#fff'; ctx.fill(); ctx.lineWidth = 0.7; ctx.strokeStyle = '#7a2a2a'; ctx.stroke();
    }
    // nez
    ctx.beginPath(); ctx.ellipse(10.8, 1.7, 2.4, 2.3, 0, 0, TAU);
    ctx.fillStyle = '#eeb48c'; ctx.fill(); ctx.lineWidth = ow * 0.7; ctx.strokeStyle = INK; ctx.stroke();
    // joue
    ctx.fillStyle = 'rgba(255,120,110,0.22)'; ctx.beginPath(); ctx.ellipse(6.5, 3.2, 2.6, 1.6, 0, 0, TAU); ctx.fill();
    // yeux
    var lx = o.lookX || 0.7, ly = o.lookY || 0;
    function eye(x, y) {
      ctx.beginPath(); ctx.ellipse(x, y, 2.2, o.dead ? 3.4 : 2.8, 0, 0, TAU);
      ctx.fillStyle = '#fff'; ctx.fill(); ctx.lineWidth = 0.55; ctx.strokeStyle = '#5a4640'; ctx.stroke();
      circle(ctx, x + lx * 0.8, y + ly, 1.4); ctx.fillStyle = '#1b1722'; ctx.fill();
      circle(ctx, x + lx * 0.8 + 0.5, y + ly - 0.6, 0.45); ctx.fillStyle = '#fff'; ctx.fill();
    }
    eye(5.6, -1.8); eye(-0.8, -1.8);
    ctx.lineCap = 'round'; ctx.strokeStyle = bd; ctx.lineWidth = 1.6;
    var br = o.brow || 0;
    ctx.beginPath(); ctx.moveTo(3.4, -5.4 - br); ctx.quadraticCurveTo(6, -6.6, 8.4, -5.4 + br * 0.4); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(-3, -5.2 + br * 0.4); ctx.quadraticCurveTo(-0.8, -6.6, 1.4, -5.6 - br); ctx.stroke();
    // casquette (à l'envers : visière derrière la tête)
    var fire = o.power === 2;
    ctx.beginPath();
    ctx.moveTo(-10.4, -7.5); ctx.quadraticCurveTo(-20.5, -15.5, -24.5, -7.8);
    ctx.quadraticCurveTo(-24.5, -3.6, -19, -3.1); ctx.quadraticCurveTo(-14, -2.7, -10.8, -2.9); ctx.closePath();
    ctx.fillStyle = lin(ctx, -24, -14, -12, -2, [0, '#ffffff', 1, '#d3d6ea']); ctx.fill();
    ctx.lineWidth = ow; ctx.strokeStyle = INK; ctx.stroke();
    ctx.strokeStyle = '#b9bdd6'; ctx.lineWidth = 0.8;
    ctx.beginPath(); ctx.moveTo(-12, -3.8); ctx.quadraticCurveTo(-18, -4.5, -22.6, -7); ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(-11.8, -2.2); ctx.bezierCurveTo(-12.8, -17.2, -2, -18.8, 2, -18.7);
    ctx.bezierCurveTo(9.4, -18.5, 13.4, -12, 12.8, -3.2); ctx.quadraticCurveTo(1, -6.6, -11.8, -2.2); ctx.closePath();
    ctx.fillStyle = lin(ctx, -12, -18, 14, -3, [0, '#f0f2fb', 0.5, '#ffffff', 1, '#d9dcef']); ctx.fill();
    ctx.lineWidth = ow; ctx.strokeStyle = INK; ctx.stroke();
    ctx.strokeStyle = '#c4c8de'; ctx.lineWidth = 0.8;
    ctx.beginPath(); ctx.moveTo(1.6, -18.5); ctx.quadraticCurveTo(-2.4, -12, -5.6, -4.6); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(1.6, -18.5); ctx.quadraticCurveTo(7.4, -12.4, 9.8, -4.9); ctx.stroke();
    ctx.strokeStyle = fire ? '#ff7a1a' : '#c9cde4'; ctx.lineWidth = 2.1;
    ctx.beginPath(); ctx.moveTo(-11.2, -2.9); ctx.quadraticCurveTo(1, -6.2, 12.4, -3.4); ctx.stroke();
    circle(ctx, 1.7, -18.6, 1.4); ctx.fillStyle = fire ? '#ff7a1a' : '#e4e6f4'; ctx.fill();
    ctx.fillStyle = '#15151c'; rrect(ctx, -9.6, -11.4, 3.8, 3, 0.9); ctx.fill();
    if (fire) { ctx.fillStyle = '#ffb02e'; rrect(ctx, -8.8, -10.6, 2.2, 1.4, 0.5); ctx.fill(); }
  }
  art.drawHead = drawHead;

  /*  o : pose, ph (phase de course), t, power, sq (étirement), look */
  art.drawHero = function (ctx, x, y, s, face, o) {
    o = o || {};
    var pose = o.pose || 'idle', ph = o.ph || 0, t = o.t || 0, power = o.power || 0, sq = o.sq || 0;
    var ow = clamp(2.0 / s, 0.7, 2.0);
    var HIP = -20.5, TH = 9.5, SH = 9.5, UA = 8.2, FA = 7.8, SY = -19.2;
    var lean = 0, bob = 0, legB, legF, armB, armF, lookY = 0, brow = 0, dead = false, headRot = 0;
    function run(p) { var th = 0.85 * Math.sin(p), bend = 0.2 + 0.95 * Math.max(0, Math.cos(p)); return [th, th - bend]; }
    var runSpeed = Math.min(1.4, 0.8 + Math.abs(ph % 6) * 0.05);
    switch (pose) {
      case 'run':
        legB = run(ph + PI); legF = run(ph);
        var sw = Math.sin(ph);
        armB = [0.95 * sw + 0.15, 0.95 * sw + 1.35]; armF = [-0.95 * sw + 0.15, -0.95 * sw + 1.35];
        bob = -Math.abs(Math.cos(ph)) * 2.4; lean = 0.22; brow = 0.5;
        headRot = Math.sin(ph) * 0.03;
        break;
      case 'jump':
        legB = [-0.7, -1.7]; legF = [1.45, -0.25];
        armB = [-1.35, -1.0]; armF = [1.45, 2.8];
        lean = 0.26; lookY = -0.7; brow = 0.6; headRot = -0.12;
        bob = -1.2;
        break;
      case 'fall':
        legB = [-0.45, -1.0]; legF = [0.7, 0.3];
        armB = [-1.7, -2.2]; armF = [1.9, 2.5];
        lean = 0.08; lookY = 0.4; brow = -0.7;
        bob = 0.8;
        break;
      case 'skid':
        legB = [0.55, 0.35]; legF = [0.95, 0.7];
        armB = [-1.2, -0.6]; armF = [-0.85, -0.3];
        lean = -0.3; bob = 1.0; brow = 1.0; headRot = 0.08;
        break;
      case 'flag':
        legB = [0.35, 0.05]; legF = [0.15, -0.1];
        armB = [2.9, 3.1]; armF = [2.7, 3.1];
        lean = 0; bob = 0; brow = -0.3;
        break;
      case 'dead':
        legB = [-0.55, -0.35]; legF = [0.55, 0.3];
        armB = [-2.7, -3.0]; armF = [2.7, 3.0];
        lookY = -0.4; brow = -1.2; dead = true;
        break;
      default:
        legB = [-0.05, -0.05]; legF = [0.07, 0.07];
        armB = [-0.1, 0.3]; armF = [0.12, 0.5];
        bob = Math.sin(t * 3) * 0.55; lean = 0.03;
    }
    ctx.save();
    ctx.translate(x, y);
    ctx.scale(face * s * (1 - 0.6 * sq), s * (1 + sq));
    var hy = HIP + bob;

    function legPts(hx, a) {
      var kx = hx + Math.sin(a[0]) * TH, ky = hy + Math.cos(a[0]) * TH;
      return { h: [hx, hy], k: [kx, ky], a: [kx + Math.sin(a[1]) * SH, ky + Math.cos(a[1]) * SH], sa: a[1] };
    }
    function drawLeg(L) {
      var pants = power === 2 ? '#3a2a6b' : '#232f5e';
      var pantsL = power === 2 ? '#ff8a2a' : '#3f5aa8';
      limb(ctx, [L.h, L.k, L.a], 8.2, pants, ow);
      limb(ctx, [[L.h[0] + 1.6, L.h[1] + 1], [L.k[0] + 1.6, L.k[1]]], 2.6, pantsL, 0);
      var sa = L.sa, cx = L.a[0] - Math.sin(sa) * 2.7, cy = L.a[1] - Math.cos(sa) * 2.7;
      limb(ctx, [[cx, cy], L.a], 7.9, '#d6d9ec', ow * 0.9);
      ctx.save();
      ctx.translate(L.a[0], L.a[1] + 0.5); ctx.rotate(clamp(sa * 0.55, -1.1, 1.1));
      ctx.beginPath();
      ctx.moveTo(-4.6, -4.8); ctx.lineTo(1, -5); ctx.quadraticCurveTo(5.2, -4.8, 8.2, -1.6);
      ctx.quadraticCurveTo(9.8, 0.2, 8.8, 1.6); ctx.lineTo(-4.8, 1.6); ctx.quadraticCurveTo(-6, -1, -4.6, -4.8); ctx.closePath();
      ctx.fillStyle = lin(ctx, 0, -5, 0, 2, [0, '#ffffff', 1, '#e1e4f1']); ctx.fill();
      ctx.lineWidth = ow; ctx.strokeStyle = INK; ctx.stroke();
      ctx.beginPath(); ctx.moveTo(-3, -0.8); ctx.quadraticCurveTo(1.6, -4.2, 6.6, -1.4); ctx.lineTo(5.6, 0.4); ctx.quadraticCurveTo(1.6, -2.2, -3, 0.6); ctx.closePath();
      ctx.fillStyle = '#15151c'; ctx.fill();
      rrect(ctx, -5.2, 0.4, 14.6, 2.3, 1.1); ctx.fillStyle = '#dfe2ef'; ctx.fill();
      ctx.lineWidth = ow * 0.7; ctx.stroke();
      ctx.restore();
    }
    function drawArm(sx, sy, a, front) {
      var ex = sx + Math.sin(a[0]) * UA, ey = sy + Math.cos(a[0]) * UA;
      var wx = ex + Math.sin(a[1]) * FA, wy = ey + Math.cos(a[1]) * FA;
      limb(ctx, [[sx, sy], [ex, ey], [wx, wy]], 6.6, '#f6f7fd', ow);
      limb(ctx, [[wx - Math.sin(a[1]) * 2.8, wy - Math.cos(a[1]) * 2.8], [wx, wy]], 6.8, '#23242d', ow * 0.9);
      if (front) {
        var mx = wx - Math.sin(a[1]) * 4.6, my = wy - Math.cos(a[1]) * 4.6;
        limb(ctx, [[mx - Math.sin(a[1]) * 1.2, my - Math.cos(a[1]) * 1.2], [mx + Math.sin(a[1]) * 0.6, my + Math.cos(a[1]) * 0.6]], 7, '#101018', 0);
        circle(ctx, mx, my, 1); ctx.fillStyle = '#58d6ff'; ctx.fill();
      }
      var hx = wx + Math.sin(a[1]) * 2.3, hyy = wy + Math.cos(a[1]) * 2.3;
      circle(ctx, hx, hyy, 3.7); ctx.fillStyle = '#eab088'; ctx.fill();
      ctx.lineWidth = ow; ctx.strokeStyle = INK; ctx.stroke();
      ctx.strokeStyle = 'rgba(120,60,40,0.5)'; ctx.lineWidth = 0.6;
      ctx.beginPath(); ctx.moveTo(hx - 1.2, hyy - 1.6); ctx.lineTo(hx - 1.2, hyy + 0.8); ctx.moveTo(hx + 0.6, hyy - 1.8); ctx.lineTo(hx + 0.6, hyy + 0.8); ctx.stroke();
    }

    var LB = legPts(-2.7, legB), LF = legPts(3, legF);
    drawLeg(LB); drawLeg(LF);

    ctx.save();
    ctx.translate(0, hy); ctx.rotate(lean);
    // === WASSEL GALAXY : jetpack dorsal ===
    (function () {
      var jy = -12, jw = 7;
      ctx.save();
      ctx.translate(-11.5, jy);
      rrect(ctx, -jw, -9, jw * 2, 18, 3.5);
      ctx.fillStyle = lin(ctx, -jw, 0, jw, 0, [0, '#3a4a7a', 0.5, '#1e2a5a', 1, '#10173a']); ctx.fill();
      ctx.lineWidth = ow * 0.9; ctx.strokeStyle = INK; ctx.stroke();
      ctx.fillStyle = power === 2 ? '#ff7a1a' : '#58d6ff';
      circle(ctx, 0, -4, 2.4); ctx.fill();
      ctx.fillStyle = power === 2 ? '#ffe58a' : '#c8f4ff';
      circle(ctx, 0, -4, 1.1); ctx.fill();
      // flammes animees
      var fl = 4 + Math.abs(Math.sin(t * 22)) * (pose === 'run' ? 7 : 3) + (pose === 'jump' ? 5 : 0);
      ctx.beginPath(); ctx.moveTo(-jw + 1.5, 9); ctx.lineTo(0, 9 + fl + 4); ctx.lineTo(jw - 1.5, 9); ctx.closePath();
      ctx.fillStyle = pose === 'run' || pose === 'jump' ? '#ff9d2e' : 'rgba(255,157,46,0.55)'; ctx.fill();
      ctx.beginPath(); ctx.moveTo(-3, 9); ctx.lineTo(0, 9 + fl); ctx.lineTo(3, 9); ctx.closePath();
      ctx.fillStyle = '#fff6b8'; ctx.fill();
      ctx.restore();
    })();
    drawArm(-1.6, SY, armB, false);
    // === combinaison Galaxy : bleu nuit + orange ===
    var suitC0 = power === 2 ? '#2a3f8f' : '#25336b';
    var suitC1 = power === 2 ? '#ff8a2a' : '#33478c';
    var suitL = power === 2 ? '#ffd23f' : '#58d6ff';
    rrect(ctx, -9.8, -22.2, 19.6, 24.4, 5.5);
    ctx.fillStyle = lin(ctx, -10, 0, 10, 0, [0, suitC0, 0.5, suitC1, 1, suitC0]); ctx.fill();
    ctx.lineWidth = ow; ctx.strokeStyle = INK; ctx.stroke();
    // bande ventrale lumineuse
    ctx.fillStyle = suitL; rrect(ctx, -9.2, -1.4, 18.4, 3.2, 1.6); ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,0.5)'; rrect(ctx, -9.2, -1.4, 18.4, 1.2, 1); ctx.fill();
    // plastron + coeur d'energie
    rrect(ctx, -6.5, -19, 13, 11, 3);
    ctx.fillStyle = lin(ctx, 0, -19, 0, -8, [0, '#ffffff', 1, '#c8d4f5']); ctx.fill();
    ctx.lineWidth = ow * 0.8; ctx.strokeStyle = INK; ctx.stroke();
    var pulse = 1 + Math.sin(t * 6) * 0.15;
    ctx.save(); ctx.translate(1, -13.5); ctx.scale(pulse, pulse);
    circle(ctx, 0, 0, 3.2); ctx.fillStyle = power === 2 ? '#ff7a1a' : '#00e5ff'; ctx.fill();
    ctx.lineWidth = 1; ctx.strokeStyle = INK; ctx.stroke();
    circle(ctx, -0.8, -0.8, 1); ctx.fillStyle = '#fff'; ctx.fill();
    ctx.restore();
    // col
    ctx.beginPath(); ctx.ellipse(1, -21.8, 7.6, 3.3, 0, 0, TAU);
    ctx.fillStyle = power === 2 ? '#ff7a1a' : '#0f1836'; ctx.fill(); ctx.lineWidth = ow * 0.8; ctx.strokeStyle = INK; ctx.stroke();
    // WASSEL GALAXY
    ctx.save(); ctx.scale(face, 1);
    ctx.font = '4.2px ' + FONT; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    if ('letterSpacing' in ctx) ctx.letterSpacing = '0.5px';
    ctx.fillStyle = '#ffffff'; ctx.fillText('WASSEL', face * 1.2, -6.5);
    ctx.restore();
    // tête
    ctx.save(); ctx.translate(1.6, -33.2); ctx.rotate(headRot); ctx.scale(0.82, 0.82);
    drawHead(ctx, ow / 0.82, { power: power, lookY: lookY, brow: brow, dead: dead });
    ctx.restore();
    drawArm(2.6, SY, armF, true);
    ctx.restore();
    ctx.restore();
  };

  /* ------------------------------------------------------------- décors */
  function buildLayers(th) {
    var R = 1.5, Wl = 1200;
    function mk(fn) {
      var c = document.createElement('canvas'); c.width = Math.round(Wl * R); c.height = Math.round(VH * R);
      var x = c.getContext('2d'); x.scale(R, R); fn(x); return c;
    }
    function tree(x, bx, by, s, rnd) {
      bx = bx; x.fillStyle = '#4a2f1a'; x.fillRect(bx - 1.8 * s, by - 9 * s, 3.6 * s, 10 * s);
      var cols = [th.treeD, th.tree];
      [[0, -22, 12], [-8, -17, 9], [8, -17, 9.5], [0, -13, 10]].forEach(function (c, i) {
        circle(x, bx + c[0] * s, by + c[1] * s, c[2] * s); x.fillStyle = cols[i % 2 === 0 ? 0 : 1]; x.fill();
      });
      [[-3, -25, 5], [5, -20, 3.4]].forEach(function (c) { circle(x, bx + c[0] * s, by + c[1] * s, c[2] * s); x.fillStyle = th.treeL; x.globalAlpha = 0.65; x.fill(); x.globalAlpha = 1; });
    }
    var far = mk(function (x) {
      function pk(px) {
        return 330 - (70 * (1 - Math.pow(Math.abs(Math.sin(TAU * 2 * px / Wl + 0.6)), 0.85)) + 34 * (1 - Math.pow(Math.abs(Math.sin(TAU * 5 * px / Wl + 1.9)), 0.9)));
      }
      x.beginPath(); x.moveTo(0, VH);
      for (var px = 0; px <= Wl; px += 6) x.lineTo(px, pk(px));
      x.lineTo(Wl, VH); x.closePath();
      x.fillStyle = lin(x, 0, 220, 0, 400, [0, th.farB, 1, th.far]); x.fill();
      x.strokeStyle = th.farRim; x.lineWidth = 2; x.beginPath();
      for (px = 0; px <= Wl; px += 6) { if (px === 0) x.moveTo(px, pk(px)); else x.lineTo(px, pk(px)); }
      x.stroke();
    });
    var mid = mk(function (x) {
      function hl(px) { return 362 - (34 * (Math.sin(TAU * 3 * px / Wl + 0.4) * 0.5 + 0.5) + 18 * (Math.sin(TAU * 7 * px / Wl + 2.1) * 0.5 + 0.5)); }
      x.beginPath(); x.moveTo(0, VH);
      for (var px = 0; px <= Wl; px += 6) x.lineTo(px, hl(px));
      x.lineTo(Wl, VH); x.closePath();
      x.fillStyle = lin(x, 0, 300, 0, 420, [0, th.mid, 1, th.midB]); x.fill();
      x.strokeStyle = th.midRim; x.lineWidth = 3; x.beginPath();
      for (px = 0; px <= Wl; px += 6) { if (px === 0) x.moveTo(px, hl(px)); else x.lineTo(px, hl(px)); }
      x.stroke();
      var r = rng(7);
      for (var i = 0; i < 18; i++) {
        var tx = (i + 0.2 + r() * 0.6) * Wl / 18, sc = 0.7 + r() * 0.6;
        tree(x, tx, hl(tx) + 8, sc, r);
        if (tx < 70) tree(x, tx + Wl, hl(tx) + 8, sc, r);
        if (tx > Wl - 70) tree(x, tx - Wl, hl(tx) + 8, sc, r);
      }
    });
    var near = mk(function (x) {
      function hl(px) { return 398 - (16 * (Math.sin(TAU * 4 * px / Wl + 1.2) * 0.5 + 0.5) + 8 * (Math.sin(TAU * 9 * px / Wl) * 0.5 + 0.5)); }
      x.beginPath(); x.moveTo(0, VH);
      for (var px = 0; px <= Wl; px += 6) x.lineTo(px, hl(px));
      x.lineTo(Wl, VH); x.closePath();
      x.fillStyle = lin(x, 0, 370, 0, 430, [0, th.near, 1, th.nearB]); x.fill();
      x.strokeStyle = th.nearRim; x.lineWidth = 3; x.beginPath();
      for (px = 0; px <= Wl; px += 6) { if (px === 0) x.moveTo(px, hl(px)); else x.lineTo(px, hl(px)); }
      x.stroke();
      var r = rng(31);
      for (var i = 0; i < 22; i++) {
        var bx = r() * Wl, by = hl(bx) + 3, bs = 7 + r() * 8;
        [[0, 0, 1], [-bs * 0.8, 2, 0.8], [bs * 0.8, 2, 0.85]].forEach(function (c) {
          circle(x, bx + c[0], by - bs * 0.2 + c[1], bs * c[2]); x.fillStyle = th.nearB; x.fill();
          circle(x, bx + c[0] - 1, by - bs * 0.35 + c[1], bs * c[2] * 0.8); x.fillStyle = th.near; x.fill();
        });
      }
      if (th.id === 'day') {
        var cols = ['#ffffff', '#ffe36b', '#ff9ec2'];
        for (i = 0; i < 40; i++) { var fx = r() * Wl; circle(x, fx, hl(fx) + 6 + r() * 12, 1.8); x.fillStyle = cols[i % 3]; x.fill(); }
      }
    });
    return [{ c: far, sp: 0.06 }, { c: mid, sp: 0.2 }, { c: near, sp: 0.42 }];
  }

  function cloud(ctx, x, y, s, th) {
    ctx.fillStyle = th.cloudSh;
    ctx.beginPath(); ctx.ellipse(x + 28 * s, y + 14 * s, 36 * s, 11 * s, 0, 0, TAU); ctx.fill();
    ctx.fillStyle = th.cloud;
    circle(ctx, x, y + 4 * s, 15 * s); ctx.fill();
    circle(ctx, x + 22 * s, y - 8 * s, 21 * s); ctx.fill();
    circle(ctx, x + 48 * s, y, 17 * s); ctx.fill();
    ctx.beginPath(); ctx.ellipse(x + 26 * s, y + 8 * s, 34 * s, 11 * s, 0, 0, TAU); ctx.fill();
  }
  art.cloud = cloud;

  art.drawBackground = function (ctx, th, cam, t) {
    ctx.fillStyle = lin(ctx, 0, 0, 0, VH, [0, th.skyTop, 0.55, th.skyMid, 1, th.skyBot]);
    ctx.fillRect(0, 0, VW, VH);
    var i;
    if (th.id === 'day') {
      var sg = ctx.createRadialGradient(660, 80, 8, 660, 80, 150);
      sg.addColorStop(0, 'rgba(255,248,200,0.95)'); sg.addColorStop(0.25, 'rgba(255,240,160,0.4)'); sg.addColorStop(1, 'rgba(255,240,160,0)');
      ctx.fillStyle = sg; ctx.fillRect(500, 0, 300, 240);
      circle(ctx, 660, 80, 24); ctx.fillStyle = '#fff6b8'; ctx.fill();
    } else if (th.id === 'night') {
      if (!th._stars) { var r = rng(5); th._stars = []; for (i = 0; i < 90; i++) th._stars.push([r() * VW, r() * 280, r()]); }
      ctx.fillStyle = '#fff';
      th._stars.forEach(function (s, k) {
        ctx.globalAlpha = 0.35 + 0.6 * Math.abs(Math.sin(t * (0.8 + s[2]) + k));
        ctx.fillRect(s[0], s[1], s[2] > 0.8 ? 2 : 1.2, s[2] > 0.8 ? 2 : 1.2);
      });
      ctx.globalAlpha = 1;
      var mg = ctx.createRadialGradient(620, 84, 10, 620, 84, 120);
      mg.addColorStop(0, 'rgba(210,225,255,0.5)'); mg.addColorStop(1, 'rgba(210,225,255,0)');
      ctx.fillStyle = mg; ctx.fillRect(480, 0, 280, 220);
      circle(ctx, 620, 84, 26); ctx.fillStyle = '#f2f5ff'; ctx.fill();
      ctx.fillStyle = 'rgba(160,175,215,0.45)'; circle(ctx, 611, 78, 5); ctx.fill(); circle(ctx, 630, 92, 4); ctx.fill(); circle(ctx, 624, 70, 3); ctx.fill();
      var sp = (t * 0.12) % 1;
      if (sp < 0.12) { ctx.strokeStyle = 'rgba(255,255,255,' + (1 - sp / 0.12) + ')'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(200 + sp * 900, 40 + sp * 300); ctx.lineTo(200 + sp * 900 - 50, 40 + sp * 300 - 18); ctx.stroke(); }
    } else {
      var dg = ctx.createRadialGradient(520, 330, 10, 520, 330, 260);
      dg.addColorStop(0, 'rgba(255,230,150,0.95)'); dg.addColorStop(0.3, 'rgba(255,160,100,0.45)'); dg.addColorStop(1, 'rgba(255,120,100,0)');
      ctx.fillStyle = dg; ctx.fillRect(220, 90, 600, 340);
      circle(ctx, 520, 318, 52); ctx.fillStyle = '#ffe9a8'; ctx.fill();
      ctx.strokeStyle = '#2a1744'; ctx.lineWidth = 2; ctx.lineCap = 'round';
      for (i = 0; i < 4; i++) {
        var bx = ((i * 230 - cam * 0.1 + t * 22) % 900 + 900) % 900 - 60, by = 90 + i * 28 + Math.sin(t * 2 + i) * 6, fl = Math.sin(t * 9 + i * 2) * 4;
        ctx.beginPath(); ctx.moveTo(bx - 8, by - 3 + fl); ctx.quadraticCurveTo(bx - 3, by + 1, bx, by); ctx.quadraticCurveTo(bx + 3, by + 1, bx + 8, by - 3 + fl); ctx.stroke();
      }
    }
    if (!th._L) th._L = buildLayers(th);
    var L = th._L, Wl = 1200;
    function blit(layer) {
      var x0 = -((cam * layer.sp) % Wl);
      ctx.drawImage(layer.c, x0, 0, Wl, VH); ctx.drawImage(layer.c, x0 + Wl, 0, Wl, VH);
    }
    blit(L[0]);
    var cl = [[40, 92, 1], [330, 150, 1.3], [560, 70, 0.8], [840, 130, 1.1], [1100, 60, 0.9]];
    for (i = 0; i < cl.length; i++) {
      var cx = (((cl[i][0] - cam * 0.12 + t * (5 + i * 2)) % 1400) + 1400) % 1400 - 150;
      cloud(ctx, cx, cl[i][1], cl[i][2], th);
    }
    blit(L[1]); blit(L[2]);
    if (th.id === 'night') {
      for (i = 0; i < 16; i++) {
        var fx = ((i * 97 - cam * 0.3 + Math.sin(t * 0.7 + i) * 30) % 880 + 880) % 880 - 40, fy = 300 + (i * 37) % 80 + Math.sin(t * 1.3 + i * 2) * 12;
        var a = 0.4 + 0.5 * Math.sin(t * 3 + i);
        ctx.fillStyle = 'rgba(210,255,120,' + (0.15 * a) + ')'; circle(ctx, fx, fy, 6); ctx.fill();
        ctx.fillStyle = 'rgba(240,255,170,' + a + ')'; circle(ctx, fx, fy, 1.8); ctx.fill();
      }
    }
  };

  /* ------------------------------------------------------------ tuiles */
  function pipeBody(ctx, px, py, left, cap) {
    var inset = 3;
    var x0 = left ? px + inset : px, x1 = left ? px + T : px + T - inset;
    var g = left ? lin(ctx, px, 0, px + T, 0, [0, '#177026', 0.38, '#8cf06a', 0.62, '#43b94c', 1, '#2b9c3b']) : lin(ctx, px, 0, px + T, 0, [0, '#2b9c3b', 0.5, '#2f9f3d', 1, '#0f5a21']);
    var y0 = cap ? py + 12 : py;
    ctx.fillStyle = g; ctx.fillRect(x0, y0, x1 - x0, py + T - y0);
    ctx.fillStyle = '#0b3d17';
    if (left) ctx.fillRect(x0, y0, 2, py + T - y0); else ctx.fillRect(x1 - 2, y0, 2, py + T - y0);
    if (cap) {
      var lx0 = left ? px - 3 : px, lx1 = left ? px + T : px + T + 3;
      ctx.fillStyle = g; rrect(ctx, lx0, py, lx1 - lx0, 16, 3); ctx.fill();
      ctx.lineWidth = 2; ctx.strokeStyle = '#0b3d17'; ctx.stroke();
      ctx.fillStyle = 'rgba(0,0,0,0.22)'; ctx.fillRect(left ? lx0 + 2 : lx0, py + 12, lx1 - lx0 - 2, 4);
    }
  }

  art.drawTile = function (ctx, c, px, py, tx, ty, th, sol, t) {
    var i;
    switch (c) {
      case 'G': {
        ctx.fillStyle = lin(ctx, 0, py, 0, py + T, [0, th.dirtT, 1, th.dirtB]); ctx.fillRect(px, py, T, T);
        var r = ((tx * 73 + ty * 151) % 97);
        ctx.fillStyle = th.dirtD;
        ctx.beginPath(); ctx.ellipse(px + 8 + (r % 7), py + 18 + (r % 5), 3.4, 2.2, 0.3, 0, TAU); ctx.fill();
        ctx.beginPath(); ctx.ellipse(px + 22 - (r % 5), py + 25 - (r % 4), 2.6, 1.8, 0, 0, TAU); ctx.fill();
        ctx.fillRect(px + 15 + (r % 6), py + 13, 3, 2);
        var topOpen = !sol(tx, ty - 1);
        if (!sol(tx - 1, ty)) { ctx.fillStyle = th.outline; ctx.fillRect(px, py, 2, T); }
        if (!sol(tx + 1, ty)) { ctx.fillStyle = th.outline; ctx.fillRect(px + T - 2, py, 2, T); }
        if (topOpen) {
          var ex0 = sol(tx - 1, ty - 1) || sol(tx - 1, ty) ? 0 : -1.5, ex1 = sol(tx + 1, ty) ? 0 : 1.5;
          ctx.beginPath(); ctx.moveTo(px + ex0, py - 2);
          ctx.lineTo(px + T + ex1, py - 2); ctx.lineTo(px + T + ex1, py + 9);
          for (i = 3; i >= 0; i--) ctx.arc(px + 4 + i * 8, py + 9, 4.2, 0, PI);
          ctx.lineTo(px + ex0, py + 9); ctx.closePath();
          ctx.fillStyle = lin(ctx, 0, py - 2, 0, py + 13, [0, th.grassL, 0.3, th.grass, 1, th.grassD]); ctx.fill();
          ctx.lineWidth = 2; ctx.strokeStyle = th.outline; ctx.stroke();
          ctx.fillStyle = 'rgba(255,255,255,0.35)'; ctx.fillRect(px + 2, py - 0.5, T - 4, 2);
          if ((tx * 5 + 3) % 4 === 0) {
            ctx.fillStyle = th.grassD;
            ctx.beginPath(); ctx.moveTo(px + 8, py - 1); ctx.lineTo(px + 10, py - 6); ctx.lineTo(px + 12, py - 1); ctx.lineTo(px + 15, py - 5); ctx.lineTo(px + 16, py - 1); ctx.fill();
          }
        }
        break;
      }
      case 'B': {
        ctx.fillStyle = th.brick; ctx.fillRect(px, py, T, T);
        ctx.fillStyle = th.brickD;
        ctx.fillRect(px, py + 10, T, 2); ctx.fillRect(px, py + 21, T, 2);
        ctx.fillRect(px + 15, py, 2, 11); ctx.fillRect(px + 7, py + 11, 2, 11); ctx.fillRect(px + 23, py + 11, 2, 11); ctx.fillRect(px + 15, py + 22, 2, 10);
        ctx.fillStyle = th.brickL; ctx.globalAlpha = 0.55;
        ctx.fillRect(px + 1, py + 1, 13, 2); ctx.fillRect(px + 18, py + 1, 13, 2); ctx.fillRect(px + 1, py + 12, 5, 2); ctx.fillRect(px + 10, py + 12, 12, 2); ctx.fillRect(px + 26, py + 12, 5, 2);
        ctx.fillRect(px + 1, py + 23, 13, 2); ctx.fillRect(px + 18, py + 23, 13, 2);
        ctx.globalAlpha = 1;
        ctx.strokeStyle = th.outline; ctx.lineWidth = 2; ctx.strokeRect(px + 1, py + 1, T - 2, T - 2);
        break;
      }
      case '?': case 'M': case 'W': {
        ctx.fillStyle = lin(ctx, 0, py, 0, py + T, [0, '#ffe888', 0.5, '#f7b929', 1, '#e0900f']); ctx.fillRect(px, py, T, T);
        ctx.fillStyle = 'rgba(255,255,255,0.5)'; ctx.fillRect(px + 2, py + 2, T - 4, 2.5); ctx.fillRect(px + 2, py + 2, 2.5, T - 4);
        ctx.fillStyle = 'rgba(120,60,0,0.45)'; ctx.fillRect(px + 2, py + T - 4.5, T - 4, 2.5); ctx.fillRect(px + T - 4.5, py + 2, 2.5, T - 4);
        ctx.strokeStyle = th.outline; ctx.lineWidth = 2; ctx.strokeRect(px + 1, py + 1, T - 2, T - 2);
        ctx.fillStyle = '#8a5200';
        circle(ctx, px + 5.5, py + 5.5, 1.6); ctx.fill(); circle(ctx, px + T - 5.5, py + 5.5, 1.6); ctx.fill();
        circle(ctx, px + 5.5, py + T - 5.5, 1.6); ctx.fill(); circle(ctx, px + T - 5.5, py + T - 5.5, 1.6); ctx.fill();
        ctx.save(); ctx.font = '24px ' + FONT; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        ctx.fillStyle = '#8a4a00'; ctx.fillText('?', px + 17, py + 18.5);
        ctx.fillStyle = '#fff6c8'; ctx.fillText('?', px + 16, py + 17); ctx.restore();
        var ph = (t * 0.55 + tx * 0.11) % 1;
        if (ph < 0.22) {
          ctx.save(); ctx.beginPath(); ctx.rect(px + 2, py + 2, T - 4, T - 4); ctx.clip();
          var sx = px - 12 + ph / 0.22 * (T + 24);
          ctx.fillStyle = 'rgba(255,255,255,0.55)';
          ctx.beginPath(); ctx.moveTo(sx, py + T); ctx.lineTo(sx + 7, py + T); ctx.lineTo(sx + 19, py); ctx.lineTo(sx + 12, py); ctx.fill();
          ctx.restore();
        }
        break;
      }
      case 'U': {
        ctx.fillStyle = '#8d6e4d'; ctx.fillRect(px, py, T, T);
        ctx.fillStyle = '#a58765'; ctx.fillRect(px + 2, py + 2, T - 4, 2.5); ctx.fillRect(px + 2, py + 2, 2.5, T - 4);
        ctx.fillStyle = '#5c432c'; ctx.fillRect(px + 2, py + T - 4.5, T - 4, 2.5); ctx.fillRect(px + T - 4.5, py + 2, 2.5, T - 4);
        ctx.fillStyle = '#6e5238'; ctx.fillRect(px + 9, py + 9, T - 18, T - 18);
        ctx.strokeStyle = th.outline; ctx.lineWidth = 2; ctx.strokeRect(px + 1, py + 1, T - 2, T - 2);
        ctx.fillStyle = '#4a3622';
        circle(ctx, px + 5.5, py + 5.5, 1.5); ctx.fill(); circle(ctx, px + T - 5.5, py + 5.5, 1.5); ctx.fill();
        circle(ctx, px + 5.5, py + T - 5.5, 1.5); ctx.fill(); circle(ctx, px + T - 5.5, py + T - 5.5, 1.5); ctx.fill();
        break;
      }
      case 'S': {
        ctx.fillStyle = lin(ctx, 0, py, 0, py + T, [0, th.stoneL, 0.2, th.stone, 1, th.stoneD]); ctx.fillRect(px, py, T, T);
        ctx.fillStyle = 'rgba(255,255,255,0.4)'; ctx.fillRect(px + 2, py + 2, T - 4, 2.5); ctx.fillRect(px + 2, py + 2, 2.5, T - 4);
        ctx.fillStyle = th.stoneD; ctx.globalAlpha = 0.6;
        ctx.fillRect(px + 2, py + T - 4.5, T - 4, 2.5); ctx.fillRect(px + T - 4.5, py + 2, 2.5, T - 4);
        ctx.globalAlpha = 1;
        ctx.fillRect(px + 8, py + 10, 3, 2); ctx.fillRect(px + 20, py + 19, 4, 2); ctx.fillRect(px + 14, py + 24, 2, 2);
        ctx.strokeStyle = th.outline; ctx.lineWidth = 2; ctx.strokeRect(px + 1, py + 1, T - 2, T - 2);
        break;
      }
      case 'p': pipeBody(ctx, px, py, true, true); break;
      case 'q': pipeBody(ctx, px, py, false, true); break;
      case 'l': pipeBody(ctx, px, py, true, false); break;
      case 'r': pipeBody(ctx, px, py, false, false); break;
    }
  };

  art.drawCoin = function (ctx, px, py, t) {
    var cx = px + 16, cy = py + 16 + Math.sin(t * 3 + px * 0.07) * 1.6;
    var w = Math.abs(Math.cos(t * 4 + px * 0.05)) * 8 + 2.5;
    ctx.beginPath(); ctx.ellipse(cx, cy, w, 11.5, 0, 0, TAU);
    ctx.fillStyle = lin(ctx, cx - w, 0, cx + w, 0, [0, '#ffe36a', 0.5, '#ffc61c', 1, '#e69a08']); ctx.fill();
    ctx.lineWidth = 2; ctx.strokeStyle = '#a86a00'; ctx.stroke();
    ctx.fillStyle = 'rgba(255,255,255,0.65)'; ctx.fillRect(cx - Math.min(w * 0.3, 2.2), cy - 6, Math.min(w * 0.6, 4.4), 12);
    var sp = (t * 0.7 + px * 0.01) % 2;
    if (sp < 0.2) { ctx.fillStyle = 'rgba(255,255,255,' + (1 - sp / 0.2) + ')'; star(ctx, cx + 6, cy - 8, 4, t); ctx.fill(); }
  };

  /* ------------------------------------------------------------ objets */
  art.drawItem = function (ctx, it, t) {
    var cx = it.x + it.w / 2, cy = it.y + it.h / 2;
    ctx.save();
    var gl = ctx.createRadialGradient(cx, cy, 2, cx, cy, 26);
    gl.addColorStop(0, 'rgba(255,240,150,0.6)'); gl.addColorStop(1, 'rgba(255,240,150,0)');
    ctx.fillStyle = gl; circle(ctx, cx, cy, 26); ctx.fill();
    ctx.lineJoin = 'round';
    if (it.t === 'cap') {
      ctx.beginPath(); ctx.ellipse(cx - 12, cy + 5, 10, 3.8, 0.1, 0, TAU);
      ctx.fillStyle = '#e9ebf8'; ctx.fill(); ctx.lineWidth = 2; ctx.strokeStyle = INK; ctx.stroke();
      ctx.beginPath(); ctx.arc(cx, cy + 6, 13.5, PI, TAU); ctx.closePath();
      ctx.fillStyle = lin(ctx, cx - 13, cy - 8, cx + 13, cy + 6, [0, '#ffffff', 1, '#d2d5ea']); ctx.fill(); ctx.stroke();
      ctx.fillStyle = '#ffc61c'; circle(ctx, cx + 1, cy - 3, 2.8); ctx.fill();
      ctx.strokeStyle = '#c4c8de'; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(cx + 1, cy - 7); ctx.quadraticCurveTo(cx - 4, cy - 3, cx - 6, cy + 5); ctx.stroke();
    } else if (it.t === 'fire') {
      var r = 9 + Math.sin(t * 12) * 1.2;
      ctx.beginPath(); ctx.moveTo(cx - 10, cy + 6); ctx.lineTo(cx - 7, cy - 13 - Math.sin(t * 9) * 2); ctx.lineTo(cx - 1, cy - 2); ctx.lineTo(cx + 3, cy - 15); ctx.lineTo(cx + 6, cy - 2); ctx.lineTo(cx + 11, cy + 6); ctx.closePath();
      ctx.fillStyle = '#ff5a14'; ctx.fill(); ctx.lineWidth = 2; ctx.strokeStyle = '#8a2200'; ctx.stroke();
      circle(ctx, cx, cy + 3, r); ctx.fillStyle = '#ff9d2e'; ctx.fill(); ctx.stroke();
      circle(ctx, cx, cy + 4, r * 0.55); ctx.fillStyle = '#ffe58a'; ctx.fill();
    } else {
      ctx.beginPath(); ctx.moveTo(cx - 13, cy + 9); ctx.lineTo(cx - 14, cy - 9); ctx.lineTo(cx - 6.5, cy - 1.5); ctx.lineTo(cx, cy - 12); ctx.lineTo(cx + 6.5, cy - 1.5); ctx.lineTo(cx + 14, cy - 9); ctx.lineTo(cx + 13, cy + 9); ctx.closePath();
      ctx.fillStyle = lin(ctx, 0, cy - 12, 0, cy + 9, [0, '#ffe36a', 1, '#f0a812']); ctx.fill(); ctx.lineWidth = 2; ctx.strokeStyle = '#8a5200'; ctx.stroke();
      ctx.fillStyle = '#e63946'; circle(ctx, cx, cy + 3, 2.8); ctx.fill();
      ctx.fillStyle = '#3fb6ff'; circle(ctx, cx - 8, cy + 4, 2); ctx.fill(); circle(ctx, cx + 8, cy + 4, 2); ctx.fill();
      ctx.fillStyle = '#fff'; star(ctx, cx + 11, cy - 11, 3.5, t * 2); ctx.fill();
    }
    ctx.restore();
  };

  /* ---------------------------------------------------------- ennemis */
  function eyeBall(ctx, x, y, rx, ry, dir) {
    ctx.beginPath(); ctx.ellipse(x, y, rx, ry, 0, 0, TAU); ctx.fillStyle = '#fff'; ctx.fill();
    ctx.lineWidth = 1.2; ctx.strokeStyle = '#2a1240'; ctx.stroke();
    circle(ctx, x + dir * 1.7, y + 0.7, rx * 0.5); ctx.fillStyle = '#1b1020'; ctx.fill();
    circle(ctx, x + dir * 1.7 + 0.9, y - 0.4, rx * 0.17); ctx.fillStyle = '#fff'; ctx.fill();
  }

  /* ================= WASSEL GALAXY : ennemis spatiaux =================
     slime -> ROBO-Rover (robot chenille)
     shellbug -> MEDUSE PLASMA (gelée spatiale, carapace = bouclier) */
  art.drawEnemy = function (ctx, e, t) {
    var cx = e.x + e.w / 2, by = e.y + e.h;
    ctx.save();
    ctx.translate(cx, by);
    if (e.state === 'fall') { ctx.translate(0, -e.h / 2); ctx.rotate(t * 8 * (e.vx >= 0 ? 1 : -1)); ctx.translate(0, e.h / 2); }
    ctx.lineJoin = 'round';
    // ---------- ROBO-ROVER ----------
    if (e.t === 'slime') {
      if (e.state === 'dead') {
        ctx.beginPath(); ctx.ellipse(0, -3, 18, 5, 0, 0, TAU);
        ctx.fillStyle = '#2a3350'; ctx.fill(); ctx.lineWidth = 2; ctx.strokeStyle = '#0b1026'; ctx.stroke();
        ctx.fillStyle = '#ff5a64';
        star(ctx, -6, -6, 3, t); ctx.fill();
        star(ctx, 6, -6, 3, -t); ctx.fill();
        ctx.strokeStyle = '#ff5a64'; ctx.lineWidth = 1.4;
        ctx.beginPath(); ctx.moveTo(-16, -12); ctx.lineTo(-8, -2); ctx.moveTo(-8, -12); ctx.lineTo(-16, -2); ctx.stroke();
        ctx.restore(); return;
      }
      var moving = e.state === 'walk' ? 1 : 0;
      var bobR = Math.sin(t * 14 + e.x * 0.2) * 1.2 * moving;
      var wheelRot = (t * 10 + e.x * 0.1) % (Math.PI*2);
      // ombre + lueur
      ctx.fillStyle = 'rgba(0,255,255,0.18)';
      ctx.beginPath(); ctx.ellipse(0, 0, 17, 4, 0, 0, TAU); ctx.fill();
      // chenilles / roues
      [-10, 10].forEach(function(wx, idx2){
        var wy = -4 + (idx2===0 ? Math.sin(t*16+e.x)*0.8 : -Math.sin(t*16+e.x)*0.8);
        ctx.save(); ctx.translate(wx, wy);
        circle(ctx, 0, 0, 6.5); ctx.fillStyle = '#11162e'; ctx.fill(); ctx.lineWidth = 2; ctx.strokeStyle = '#05081a'; ctx.stroke();
        circle(ctx, 0, 0, 4.2); ctx.fillStyle = '#2e3c6e'; ctx.fill();
        ctx.strokeStyle = '#58d6ff'; ctx.lineWidth = 1.4;
        for (var rr=0; rr<3; rr++){
          var a = wheelRot + rr*2.09 + (idx2? Math.PI:0);
          ctx.beginPath(); ctx.moveTo(0,0); ctx.lineTo(Math.cos(a)*4.2, Math.sin(a)*4.2); ctx.stroke();
        }
        circle(ctx, 0, 0, 1.2); ctx.fillStyle = '#ffe066'; ctx.fill();
        ctx.restore();
      });
      // corps robot
      ctx.save(); ctx.translate(0, bobR - 8);
      rrect(ctx, -15, -14, 30, 16, 5);
      ctx.fillStyle = lin(ctx, 0, -14, 0, 2, [0, '#dfe6ff', 0.45, '#8a99c9', 1, '#4a5a8f']); ctx.fill();
      ctx.lineWidth = 2.2; ctx.strokeStyle = '#0b1026'; ctx.stroke();
      // bande orange
      rrect(ctx, -15, -4, 30, 5, 2.5); ctx.fillStyle = '#ff7a1a'; ctx.fill();
      ctx.fillStyle = 'rgba(255,255,255,0.35)'; ctx.fillRect(-13, -3, 26, 1.4);
      // rivets
      ctx.fillStyle = '#0b1026';
      circle(ctx, -12, -11, 1.2); ctx.fill(); circle(ctx, 12, -11, 1.2); ctx.fill();
      // oeil capteur
      var dirR = e.dir || -1;
      var blink = (Math.sin(t*2.5 + e.x) > 0.92) ? 0.15 : 1;
      ctx.save(); ctx.translate(dirR*4, -8); ctx.scale(1, blink);
      circle(ctx, 0, 0, 5); ctx.fillStyle = '#0b1026'; ctx.fill();
      circle(ctx, 0, 0, 3.8); ctx.fillStyle = Math.sin(t*6+e.x)>0 ? '#ff3b3b' : '#00e5ff'; ctx.fill();
      circle(ctx, 1, -1, 1.3); ctx.fillStyle = '#fff'; ctx.fill();
      ctx.restore();
      // antenne
      ctx.strokeStyle = '#0b1026'; ctx.lineWidth = 1.8;
      ctx.beginPath(); ctx.moveTo(-6, -14); ctx.lineTo(-8, -20 - Math.sin(t*8+e.x)*1.5); ctx.stroke();
      var ab = (Math.sin(t*9+e.x)>0);
      circle(ctx, -8, -21 - Math.sin(t*8+e.x)*1.5, 2.2); ctx.fillStyle = ab ? '#ff3b3b' : '#5a6a9a'; ctx.fill();
      ctx.lineWidth = 1; ctx.strokeStyle = '#0b1026'; ctx.stroke();
      if (ab){ ctx.fillStyle = 'rgba(255,60,60,0.35)'; circle(ctx, -8, -21 - Math.sin(t*8+e.x)*1.5, 4.5); ctx.fill(); }
      ctx.restore();
      // etincelles
      if (moving && Math.random()<0.12){
        ctx.fillStyle = '#8af0ff';
        ctx.fillRect((Math.random()-0.5)*24, -2+Math.random()*2, 2, 2);
      }
    } else {
      // ---------- MEDUSE PLASMA ----------
      var d = e.dir || 1;
      if (e.state === 'shell') {
        var spin = e.shellV !== 0 ? t * 14 : t*2;
        // bouclier energie
        ctx.fillStyle = 'rgba(0,229,255,0.18)';
        circle(ctx, 0, -10, 18 + Math.sin(t*8)*1.5); ctx.fill();
        ctx.beginPath(); ctx.ellipse(0, -9, 15, 10, 0, Math.PI, TAU); ctx.lineTo(15, -3); ctx.quadraticCurveTo(0, 2, -15, -3); ctx.closePath();
        ctx.fillStyle = lin(ctx, 0, -19, 0, -2, [0, '#c8f4ff', 0.5, '#58b6ff', 1, '#2a3f8f']); ctx.fill();
        ctx.lineWidth = 2.4; ctx.strokeStyle = '#0b1e4a'; ctx.stroke();
        for (var k = 0; k < 4; k++) {
          var aa = spin + k * 1.57;
          circle(ctx, Math.cos(aa)*8, -11 + Math.sin(aa)*3, 2.4);
          ctx.fillStyle = k%2 ? '#ff9bdc' : '#ffe066'; ctx.fill();
        }
        ctx.fillStyle = 'rgba(255,255,255,0.7)'; ctx.beginPath(); ctx.ellipse(-5, -14, 4, 2, -0.5, 0, TAU); ctx.fill();
        rrect(ctx, -13, -4, 26, 4, 2); ctx.fillStyle = '#0b1e4a'; ctx.fill();
        ctx.restore(); return;
      }
      var floatY = Math.sin(t * 3.2 + e.x * 0.3) * 2.2;
      var pulse = 1 + Math.sin(t * 5 + e.x) * 0.06;
      ctx.save(); ctx.translate(0, floatY); ctx.scale(pulse, 1/pulse);
      // tentacules
      ctx.strokeStyle = '#ff9bdc'; ctx.lineWidth = 2; ctx.lineCap = 'round';
      for (var ti=-2; ti<=2; ti++){
        var wx = ti*5.5, wv = Math.sin(t*7 + ti*1.3 + e.x)*3.5;
        ctx.beginPath(); ctx.moveTo(wx, -4);
        ctx.quadraticCurveTo(wx + wv*0.5, 2, wx + wv, 7 + Math.abs(wv)*0.5);
        ctx.stroke();
        ctx.fillStyle = '#ffe066';
        circle(ctx, wx + wv, 7 + Math.abs(wv)*0.5, 1.4); ctx.fill();
      }
      // dome
      ctx.beginPath(); ctx.ellipse(0, -11, 15, 11.5, 0, Math.PI, TAU); ctx.lineTo(15, -4); ctx.quadraticCurveTo(0, 1, -15, -4); ctx.closePath();
      ctx.fillStyle = lin(ctx, 0, -23, 0, -3, [0, 'rgba(255,255,255,0.95)', 0.35, 'rgba(120,220,255,0.9)', 1, 'rgba(80,80,220,0.95)']); ctx.fill();
      ctx.lineWidth = 2.2; ctx.strokeStyle = '#2a1a5a'; ctx.stroke();
      // reflets
      ctx.fillStyle = 'rgba(255,255,255,0.75)'; ctx.beginPath(); ctx.ellipse(-6, -17, 4.5, 2.6, -0.5, 0, TAU); ctx.fill();
      // noyau
      var coreP = 5 + Math.sin(t*6+e.x)*0.8;
      ctx.save(); ctx.shadowColor = '#ff5ad0'; ctx.shadowBlur = 12;
      circle(ctx, 0, -10, coreP*0.7); ctx.fillStyle = '#ff5ad0'; ctx.fill();
      ctx.restore();
      circle(ctx, 0, -10, coreP*0.35); ctx.fillStyle = '#fff'; ctx.fill();
      // yeux
      var look = d*1.5;
      circle(ctx, -4+look*0.3, -13, 2.6); ctx.fillStyle = '#fff'; ctx.fill();
      circle(ctx, 4+look*0.3, -13, 2.6); ctx.fill();
      ctx.fillStyle = '#1b1030';
      circle(ctx, -4+look*0.5, -13, 1.3); ctx.fill();
      circle(ctx, 4+look*0.5, -13, 1.3); ctx.fill();
      ctx.restore();
      // halo
      ctx.fillStyle = 'rgba(255,90,208,0.12)';
      circle(ctx, 0, -10, 20 + Math.sin(t*4)*2); ctx.fill();
    }
    ctx.restore();
  };

  /* ------------------------------------------------------------ château */
  art.drawCastle = function (ctx, x, base, s, t, flagUp) {
    ctx.save(); ctx.translate(x, base); ctx.scale(s, s); ctx.lineJoin = 'round';
    var ol = '#3b3358', wall = lin(ctx, 0, -100, 0, 0, [0, '#f3eefb', 1, '#d5cde6']);
    function crenel(x0, w, y) { ctx.fillStyle = '#ece6f6'; for (var cx = x0; cx < x0 + w - 6; cx += 14) { ctx.fillRect(cx, y - 9, 9, 10); ctx.strokeRect(cx, y - 9, 9, 10); } }
    function bricks(x0, y0, w, h) {
      ctx.strokeStyle = 'rgba(120,108,160,0.35)'; ctx.lineWidth = 1;
      for (var yy = y0 + 14, r = 0; yy < y0 + h; yy += 14, r++) {
        ctx.beginPath(); ctx.moveTo(x0, yy); ctx.lineTo(x0 + w, yy); ctx.stroke();
        for (var xx = x0 + (r % 2 ? 9 : 20); xx < x0 + w; xx += 22) { ctx.beginPath(); ctx.moveTo(xx, yy - 14); ctx.lineTo(xx, yy); ctx.stroke(); }
      }
    }
    function roof(cx, bw, top, hgt) {
      ctx.beginPath(); ctx.moveTo(cx - bw / 2 - 7, top); ctx.lineTo(cx, top - hgt); ctx.lineTo(cx + bw / 2 + 7, top); ctx.closePath();
      ctx.fillStyle = lin(ctx, cx - bw / 2, 0, cx + bw / 2, 0, [0, '#ff5a4d', 0.5, '#e0302f', 1, '#a81c26']); ctx.fill(); ctx.lineWidth = 2.5; ctx.strokeStyle = '#5a0f1a'; ctx.stroke();
      ctx.fillStyle = 'rgba(255,255,255,0.28)'; ctx.beginPath(); ctx.moveTo(cx - 3, top - hgt + 12); ctx.lineTo(cx - bw / 2 + 4, top - 3); ctx.lineTo(cx - bw / 2 + 12, top - 3); ctx.closePath(); ctx.fill();
    }
    function win(cx, cy) {
      ctx.beginPath(); ctx.moveTo(cx - 5, cy + 14); ctx.lineTo(cx - 5, cy); ctx.arc(cx, cy, 5, PI, 0); ctx.lineTo(cx + 5, cy + 14); ctx.closePath();
      ctx.fillStyle = '#3a3358'; ctx.fill(); ctx.lineWidth = 2; ctx.strokeStyle = '#8f86b3'; ctx.stroke();
    }
    function flag(px, py, fy) {
      ctx.fillStyle = '#7b5a3c'; ctx.fillRect(px - 1, py - 24, 2.4, 26);
      var f = Math.sin(t * 5 + px) * 2;
      ctx.fillStyle = '#e63946'; ctx.beginPath(); ctx.moveTo(px + 1.2, py - 24); ctx.quadraticCurveTo(px + 9, py - 22 + f, px + 17, py - 19); ctx.quadraticCurveTo(px + 9, py - 16 - f, px + 1.2, py - 13); ctx.fill();
      ctx.lineWidth = 1.2; ctx.strokeStyle = '#6e0c12'; ctx.stroke();
    }
    ctx.lineWidth = 2.5; ctx.strokeStyle = ol;
    ctx.fillStyle = wall; ctx.fillRect(0, -96, 160, 96); ctx.strokeRect(0, -96, 160, 96); bricks(0, -96, 160, 96); crenel(0, 160, -96);
    [[-10, 46, 140, 0], [124, 46, 140, 0]].forEach(function (tw) {
      ctx.fillStyle = wall; ctx.fillRect(tw[0], -tw[2], tw[1], tw[2]); ctx.strokeRect(tw[0], -tw[2], tw[1], tw[2]); bricks(tw[0], -tw[2], tw[1], tw[2]);
      ctx.fillStyle = '#e6dff2'; ctx.fillRect(tw[0] - 4, -tw[2] - 10, tw[1] + 8, 12); ctx.strokeRect(tw[0] - 4, -tw[2] - 10, tw[1] + 8, 12);
      roof(tw[0] + tw[1] / 2, tw[1] + 8, -tw[2] - 10, 50); win(tw[0] + tw[1] / 2, -tw[2] + 26);
    });
    ctx.fillStyle = wall; ctx.fillRect(52, -172, 56, 172); ctx.strokeRect(52, -172, 56, 172); bricks(52, -172, 56, 172);
    ctx.fillStyle = '#e6dff2'; ctx.fillRect(48, -182, 64, 12); ctx.strokeRect(48, -182, 64, 12);
    roof(80, 64, -182, 56); win(80, -150); win(80, -112);
    flag(80, -238, 0); flag(13, -200, 0); flag(147, -200, 0);
    ctx.beginPath(); ctx.moveTo(64, 0); ctx.lineTo(64, -34); ctx.arc(80, -34, 16, PI, 0); ctx.lineTo(96, 0); ctx.closePath();
    ctx.fillStyle = lin(ctx, 64, 0, 96, 0, [0, '#8a5a30', 0.5, '#a8743f', 1, '#7a4c26']); ctx.fill(); ctx.lineWidth = 2.5; ctx.strokeStyle = '#3a2412'; ctx.stroke();
    ctx.strokeStyle = '#4a2e18'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(80, -50); ctx.lineTo(80, 0); ctx.stroke();
    if (flagUp > 0) {
      var fy = -122 - flagUp * 0; ctx.save();
      ctx.fillStyle = '#ffd23f'; ctx.globalAlpha = Math.min(1, flagUp); star(ctx, 80, -258 - flagUp * 6, 9, t * 2); ctx.fill(); ctx.restore();
    }
    ctx.restore();
  };

  art.drawGoal = function (ctx, L, G, t) {
    var poleX = L.flagX * T + 14, gy = 12 * T;
    if (poleX + 260 < G.camX || poleX - 40 > G.camX + VW) return;
    art.drawCastle(ctx, (L.flagX + 2) * T, gy, 1, t, G.castleFlag || 0);
    ctx.fillStyle = lin(ctx, poleX, 0, poleX + 4, 0, [0, '#ffffff', 1, '#aeb4cc']); ctx.fillRect(poleX, 3 * T, 4, 9 * T);
    ctx.strokeStyle = '#59607f'; ctx.lineWidth = 1; ctx.strokeRect(poleX, 3 * T, 4, 9 * T);
    circle(ctx, poleX + 2, 3 * T - 5, 7); ctx.fillStyle = lin(ctx, 0, 3 * T - 12, 0, 3 * T + 2, [0, '#ffe36a', 1, '#f0a812']); ctx.fill(); ctx.lineWidth = 2; ctx.strokeStyle = '#8a5200'; ctx.stroke();
    ctx.fillStyle = '#7a7f98'; rrect(ctx, poleX - 7, gy - 11, 18, 11, 3); ctx.fill(); ctx.strokeStyle = '#3b3f58'; ctx.stroke();
    var fy = G.flagY, wv = Math.sin(t * 6) * 2.5;
    ctx.beginPath(); ctx.moveTo(poleX + 4, fy); ctx.quadraticCurveTo(poleX + 24, fy + 4 + wv, poleX + 46, fy + 12 + wv); ctx.quadraticCurveTo(poleX + 24, fy + 20 - wv, poleX + 4, fy + 28); ctx.closePath();
    ctx.fillStyle = lin(ctx, poleX, fy, poleX, fy + 28, [0, '#ff5a64', 1, '#c81f2b']); ctx.fill(); ctx.lineWidth = 2; ctx.strokeStyle = '#6e0c12'; ctx.stroke();
    ctx.save(); ctx.font = '17px ' + FONT; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillStyle = '#fff'; ctx.fillText('W', poleX + 18, fy + 15); ctx.restore();
  };

  /* --------------------------------------------------------------- HUD */
  function heart(ctx, x, y, s, on) {
    ctx.beginPath();
    ctx.moveTo(x, y + 7 * s);
    ctx.bezierCurveTo(x - 16 * s, y - 3 * s, x - 7 * s, y - 15 * s, x, y - 6 * s);
    ctx.bezierCurveTo(x + 7 * s, y - 15 * s, x + 16 * s, y - 3 * s, x, y + 7 * s);
    ctx.closePath();
    ctx.fillStyle = on ? lin(ctx, 0, y - 12 * s, 0, y + 7 * s, [0, '#ff5c63', 1, '#d81b2c']) : 'rgba(10,20,60,0.5)'; ctx.fill();
    ctx.lineWidth = 2.4; ctx.strokeStyle = on ? '#6e0c18' : 'rgba(255,255,255,0.35)'; ctx.stroke();
    if (on) { ctx.fillStyle = 'rgba(255,255,255,0.6)'; ctx.beginPath(); ctx.ellipse(x - 5 * s, y - 6 * s, 3 * s, 1.8 * s, -0.7, 0, TAU); ctx.fill(); }
  }
  function pad5(n) { var s = String(Math.max(0, n | 0)); while (s.length < 5) s = '0' + s; return s; }

  art.drawHud = function (ctx, h, avatar, t) {
    ctx.save();
    ctx.shadowColor = 'rgba(0,30,90,0.35)'; ctx.shadowBlur = 6; ctx.shadowOffsetY = 2;
    rrect(ctx, 10, 9, 59, 51, 11); ctx.fillStyle = '#cfe6ff'; ctx.fill();
    ctx.restore();
    ctx.save(); rrect(ctx, 10, 9, 59, 51, 11); ctx.clip();
    if (avatar && avatar.complete && avatar.naturalWidth) ctx.drawImage(avatar, 10, 9, 59, 51);
    ctx.restore();
    rrect(ctx, 10, 9, 59, 51, 11); ctx.lineWidth = 3.5; ctx.strokeStyle = '#2d7be0'; ctx.stroke();
    rrect(ctx, 12, 11, 55, 47, 9); ctx.lineWidth = 1; ctx.strokeStyle = 'rgba(255,255,255,0.8)'; ctx.stroke();
    outlineText(ctx, '× ' + h.lives, 78, 42, 30, 'left');
    for (var i = 0; i < 3; i++) heart(ctx, 90 + i * 26, 70, 0.95, i < h.hearts);
    var cx = VW - 12;
    outlineText(ctx, '× ' + h.coins, cx, 40, 30, 'right');
    var w = Math.abs(Math.cos(t * 3)) * 5 + 9;
    ctx.beginPath(); ctx.ellipse(VW - 112, 27, w, 16, 0, 0, TAU);
    ctx.fillStyle = lin(ctx, VW - 112 - w, 0, VW - 112 + w, 0, [0, '#ffe36a', 0.5, '#ffc61c', 1, '#e69a08']); ctx.fill();
    ctx.lineWidth = 2.5; ctx.strokeStyle = '#a86a00'; ctx.stroke();
    ctx.fillStyle = 'rgba(255,255,255,0.7)'; ctx.fillRect(VW - 114, 17, 3.5, 20);
    outlineText(ctx, 'Score : ' + pad5(h.score), cx, 68, 22, 'right');
    outlineText(ctx, 'Level : ' + h.level, cx, 92, 22, 'right');
    if (h.time != null) outlineText(ctx, 'Temps : ' + h.time, cx, 114, 17, 'right', h.time <= 100 ? '#ffd0d0' : '#ffffff');
  };
})();
