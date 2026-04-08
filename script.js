const state = {
  staged:false, started:false, greenAt:0, locked:false,
  best:null, last:null, wins:0, results:[], opponent:null, timers:[], view:'windshield'
};

const els = {
  resultPill: document.getElementById('resultPill'),
  dashMessage: document.getElementById('dashMessage'),
  launchButton: document.getElementById('launchButton'),
  resetButton: document.getElementById('resetButton'),
  treeStatus: document.getElementById('treeStatus'),
  tipText: document.getElementById('tipText'),
  lastReaction: document.getElementById('lastReaction'),
  bestReaction: document.getElementById('bestReaction'),
  avgReaction: document.getElementById('avgReaction'),
  winCount: document.getElementById('winCount'),
  opponentReaction: document.getElementById('opponentReaction'),
  playerBar: document.getElementById('playerBar'),
  opponentBar: document.getElementById('opponentBar'),
  raceScene: document.getElementById('raceScene'),
  opponentCar: document.getElementById('opponentCar'),
  tachNeedle: document.getElementById('tachNeedle'),
  speedNeedle: document.getElementById('speedNeedle'),
  tachArc: document.getElementById('tachArc'),
  speedArc: document.getElementById('speedArc'),
  bulbs: {
    prestage: document.getElementById('prestageBulb'), stage: document.getElementById('stageBulb'),
    red1: document.getElementById('red1'), red2: document.getElementById('red2'), red3: document.getElementById('red3'),
    yellow1: document.getElementById('yellow1'), yellow2: document.getElementById('yellow2'), green: document.getElementById('green'), foul: document.getElementById('foul')
  },
  viewButtons:[...document.querySelectorAll('.view-btn')]
};

function formatReaction(ms){ if(ms==null || Number.isNaN(ms)) return '--'; return `.${String(Math.max(0,Math.round(ms))).padStart(3,'0')}`; }
function clearTimers(){ state.timers.forEach(clearTimeout); state.timers=[]; }
function setPill(text, kind='ready'){ els.resultPill.textContent=text; els.resultPill.className=`status-chip ${kind}`; }
function toggleBulb(name,on){ els.bulbs[name].classList.toggle('on',on); }
function resetBulbs(){ Object.keys(els.bulbs).forEach(name=>toggleBulb(name,false)); }
function setGauge(needleEl, arcEl, amount){ const c=Math.max(0,Math.min(1,amount)); const deg=-72+c*144; needleEl.style.transform=`rotate(${deg}deg)`; arcEl.style.strokeDashoffset=`${71-c*71}`; }
function setTreeStatus(text){ if(els.treeStatus) els.treeStatus.textContent=text; }
function setTip(text){ if(els.tipText) els.tipText.textContent=text; }

function animateIdleDash(){
  const start=performance.now();
  function tick(now){
    if(state.started || state.locked) return;
    const pulse=(Math.sin((now-start)/260)+1)/2;
    setGauge(els.tachNeedle, els.tachArc, 0.22+pulse*0.05);
    setGauge(els.speedNeedle, els.speedArc, 0.05);
    requestAnimationFrame(tick);
  }
  requestAnimationFrame(tick);
}

function setView(view){
  state.view=view;
  els.raceScene.classList.remove('view-windshield','view-dash','view-hood');
  els.raceScene.classList.add(`view-${view}`);
  els.viewButtons.forEach(btn=>btn.classList.toggle('active', btn.dataset.view===view));
}

function stage(){
  clearTimers(); resetBulbs(); state.staged=true; state.started=false; state.locked=false; state.greenAt=0; state.opponent=null;
  els.opponentCar.style.transform='translateX(-50%) translateY(0)';
  els.playerBar.style.width='0%'; els.opponentBar.style.width='0%'; els.opponentReaction.textContent='.---';
  els.dashMessage.innerHTML='Tap <span>Launch</span> on green';
  setTreeStatus('Staged');
  setTip('Settle in and wait. The launch button only wins if you hit green, not early.');
  toggleBulb('prestage',true); toggleBulb('stage',true);
  setPill('Ready','ready');
  setGauge(els.tachNeedle, els.tachArc, .22); setGauge(els.speedNeedle, els.speedArc, .05); animateIdleDash();
  const startDelay=650+Math.random()*650;
  state.timers.push(setTimeout(beginSequence,startDelay));
}

