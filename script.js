const state = {
  running: false,
  canLaunch: false,
  greenAt: 0,
  results: [],
  timers: [],
  view: 'windshield'
};

const lamps = {
  reds: [...document.querySelectorAll('.lamp.red')],
  ambers: [...document.querySelectorAll('.lamp.amber')],
  green: document.querySelector('.lamp.green')
};

const scene = document.getElementById('scene');
const statusText = document.getElementById('statusText');
const reactionDisplay = document.getElementById('reactionDisplay');
const rpmNeedle = document.getElementById('rpmNeedle');
const startBtn = document.getElementById('startBtn');
const launchBtn = document.getElementById('launchBtn');
const resetBtn = document.getElementById('resetBtn');
const lastStat = document.getElementById('lastStat');
const bestStat = document.getElementById('bestStat');
const avgStat = document.getElementById('avgStat');
const runsStat = document.getElementById('runsStat');

function clearTimers() {
  state.timers.forEach(clearTimeout);
  state.timers = [];
}

function resetLights() {
  [...lamps.reds, ...lamps.ambers, lamps.green].forEach(l => l.classList.remove('active'));
}

function setStatus(message) {
  statusText.textContent = message;
}

function setNeedle(deg) {
  rpmNeedle.style.transform = `rotate(${deg}deg)`;
}

function setLaunchButton(mode = 'idle') {
  launchBtn.classList.remove('ready', 'go', 'foul');
  if (mode === 'ready') launchBtn.classList.add('ready');
  if (mode === 'go') launchBtn.classList.add('go');
  if (mode === 'foul') launchBtn.classList.add('foul');
}

function formatTime(ms) {
  return `${(ms / 1000).toFixed(3)} s`;
}

function updateStats() {
  runsStat.textContent = state.results.length;
  if (!state.results.length) {
    lastStat.textContent = bestStat.textContent = avgStat.textContent = '—';
    return;
  }
  const last = state.results[state.results.length - 1];
  const best = Math.min(...state.results);
  const avg = state.results.reduce((a, b) => a + b, 0) / state.results.length;
  lastStat.textContent = formatTime(last);
  bestStat.textContent = formatTime(best);
  avgStat.textContent = formatTime(avg);
}

function finishRun(resultMs, message) {
  state.running = false;
  state.canLaunch = false;
  state.results.push(resultMs);
  reactionDisplay.textContent = formatTime(resultMs);
  setStatus(message);
  setNeedle(-70);
  setLaunchButton('idle');
  updateStats();
}

function foulStart() {
  clearTimers();
  resetLights();
  lamps.reds.forEach(l => l.classList.add('active'));
  state.running = false;
  state.canLaunch = false;
  reactionDisplay.textContent = 'FOUL';
  setStatus('Red light. Too early — wait for green.');
  setNeedle(95);
  setLaunchButton('foul');
}

function launch() {
  if (!state.running) return;
  if (!state.canLaunch) {
    foulStart();
    return;
  }
  const reaction = performance.now() - state.greenAt;
  resetLights();
  lamps.green.classList.add('active');
  finishRun(reaction, reaction < 180 ? 'Great light. You were quick off the line.' : 'Clean launch. Try to cut it even tighter.');
}

function runSequence() {
  clearTimers();
  resetLights();
  state.running = true;
  state.canLaunch = false;
  reactionDisplay.textContent = '0.000 s';
  setStatus('Tree is armed. Wait for green.');
  setNeedle(15);
  setLaunchButton('ready');

  const steps = [
    () => { lamps.reds[0].classList.add('active'); setNeedle(35); },
    () => { lamps.reds[1].classList.add('active'); setNeedle(45); },
    () => { lamps.reds[2].classList.add('active'); setNeedle(55); },
    () => { lamps.ambers[0].classList.add('active'); setNeedle(70); },
    () => { lamps.ambers[1].classList.add('active'); setNeedle(82); },
    () => {
      resetLights();
      lamps.green.classList.add('active');
      state.canLaunch = true;
      state.greenAt = performance.now();
      setStatus('GO! Tap now.');
      setNeedle(105);
      setLaunchButton('go');
    }
  ];

  let delay = 350;
  steps.forEach(step => {
    state.timers.push(setTimeout(step, delay));
    delay += step === steps[5] ? 0 : 340;
  });

  state.timers.push(setTimeout(() => {
    if (state.running && state.canLaunch) {
      state.running = false;
      state.canLaunch = false;
      setStatus('Missed the launch. Hit Start Run to try again.');
      setLaunchButton('idle');
      setNeedle(-70);
    }
  }, delay + 2500));
}

function resetAll() {
  clearTimers();
  resetLights();
  state.running = false;
  state.canLaunch = false;
  state.results = [];
  reactionDisplay.textContent = '0.000 s';
  setStatus('Tap Start, then hit GO on green.');
  setNeedle(-110);
  setLaunchButton('idle');
  updateStats();
}

function setView(view) {
  state.view = view;
  scene.classList.remove('view-windshield', 'view-dash', 'view-hood');
  scene.classList.add(`view-${view}`);
  document.querySelectorAll('.view-btn').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.view === view);
  });
}

startBtn.addEventListener('click', runSequence);
launchBtn.addEventListener('click', launch);
resetBtn.addEventListener('click', resetAll);

document.querySelectorAll('.view-btn').forEach(btn => {
  btn.addEventListener('click', () => setView(btn.dataset.view));
});

window.addEventListener('keydown', (event) => {
  if (event.code === 'Space') {
    event.preventDefault();
    if (state.running) launch();
  }
  if (event.key === '1') setView('windshield');
  if (event.key === '2') setView('dash');
  if (event.key === '3') setView('hood');
});

setView('windshield');
resetAll();
