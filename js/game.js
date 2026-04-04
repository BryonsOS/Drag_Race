const scene = document.getElementById('scene');
const headline = document.getElementById('headline');
const subline = document.getElementById('subline');
const rating = document.getElementById('rating');
const launchMode = document.getElementById('launchMode');
const actionButton = document.getElementById('actionButton');
const viewButtons = document.querySelectorAll('.view-btn');
const mobilePrompt = document.getElementById('mobilePrompt');

const lastReactionEl = document.getElementById('lastReaction');
const bestReactionEl = document.getElementById('bestReaction');
const avgReactionEl = document.getElementById('avgReaction');
const runCountEl = document.getElementById('runCount');
const rpmNeedle = document.getElementById('rpmNeedle');
const mphNeedle = document.getElementById('mphNeedle');
const rpmValue = document.getElementById('rpmValue');
const mphValue = document.getElementById('mphValue');
const leftBoard = document.getElementById('leftBoard');
const rightBoard = document.getElementById('rightBoard');

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

const STORAGE_KEY = 'sick-off-the-line-v6-stats';
const VIEW_KEY = 'sick-off-the-line-v6-view';

let state = 'idle';
let greenAt = null;
let timeouts = [];
let gaugeInterval = null;
let stats = loadStats();

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

function schedule(callback, delay) {
  const id = window.setTimeout(callback, delay);
  timeouts.push(id);
}

function clearTimers() {
  timeouts.forEach(window.clearTimeout);
  timeouts = [];
}

function resetLights() {
  Object.values(lights).forEach((light) => light.classList.remove('active'));
}

function stageLampsOn() {
  lights.pre.classList.add('active');
  lights.stage.classList.add('active');
}

function setMessage(main, detail, tag) {
  headline.textContent = main;
  subline.textContent = detail;
  rating.textContent = tag;
}

function setLaunchMode(text) {
  launchMode.textContent = text;
}

function updateBoards(rt = '.---', mph = '000') {
  leftBoard.textContent = rt;
  rightBoard.textContent = mph;
}

function setNeedle(element, percent) {
  const min = -130;
  const max = 50;
  const angle = min + (max - min) * Math.max(0, Math.min(1, percent));
  element.style.transform = `translateX(-50%) rotate(${angle}deg)`;
}

function setCockpit(rpm, mph) {
  setNeedle(rpmNeedle, rpm / 8000);
  setNeedle(mphNeedle, mph / 160);
  rpmValue.textContent = String(Math.round(rpm));
  mphValue.textContent = String(Math.round(mph));
}

function stopGaugeAnimation() {
  if (gaugeInterval) {
    window.clearInterval(gaugeInterval);
    gaugeInterval = null;
  }
}

function startIdleGaugeAnimation() {
  stopGaugeAnimation();
  let t = 0;
  gaugeInterval = window.setInterval(() => {
    if (!['idle', 'result', 'foul'].includes(state)) return;
    t += 0.08;
    const rpm = 3050 + Math.sin(t) * 220 + Math.cos(t * 0.55) * 90;
    setCockpit(rpm, 0);
  }, 50);
}

function updateStatsUI() {
  const runs = stats.runs;
  const best = runs.length ? Math.min(...runs) : null;
  const avg = runs.length ? runs.reduce((sum, run) => sum + run, 0) / runs.length : null;
  const last = runs.length ? runs[runs.length - 1] : null;

  lastReactionEl.textContent = last === null ? '--' : `${last.toFixed(3)}s`;
  bestReactionEl.textContent = best === null ? '--' : `${best.toFixed(3)}s`;
  avgReactionEl.textContent = avg === null ? '--' : `${avg.toFixed(3)}s`;
  runCountEl.textContent = String(runs.length);
}

function reactionLabel(reaction) {
  if (reaction <= 0.06) return 'Monster Light';
  if (reaction <= 0.10) return 'Sharp Leave';
  if (reaction <= 0.16) return 'Strong Street Hit';
  if (reaction <= 0.24) return 'Good Reaction';
  return 'Run It Back';
}

function clearFlash() {
  scene.classList.remove('green-flash', 'red-flash', 'launching');
}

function flash(color) {
  clearFlash();
  scene.classList.add(color === 'green' ? 'green-flash' : 'red-flash');
  window.setTimeout(() => clearFlash(), 150);
}

function animateLaunch() {
  scene.classList.add('launching');
  let frame = 0;
  const totalFrames = 18;
  const interval = window.setInterval(() => {
    frame += 1;
    const progress = frame / totalFrames;
    const rpm = 6300 - progress * 2500;
    const mph = progress * 42;
    setCockpit(rpm, mph);
    if (frame >= totalFrames) {
      window.clearInterval(interval);
      scene.classList.remove('launching');
      if (['idle', 'result', 'foul'].includes(state)) startIdleGaugeAnimation();
    }
  }, 28);
}

