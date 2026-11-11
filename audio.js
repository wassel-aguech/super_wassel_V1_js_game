/* Super Wassel - audio : synthé Web Audio (effets + musique par niveau) */
(function () {
  'use strict';
  var W = window.WASSEL = window.WASSEL || {};
  var AC = null, master = null, musicBus = null, sfxBus = null, noiseBuf = null;
  var muted = false, theme = null, want = null, timer = null, nextT = 0, step = 0, tempo = 1, starMode = false, hurryOn = false;
  var vol = 0.9;
  try { var _v = parseFloat(localStorage.getItem('wassel-vol')); if (!isNaN(_v)) vol = Math.min(1, Math.max(0, _v)); } catch (e) {}
  try { muted = localStorage.getItem('wassel-muted') === '1'; } catch (e) {}
  function applyGain() { if (master) master.gain.value = muted ? 0 : vol; }

  function init() {
    if (AC) { if (AC.state === 'suspended' && AC.resume) { try { AC.resume(); } catch (e) {} } return; }
    try {
      var C = window.AudioContext || window.webkitAudioContext;
      if (!C) return;
      AC = new C();
      master = AC.createGain(); master.gain.value = muted ? 0 : vol;
      var comp = AC.createDynamicsCompressor();
      comp.threshold.value = -14; comp.ratio.value = 5;
      master.connect(comp); comp.connect(AC.destination);
      musicBus = AC.createGain(); musicBus.gain.value = 0.55; musicBus.connect(master);
      sfxBus = AC.createGain(); sfxBus.gain.value = 1; sfxBus.connect(master);
      var len = AC.sampleRate, b = AC.createBuffer(1, len, AC.sampleRate), d = b.getChannelData(0);
      for (var i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
      noiseBuf = b;
      if (want) startTheme(want);
    } catch (e) { AC = null; }
  }
  function now() { return AC ? AC.currentTime : 0; }
  function mtof(n) { return 440 * Math.pow(2, (n - 69) / 12); }

  function osc(type, f0, f1, t, dur, vol, dest, att) {
    if (!AC) return;
    try {
      var o = AC.createOscillator(), g = AC.createGain(), a = att || 0.004;
      o.type = type;
      o.frequency.setValueAtTime(Math.max(20, f0), t);
      if (f1 && f1 !== f0) o.frequency.exponentialRampToValueAtTime(Math.max(20, f1), t + dur);
      g.gain.setValueAtTime(0.0001, t);
      g.gain.linearRampToValueAtTime(vol, t + a);
      g.gain.exponentialRampToValueAtTime(0.0001, t + Math.max(dur, a + 0.01));
      o.connect(g); g.connect(dest || sfxBus);
      o.start(t); o.stop(t + dur + 0.05);
    } catch (e) {}
  }
  function noise(t, dur, vol, dest, ftype, f0, f1, q) {
    if (!AC || !noiseBuf) return;
    try {
      var s = AC.createBufferSource(), f = AC.createBiquadFilter(), g = AC.createGain();
      s.buffer = noiseBuf; f.type = ftype || 'lowpass';
      f.frequency.setValueAtTime(f0 || 1000, t);
      if (f1) f.frequency.exponentialRampToValueAtTime(Math.max(30, f1), t + dur);
      f.Q.value = q || 0.8;
      g.gain.setValueAtTime(vol, t);
      g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
      s.connect(f); f.connect(g); g.connect(dest || sfxBus);
      s.start(t, Math.random() * 0.5); s.stop(t + dur + 0.05);
    } catch (e) {}
  }
  function arp(notes, gap, type, vol, t0, len) {
    var t = t0 || now();
    notes.forEach(function (n, i) { osc(type || 'square', mtof(n), mtof(n), t + i * gap, (len || gap * 1.6), vol || 0.07, sfxBus); });
  }

  var sfx = {
    jump: function (big) {
      var t = now(), k = big ? 0.78 : 1;
      osc('square', 300 * k, 820 * k, t, 0.17, 0.07);
      osc('triangle', 150 * k, 410 * k, t, 0.17, 0.12);
    },
    coin: function () {
      var t = now();
      osc('square', 988, 988, t, 0.07, 0.06);
      osc('square', 1319, 1319, t + 0.065, 0.32, 0.06);
      osc('triangle', 2637, 2637, t + 0.065, 0.22, 0.04);
      osc('sine', 3951, 3951, t + 0.09, 0.18, 0.02);
    },
    stomp: function () {
      var t = now();
      osc('square', 480, 70, t, 0.14, 0.09);
      osc('sine', 160, 50, t, 0.14, 0.25);
      noise(t, 0.07, 0.12, sfxBus, 'lowpass', 2400, 300);
    },
    kick: function () {
      var t = now();
      osc('square', 220, 620, t, 0.09, 0.07);
      noise(t, 0.06, 0.1, sfxBus, 'highpass', 1800, 4000);
    },
    bump: function () {
      var t = now();
      osc('triangle', 150, 60, t, 0.12, 0.28);
      noise(t, 0.05, 0.08, sfxBus, 'lowpass', 900, 200);
    },
    brk: function () {
      var t = now();
      noise(t, 0.34, 0.25, sfxBus, 'bandpass', 1400, 180, 0.7);
      osc('sawtooth', 320, 50, t, 0.24, 0.07);
      osc('square', 180, 70, t + 0.03, 0.14, 0.05);
    },
    power: function () {
      var t = now();
      arp([55, 59, 62, 67, 71, 74, 79, 83], 0.055, 'square', 0.055, t, 0.1);
      arp([67, 71, 74, 79, 83, 86, 91, 95], 0.055, 'triangle', 0.07, t + 0.02, 0.12);
    },
    fire: function () {
      var t = now();
      osc('sawtooth', 1400, 220, t, 0.16, 0.05);
      noise(t, 0.1, 0.07, sfxBus, 'highpass', 3000, 900);
    },
    fireHit: function () {
      var t = now();
      noise(t, 0.12, 0.1, sfxBus, 'bandpass', 1800, 400);
      osc('square', 600, 200, t, 0.08, 0.04);
    },
    hurt: function () {
      var t = now();
      osc('sawtooth', 700, 90, t, 0.4, 0.09);
      osc('square', 350, 60, t, 0.4, 0.06);
      noise(t, 0.12, 0.08, sfxBus, 'lowpass', 1500, 300);
    },
    land: function () {
      var t = now();
      noise(t, 0.06, 0.06, sfxBus, 'lowpass', 700, 200);
      osc('sine', 120, 60, t, 0.08, 0.12);
    },
    oneup: function () {
      arp([76, 79, 88, 84, 86, 91], 0.075, 'square', 0.06, now(), 0.12);
    },
    tick: function () { osc('square', 1500, 1500, now(), 0.025, 0.03); },
    pause: function () {
      var t = now();
      osc('square', 880, 880, t, 0.06, 0.05); osc('square', 660, 660, t + 0.07, 0.08, 0.05);
    },
    star: function () {
      arp([72, 76, 79, 84, 79, 76, 72, 76, 79, 84, 88, 91], 0.045, 'square', 0.05, now(), 0.07);
    },
    hurry: function () {
      arp([79, 74, 79, 74, 83, 78, 83, 78], 0.07, 'square', 0.05, now(), 0.08);
    },
    flag: function () {
      var t = now();
      osc('triangle', 1500, 260, t, 1.2, 0.14);
      osc('square', 1500, 260, t + 0.02, 1.2, 0.05);
    },
    clear: function () {
      var t = now(), n = [72, 72, 72, 76, 72, 76, 79];
      arp([67, 72, 76, 79, 84, 79, 84, 88], 0.11, 'square', 0.06, t, 0.16);
      arp([55, 60, 64, 67, 72, 67, 72, 76], 0.11, 'triangle', 0.1, t, 0.16);
      osc('square', mtof(91), mtof(91), t + 0.9, 0.7, 0.06);
      osc('triangle', mtof(79), mtof(79), t + 0.9, 0.7, 0.1);
    },
    die: function () {
      var t = now();
      arp([72, 71, 70, 69, 67, 65, 64, 60], 0.1, 'triangle', 0.12, t + 0.05, 0.2);
      arp([60, 59, 58, 57, 55, 53, 52, 48], 0.1, 'square', 0.04, t + 0.05, 0.2);
    },
    over: function () {
      var t = now();
      arp([67, 64, 60, 55, 57, 59, 57, 56, 58, 56, 55], 0.17, 'triangle', 0.11, t, 0.3);
    },
    win: function () {
      var t = now(), seq = [60, 64, 67, 72, 67, 72, 76, 79, 76, 79, 84, 88, 91];
      arp(seq, 0.1, 'square', 0.05, t, 0.14);
      arp(seq.map(function (n) { return n - 12; }), 0.1, 'triangle', 0.1, t, 0.14);
      osc('square', mtof(96), mtof(96), t + 1.4, 1.2, 0.05);
      osc('triangle', mtof(84), mtof(84), t + 1.4, 1.2, 0.1);
    }
  };

  /* ------------------------------------------------------------- musique */
  // accords : [fondamentale, tierce, quinte] (notes MIDI)
  var THEMES = {
    day: {
      bpm: 134, bars: 4, leadType: 'square', leadVol: 0.05, bassVol: 0.16, arpVol: 0.028, doubled: false,
      chords: [[48, 52, 55], [45, 48, 52], [41, 45, 48], [43, 47, 50]],
      lead: [
        72, 0, 76, 0, 79, 0, 76, 0, 74, 0, 72, 0, 67, 0, 0, 0,
        69, 0, 72, 0, 76, 0, 72, 0, 71, 0, 69, 0, 64, 0, 0, 0,
        65, 0, 69, 0, 72, 0, 69, 0, 67, 0, 65, 0, 60, 0, 62, 0,
        67, 0, 71, 0, 74, 0, 71, 0, 79, 0, 77, 0, 74, 0, 0, 0],
      bass: ['r', 0, 0, 0, 'f', 0, 0, 0, 'r', 0, 0, 0, 'f', 0, 'o', 0],
      arp: [0, 0, 1, 0, 0, 2, 0, 0, 0, 0, 3, 0, 0, 2, 0, 0],
      kick: [1, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0],
      snare: [0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0],
      hat: [1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 1]
    },
    night: {
      bpm: 104, bars: 4, leadType: 'triangle', leadVol: 0.1, bassVol: 0.15, arpVol: 0.03, doubled: true,
      chords: [[45, 48, 52], [41, 45, 48], [48, 52, 55], [40, 44, 47]],
      lead: [
        69, 0, 0, 72, 0, 0, 76, 0, 0, 0, 74, 0, 72, 0, 0, 0,
        65, 0, 0, 69, 0, 0, 72, 0, 0, 0, 71, 0, 69, 0, 0, 0,
        67, 0, 0, 72, 0, 0, 76, 0, 0, 0, 79, 0, 76, 0, 0, 0,
        68, 0, 0, 71, 0, 0, 76, 0, 0, 0, 75, 0, 71, 0, 68, 0],
      bass: ['r', 0, 0, 0, 0, 0, 'f', 0, 'r', 0, 0, 0, 0, 0, 0, 0],
      arp: [1, 0, 2, 0, 3, 0, 2, 0, 1, 0, 2, 0, 3, 0, 2, 0],
      kick: [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0],
      snare: [0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0],
      hat: [0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1, 0]
    },
    dusk: {
      bpm: 152, bars: 4, leadType: 'square', leadVol: 0.048, bassVol: 0.16, arpVol: 0.03, doubled: false,
      chords: [[50, 53, 57], [46, 50, 53], [53, 57, 60], [48, 52, 55]],
      lead: [
        74, 0, 77, 0, 81, 0, 77, 0, 74, 77, 81, 0, 86, 0, 0, 0,
        70, 0, 74, 0, 77, 0, 74, 0, 70, 74, 77, 0, 82, 0, 0, 0,
        72, 0, 77, 0, 81, 0, 77, 0, 72, 77, 81, 0, 84, 0, 0, 0,
        72, 0, 76, 0, 79, 0, 76, 0, 72, 76, 79, 0, 84, 0, 83, 0],
      bass: ['r', 0, 'r', 0, 'f', 0, 'r', 0, 'r', 0, 'r', 0, 'f', 0, 'o', 0],
      arp: [0, 1, 0, 2, 0, 3, 0, 2, 0, 1, 0, 2, 0, 3, 0, 2],
      kick: [1, 0, 0, 0, 0, 0, 1, 0, 1, 0, 0, 0, 0, 0, 1, 0],
      snare: [0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 1],
      hat: [1, 1, 1, 0, 1, 1, 1, 0, 1, 1, 1, 0, 1, 1, 1, 1]
    }
  };

  function playStep(i, t) {
    var d = theme, total = d.bars * 16, n = i % total, bar = (n / 16) | 0, s = n % 16;
    var sd = 60 / (d.bpm * tempo) / 4, ch = d.chords[bar];
    var note = d.lead[n];
    if (note) {
      var len = 1;
      while (len < 4 && n + len < total && !d.lead[n + len]) len++;
      osc(d.leadType, mtof(note), mtof(note), t, sd * len * 0.92, d.leadVol, musicBus, 0.006);
      if (d.doubled || starMode) osc('triangle', mtof(note + (starMode ? 12 : -12)), mtof(note + (starMode ? 12 : -12)), t, sd * len * 0.92, d.leadVol * 0.8, musicBus, 0.006);
    }
    var bp = d.bass[s];
    if (bp) {
      var bn = bp === 'r' ? ch[0] : bp === 'f' ? ch[0] + 7 : ch[0] + 12;
      osc('triangle', mtof(bn), mtof(bn), t, sd * 1.9, d.bassVol, musicBus, 0.004);
    }
    var ap = d.arp[s];
    if (ap) {
      var an = ch[(ap - 1) % 3] + 12;
      osc('square', mtof(an), mtof(an), t, sd * 1.4, d.arpVol, musicBus, 0.004);
    }
    if (d.kick[s]) { osc('sine', 160, 42, t, 0.13, 0.5, musicBus, 0.002); }
    if (d.snare[s]) { noise(t, 0.12, 0.17, musicBus, 'highpass', 1800, 2500); osc('triangle', 200, 120, t, 0.07, 0.1, musicBus, 0.002); }
    if (d.hat[s]) { noise(t, 0.03, (s % 4 === 2 ? 0.11 : 0.07), musicBus, 'highpass', 7500, 9000); }
    if (starMode && s % 2 === 0) noise(t, 0.025, 0.06, musicBus, 'highpass', 9000, 9500);
  }
  function tick() {
    if (!AC || !theme) return;
    var guard = 0;
    while (nextT < AC.currentTime + 0.18 && guard++ < 16) {
      playStep(step, nextT);
      nextT += 60 / (theme.bpm * tempo) / 4;
      step++;
    }
  }
  function startTheme(name) {
    if (!AC) return;
    theme = THEMES[name] || THEMES.day;
    step = 0; nextT = AC.currentTime + 0.06;
    if (!timer) timer = setInterval(tick, 40);
  }

  W.audio = {
    init: init,
    sfx: sfx,
    music: function (name) { want = name; if (AC) startTheme(name); },
    stop: function () { want = null; theme = null; },
    pause: function (p) { if (!AC) return; try { if (p) AC.suspend(); else AC.resume(); } catch (e) {} },
    setMuted: function (m) { muted = !!m; applyGain(); try { localStorage.setItem('wassel-muted', muted ? '1' : '0'); } catch (e) {} },
    isMuted: function () { return muted; },
    setVolume: function (v) { vol = Math.min(1, Math.max(0, +v || 0)); applyGain(); try { localStorage.setItem('wassel-vol', String(vol)); } catch (e) {} },
    getVolume: function () { return vol; },
    setStar: function (on) { starMode = on; tempo = starMode ? 1.3 : (hurryOn ? 1.22 : 1); },
    hurry: function (on) { hurryOn = on; tempo = starMode ? 1.3 : (hurryOn ? 1.22 : 1); }
  };
})();
