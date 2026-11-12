/* Super Wassel - moteur du jeu */
(function () {
  'use strict';
  var W = window.WASSEL, AU = W.audio, ART = W.art, SFX = AU.sfx;
  var T = 32, VW = 800, VH = 448, ROWS = 14, STEP = 1 / 60, PI = Math.PI, TAU = PI * 2;
  var SOLID = 'GB?MWHTV1INDGAUpqlr';
  function $(id) { return document.getElementById(id); }
   function setOnlinePlaying(value) {
     try {
       if (window.WASSELOnline) window.WASSELOnline.setPlaying(value);
     } catch (e) {}
   }
  var canvas = $('game'), ctx = canvas.getContext('2d'), stage = $('stage');
  var playBtn = $('playBtn'), continueBtn = $('continueBtn'), endEl = $('end'), endTitle = $('endTitle'), endText = $('endText');
  var muteBtn = $('muteBtn'), pauseBtn = $('pauseBtn'), pad = $('pad');
  var TOUCH = false;
  try { TOUCH = !!(window.matchMedia && window.matchMedia('(pointer: coarse)').matches); } catch (e) {}

  var avatar = new Image(), badge = new Image();
  avatar.src = 'avatar.png'; badge.src = 'badge.png';
  try {
    if (document.fonts && document.fonts.load) {
      document.fonts.load('30px "Lilita One"'); document.fonts.load('italic 30px "Kaushan Script"');
    }
  } catch (e) {}

  /* ------------------------------------------------------------------ entrées */
  var keys = {}, touch = { left: false, right: false, jump: false, run: false, slide: false, special: false };
  var jumpBuf = 0, fireReq = false, dashReq = false, specialReq = false;
  var JUMP_KEYS = { Space: 1, ArrowUp: 1, KeyW: 1 }, RUN_KEYS = { ShiftLeft: 1, ShiftRight: 1, KeyZ: 1, KeyX: 1 };
  var DASH_KEYS = { KeyC: 1, ControlLeft: 1, ControlRight: 1 };
  var WEAPON_KEYS = { Digit1: 'pistol', Digit2: 'smg', Digit3: 'spread', Digit4: 'grenade' };
  function isLeft() { return keys.ArrowLeft || keys.KeyA || touch.left; }
  function isRight() { return keys.ArrowRight || keys.KeyD || touch.right; }
  function isJump() { return keys.Space || keys.ArrowUp || keys.KeyW || touch.jump; }
  function isRun() { return keys.ShiftLeft || keys.ShiftRight || keys.KeyZ || keys.KeyX || touch.run; }
  function isSlide() { return keys.ArrowDown || keys.KeyS || touch.slide; }

  window.addEventListener('keydown', function (e) {
    var c = e.code;
    AU.init();
    if (!keys[c]) {
      if (JUMP_KEYS[c]) jumpBuf = 0.12;
      if (RUN_KEYS[c]) fireReq = true;
      if (DASH_KEYS[c]) dashReq = true;
      if (WEAPON_KEYS[c] && P) P.weapon = WEAPON_KEYS[c];
      if (c === 'KeyE') specialReq = true;
      if (G.state === 'dialog' && (c === 'Enter' || c === 'Space')) advanceDialog();
      if (G.state === 'shop' && (c === 'Digit1' || c === 'Digit2' || c === 'Digit3' || c === 'Enter' || c === 'Space')) shopAction(c);
      if (c === 'KeyP' || c === 'Escape') togglePause();
      if (c === 'KeyM') toggleMute();
      if ((c === 'Enter' || c === 'Space') && (G.state === 'title' || G.state === 'over' || G.state === 'win')) startGame();
    }
    keys[c] = true;
    if (c.indexOf('Arrow') === 0 || c === 'Space' || c === 'ControlLeft' || c === 'ControlRight') e.preventDefault();
  });
  window.addEventListener('keyup', function (e) { keys[e.code] = false; });
  window.addEventListener('blur', function () {
    keys = {}; touch.left = touch.right = touch.jump = touch.run = touch.slide = touch.special = false;
    if (G.state === 'play') togglePause();
  });
  Array.prototype.forEach.call(pad.querySelectorAll('button[data-k]'), function (btn) {
    var k = btn.getAttribute('data-k');
    btn.addEventListener('pointerdown', function (e) {
      e.preventDefault(); AU.init(); touch[k] = true;
      if (k === 'jump') jumpBuf = 0.12;
      if (k === 'run') fireReq = true;
      if (k === 'dash') dashReq = true;
      if (k === 'special') specialReq = true;
      if (k === 'continue' && G.state === 'dialog') advanceDialog();
      if (k === 'continue' && G.state === 'shop') shopAction('Enter');
      try { btn.setPointerCapture(e.pointerId); } catch (err) {}
    });
    function up(e) { e.preventDefault(); touch[k] = false; }
    btn.addEventListener('pointerup', up); btn.addEventListener('pointercancel', up);
    btn.addEventListener('lostpointercapture', function () { touch[k] = false; });
    btn.addEventListener('contextmenu', function (e) { e.preventDefault(); });
  });
  function toggleMute() {
    AU.setMuted(!AU.isMuted());
    muteBtn.textContent = AU.isMuted() ? 'Son : off' : 'Son : on';
  }
  function togglePause() {
  if (G.state === 'play') { G.prev = G.state; G.state = 'pause'; pauseBtn.textContent = 'Reprendre'; AU.pause(true); setOnlinePlaying(false); }
  else if (G.state === 'pause') { G.state = G.prev || 'play'; pauseBtn.textContent = 'Pause'; AU.pause(false); SFX.pause(); last = performance.now(); setOnlinePlaying(true); }
}
function syncTouchControls() {
  continueBtn.hidden = G.state !== 'dialog' && G.state !== 'shop';
}
  muteBtn.addEventListener('click', function () { AU.init(); toggleMute(); });
  pauseBtn.addEventListener('click', togglePause);
  playBtn.addEventListener('click', function () { AU.init(); startGame(); });
  $('retryBtn').addEventListener('click', function () { AU.init(); startGame(); });
  document.addEventListener('pointerdown', function () { AU.init(); if (G.state === 'title') AU.music('day'); }, { passive: true });

  /* ------------------------------------------------------------------ niveaux */
  var TH = ART.themes;
  function Builder(w) {
    this.w = w; this.g = [];
    for (var y = 0; y < ROWS; y++) { var r = []; for (var x = 0; x < w; x++) r.push(' '); this.g.push(r); }
    this.ents = []; this.sx = 3; this.sy = 11; this.flagX = w - 8;
  }
  Builder.prototype.put = function (x, y, c) { if (x >= 0 && x < this.w && y >= 0 && y < ROWS) this.g[y][x] = c; return this; };
  Builder.prototype.row = function (x0, x1, y, c) { for (var x = x0; x < x1; x++) this.put(x, y, c); return this; };
  Builder.prototype.ground = function (x0, x1) { for (var x = x0; x < x1; x++) { this.put(x, 12, 'G'); this.put(x, 13, 'G'); } return this; };
  Builder.prototype.cut = function (x0, x1) { for (var x = x0; x < x1; x++) { this.put(x, 12, ' '); this.put(x, 13, ' '); } return this; };
  Builder.prototype.pipe = function (x, h) {
    var top = 12 - h;
    for (var y = top; y < 12; y++) { this.put(x, y, y === top ? 'p' : 'l'); this.put(x + 1, y, y === top ? 'q' : 'r'); }
    return this;
  };
  Builder.prototype.stairs = function (x, n) { for (var i = 0; i < n; i++) for (var y = 11 - i; y <= 11; y++) this.put(x + i, y, 'S'); return this; };
  Builder.prototype.coins = function (x, y, n) { return this.row(x, x + n, y, 'C'); };
  Builder.prototype.platform = function (x0, x1, y) { return this.row(x0, x1, y, 'S'); };
  Builder.prototype.enemy = function (t, x, y) { this.ents.push({ t: t, x: x, y: y }); return this; };
  Builder.prototype.done = function (name, theme, time, music) {
    return { name: name, theme: TH[theme], music: music, w: this.w, g: this.g, ents: this.ents, sx: this.sx, sy: this.sy, flagX: this.flagX, time: time };
  };

  function level1() {
    var b = new Builder(158);
    b.ground(0, 158).cut(54, 57).cut(92, 95).cut(118, 121);
    b.put(14, 8, '?').put(18, 8, 'B').put(19, 8, 'M').put(20, 8, 'B').put(21, 8, '?').put(22, 8, 'B');
    b.coins(26, 9, 4);
    b.pipe(31, 2).pipe(41, 3).pipe(49, 4);
    b.enemy('slime', 24, 11).enemy('slime', 36, 11).enemy('slime', 45, 11);
    b.coins(54, 9, 3);
    b.row(60, 67, 8, 'B').put(63, 8, '?').put(62, 4, '?').put(64, 4, 'M').put(66, 4, 'B').put(68, 8, 'H').put(69, 8, 'N');
    b.enemy('shellbug', 70, 11).enemy('shooter', 74, 11).enemy('drone-gunner', 78, 7).enemy('drone-gunner', 86, 6).enemy('drone-gunner', 94, 7).enemy('chaser', 77, 11);
    b.coins(72, 9, 5);
    b.pipe(82, 2).pipe(87, 3);
    b.coins(92, 9, 3);
    b.row(98, 103, 8, 'B').put(100, 8, 'M');
    b.enemy('shellbug', 106, 11).enemy('slime', 110, 11).enemy('slime', 113, 11);
    b.coins(118, 9, 3);
    b.pipe(124, 2).enemy('slime', 128, 11).enemy('shellbug', 132, 11);
    b.stairs(136, 6);
    b.flagX = 148;
    return b.done('1-1', 'day', 300, 'day');
  }
  function level2() {
    var b = new Builder(154);
    b.ground(0, 154).cut(30, 34).cut(62, 66).cut(92, 97).cut(112, 116);
    for (var x = 8; x < 140; x++) { b.put(x, 0, 'S').put(x, 1, 'S'); }
    b.put(12, 8, '?').put(13, 8, 'B').put(14, 8, 'M').put(15, 8, 'B').put(16, 8, 'T').put(17, 8, 'I');
    b.enemy('slime', 19, 11).enemy('shellbug', 23, 11).enemy('shooter', 26, 11);
    b.coins(30, 8, 4);
    b.pipe(38, 3).enemy('slime', 41, 11).enemy('slime', 43, 11).pipe(47, 2);
    b.row(52, 58, 8, 'B').put(54, 8, '?').put(56, 8, '?').enemy('shellbug', 53, 7);
    b.coins(62, 8, 4);
    b.enemy('slime', 70, 11).enemy('slime', 73, 11).enemy('shellbug', 77, 11).enemy('slime', 80, 11);
    b.pipe(84, 3).pipe(88, 4);
    b.platform(94, 96, 10).coins(93, 8, 3);
    b.row(100, 106, 8, 'B').put(102, 8, 'M').put(104, 8, '?').put(106, 8, 'V');
    b.enemy('shellbug', 99, 11).enemy('slime', 108, 11).enemy('chaser', 113, 11);
    b.coins(112, 8, 4);
    b.enemy('slime', 120, 11).enemy('slime', 122, 11).enemy('shellbug', 126, 11).pipe(130, 2);
    b.stairs(133, 6);
    b.flagX = 146;
    return b.done('1-2', 'night', 300, 'night');
  }
  function level3() {
    var b = new Builder(176);
    b.ground(0, 14).ground(150, 176);
    [[16, 21, 10], [25, 29, 9], [33, 38, 10], [42, 45, 8], [49, 55, 10], [59, 62, 9], [66, 72, 10], [76, 79, 8], [83, 89, 10], [93, 96, 9], [100, 106, 10], [110, 113, 8], [117, 123, 10], [127, 130, 9], [134, 142, 10], [146, 150, 11]]
      .forEach(function (p) { b.platform(p[0], p[1], p[2]); });
    b.put(18, 6, '?').put(19, 6, 'M').put(35, 6, '?').put(51, 6, 'W').put(68, 6, 'M').put(85, 6, '?').put(102, 6, 'M').put(119, 6, '?').put(138, 6, '?').put(139, 6, '?');
    [21, 38, 55, 72, 89, 106, 123, 142].forEach(function (x) { b.coins(x, 8, 4); });
    b.enemy('slime', 52, 9).enemy('shellbug', 69, 9).enemy('shooter', 76, 9).enemy('drone-gunner', 86, 6).enemy('drone-gunner', 103, 6).enemy('chaser', 120, 9).enemy('drone-gunner', 138, 6).enemy('drone-gunner', 150, 6).enemy('drone-gunner', 162, 7).enemy('slime', 155, 11).enemy('shooter', 158, 11);
    b.stairs(152, 5);
    b.flagX = 162;
    return b.done('1-3', 'factory', 330, 'dusk');
  }
  function level4() {
    // 1-4 "Crepuscule expert" : sauts longs, tuyaux hauts, carapaces en chaine
    var b = new Builder(222);
    b.ground(0, 222)
      .cut(24, 28).cut(44, 49).cut(70, 75).cut(96, 101)
      .cut(124, 129).cut(150, 155).cut(174, 179);
    // plateformes de secours au-dessus des grands trous (oblige la precision)
    b.platform(45, 48, 10).platform(71, 74, 10).platform(97, 100, 10)
      .platform(125, 128, 10).platform(151, 154, 10).platform(175, 178, 10);
    // plateformes hautes a bonus
    b.platform(52, 58, 8).platform(106, 112, 8).platform(132, 138, 8).platform(184, 190, 8);
    // blocs : peu de recompenses, bien places
    b.put(12, 8, '?').put(14, 8, 'B').put(15, 8, 'M').put(16, 8, 'B').put(17, 8, '1');
    b.put(54, 8, '?').put(56, 8, 'W').put(58, 8, 'H').put(108, 8, 'M').put(110, 8, '?').put(112, 8, 'T').put(114, 8, 'D').put(116, 8, 'A');
    b.put(134, 8, '?').put(136, 8, 'M').put(138, 8, 'G').put(186, 8, '?').put(188, 8, 'B');
    b.row(60, 64, 6, 'B').put(62, 6, '?');
    b.row(160, 164, 6, 'B').put(162, 6, 'M');
    // pieces : guident les sauts
    b.coins(24, 8, 4); b.coins(44, 8, 5); b.coins(70, 8, 5); b.coins(96, 8, 5);
    b.coins(124, 8, 5); b.coins(150, 8, 5); b.coins(174, 8, 5);
    b.coins(53, 6, 3); b.coins(107, 6, 3); b.coins(185, 6, 3);
    // tuyaux : hauts, a enchaîner
    b.pipe(18, 2).pipe(36, 3).pipe(40, 2).pipe(60, 4).pipe(66, 2);
    b.pipe(110, 3).pipe(116, 4).pipe(136, 4).pipe(144, 2).pipe(166, 3).pipe(192, 2);
    // ennemis : dense, alterne slime / shellbug, certains sur plateformes
    b.enemy('slime', 20, 11).enemy('shellbug', 32, 11).enemy('slime', 34, 11);
    b.enemy('slime', 54, 11).enemy('shellbug', 58, 11).enemy('shooter', 63, 11);
    b.enemy('shellbug', 80, 11).enemy('slime', 84, 11).enemy('shellbug', 89, 11).enemy('slime', 92, 11);
    b.enemy('slime', 106, 11).enemy('shellbug', 113, 11).enemy('chaser', 118, 11);
    b.enemy('shellbug', 133, 11).enemy('slime', 139, 11).enemy('slime', 144, 11);
    b.enemy('slime', 159, 11).enemy('shellbug', 166, 11).enemy('slime', 170, 11);
    b.enemy('shellbug', 184, 11).enemy('shooter', 190, 11).enemy('shellbug', 196, 11).enemy('chaser', 199, 11);
    b.enemy('shellbug', 54, 7).enemy('drone-gunner', 82, 6).enemy('drone-gunner', 108, 6).enemy('slime', 108, 7).enemy('drone-gunner', 125, 6).enemy('drone-gunner', 145, 6).enemy('drone-gunner', 165, 7).enemy('shellbug', 186, 7);
    b.stairs(204, 7);
    b.flagX = 214;
    return b.done('1-4', 'dusk', 360, 'dusk');
  }
  var LEVELS = [level1, level2, level3, level4];

  /* ------------------------------------------------------------------- état */
  var G = { state: 'title', lives: 3, score: 0, coins: 0, level: 0, time: 300, timeAcc: 0, timer: 0, camX: 0, t: 0, prev: 'play', nextLevel: 0, dialogLine: 0,
    flagY: 0, flagPts: 0, shake: 0, freeze: 0, flash: 0, castleFlag: 0, fwT: 0, hurry: false, tickN: 0 };
  var L, P, enemies, items, fireballs, enemyShots, parts, pops, bumps;
  var best = 0;
  try { best = parseInt(localStorage.getItem('wassel-best') || '0', 10) || 0; } catch (e) {}

  function makePlayer(tx, ty, power) {
    P = { x: 0, y: 0, w: 16, h: 30, normalH: 30, vx: 0, vy: 0, face: 1, ground: false, head: null, power: 0, shield: 0, speedT: 0, slowT: 0, inv: 0, star: 0, coyote: 0, jumps: 0, wallDir: 0, slide: false, dashCd: 0, dashT: 0, anim: 0,
      weapon: 'pistol', ammo: { pistol: 30, smg: 0, spread: 0, grenade: 0 }, fireCd: 0, energy: 0, energyMax: 100, stepT: 0, combo: 0, comboT: 0, deadT: 0, hopped: false, hidden: false, hitX: false, sq: 0, dustT: 0 };
    setPower(power || 0);
    P.x = tx * T + (T - P.w) / 2;
    P.y = (ty + 1) * T - P.h;
  }
  function setPower(n) {
    var oh = P.h, ow = P.w;
    P.power = n; P.w = n > 0 ? 22 : 16; P.normalH = n > 0 ? 54 : 30; P.h = P.normalH;
    P.x += (ow - P.w) / 2; P.y -= (P.h - oh);
  }
  function loadLevel(i, power) {
    var loadout = P ? { weapon: P.weapon, ammo: { pistol: P.ammo.pistol, smg: P.ammo.smg, spread: P.ammo.spread, grenade: P.ammo.grenade }, energy: P.energy, energyMax: P.energyMax } : null;
    L = LEVELS[i]();
    G.level = i; G.time = L.time; G.timeAcc = 0; G.camX = 0; G.flagY = 3 * T + 8; G.castleFlag = 0; G.fwT = 0; G.hurry = false; G.shake = 0; G.flash = 0;
    AU.hurry(false); AU.setStar(false);
    enemies = []; items = []; fireballs = []; enemyShots = []; parts = []; pops = []; bumps = {};
    L.ents.forEach(function (d) { enemies.push(makeEnemy(d.t, d.x, d.y)); });
    makePlayer(L.sx, L.sy, power);
    if (loadout) { P.weapon = loadout.weapon; P.ammo = loadout.ammo; P.energyMax = loadout.energyMax; P.energy = Math.min(P.energyMax, loadout.energy); }
    jumpBuf = 0; fireReq = false; dashReq = false;
  }
  function startIntro() { G.state = 'intro'; G.timer = 2.0; setOnlinePlaying(true); AU.stop(); }
  function beginIntermission(next) {
    G.nextLevel = next; G.dialogLine = 0; G.state = 'dialog'; AU.stop(); setOnlinePlaying(false);
  }
  function advanceDialog() {
    if (G.state !== 'dialog') return;
    if (G.dialogLine < 1) { G.dialogLine++; return; }
    G.state = 'shop'; SFX.power();
  }
  function shopAction(code) {
    if (G.state !== 'shop') return;
    var price = code === 'Digit1' ? 50 : code === 'Digit2' ? 30 : code === 'Digit3' ? 75 : 0;
    if (code === 'Digit1' && G.coins >= price) { G.coins -= price; G.lives++; SFX.oneup(); }
    else if (code === 'Digit2' && G.coins >= price) { G.coins -= price; P.ammo.pistol += 20; P.ammo.smg += 30; P.ammo.spread += 10; P.ammo.grenade += 3; SFX.power(); }
    else if (code === 'Digit3' && G.coins >= price) { G.coins -= price; P.energyMax = Math.min(160, P.energyMax + 20); P.energy = P.energyMax; SFX.power(); }
    else if (code === 'Enter' || code === 'Space') { loadLevel(G.nextLevel, P.power); startIntro(); }
  }
  function startGame() {
    G.lives = 3; G.score = 0; G.coins = 0;
    loadLevel(0, 0);
    playBtn.hidden = true; endEl.hidden = true; pauseBtn.textContent = 'Pause';
    startIntro();
	setOnlinePlaying(true);
  }
  function finishRun(won) {
    if (G.score > best) { best = G.score; try { localStorage.setItem('wassel-best', String(best)); } catch (e) {} }
    G.state = won ? 'win' : 'over';
	setOnlinePlaying(false);
    endTitle.textContent = won ? 'Bravo Wassel !' : 'Game over';
    endText.textContent = (won ? 'Le château est à toi. ' : '') + 'Score : ' + G.score + ' · Meilleur : ' + best;
    endEl.hidden = false;
    AU.stop();
    if (won) { SFX.win(); } else { SFX.over(); }
  }
  function toTitle() { G.state = 'title'; playBtn.hidden = false; }

  /* ------------------------------------------------------------------ physique */
  function solidAt(tx, ty) {
    if (tx < 0 || tx >= L.w) return true;
    if (ty < 0 || ty >= ROWS) return false;
    return SOLID.indexOf(L.g[ty][tx]) >= 0;
  }
  function approach(v, t, d) { return v < t ? Math.min(v + d, t) : Math.max(v - d, t); }
  function hit(a, b) { return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y; }
  function canOccupy(x, y, w, h) {
    var x0 = Math.floor(x / T), x1 = Math.floor((x + w - 0.01) / T);
    var y0 = Math.floor(y / T), y1 = Math.floor((y + h - 0.01) / T);
    for (var ty = y0; ty <= y1; ty++) for (var tx = x0; tx <= x1; tx++) if (solidAt(tx, ty)) return false;
    return true;
  }
  // Ajuste la hauteur du personnage sans le faire traverser un plafond.
  function updateSlide() {
    var want = isSlide() && P.ground && P.dashT <= 0;
    if (want && !P.slide) {
      var slideH = P.power > 0 ? 34 : 20;
      P.y += P.h - slideH; P.h = slideH; P.slide = true;
    } else if (!want && P.slide) {
      var delta = P.normalH - P.h;
      if (canOccupy(P.x, P.y - delta, P.w, P.normalH)) {
        P.y -= delta; P.h = P.normalH; P.slide = false;
      }
    }
  }
  function moveX(e, dt) {
    e.hitX = false; e.x += e.vx * dt;
    var x0 = Math.floor(e.x / T), x1 = Math.floor((e.x + e.w - 0.01) / T), y0 = Math.floor(e.y / T), y1 = Math.floor((e.y + e.h - 0.01) / T);
    for (var ty = y0; ty <= y1; ty++) for (var tx = x0; tx <= x1; tx++) {
      if (solidAt(tx, ty)) {
        if (e.vx > 0) e.x = tx * T - e.w; else if (e.vx < 0) e.x = (tx + 1) * T;
        e.hitX = true; e.vx = 0; return;
      }
    }
  }
  function moveY(e, dt) {
    e.ground = false; e.head = null; e.y += e.vy * dt;
    var x0 = Math.floor(e.x / T), x1 = Math.floor((e.x + e.w - 0.01) / T), y0 = Math.floor(e.y / T), y1 = Math.floor((e.y + e.h - 0.01) / T), tx, ty;
    if (e.vy > 0) {
      for (ty = y0; ty <= y1; ty++) for (tx = x0; tx <= x1; tx++) if (solidAt(tx, ty)) { e.y = ty * T - e.h; e.vy = 0; e.ground = true; return; }
    } else if (e.vy < 0) {
      var cx = e.x + e.w / 2, bd = 1e9, bt = -1;
      for (tx = x0; tx <= x1; tx++) if (solidAt(tx, y0)) { var d = Math.abs(tx * T + T / 2 - cx); if (d < bd) { bd = d; bt = tx; } }
      if (bt >= 0) { e.y = (y0 + 1) * T; e.vy = 0; e.head = { tx: bt, ty: y0 }; }
    }
  }

  /* --------------------------------------------------------- effets & score */
  function part(o) { o.t = 0; parts.push(o); return o; }
  function dust(x, y, n, dir) {
    for (var i = 0; i < n; i++) part({ type: 'dust', x: x + (Math.random() - 0.5) * 10, y: y - 1, vx: (dir || (Math.random() - 0.5) * 2) * (20 + Math.random() * 40), vy: -10 - Math.random() * 30, ttl: 0.35 + Math.random() * 0.2, size: 3 + Math.random() * 3 });
  }
  function sparkle(x, y, n, color) {
    for (var i = 0; i < n; i++) part({ type: 'spark', x: x, y: y, vx: (Math.random() - 0.5) * 260, vy: -Math.random() * 280, ttl: 0.5 + Math.random() * 0.3, color: color || '#ffe066', size: 3 });
  }
  // Fumée légère pour les impacts et les destructions.
  function smokeBurst(x, y, n, color) {
    for (var i = 0; i < n; i++) part({ type: 'smoke', x: x + (Math.random() - 0.5) * 12, y: y + (Math.random() - 0.5) * 8, vx: (Math.random() - 0.5) * 55, vy: -25 - Math.random() * 55, ttl: 0.45 + Math.random() * 0.3, color: color || '#b7c1d9', size: 4 + Math.random() * 4 });
  }
  // Explosion courte : particules, lumière et tremblement synchronisés.
  function explosionBurst(x, y, color) {
    sparkle(x, y, 12, color || '#ffb040');
    smokeBurst(x, y, 7);
    ring(x, y, color || '#ffb040', 22);
    G.shake = Math.max(G.shake, 5);
    G.freeze = Math.max(G.freeze, 0.05);
  }
  function starBurst(x, y, n) {
    for (var i = 0; i < n; i++) { var a = Math.random() * TAU, sp = 60 + Math.random() * 140; part({ type: 'star', x: x, y: y, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp - 80, ttl: 0.55 + Math.random() * 0.25, size: 4 + Math.random() * 3, rot: Math.random() * 6 }); }
  }
  function ring(x, y, color, r) { part({ type: 'ring', x: x, y: y, vx: 0, vy: 0, ttl: 0.4, size: r || 26, color: color || '#fff' }); }
  function addScore(n, x, y) { G.score += n; pops.push({ x: x, y: y, txt: String(n), t: 0 }); }
  function registerCombo(base, x, y) {
    P.combo = P.comboT > 0 ? Math.min(9, P.combo + 1) : 1;
    P.comboT = 2.2;
    P.energy = Math.min(P.energyMax, P.energy + 20);
    var total = base * P.combo;
    addScore(total, x, y);
    if (P.combo > 1) pops.push({ x: x, y: y - 18, txt: 'COMBO x' + P.combo, t: 0 });
  }
  function activateSpecial() {
    if (P.energy < P.energyMax || G.state !== 'play') return;
    P.energy = 0; SFX.special(); G.shake = 8; G.flash = 0.18; ring(P.x + P.w / 2, P.y + P.h / 2, '#7af0ff', 90);
    enemies.forEach(function (e) {
      if (e.state === 'dead' || e.state === 'fall') return;
      var dx = e.x + e.w / 2 - (P.x + P.w / 2), dy = e.y + e.h / 2 - (P.y + P.h / 2);
      if (Math.sqrt(dx * dx + dy * dy) < 150) { damageEnemy(e, e.hp, dx < 0 ? -1 : 1); if (e.state === 'dead') registerCombo(200, e.x, e.y - 10); }
    });
  }
  function addCoin() {
    G.coins++; G.score += 100; SFX.coin();
    if (G.coins >= 100) { G.coins -= 100; G.lives++; SFX.oneup(); pops.push({ x: P.x, y: P.y - 10, txt: '1UP', t: 0 }); }
  }
  function firework(x, y) {
    var cols = ['#ffd23f', '#ff5a64', '#58d6ff', '#7dff9a', '#ff9bdc'], c = cols[(Math.random() * cols.length) | 0];
    for (var i = 0; i < 34; i++) { var a = i / 34 * TAU, sp = 90 + Math.random() * 60; part({ type: 'fw', x: x, y: y, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp, ttl: 0.9 + Math.random() * 0.3, color: c, size: 2.6 }); }
    G.flash = Math.max(G.flash, 0.12);
  }

  /* ------------------------------------------------------------------ blocs */
  function bumpBlock(tx, ty) {
    var c = L.g[ty][tx], px = tx * T, py = ty * T;
    if (c === '?') {
      L.g[ty][tx] = 'U'; bumps[ty * 1000 + tx] = 0.2;
      part({ type: 'coinpop', x: px + 10, y: py - 6, vx: 0, vy: -520, ttl: 0.6 });
      addCoin(); G.score += 100; pops.push({ x: px, y: py - 30, txt: '200', t: 0 });
      sparkle(px + 16, py, 6, '#ffe066');
    } else if (c === 'M') {
      L.g[ty][tx] = 'U'; bumps[ty * 1000 + tx] = 0.2; spawnItem(P.power === 0 ? 'cap' : 'fire', tx, ty); SFX.bump();
    } else if (c === 'W' || c === 'H' || c === 'V' || c === 'T' || c === '1' || c === 'I' || c === 'N' || c === 'D' || c === 'G' || c === 'A') {
      var itemType = c === 'W' ? 'crown' : c === 'H' ? 'shield' : c === 'V' ? 'speed' : c === 'T' ? 'slow' : c === '1' ? 'life' : c === 'I' ? 'weapon-pistol' : c === 'N' ? 'weapon-smg' : c === 'D' ? 'weapon-spread' : c === 'G' ? 'weapon-grenade' : 'ammo';
      L.g[ty][tx] = 'U'; bumps[ty * 1000 + tx] = 0.2; spawnItem(itemType, tx, ty); SFX.bump();
    } else if (c === 'B') {
      if (P.power > 0) {
        L.g[ty][tx] = ' ';
        for (var i = 0; i < 6; i++) part({ type: 'brick', x: px + 6 + (i % 3) * 8, y: py + 6 + Math.floor(i / 3) * 14, vx: (i % 3 - 1) * (90 + Math.random() * 70), vy: -380 - Math.random() * 160, ttl: 1.2, rot: Math.random() * 6, vr: (Math.random() - 0.5) * 16 });
        dust(px + 16, py + 28, 5); smokeBurst(px + 16, py + 20, 4, '#a78c7b');
        G.score += 50; SFX.brk(); G.shake = Math.max(G.shake, 5);
      } else { bumps[ty * 1000 + tx] = 0.2; SFX.bump(); }
    } else SFX.bump();
    enemies.forEach(function (e) {
      if (e.state === 'dead' || e.state === 'fall') return;
      if (Math.abs(e.x + e.w / 2 - (px + T / 2)) < 26 && Math.abs(e.y + e.h - py) < 8) knock(e, e.x + e.w / 2 < px + T / 2 ? -1 : 1);
    });
  }
  function spawnItem(type, tx, ty) {
    items.push({ t: type, x: tx * T + 3, y0: ty * T + 4, y: ty * T + 4, y1: ty * T - 26, w: 26, h: 26, vx: 0, vy: 0, emerge: 0, dir: 1, ground: false });
  }
  function updateItems(dt) {
    for (var i = items.length - 1; i >= 0; i--) {
      var it = items[i];
      if (it.emerge < 1) {
        it.emerge = Math.min(1, it.emerge + dt / 0.4); it.y = it.y0 + (it.y1 - it.y0) * it.emerge;
        if (it.emerge >= 1) {
          if (it.t === 'cap' || it.t === 'shield' || it.t === 'speed' || it.t === 'slow' || it.t === 'life' || it.t.indexOf('weapon-') === 0 || it.t === 'ammo') it.vx = 70;
          if (it.t === 'crown') { it.vx = 80; it.vy = -380; }
        }
        continue;
      }
      if (it.t !== 'fire') {
        it.vy = Math.min(it.vy + 1800 * dt, 700); moveX(it, dt);
        if (it.hitX) it.dir = -it.dir;
        it.vx = (it.t === 'cap' || it.t === 'shield' || it.t === 'speed' || it.t === 'slow' || it.t === 'life' || it.t.indexOf('weapon-') === 0 || it.t === 'ammo' ? 70 : 85) * it.dir; moveY(it, dt);
        if (it.t === 'crown' && it.ground) it.vy = -420;
        if (it.y > VH + 60) { items.splice(i, 1); continue; }
      }
      if (G.state === 'play' && hit(P, it)) {
        items.splice(i, 1);
        addScore(1000, it.x, it.y); G.flash = 0.22; ring(P.x + P.w / 2, P.y + P.h / 2, '#ffe066', 34); sparkle(P.x + P.w / 2, P.y + P.h / 2, 16);
        if (it.t === 'cap') { if (P.power < 1) setPower(1); SFX.power(); }
        else if (it.t === 'fire') { setPower(2); SFX.power(); }
        else if (it.t === 'shield') { P.shield = 12; P.inv = 0.4; SFX.power(); }
        else if (it.t === 'speed') { P.speedT = 8; SFX.power(); }
        else if (it.t === 'slow') { P.slowT = 8; SFX.power(); }
        else if (it.t === 'life') { G.lives++; SFX.oneup(); }
        else if (it.t.indexOf('weapon-') === 0) { P.weapon = it.t.slice(7); P.ammo[P.weapon] = Math.max(P.ammo[P.weapon], P.weapon === 'pistol' ? 30 : P.weapon === 'smg' ? 45 : P.weapon === 'spread' ? 18 : 8); SFX.power(); }
        else if (it.t === 'ammo') { P.ammo.pistol += 12; P.ammo.smg += 20; P.ammo.spread += 8; P.ammo.grenade += 3; SFX.power(); }
        else { P.star = 10; SFX.star(); AU.setStar(true); }
      }
    }
  }

  /* ---------------------------------------------------------------- ennemis */
  function makeEnemy(t, tx, ty) {
    var e = { t: t, w: 28, h: t === 'slime' ? 24 : 26, vx: -50, vy: 0, state: 'walk', dir: -1, timer: 0, kick: 0, act: false, shellV: 0, ground: false, hitX: false, head: null, hp: 1, maxHp: 1, hitT: 0 };
    if (t.indexOf('drone') === 0) {
      e.w = 30; e.h = 24; e.vx = -46; e.state = 'fly';
      e.hoverY = ty * T + 4; e.hoverPhase = tx * 0.8;
      e.shotT = 1.2 + (tx % 3) * 0.25;
    } else if (t === 'shooter') {
      e.vx = -42; e.shotT = 1.1 + (tx % 3) * 0.2; e.hp = e.maxHp = 2;
    } else if (t === 'chaser') {
      e.vx = -52; e.hp = e.maxHp = 2;
    }
    e.x = tx * T + (T - e.w) / 2; e.y = (ty + 1) * T - e.h; return e;
  }
  // Les tireurs et les drones partagent une visée 2D vers le joueur.
  function isFlyingEnemy(e) { return e.t.indexOf('drone') === 0; }
  function shootAtPlayer(e) {
    var dx = P.x + P.w / 2 - (e.x + e.w / 2), dy = P.y + P.h / 2 - (e.y + e.h / 2);
    var dist = Math.max(1, Math.sqrt(dx * dx + dy * dy)), speed = 260;
    enemyShots.push({ x: e.x + e.w / 2 - 5, y: e.y + e.h / 2 - 5, w: 10, h: 10, vx: dx / dist * speed, vy: dy / dist * speed, ttl: 3 });
  }
  function damageEnemy(e, amount, dirx) {
    if (e.state === 'dead' || e.state === 'fall') return;
    e.hp -= amount || 1; e.hitT = 0.22;
    sparkle(e.x + e.w / 2, e.y + e.h / 2, 5, '#ffe066');
    if (e.hp <= 0) {
      e.state = 'dead'; e.timer = 0.45; e.vx = 0; e.vy = 0;
      SFX.stomp(); explosionBurst(e.x + e.w / 2, e.y + e.h / 2, '#ff5a64');
    } else {
      e.vx = (dirx || -e.dir || 1) * 120; e.vy = -120;
      G.freeze = Math.max(G.freeze, 0.05); G.shake = Math.max(G.shake, 2);
    }
  }
  function knock(e, dirx) {
    if (e.state === 'fall') return;
    e.state = 'fall'; e.vx = dirx * 90; e.vy = -320;
    addScore(200, e.x, e.y - 10); SFX.stomp(); starBurst(e.x + e.w / 2, e.y + e.h / 2, 5); smokeBurst(e.x + e.w / 2, e.y + e.h / 2, 4);
  }
  function updateEnemies(dt) {
    var i, e;
    for (i = enemies.length - 1; i >= 0; i--) {
      e = enemies[i];
      if (e.state === 'dead') { e.timer -= dt; if (e.timer <= 0) enemies.splice(i, 1); continue; }
      if (e.state === 'fall') { e.vy += 1800 * dt; e.y += e.vy * dt; e.x += e.vx * dt; if (e.y > VH + 100) enemies.splice(i, 1); continue; }
      if (!e.act) { if (e.x < G.camX + VW + 40) e.act = true; else continue; }
      if (e.kick > 0) e.kick -= dt;
      e.hitT = Math.max(0, e.hitT - dt);
      if (isFlyingEnemy(e)) {
        e.dir = P.x < e.x ? -1 : 1;
        e.vx = e.dir * 46;
        e.y = e.hoverY + Math.sin(G.t * 3.2 + e.hoverPhase) * 10;
        moveX(e, dt);
        e.shotT -= dt;
        if (e.shotT <= 0 && Math.abs(P.x - e.x) < 520) {
          e.shotT = 1.35;
          shootAtPlayer(e);
        }
      } else {
        if (e.t === 'chaser' && Math.abs(P.x - e.x) < 240) e.dir = P.x < e.x ? -1 : 1;
        if (e.state === 'walk') e.vx = e.dir * (e.t === 'chaser' ? 115 : e.t === 'shooter' ? 42 : e.t === 'slime' ? 50 : 56); else e.vx = e.shellV;
        if (e.t === 'shooter') {
          e.shotT -= dt;
          if (e.shotT <= 0 && Math.abs(P.x - e.x) < 500) { e.shotT = 1.7; shootAtPlayer(e); }
        }
        e.vy = Math.min(e.vy + 2000 * dt, 800); moveX(e, dt);
      }
      if (e.hitX) {
        if (e.state === 'walk' || isFlyingEnemy(e)) e.dir = -e.dir;
        else if (e.shellV !== 0) { e.shellV = -e.shellV; SFX.bump(); }
      }
      if (!isFlyingEnemy(e)) moveY(e, dt);
      if (e.y > VH + 100) enemies.splice(i, 1);
    }
    enemies.forEach(function (s) {
      if (s.state !== 'shell' || s.shellV === 0) return;
      enemies.forEach(function (o) {
        if (o === s || o.state === 'dead' || o.state === 'fall' || !o.act) return;
        if (hit(s, o)) knock(o, s.shellV > 0 ? 1 : -1);
      });
    });
    if (G.state !== 'play') return;
    for (i = 0; i < enemies.length; i++) {
      e = enemies[i];
      if (e.state === 'dead' || e.state === 'fall' || !e.act || !hit(P, e)) continue;
      if (P.star > 0) { knock(e, P.face); continue; }
      var stomp = P.vy > 0 && (P.y + P.h) - e.y < 20;
      if (e.state === 'shell' && e.shellV === 0) {
        if (e.kick > 0) continue;
        e.shellV = (P.x + P.w / 2 < e.x + e.w / 2) ? 380 : -380; e.kick = 0.3;
        addScore(400, e.x, e.y - 10); SFX.kick(); dust(e.x + e.w / 2, e.y + e.h, 4);
        if (stomp) P.vy = -330;
        continue;
      }
      if (stomp) {
        if (e.t === 'slime' || e.t === 'shooter' || e.t === 'chaser' || isFlyingEnemy(e)) damageEnemy(e, e.hp, P.face);
        else if (e.state === 'walk') { e.state = 'shell'; e.shellV = 0; e.vx = 0; e.y += e.h - 20; e.h = 20; e.kick = 0.25; }
        else { e.shellV = 0; e.vx = 0; e.kick = 0.25; }
        if (e.state === 'dead') registerCombo(100, e.x, e.y - 12); else addScore(50, e.x, e.y - 12);
        P.vy = isJump() ? -620 : -400; P.y = Math.min(P.y, e.y - P.h - 1); P.sq = 0.16;
        SFX.stomp(); starBurst(e.x + e.w / 2, e.y, 6); dust(e.x + e.w / 2, e.y + e.h, 4);
        G.freeze = Math.max(G.freeze, 0.05); G.shake = Math.max(G.shake, 3);
        continue;
      }
      if (e.state === 'shell' && e.kick > 0) continue;
      hurt();
    }
  }
  function updateFireballs(dt) {
    for (var i = fireballs.length - 1; i >= 0; i--) {
      var f = fireballs[i];
      if (f.gravity) f.vy = Math.min(f.vy + 900 * dt, 600);
      f.x += f.vx * dt; f.y += f.vy * dt;
      var dead = solidAt(Math.floor((f.x + f.w / 2) / T), Math.floor((f.y + f.h / 2) / T));
      if (f.head) dead = true;
      if (f.y > VH + 40 || f.x < G.camX - 40 || f.x > G.camX + VW + 40) dead = true;
      part({ type: 'spark', x: f.x + 5, y: f.y + 5, vx: -f.dir * 20, vy: (Math.random() - 0.5) * 30, ttl: 0.25, color: f.color, size: 2 });
      if (!dead) for (var j = 0; j < enemies.length; j++) {
        var e = enemies[j];
        if (e.state === 'dead' || e.state === 'fall' || !e.act) continue;
        if (hit(f, e)) { damageEnemy(e, 1, f.dir); if (e.state === 'dead') registerCombo(250, e.x, e.y - 10); dead = true; break; }
      }
      if (dead) {
        if (f.kind === 'grenade') {
          explosionBurst(f.x + 5, f.y + 5, f.color);
          enemies.forEach(function (e) {
            if (e.state === 'dead' || e.state === 'fall' || !e.act) return;
            var dx = e.x + e.w / 2 - (f.x + 5), dy = e.y + e.h / 2 - (f.y + 5);
            if (Math.sqrt(dx * dx + dy * dy) <= f.radius) { damageEnemy(e, 1, f.dir); if (e.state === 'dead') registerCombo(300, e.x, e.y - 10); }
          });
        } else sparkle(f.x + 5, f.y + 5, 4, f.color);
        SFX.fireHit(); fireballs.splice(i, 1);
      }
    }
  }
  function updateEnemyShots(dt) {
    for (var i = enemyShots.length - 1; i >= 0; i--) {
      var s = enemyShots[i];
      s.ttl -= dt; s.x += s.vx * dt; s.y += s.vy * dt;
      var tx = Math.floor((s.x + s.w / 2) / T), ty = Math.floor((s.y + s.h / 2) / T);
      if (s.ttl <= 0 || solidAt(tx, ty) || s.x < G.camX - 60 || s.x > G.camX + VW + 60 || s.y < -60 || s.y > VH + 60) { enemyShots.splice(i, 1); continue; }
      if (G.state === 'play' && hit(P, s)) { enemyShots.splice(i, 1); hurt(); }
    }
  }

  // Calcule une direction avec les touches de déplacement et de visée.
  function aimVector() {
    var ax = (isRight() ? 1 : 0) - (isLeft() ? 1 : 0);
    var ay = (keys.ArrowDown || keys.KeyS ? 1 : 0) - (keys.ArrowUp || keys.KeyW ? 1 : 0);
    if (!ax && !ay) ax = P.face;
    var len = Math.max(1, Math.sqrt(ax * ax + ay * ay));
    return { x: ax / len, y: ay / len };
  }
  function fireWeapon() {
    var w = P.weapon, ammo = P.ammo[w] || 0;
    if (ammo <= 0) { P.fireCd = 0.2; return; }
    var cfg = w === 'smg' ? { count: 1, spread: 0, speed: 500, cooldown: 0.11, color: '#ffe066' } :
      w === 'spread' ? { count: 5, spread: 0.22, speed: 430, cooldown: 0.42, color: '#ff9bdc' } :
      w === 'grenade' ? { count: 1, spread: 0, speed: 330, cooldown: 0.75, color: '#7dff9a' } :
      { count: 1, spread: 0, speed: 560, cooldown: 0.28, color: '#8af0ff' };
    var a = aimVector(), base = Math.atan2(a.y, a.x);
    for (var i = 0; i < cfg.count; i++) {
      var angle = base + (i - (cfg.count - 1) / 2) * cfg.spread;
      fireballs.push({
        kind: w, x: P.x + P.w / 2 - 5, y: P.y + P.h * 0.45 - 5, w: 10, h: 10,
        vx: Math.cos(angle) * cfg.speed, vy: Math.sin(angle) * cfg.speed, dir: Math.cos(angle) >= 0 ? 1 : -1,
        ttl: w === 'grenade' ? 2.2 : 1.8, gravity: w === 'grenade', radius: w === 'grenade' ? 58 : 0, color: cfg.color
      });
    }
    P.ammo[w]--; P.fireCd = cfg.cooldown; SFX.weapon(w);
  }

  /* ----------------------------------------------------------------- joueur */
  function hurt() {
    if (P.inv > 0 || P.star > 0 || G.state !== 'play') return;
    if (P.shield > 0) {
      P.shield = 0; P.inv = 0.8; SFX.hurt(); G.shake = 6;
      explosionBurst(P.x + P.w / 2, P.y + P.h / 2, '#58d6ff');
      return;
    }
    if (P.power > 0) { setPower(P.power - 1); P.inv = 1.6; SFX.hurt(); G.shake = 6; ring(P.x + P.w / 2, P.y + P.h / 2, '#ff6a6a', 30); }
    else die();
  }
  function die() {
    if (G.state !== 'play') return;
    G.state = 'dying'; G.timer = 2.6; P.deadT = 0; P.hopped = false; P.vx = 0; P.vy = 0; P.star = 0; G.lives--; G.freeze = 0.25; G.shake = 5;
    AU.stop(); AU.setStar(false); SFX.die();
  }
  function updatePlayer(dt) {
    var dir = (isRight() ? 1 : 0) - (isLeft() ? 1 : 0);
    if (specialReq) { specialReq = false; activateSpecial(); }
    P.dashCd = Math.max(0, P.dashCd - dt);
    P.fireCd = Math.max(0, P.fireCd - dt);
    P.shield = Math.max(0, P.shield - dt);
    P.speedT = Math.max(0, P.speedT - dt);
    P.slowT = Math.max(0, P.slowT - dt);
    if (dashReq) {
      dashReq = false;
      if (P.dashCd <= 0 && !P.slide) {
        P.dashCd = 1.0; P.dashT = 0.18; P.vx = P.face * 520; P.vy = 0; P.inv = Math.max(P.inv, 0.2);
        dust(P.x + P.w / 2, P.y + P.h, 7, -P.face);
      }
    }
    updateSlide();
    if (P.dashT > 0) {
      P.dashT -= dt; P.vx = P.face * 520;
    } else {
      var maxV = P.slide ? 320 : (isRun() ? 280 : 180);
      if (P.speedT > 0) maxV *= 1.35;
      if (dir) { P.face = dir; P.vx = approach(P.vx, dir * maxV, (P.ground ? (P.vx * dir < 0 ? 2600 : 1300) : 900) * dt); }
      else P.vx = approach(P.vx, 0, (P.ground ? (P.slide ? 900 : 1500) : 250) * dt);
    }
    if (P.ground) P.coyote = 0.1; else P.coyote -= dt;
    jumpBuf -= dt;
    if (jumpBuf > 0 && P.dashT <= 0 && !P.slide && (P.coyote > 0 || P.jumps < 2 || P.wallDir)) {
      if (P.wallDir && !P.ground && P.coyote <= 0) {
        P.vx = -P.wallDir * 300; P.vy = -640; P.jumps = 1;
      } else {
        P.vy = -(640 + Math.abs(P.vx) * 0.1); P.jumps++;
      }
      P.ground = false; P.coyote = 0; P.wallDir = 0; jumpBuf = 0; P.sq = 0.2;
      SFX.jump(P.power > 0); dust(P.x + P.w / 2, P.y + P.h, 4);
    }
    if (P.dashT <= 0) P.vy = Math.min(P.vy + (P.vy < 0 ? (isJump() ? 1500 : 3200) : 2500) * dt, 820);
    var wasG = P.ground, vy0 = P.vy;
    var wallInput = dir;
    moveX(P, dt);
    P.wallDir = P.hitX && !P.ground ? wallInput : 0;
    if (P.x < G.camX) { P.x = G.camX; if (P.vx < 0) P.vx = 0; }
    moveY(P, dt);
    if (P.ground) { P.jumps = 0; P.wallDir = 0; }
    if (P.ground && !wasG && vy0 > 280) { P.sq = -Math.min(0.2, vy0 / 3600); dust(P.x + P.w / 2, P.y + P.h, 6); if (vy0 > 480) SFX.land(); }
    if (P.head) { bumpBlock(P.head.tx, P.head.ty); G.shake = Math.max(G.shake, 1.5); }
    P.dustT -= dt;
    P.stepT -= dt;
    if (P.ground && Math.abs(P.vx) > 90 && P.stepT <= 0) { SFX.step(); P.stepT = 0.22; }
    if (P.ground && P.dustT <= 0 && ((Math.abs(P.vx) > 200) || (dir && P.vx * dir < -80))) { dust(P.x + P.w / 2 - P.face * 4, P.y + P.h, 1, -P.face); P.dustT = 0.08; }
    if ((fireReq || isRun()) && P.fireCd <= 0) fireWeapon();
    fireReq = false;
    P.comboT = Math.max(0, P.comboT - dt);
    if (P.comboT <= 0) P.combo = 0;
    P.anim += Math.abs(P.vx) * dt * 0.055;
    P.sq = approach(P.sq, 0, dt * 1.7);
    if (P.inv > 0) P.inv -= dt;
    if (P.star > 0) { P.star -= dt; if (P.star <= 0) { P.star = 0; AU.setStar(false); } if (Math.random() < 0.5) part({ type: 'spark', x: P.x + Math.random() * P.w, y: P.y + Math.random() * P.h, vx: 0, vy: -20, ttl: 0.4, color: Math.random() < 0.5 ? '#ffe066' : '#7af0ff', size: 3 }); }
    var x0 = Math.floor(P.x / T), x1 = Math.floor((P.x + P.w) / T), y0 = Math.floor(P.y / T), y1 = Math.floor((P.y + P.h) / T);
    for (var ty = y0; ty <= y1; ty++) for (var tx = x0; tx <= x1; tx++) {
      if (tx >= 0 && tx < L.w && ty >= 0 && ty < ROWS && L.g[ty][tx] === 'C') { L.g[ty][tx] = ' '; addCoin(); sparkle(tx * T + 16, ty * T + 16, 5); ring(tx * T + 16, ty * T + 16, '#ffe066', 14); }
    }
    var poleX = L.flagX * T + 14;
    if (P.x + P.w > poleX && P.x < poleX + 4 && P.y < 12 * T) {
      startFlag();
    }
    if (P.y > VH + 40) die();
  }
  function startFlag() {
    G.state = 'flag'; P.vx = 0; P.vy = 0; P.x = L.flagX * T + 14 - P.w;
    var ratio = Math.max(0, Math.min(1, (12 * T - (P.y + P.h)) / (9 * T)));
    G.flagPts = Math.max(100, Math.round((100 + 4900 * ratio) / 100) * 100);
    addScore(G.flagPts, P.x, P.y - 10); fireballs = []; enemyShots = []; AU.stop(); AU.setStar(false); P.star = 0; SFX.flag(); sparkle(P.x + P.w, P.y, 10);
  }
  function updateGoal(dt) {
    if (G.state === 'flag') {
      P.y += 220 * dt; G.flagY = Math.min(G.flagY + 220 * dt, 11 * T - 28); P.anim = 0;
      if (P.y + P.h >= 12 * T) { P.y = 12 * T - P.h; G.state = 'walk'; P.face = 1; P.x = L.flagX * T + 20; dust(P.x, 12 * T, 4); }
    } else if (G.state === 'walk') {
      P.x += 110 * dt; P.anim += 110 * dt * 0.055; P.ground = true;
      if (P.x > (L.flagX + 3.4) * T) { G.state = 'clear'; G.timer = 3.4; P.hidden = true; SFX.clear(); G.fwT = 0.2; }
    } else if (G.state === 'clear') {
      G.castleFlag = Math.min(1, G.castleFlag + dt);
      G.fwT -= dt;
      if (G.fwT <= 0 && G.timer > 0.6) { G.fwT = 0.38; firework((L.flagX + 2) * T + 80 + (Math.random() - 0.5) * 220, 60 + Math.random() * 110); }
      if (G.time > 0) {
        var n = Math.min(G.time, Math.ceil(90 * dt)); G.time -= n; G.score += n * 10;
        if ((G.tickN++) % 3 === 0) SFX.tick();
      } else {
        G.timer -= dt;
        if (G.timer <= 0) {
          if (G.level + 1 >= LEVELS.length) finishRun(true);
          else beginIntermission(G.level + 1);
        }
      }
    }
  }
  function updateParticles(dt) {
    var i, p;
    for (i = parts.length - 1; i >= 0; i--) {
      p = parts[i]; p.t += dt;
      if (p.type === 'brick' || p.type === 'coinpop') p.vy += 1800 * dt;
      else if (p.type === 'fw') { p.vy += 120 * dt; p.vx *= 0.985; }
      else if (p.type === 'dust' || p.type === 'smoke') { p.vx *= 0.95; p.vy *= 0.95; }
      else if (p.type !== 'ring') p.vy += 500 * dt;
      p.x += p.vx * dt; p.y += p.vy * dt; if (p.vr) p.rot += p.vr * dt;
      if (p.t > p.ttl) parts.splice(i, 1);
    }
    for (i = pops.length - 1; i >= 0; i--) { pops[i].t += dt; pops[i].y -= 40 * dt; if (pops[i].t > 0.9) pops.splice(i, 1); }
    for (var k in bumps) { bumps[k] -= dt; if (bumps[k] <= 0) delete bumps[k]; }
  }

    function update(dt) {
    G.t += dt;
      syncTouchControls();
    if (G.state === 'title' || G.state === 'pause' || G.state === 'over' || G.state === 'win' || G.state === 'dialog' || G.state === 'shop') {
      if (G.state === 'over' || G.state === 'win') updateParticles(dt);
      return;
    }
    if (G.freeze > 0) { G.freeze -= dt; return; }
    G.shake = Math.max(0, G.shake - dt * 28); G.flash = Math.max(0, G.flash - dt * 1.4);
    if (G.state === 'intro') { G.timer -= dt; if (G.timer <= 0) { G.state = 'play'; last = performance.now(); AU.music(L.music); } return; }
    updateParticles(dt);
    if (G.state === 'dying') {
      P.deadT += dt;
      if (P.deadT > 0.45) { if (!P.hopped) { P.hopped = true; P.vy = -560; } P.vy += 1800 * dt; P.y += P.vy * dt; }
      G.timer -= dt;
      if (G.timer <= 0) { if (G.lives > 0) { loadLevel(G.level, 0); startIntro(); } else finishRun(false); }
      return;
    }
    if (G.state === 'play') {
      updatePlayer(dt);
      if (G.state === 'play') {
        G.timeAcc += dt * (P.slowT > 0 ? 0.45 : 1);
        if (G.timeAcc >= 1) {
          G.timeAcc -= 1; G.time--;
          if (G.time === 100 && !G.hurry) { G.hurry = true; SFX.hurry(); AU.hurry(true); }
          if (G.time <= 0) { G.time = 0; die(); }
        }
      }
    } else updateGoal(dt);
    if (G.state === 'play' || G.state === 'flag' || G.state === 'walk') {
      if (G.state === 'play') {
        var enemyDt = dt * (P.slowT > 0 ? 0.45 : 1);
        updateEnemies(enemyDt); updateFireballs(dt); updateEnemyShots(enemyDt);
      }
      updateItems(dt);
    }
    var target = Math.max(0, Math.min(P.x - 300 + P.vx * 0.12, L.w * T - VW));
    G.camX += (target - G.camX) * Math.min(1, dt * 10);
  }

  /* ------------------------------------------------------------------ rendu */
  function drawParticles() {
    parts.forEach(function (p) {
      var k = Math.max(0, 1 - p.t / p.ttl);
      if (p.type === 'brick') {
        ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(p.rot);
        ctx.fillStyle = L.theme.brick; ctx.fillRect(-5, -5, 10, 10); ctx.fillStyle = L.theme.brickD; ctx.fillRect(-5, 1, 10, 4);
        ctx.strokeStyle = L.theme.outline; ctx.lineWidth = 1.5; ctx.strokeRect(-5, -5, 10, 10); ctx.restore();
      } else if (p.type === 'coinpop') {
        var w = Math.abs(Math.cos(p.t * 18)) * 8 + 2;
        ctx.beginPath(); ctx.ellipse(p.x + 6, p.y, w, 10, 0, 0, TAU); ctx.fillStyle = '#ffcf33'; ctx.fill(); ctx.strokeStyle = '#a86a00'; ctx.lineWidth = 2; ctx.stroke();
      } else if (p.type === 'dust') {
        ctx.globalAlpha = k * 0.6; ctx.fillStyle = '#f4ead0'; ctx.beginPath(); ctx.arc(p.x, p.y, p.size * (1.6 - k * 0.6), 0, TAU); ctx.fill(); ctx.globalAlpha = 1;
      } else if (p.type === 'smoke') {
        ctx.globalAlpha = k * 0.45; ctx.fillStyle = p.color; ctx.beginPath(); ctx.arc(p.x, p.y, p.size * (1.5 - k * 0.35), 0, TAU); ctx.fill(); ctx.globalAlpha = 1;
      } else if (p.type === 'star') {
        ctx.globalAlpha = k; ctx.fillStyle = '#ffe066'; ART.star(ctx, p.x, p.y, p.size, p.rot + p.t * 6); ctx.fill(); ctx.strokeStyle = '#a86a00'; ctx.lineWidth = 1; ctx.stroke(); ctx.globalAlpha = 1;
      } else if (p.type === 'ring') {
        ctx.globalAlpha = k; ctx.strokeStyle = p.color; ctx.lineWidth = 3 * k + 1; ctx.beginPath(); ctx.arc(p.x, p.y, p.size * (1 - k * 0.7) + 4, 0, TAU); ctx.stroke(); ctx.globalAlpha = 1;
      } else if (p.type === 'fw') {
        ctx.globalCompositeOperation = 'lighter'; ctx.globalAlpha = k; ctx.fillStyle = p.color;
        ctx.beginPath(); ctx.arc(p.x, p.y, p.size * (0.6 + k * 0.6), 0, TAU); ctx.fill();
        ctx.beginPath(); ctx.arc(p.x - p.vx * 0.03, p.y - p.vy * 0.03, p.size * 0.5, 0, TAU); ctx.fill();
        ctx.globalAlpha = 1; ctx.globalCompositeOperation = 'source-over';
      } else { ctx.globalAlpha = k; ctx.fillStyle = p.color; ctx.fillRect(p.x - 1.5, p.y - 1.5, p.size, p.size); ctx.globalAlpha = 1; }
    });
    fireballs.forEach(function (f) {
      var cx = f.x + 6, cy = f.y + 6, g = ctx.createRadialGradient(cx, cy, 1, cx, cy, 14);
      g.addColorStop(0, 'rgba(255,255,255,0.95)'); g.addColorStop(1, 'rgba(255,120,20,0)');
      ctx.save(); ctx.globalCompositeOperation = 'lighter';
      ctx.fillStyle = g; ctx.beginPath(); ctx.arc(cx, cy, 14, 0, TAU); ctx.fill();
      ctx.fillStyle = f.color || '#ff7a1a'; ctx.beginPath(); ctx.arc(cx, cy, f.kind === 'grenade' ? 8 : 5.5, 0, TAU); ctx.fill();
      ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(cx, cy, 2.5, 0, TAU); ctx.fill();
      ctx.restore();
    });
    enemyShots.forEach(function (s) {
      ctx.save(); ctx.globalCompositeOperation = 'lighter';
      ctx.fillStyle = '#ff5a64'; ctx.beginPath(); ctx.arc(s.x + 5, s.y + 5, 6, 0, TAU); ctx.fill();
      ctx.fillStyle = '#ffe066'; ctx.beginPath(); ctx.arc(s.x + 5, s.y + 5, 2.5, 0, TAU); ctx.fill();
      ctx.restore();
    });
    pops.forEach(function (p) { ctx.globalAlpha = Math.max(0, 1 - p.t / 0.9); ART.outlineText(ctx, p.txt, p.x + 8, p.y, 17, 'center'); ctx.globalAlpha = 1; });
  }

  function drawPlayer() {
    if (P.hidden) return;
    if (P.inv > 0 && Math.floor(G.t * 20) % 2 === 0) return;
    var s = P.h * 1.06 / 70, cx = P.x + P.w / 2, by = P.y + P.h + 1;
    var pose;
    if (G.state === 'dying') pose = 'dead';
    else if (G.state === 'flag') pose = 'flag';
    else if (!P.ground && G.state !== 'walk') pose = P.vy < 0 ? 'jump' : 'fall';
    else if (Math.abs(P.vx) < 12 && G.state !== 'walk') pose = 'idle';
    else if (G.state === 'play' && ((isRight() && P.vx < -90) || (isLeft() && P.vx > 90))) pose = 'skid';
    else pose = 'run';
    if (P.ground && G.state !== 'dying') {
      var gy = by, ty = Math.floor((P.y + P.h + 2) / T);
      ctx.fillStyle = 'rgba(0,0,0,0.22)'; ctx.beginPath(); ctx.ellipse(cx, gy - 1, 11 * s * 1.4, 3, 0, 0, TAU); ctx.fill();
    }
    ctx.save();
    if (P.star > 0 && (P.star > 2 || Math.floor(G.t * 12) % 2 === 0)) { ctx.shadowColor = Math.floor(G.t * 10) % 2 ? '#ffe066' : '#7af0ff'; ctx.shadowBlur = 18; }
    if (P.shield > 0) { ctx.strokeStyle = '#58d6ff'; ctx.lineWidth = 2; ctx.globalAlpha = 0.75; ctx.beginPath(); ctx.arc(cx, P.y + P.h / 2, 20, 0, TAU); ctx.stroke(); ctx.globalAlpha = 1; }
    ART.drawHero(ctx, cx, by, s, P.face, { pose: pose, ph: P.anim * 1.0, t: G.t, power: P.power, sq: P.sq });
    ctx.restore();
  }

  function drawCard(lines, hero) {
    ctx.fillStyle = 'rgba(8,16,48,0.78)'; ctx.fillRect(0, 0, VW, VH);
    ART.outlineText(ctx, lines[0], VW / 2, 150, 56, 'center', '#ffd23f');
    if (hero) {
      ART.drawHero(ctx, VW / 2 - 56, 330, 2.2, 1, { pose: 'idle', t: G.t, power: P.power });
      ART.outlineText(ctx, '× ' + G.lives, VW / 2 + 40, 300, 46, 'left');
    }
    if (lines[1]) ART.outlineText(ctx, lines[1], VW / 2, 392, 20, 'center');
  }

  function render() {
    if (G.state === 'title') { ART.drawTitle(ctx, G.t, { avatar: avatar, badge: badge, best: best, touch: TOUCH }); return; }
    if (!L) return;
    var sx = G.shake > 0 ? (Math.random() - 0.5) * G.shake : 0, sy = G.shake > 0 ? (Math.random() - 0.5) * G.shake : 0;
    ART.drawBackground(ctx, L.theme, G.camX, G.t);
    ctx.save();
    ctx.translate(-Math.round(G.camX) + sx, sy);
    ART.drawGoal(ctx, L, G, G.t);
    items.forEach(function (it) { ART.drawItem(ctx, it, G.t); });
    var x0 = Math.max(0, Math.floor(G.camX / T)), x1 = Math.min(L.w - 1, Math.floor((G.camX + VW) / T));
    var sol = function (tx, ty) { return tx < 0 || tx >= L.w ? true : (ty < 0 || ty >= ROWS ? false : SOLID.indexOf(L.g[ty][tx]) >= 0); };
    for (var ty = 0; ty < ROWS; ty++) for (var tx = x0; tx <= x1; tx++) {
      var c = L.g[ty][tx];
      if (c === ' ') continue;
      var px = tx * T, py = ty * T;
      if (c === 'C') { ART.drawCoin(ctx, px, py, G.t); continue; }
      var b = bumps[ty * 1000 + tx];
      if (b) py -= Math.sin((1 - b / 0.2) * PI) * 9;
      ART.drawTile(ctx, c, px, py, tx, ty, L.theme, sol, G.t);
    }
    enemies.forEach(function (e) { if (e.x + e.w < G.camX - 40 || e.x > G.camX + VW + 40) return; ART.drawEnemy(ctx, e, G.t); });
    drawPlayer();
    drawParticles();
    ctx.restore();
    var vg = ctx.createRadialGradient(VW / 2, VH / 2, 240, VW / 2, VH / 2, 520);
    vg.addColorStop(0, 'rgba(0,0,0,0)'); vg.addColorStop(1, L.theme.id === 'night' ? 'rgba(0,0,20,0.4)' : 'rgba(0,10,40,0.22)');
    ctx.fillStyle = vg; ctx.fillRect(0, 0, VW, VH);
    ART.drawHud(ctx, { lives: G.lives, hearts: Math.min(3, P.power + 1), coins: G.coins, score: G.score, level: L.name, time: G.time, weapon: P.weapon, ammo: P.ammo[P.weapon] || 0, combo: P.combo, energy: P.energy, energyMax: P.energyMax }, avatar, G.t);
    if (P.star > 0) ART.outlineText(ctx, 'Couronne ' + Math.ceil(P.star) + 's', VW / 2, 34, 20, 'center', '#ffe066');
    if (P.shield > 0) ART.outlineText(ctx, 'Bouclier ' + Math.ceil(P.shield) + 's', VW / 2, 58, 16, 'center', '#58d6ff');
    else if (P.speedT > 0) ART.outlineText(ctx, 'Vitesse ' + Math.ceil(P.speedT) + 's', VW / 2, 58, 16, 'center', '#ffe066');
    else if (P.slowT > 0) ART.outlineText(ctx, 'Ralenti ' + Math.ceil(P.slowT) + 's', VW / 2, 58, 16, 'center', '#c69cff');
    if (G.flash > 0) { ctx.fillStyle = 'rgba(255,255,255,' + Math.min(0.5, G.flash) + ')'; ctx.fillRect(0, 0, VW, VH); }
    if (G.state === 'intro') drawCard(['Niveau ' + L.name, ['Cours, saute et atteins le château', 'La nuit tombe… reste vif !', 'Le vide partout — ne tombe pas !', 'EXPERT : trous de 5 cases, carapaces en chaîne !'][G.level] || ''], true);
    else if (G.state === 'pause') drawCard(['Pause', 'Appuie sur P pour reprendre'], false);
    else if (G.state === 'dialog') drawCard(['Entre les niveaux', ['Le chemin devient plus dangereux…', 'Prépare ton équipement avant de repartir.'][G.dialogLine]], false);
    else if (G.state === 'shop') drawCard(['BOUTIQUE · ' + G.coins + ' pièces', '1 Vie 50 · 2 Munitions 30 · 3 Énergie +20 75 · Entrée : continuer'], false);
  }

  /* ------------------------------------------------------------------ boucle */
 function resize() {
  var dpr = Math.min(window.devicePixelRatio || 1, 2), r = stage.getBoundingClientRect();
  if (!r.width) return;
  var w = Math.max(320, Math.round(r.width * dpr));
  if (canvas.width === w) return;
  canvas.width = w; canvas.height = Math.round(w * VH / VW);
}
function resizeSoon() { resize(); setTimeout(resize, 100); setTimeout(resize, 400); }
window.addEventListener('resize', resizeSoon);
window.addEventListener('orientationchange', resizeSoon);
document.addEventListener('fullscreenchange', resizeSoon);
document.addEventListener('webkitfullscreenchange', resizeSoon);
if (window.visualViewport) window.visualViewport.addEventListener('resize', resizeSoon);
if (window.ResizeObserver) new ResizeObserver(resize).observe(stage);
  var last = 0, acc = 0;
  function frame(now) {
    var dt = Math.min(0.1, (now - last) / 1000);
    last = now; acc += dt;
    while (acc >= STEP) { update(STEP); acc -= STEP; }
    ctx.setTransform(canvas.width / VW, 0, 0, canvas.height / VH, 0, 0);
    render();
    requestAnimationFrame(frame);
  }
  window.addEventListener('resize', resize);
  resize();
  loadLevel(0, 1);
  G.state = 'title';
  last = performance.now();
  requestAnimationFrame(frame);

  if (window.__WASSEL_TEST) {
    window.__WASSEL_TEST({
      G: G, startGame: startGame, loadLevel: loadLevel, startIntro: startIntro, update: update, render: render,
      P: function () { return P; }, L: function () { return L; }, enemies: function () { return enemies; }, items: function () { return items; },
      bumpBlock: bumpBlock, setPower: setPower, keys: keys, spawn: function (t, x, y) { enemies.push(makeEnemy(t, x, y)); },
      press: function (c) { keys[c] = true; if (JUMP_KEYS[c]) jumpBuf = 0.12; if (RUN_KEYS[c]) fireReq = true; if (DASH_KEYS[c]) dashReq = true; },
      release: function (c) { keys[c] = false; }, parts: function () { return parts; }
    });
  }
})();
