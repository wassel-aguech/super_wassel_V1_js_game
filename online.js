/* Super Wassel — présence en ligne via Supabase Realtime Presence */
(function () {
  'use strict';

  var URL = 'https://csxtwwonaluitkomeysd.supabase.co';
  var KEY = 'sb_publishable_4VBYUbBL9zEmRi6ndJz25w_RT-IjFZm';

  var stats = document.getElementById('onlineStats');
  var onlineEl = document.getElementById('onlineCount');
  var playingEl = document.getElementById('playingCount');

  if (!stats || !onlineEl || !playingEl || !window.supabase || !window.supabase.createClient) {
    if (stats) stats.title = 'Presence indisponible';
    return;
  }

  var client = window.supabase.createClient(URL, KEY);
  var playerId;

  try {
    playerId = sessionStorage.getItem('superwassel-player-id');
    if (!playerId) {
      playerId = (window.crypto && crypto.randomUUID)
        ? crypto.randomUUID()
        : 'player-' + Math.random().toString(36).slice(2) + Date.now().toString(36);
      sessionStorage.setItem('superwassel-player-id', playerId);
    }
  } catch (e) {
    playerId = 'player-' + Math.random().toString(36).slice(2) + Date.now().toString(36);
  }

  var playing = false;
  var channel = client.channel('super-wassel-presence', {
    config: { presence: { key: playerId } }
  });

  function updateCounts() {
    var state = channel.presenceState() || {};
    var players = {};

    Object.keys(state).forEach(function (key) {
      (state[key] || []).forEach(function (entry) {
        var p = entry && entry.payload ? entry.payload : entry;
        if (!p || !p.player_id || p.visible === false) return;
        players[p.player_id] = p;
      });
    });

    var online = Object.keys(players).length;
    var active = Object.keys(players).filter(function (id) {
      return players[id].playing === true;
    }).length;

    onlineEl.textContent = String(online);
    playingEl.textContent = String(active);
    stats.setAttribute('aria-label', online + ' joueurs en ligne, ' + active + ' en jeu');
  }

  function trackPresence() {
    if (channel.state !== 'joined') return;

    channel.track({
      player_id: playerId,
      playing: playing,
      visible: !document.hidden,
      joined_at: new Date().toISOString()
    }).catch(function (err) {
      console.warn('[Super Wassel Presence]', err && err.message ? err.message : err);
    });
  }

  channel
    .on('presence', { event: 'sync' }, updateCounts)
    .on('presence', { event: 'join' }, updateCounts)
    .on('presence', { event: 'leave' }, updateCounts)
    .subscribe(function (status) {
      if (status === 'SUBSCRIBED') trackPresence();
    });

  window.WASSELOnline = {
    setPlaying: function (value) {
      value = value === true;
      if (playing === value) return;
      playing = value;
      trackPresence();
    }
  };

  document.addEventListener('visibilitychange', trackPresence);

  window.addEventListener('pagehide', function () {
    playing = false;
    try { channel.untrack(); } catch (e) {}
  });
})();