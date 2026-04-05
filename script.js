const state = {
  staged: false,
  started: false,
  greenAt: 0,
  waitingForLaunch: false,
  locked: false,
  best: null,
  last: null,
  wins: 0,
  results: [],
  opponent: null,
  timers: [],
  view: 'windshield'
};

const els = {
  resultPill: document.getElementById('resultPill'),
  dashMessage: document.getElementById('dashMessage'),
  launchButton: document.getElementById('launchButton'),
  resetButton: document.getElementById('resetButton'),
  lastReaction: document.getElementById('lastReaction'),
  bestReaction: document.getElementById('bestReaction'),
  avgReaction: document.getElementById('avgReaction'),
  winCount: document.getElementById('winCount'),
  opponentReaction: document.getElementById('opponentReaction'),
  playerBar: document.getElementById('playerBar'),
  opponentBar: document.getElementById('opponentBar'),
  raceScene: document.getElementById('raceScene'),
  opponentCar: document.getElementById('opponentCar'),
  shiftLight: document.getElementById('shiftLight'),
  tachNeedle: document.getElementById('tachNeedle'),
  speedNeedle: document.getElementById('speedNeedle'),
  tachArc: document.getElementById('tachArc'),
  speedArc: document.getElementById('speedArc'),
  bulbs: {
    prestage: document.getElementById('prestageBulb'),
    stage: document.getElementById('stageBulb'),
    red1: document.getElementById('red1'),
    red2: document.getElementById('red2'),
    red3: document.getElementById('red3'),
    yellow1: document.getElementById('yellow1'),
    yellow2: document.getElementById('yellow2'),
    green: document.getElementById('green'),
    foul: document.getElementById('foul')
  },
  viewButtons: [...document.querySelectorAll('.view-btn')]
};

function formatReaction(ms) {
  if (ms == null || Number.isNaN(ms)) return '--';
  return `.${String(Math.max(0, Math.round(ms))).padStart(3, '0')}`;
}

function clearTimers() {
  state.timers.forEach(clearTimeout);
  state.timers = [];
}

function setPill(text, kind = 'ready') {
  els.resultPill.textContent = text;
  els.resultPill.className = `pill result-pill ${kind}`;
}

function toggleBulb(name, on) {
  els.bulbs[name].classList.toggle('on', on);
}

function resetBulbs() {
  Object.keys(els.bulbs).forEach(name => toggleBulb(name, false));
}

function setGauge(needleEl, arcEl, amount) {
  const clamped = Math.max(0, Math.min(1, amount));
  const deg = -72 + clamped * 144;
  needleEl.style.transform = `rotate(${deg}deg)`;
  arcEl.style.strokeDashoffset = `${142 - 71 - clamped * 71}`;
}

function animateIdleDash() {
  let start = performance.now();
  function tick(now) {
    if (state.started || state.locked) return;
    const pulse = (Math.sin((now - start) / 260) + 1) / 2;
    setGauge(els.tachNeedle, els.tachArc, 0.24 + pulse * 0.06);
    setGauge(els.speedNeedle, els.speedArc, 0.08);
    requestAnimationFrame(tick);
  }
  requestAnimationFrame(tick);
}

function setView(view) {
  state.view = view;
  els.raceScene.classList.remove('view-windshield', 'view-dash', 'view-hood');
  els.raceScene.classList.add(`view-${view}`);
  els.viewButtons.forEach(btn => btn.classList.toggle('active', btn.dataset.view === view));
}

function stage() {
  clearTimers();
  resetBulbs();
  state.staged = true;
  state.started = false;
  state.waitingForLaunch = false;
  state.locked = false;
  state.greenAt = 0;
  state.opponent = null;
  els.opponentCar.style.transform = 'translateX(-50%) translateY(0)';
  els.playerBar.style.width = '0%';
  els.opponentBar.style.width = '0%';
  els.opponentReaction.textContent = '.---';
  els.dashMessage.innerHTML = 'Tap <span>Launch</span> when green';
  toggleBulb('prestage', true);
  toggleBulb('stage', true);
  els.shiftLight.classList.remove('on');
  setPill('Ready to race', 'ready');
  setGauge(els.tachNeedle, els.tachArc, 0.25);
  setGauge(els.speedNeedle, els.speedArc, 0.05);
  animateIdleDash();

  const startDelay = 700 + Math.random() * 900;
  state.timers.push(setTimeout(beginSequence, startDelay));
}