function foulStart() {
  clearTimers();
  state = 'foul';
  greenAt = null;
  resetLights();
  stageLampsOn();
  lights.r1.classList.add('active');
  lights.r2.classList.add('active');
  lights.r3.classList.add('active');
  setLaunchMode('FOUL');
  setMessage('Red Light', 'Too early. Tap again to stage and try another leave.', 'Foul Start');
  updateBoards('FOUL', '000');
  lastReactionEl.textContent = 'FOUL';
  setCockpit(2500, 0);
  flash('red');
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

  const best = Math.min(...stats.runs);
  const isBest = Math.abs(best - reaction) < 0.0005;
  const mph = Math.max(18, Math.min(44, Math.round(27 + (0.24 - Math.min(reaction, 0.24)) * 145)));

  updateBoards(`${reaction.toFixed(3)}s`, String(mph));
  setMessage(
    isBest ? 'New Best Light' : 'Clean Leave',
    `Reaction: ${reaction.toFixed(3)}s. ${isBest ? 'That is your quickest hit yet.' : 'Tap again and chase a better light.'}`,
    reactionLabel(reaction)
  );

  animateLaunch();
  schedule(() => startIdleGaugeAnimation(), 620);
}

function stageSequence() {
  clearTimers();
  clearFlash();
  stopGaugeAnimation();
  resetLights();
  stageLampsOn();

  state = 'countdown';
  greenAt = null;
  setLaunchMode('ARMED');
  setMessage('Stage Deep', 'Tree is armed. Stay patient and hit green.', 'Race Ready');
  updateBoards('.---', '000');
  setCockpit(3500, 0);

  const base = 700 + Math.random() * 850;
  const step = 400;

  schedule(() => { lights.r1.classList.add('active'); setCockpit(3900, 0); }, base);
  schedule(() => { lights.r2.classList.add('active'); setCockpit(4300, 0); }, base + step);
  schedule(() => { lights.r3.classList.add('active'); setCockpit(4700, 0); }, base + step * 2);
  schedule(() => { lights.y1.classList.add('active'); setCockpit(5250, 0); }, base + step * 3);
  schedule(() => { lights.y2.classList.add('active'); setCockpit(5750, 0); }, base + step * 4);
  schedule(() => {
    resetLights();
    stageLampsOn();
    lights.g.classList.add('active');
    greenAt = performance.now();
    state = 'green';
    setLaunchMode('GO');
    setMessage('GO GO GO', 'Leave now. Reaction time starts on green.', 'Launch');
    setCockpit(6200, 0);
    flash('green');
  }, base + step * 5);
}

function setView(view) {
  const allowed = ['cockpit', 'hood', 'wide'];
  const next = allowed.includes(view) ? view : 'cockpit';
  scene.classList.remove('view-cockpit', 'view-hood', 'view-wide');
  scene.classList.add(`view-${next}`);
  viewButtons.forEach((button) => button.classList.toggle('active', button.dataset.view === next));
  localStorage.setItem(VIEW_KEY, next);
}

function applyResponsiveDefaults() {
  const portrait = window.matchMedia('(max-width: 820px) and (orientation: portrait)').matches;
  if (mobilePrompt) {
    mobilePrompt.style.display = portrait ? 'block' : '';
  }
  const savedView = localStorage.getItem(VIEW_KEY);
  if (!savedView && portrait) {
    setView('hood');
  }
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
  if (event.code === 'Digit1') setView('cockpit');
  if (event.code === 'Digit2') setView('hood');
  if (event.code === 'Digit3') setView('wide');
}

actionButton.addEventListener('click', handleAction);
actionButton.addEventListener('touchstart', (event) => {
  event.preventDefault();
  handleAction();
}, { passive: false });
window.addEventListener('keydown', handleKey);
viewButtons.forEach((button) => button.addEventListener('click', () => setView(button.dataset.view)));
window.addEventListener('resize', applyResponsiveDefaults);
window.addEventListener('orientationchange', applyResponsiveDefaults);

updateStatsUI();
setMessage('Tap to stage', 'Tap, click, or press space. The tree drops 3 red, 2 yellow, then green.', 'Street Car Ready');
setLaunchMode('STAGED');
stageLampsOn();
updateBoards('.---', '000');
setCockpit(3200, 0);
startIdleGaugeAnimation();
setView(localStorage.getItem(VIEW_KEY) || 'cockpit');
applyResponsiveDefaults();
