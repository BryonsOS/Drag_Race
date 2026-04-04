const scene = document.querySelector('.scene');
const headline = document.getElementById('headline');
const subline = document.getElementById('subline');
const rating = document.getElementById('rating');
const launchMode = document.getElementById('launchMode');
const actionButton = document.getElementById('actionButton');

const lastReactionEl = document.getElementById('lastReaction');
const bestReactionEl = document.getElementById('bestReaction');
const avgReactionEl = document.getElementById('avgReaction');
const runCountEl = document.getElementById('runCount');
const rpmNeedle = document.getElementById('rpmNeedle');
const mphNeedle = document.getElementById('mphNeedle');
const rpmValue = document.getElementById('rpmValue');
const mphValue = document.getElementById('mphValue');

const lights = {
  pre: document.querySelector('[data-light="pre"]'),
  stage: document.querySelector('[data-light="stage"]'),
  r1: document.querySelector('[data-light="r1"]'),
  r2: document.querySelector('[data-light="r2"]'),
  r3: document.querySelector('[data-light="r3"]'),
  y1: document.querySelector('[data-light="y1"]'),
  y2: document.querySelector('[data-light="y2"]'),
  g: document.querySelector('[data-light="g"]'),
};

const STORAGE_KEY = 'sick-off-the-line-v2-stats';
let state = 'idle';
let timeouts = [];
let greenAt = null;
let stats = loadStats();
let rpmTicker = null;

function loadStats() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { runs: [] };
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed.runs) ? parsed : { runs: [] };
  } catch {
    return { runs: [] };
  }
}

function saveStats() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(stats));
}

function setMessage(main, detail, tag) {
  headline.textContent = main;
  subline.textContent = detail;
  rating.textContent = tag;
}

function schedule(fn, delay) {
  const id = setTimeout(fn, delay);
  timeouts.push(id);
}

function clearAllTimers() {
  timeouts.forEach(clearTimeout);
  timeouts = [];
}

function clearFlash() {
  scene.classList.remove('green-flash', 'red-flash', 'launching');
}

function resetLights() {
  Object.values(lights).forEach(light => light.classList.remove('active'));
}

function setNeedle(el, percent) {
  const min = -130;
  const max = 50;
  const angle = min + (max - min) * percent;
  el.style.transform = `rotate(${angle}deg)`;
}

function setCockpit(rpm, mph) {
  const rpmPercent = Math.min(Math.max((rpm - 0) / 8000, 0), 1);
  const mphPercent = Math.min(Math.max(mph / 160, 0), 1);
  setNeedle(rpmNeedle, rpmPercent);
  setNeedle(mphNeedle, mphPercent);
  rpmValue.textContent = String(Math.round(rpm));
  mphValue.textContent = String(Math.round(mph));
}

function startIdleGaugeAnimation() {
  stopIdleGaugeAnimation();
  let tick = 0;
  rpmTicker = setInterval(() => {
    if (!['idle', 'result', 'foul'].includes(state)) return;
    tick += 0.09;
    const rpm = 2900 + Math.sin(tick) * 280 + Math.cos(tick * 0.7) * 90;
    setCockpit(rpm, 0);
  }, 50);
}

function stopIdleGaugeAnimation() {
  if (rpmTicker) {
    clearInterval(rpmTicker);
    rpmTicker = null;
  }
}

function flash(kind) {
  clearFlash();
  scene.classList.add(kind === 'green' ? 'green-flash' : 'red-flash');
  setTimeout(() => clearFlash(), 130);
}

function formatReaction(seconds) {
  return `${seconds.toFixed(3)}s`;
}

function averageReaction() {
  if (!stats.runs.length) return null;
  const sum = stats.runs.reduce((acc, value) => acc + value, 0);
  return sum / stats.runs.length;
}

function bestReaction() {
  if (!stats.runs.length) return null;
  return Math.min(...stats.runs);
}

function updateStatsUI() {
  const best = bestReaction();
  const avg = averageReaction();
  const last = stats.runs.at(-1) ?? null;

  lastReactionEl.textContent = last === null ? '--' : formatReaction(last);
  bestReactionEl.textContent = best === null ? '--' : formatReaction(best);
  avgReactionEl.textContent = avg === null ? '--' : formatReaction(avg);
  runCountEl.textContent = String(stats.runs.length);
}

function stageLampsOn() {
  lights.pre.classList.add('active');
  lights.stage.classList.add('active');
}