function beginSequence(){
  if(state.locked) return;
  state.started=true;
  els.dashMessage.innerHTML='Watch the tree';
  setTreeStatus('Tree live');
  setTip('Stay disciplined. Leaving clean is better than chasing the bulbs and fouling.');
  setPill('Tree live','ready');
  const steps=[['red1',0],['red2',180],['red3',360],['yellow1',540],['yellow2',710]];
  steps.forEach(([bulb,time],index)=>{
    state.timers.push(setTimeout(()=>{
      toggleBulb(bulb,true);
      if(index>=2) setGauge(els.tachNeedle, els.tachArc, 0.46+index*0.09);
    },time));
  });
  state.timers.push(setTimeout(()=>{
    state.greenAt=performance.now();
    toggleBulb('green',true);
    els.dashMessage.innerHTML='GO <span>GO</span>';
    setTreeStatus('Green');
    setTip('Now. Hit it clean and let the other lane react to you.');
    setPill('GO','win');
    flash('green'); vibrate([40]);
    state.opponent=Math.round(90+Math.random()*145);
    els.opponentReaction.textContent=formatReaction(state.opponent);
    launchOpponent(state.opponent);
    setGauge(els.tachNeedle, els.tachArc, .86); setGauge(els.speedNeedle, els.speedArc, .44);
  },910));
}

function launchOpponent(reactionMs){
  state.timers.push(setTimeout(()=>{
    els.opponentCar.style.transform='translateX(-50%) translateY(-82px) scale(.9)';
    els.opponentBar.style.width=`${Math.max(56,100-reactionMs/4)}%`;
  }, reactionMs));
}

function launchPlayer(){
  if(!state.staged || state.locked) return;
  if(!state.greenAt){ foulStart(); return; }
  finishRun(performance.now()-state.greenAt);
}

function foulStart(){
  state.locked=true;
  toggleBulb('foul',true);
  setTreeStatus('Red light');
  setTip('That was early. Restage and try reacting to green instead of anticipating it.');
  setPill('Red light','loss');
  els.dashMessage.innerHTML='Too soon <span>foul</span>';
  els.lastReaction.textContent='FOUL';
  flash('red'); vibrate([100,50,100]);
  els.playerBar.style.width='12%';
  if(!state.opponent){ state.opponent=Math.round(90+Math.random()*145); els.opponentReaction.textContent=formatReaction(state.opponent); launchOpponent(state.opponent); }
  state.timers.push(setTimeout(()=>{ setGauge(els.tachNeedle, els.tachArc, .18); setGauge(els.speedNeedle, els.speedArc, .02); },250));
}

function finishRun(reaction){
  state.locked=true;
  state.last=Math.round(reaction);
  state.results.push(state.last);
  state.best=state.best==null ? state.last : Math.min(state.best,state.last);
  const avg=Math.round(state.results.reduce((a,b)=>a+b,0)/state.results.length);
  const win=state.last <= state.opponent;
  if(win) state.wins += 1;
  els.lastReaction.textContent=formatReaction(state.last);
  els.bestReaction.textContent=formatReaction(state.best);
  els.avgReaction.textContent=formatReaction(avg);
  els.winCount.textContent=String(state.wins);
  els.playerBar.style.width=`${Math.max(56,100-state.last/4)}%`;
  els.opponentBar.style.width=`${Math.max(56,100-state.opponent/4)}%`;
  els.dashMessage.innerHTML=win ? 'You got the <span>hit</span>' : 'Other lane got the <span>jump</span>';
  if(state.last < 40) els.dashMessage.innerHTML='Killer <span>light</span>';
  setTreeStatus(win ? 'You won' : 'Missed it');
  setTip(
    state.last < 40
      ? 'That is a killer light. Keep repeating that rhythm.'
      : win
        ? 'You were first to move. Restage and see if you can tighten it up even more.'
        : 'The other lane left first. Restage and try trimming a little delay.'
  );
  setPill(win ? 'Win light' : 'Lost the hit', win ? 'win' : 'loss');
  setGauge(els.tachNeedle, els.tachArc, .92); setGauge(els.speedNeedle, els.speedArc, .72);
}

function flash(kind){ document.body.classList.remove('green-flash','red-flash'); void document.body.offsetWidth; document.body.classList.add(`${kind}-flash`); setTimeout(()=>document.body.classList.remove(`${kind}-flash`),280); }
function vibrate(pattern){ if(navigator.vibrate) navigator.vibrate(pattern); }

function pressLaunch(e){ if(e){ e.preventDefault(); e.stopPropagation(); } launchPlayer(); }
function pressReset(e){ if(e){ e.preventDefault(); e.stopPropagation(); } stage(); }

['pointerdown','touchstart'].forEach(evt=>els.launchButton.addEventListener(evt, pressLaunch, {passive:false}));
['pointerdown','touchstart'].forEach(evt=>els.resetButton.addEventListener(evt, pressReset, {passive:false}));
els.viewButtons.forEach(btn=>['pointerdown','touchstart'].forEach(evt=>btn.addEventListener(evt,(e)=>{ e.preventDefault(); e.stopPropagation(); setView(btn.dataset.view); }, {passive:false})));
document.addEventListener('keydown',(e)=>{ if(e.code==='Space'){ e.preventDefault(); launchPlayer(); } if(e.key==='1') setView('windshield'); if(e.key==='2') setView('dash'); if(e.key==='3') setView('hood'); });

document.addEventListener('gesturestart', e=>e.preventDefault());
document.addEventListener('contextmenu', e=>e.preventDefault());

setView('windshield'); stage();