function beginSequence() {
  if (state.locked) return;
  state.started = true;
  state.waitingForLaunch = true;
  els.dashMessage.innerHTML = 'Watch the tree';
  setPill('Tree is live', 'ready');

  const steps = [
    ['red1', 0],
    ['red2', 180],
    ['red3', 360],
    ['yellow1', 540],
    ['yellow2', 710],
  ];

  steps.forEach(([bulb, time], index) => {
    state.timers.push(setTimeout(() => {
      toggleBulb(bulb, true);
      if (index >= 2) {
        els.shiftLight.classList.add('on');
        setGauge(els.tachNeedle, els.tachArc, 0.48 + index * 0.08);
      }
    }, time));
  });

  const greenDelay = 910;
  state.timers.push(setTimeout(() => {
    state.greenAt = performance.now();
    toggleBulb('green', true);
    els.shiftLight.classList.remove('on');
    els.dashMessage.innerHTML = 'GO GO GO';
    setPill('GO', 'win');
    flash('green');
    vibrate([50]);
    state.opponent = Math.round(85 + Math.random() * 155); // arcade fast
    els.opponentReaction.textContent = formatReaction(state.opponent);
    launchOpponent(state.opponent);
    setGauge(els.tachNeedle, els.tachArc, 0.88);
    setGauge(els.speedNeedle, els.speedArc, 0.44);
  }, greenDelay));
}

function launchOpponent(reactionMs) {
  state.timers.push(setTimeout(() => {
    els.opponentCar.style.transform = 'translateX(-50%) translateY(-72px) scale(0.9)';
    els.opponentBar.style.width = `${Math.max(55, 100 - reactionMs / 4)}%`;
  }, reactionMs));
}

function launchPlayer() {
  if (!state.staged || state.locked) return;

  if (!state.greenAt) {
    foulStart();
    return;
  }

  const reaction = performance.now() - state.greenAt;
  finishRun(reaction);
}

function foulStart() {
  state.locked = true;
  state.waitingForLaunch = false;
  toggleBulb('foul', true);
  setPill('Red light', 'loss');
  els.dashMessage.innerHTML = 'Too soon <span>foul start</span>';
  els.lastReaction.textContent = 'FOUL';
  flash('red');
  vibrate([120, 50, 120]);
  els.playerBar.style.width = '12%';
  if (!state.opponent) {
    state.opponent = Math.round(85 + Math.random() * 155);
    els.opponentReaction.textContent = formatReaction(state.opponent);
    launchOpponent(state.opponent);
  }
  state.timers.push(setTimeout(() => {
    setGauge(els.tachNeedle, els.tachArc, 0.22);
    setGauge(els.speedNeedle, els.speedArc, 0.02);
  }, 300));
}

function finishRun(reaction) {
  state.locked = true;
  state.waitingForLaunch = false;
  state.last = Math.round(reaction);
  state.results.push(state.last);
  state.best = state.best == null ? state.last : Math.min(state.best, state.last);

  const avg = Math.round(state.results.reduce((a, b) => a + b, 0) / state.results.length);
  const win = state.last <= state.opponent;
  if (win) state.wins += 1;

  els.lastReaction.textContent = formatReaction(state.last);
  els.bestReaction.textContent = formatReaction(state.best);
  els.avgReaction.textContent = formatReaction(avg);
  els.winCount.textContent = String(state.wins);
  els.playerBar.style.width = `${Math.max(50, 100 - state.last / 4)}%`;
  els.opponentBar.style.width = `${Math.max(50, 100 - state.opponent / 4)}%`;

  els.dashMessage.innerHTML = win
    ? 'You left on <span>them</span>'
    : 'Other lane got the <span>jump</span>';
  setPill(win ? 'Win light' : 'Lost the hit', win ? 'win' : 'loss');
  setGauge(els.tachNeedle, els.tachArc, 0.92);
  setGauge(els.speedNeedle, els.speedArc, 0.72);

  if (state.last < 40) {
    els.dashMessage.innerHTML = 'Killer <span>light</span>';
  }

  state.timers.push(setTimeout(() => {
    els.playerBar.style.width = `${Math.max(58, 100 - state.last / 6)}%`;
    els.opponentBar.style.width = `${Math.max(58, 100 - state.opponent / 6)}%`;
  }, 250));
}

function flash(kind) {
  document.body.classList.remove('green-flash', 'red-flash');
  void document.body.offsetWidth;
  document.body.classList.add(`${kind}-flash`);
  setTimeout(() => document.body.classList.remove(`${kind}-flash`), 280);
}

function vibrate(pattern) {
  if (navigator.vibrate) navigator.vibrate(pattern);
}

els.launchButton.addEventListener('click', launchPlayer);
els.resetButton.addEventListener('click', stage);
document.addEventListener('keydown', (e) => {
  if (e.code === 'Space') {
    e.preventDefault();
    launchPlayer();
  }
  if (e.key === '1') setView('windshield');
  if (e.key === '2') setView('dash');
  if (e.key === '3') setView('hood');
});
els.raceScene.addEventListener('click', launchPlayer);
els.viewButtons.forEach(btn => btn.addEventListener('click', () => setView(btn.dataset.view)));

setView('windshield');
stage();