function scoreLabel(reaction) {
  if (reaction <= 0.06) return 'PRO TREE MONSTER';
  if (reaction <= 0.11) return 'CUT A LIGHT';
  if (reaction <= 0.18) return 'STRONG STREET LEAVE';
  if (reaction <= 0.26) return 'GOOD HIT';
  return 'KEEP PRACTICING';
}

function setLaunchMode(text) {
  launchMode.textContent = text;
}

function animateLaunch() {
  scene.classList.add('launching');
  let frame = 0;
  const totalFrames = 16;
  const interval = setInterval(() => {
    frame += 1;
    const progress = frame / totalFrames;
    const rpm = 6200 - progress * 2300;
    const mph = progress * 38;
    setCockpit(rpm, mph);
    if (frame >= totalFrames) {
      clearInterval(interval);
      scene.classList.remove('launching');
      if (['idle', 'result', 'foul'].includes(state)) startIdleGaugeAnimation();
    }
  }, 30);
}

function stageSequence() {
  clearAllTimers();
  clearFlash();
  resetLights();
  stopIdleGaugeAnimation();

  state = 'countdown';
  greenAt = null;
  setLaunchMode('ARMED');
  setCockpit(3400, 0);
  setMessage('Stage Deep', 'Watch the tree drop. Hit it on green.', 'Race Ready');

  stageLampsOn();

  const base = 700 + Math.random() * 900;
  const step = 420;

  schedule(() => {
    lights.r1.classList.add('active');
    setCockpit(3700, 0);
  }, base);

  schedule(() => {
    lights.r2.classList.add('active');
    setCockpit(4050, 0);
  }, base + step);

  schedule(() => {
    lights.r3.classList.add('active');
    setCockpit(4450, 0);
  }, base + step * 2);

  schedule(() => {
    lights.y1.classList.add('active');
    setCockpit(5100, 0);
  }, base + step * 3);

  schedule(() => {
    lights.y2.classList.add('active');
    setCockpit(5600, 0);
  }, base + step * 4);

  schedule(() => {
    resetLights();
    stageLampsOn();
    lights.g.classList.add('active');
    greenAt = performance.now();
    state = 'green';
    setLaunchMode('GO');
    flash('green');
    setMessage('GO GO GO', 'Leave now. Your reaction time starts on green.', 'Launch');
    setCockpit(6100, 0);
  }, base + step * 5);
}

function foulStart() {
  clearAllTimers();
  state = 'foul';
  resetLights();
  stageLampsOn();
  lights.r1.classList.add('active');
  lights.r2.classList.add('active');
  lights.r3.classList.add('active');
  setLaunchMode('FOUL');
  setMessage('Red Light', 'Too early. Tap again to restage.', 'Foul Start');
  lastReactionEl.textContent = 'FOUL';
  flash('red');
  setCockpit(2500, 0);
  startIdleGaugeAnimation();
}

function finishRun() {
  if (greenAt === null) return;
  const reaction = (performance.now() - greenAt) / 1000;
  state = 'result';
  stats.runs.push(reaction);
  saveStats();
  updateStatsUI();
  setLaunchMode('COMPLETE');

  const best = bestReaction();
  const label = scoreLabel(reaction);
  const isBest = best !== null && Math.abs(best - reaction) < 0.0005;

  setMessage(
    isBest ? 'New Best' : 'Nice Leave',
    `Reaction: ${formatReaction(reaction)}. ${isBest ? 'Fastest run yet.' : 'Tap to run it back.'}`,
    label
  );

  animateLaunch();
  schedule(() => startIdleGaugeAnimation(), 620);
}

function handleAction() {
  if (state === 'idle' || state === 'result' || state === 'foul') {
    stageSequence();
    return;
  }

  if (state === 'countdown') {
    foulStart();
    return;
  }

  if (state === 'green') {
    finishRun();
  }
}

function handleKey(event) {
  if (event.code === 'Space' || event.code === 'Enter') {
    event.preventDefault();
    handleAction();
  }
}

actionButton.addEventListener('click', handleAction);
actionButton.addEventListener('touchstart', (event) => {
  event.preventDefault();
  handleAction();
}, { passive: false });
window.addEventListener('keydown', handleKey);

updateStatsUI();
setMessage('Tap to stage', 'Tap anywhere, click, or press space. Leave when the tree turns green.', 'Street Car Ready');
stageLampsOn();
setLaunchMode('STAGED');
setCockpit(3200, 0);
startIdleGaugeAnimation();
