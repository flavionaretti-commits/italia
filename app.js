const REGIONS = [{"name":"Valle d'Aosta","capital":"Aosta","x":105,"y":225},{"name":"Piemonte","capital":"Torino","x":112,"y":330},{"name":"Liguria","capital":"Genova","x":250,"y":452},{"name":"Lombardia","capital":"Milano","x":336,"y":283},{"name":"Trentino-Alto Adige","capital":"Trento","x":507,"y":155},{"name":"Veneto","capital":"Venezia","x":620,"y":307},{"name":"Friuli-Venezia Giulia","capital":"Trieste","x":726,"y":216},{"name":"Emilia-Romagna","capital":"Bologna","x":506,"y":430},{"name":"Toscana","capital":"Firenze","x":492,"y":540},{"name":"Marche","capital":"Ancona","x":748,"y":570},{"name":"Umbria","capital":"Perugia","x":635,"y":630},{"name":"Lazio","capital":"Roma","x":643,"y":792},{"name":"Abruzzo","capital":"L'Aquila","x":760,"y":730},{"name":"Molise","capital":"Campobasso","x":855,"y":816},{"name":"Campania","capital":"Napoli","x":828,"y":940},{"name":"Puglia","capital":"Bari","x":1080,"y":875},{"name":"Basilicata","capital":"Potenza","x":1018,"y":985},{"name":"Calabria","capital":"Catanzaro","x":1110,"y":1180},{"name":"Sardegna","capital":"Cagliari","x":245,"y":1180},{"name":"Sicilia","capital":"Palermo","x":725,"y":1360}];
const REGION_PATHS=[...document.querySelectorAll('.mini-map path')].map(p=>p.getAttribute('d'));

const $ = (s, root=document) => root.querySelector(s);
const $$ = (s, root=document) => [...root.querySelectorAll(s)];

const state = {
  screen: 'setup',
  mode: 'game',
  players: [],
  activePlayer: 0,
  perPlayerAsked: [],
  questionsPerPlayer: 10,
  categories: ['regions','capitals'],
  direction: 'mixed',
  timerSeconds: 0,
  current: null,
  scores: [],
  timerId: null,
  timeLeft: 0,
  timerStartedAt: 0,
  timerStoppedRatio: 1,
  locked: false,
  selectedPoint: null,
  result: null,
  questionPools: {},
  sound: localStorage.getItem('italia-sound') !== 'off',
  theme: localStorage.getItem('italia-theme') || 'light'
};

const els = {
  app: $('#app'),
  setupScreen: $('#setupScreen'),
  gameScreen: $('#gameScreen'),
  playersCount: $('#playersCount'),
  playerNames: $('#playerNames'),
  questions: $('#questionsPerPlayer'),
  timer: $('#timer'),
  training: $('#trainingMode'),
  start: $('#startGame'),
  categoryRegion: $('#catRegions'),
  categoryCapitals: $('#catCapitals'),
  direction: $('#direction'),
  map: $('#italyMap'),
  regionsLayer: $('#regionsLayer'),
  markerLayer: $('#markerLayer'),
  lineLayer: $('#lineLayer'),
  promptKicker: $('#promptKicker'),
  promptText: $('#promptText'),
  promptHint: $('#promptHint'),
  oralControls: $('#oralControls'),
  mapControls: $('#mapControls'),
  revealBtn: $('#revealBtn'),
  judgeControls: $('#judgeControls'),
  correctBtn: $('#correctBtn'),
  wrongBtn: $('#wrongBtn'),
  resultBox: $('#resultBox'),
  resultTitle: $('#resultTitle'),
  resultText: $('#resultText'),
  nextBtn: $('#nextBtn'),
  endTrainingBtn: $('#endTrainingBtn'),
  timerWrap: $('#timerWrap'),
  timerText: $('#timerText'),
  timerBar: $('#timerBar'),
  playerLabel: $('#playerLabel'),
  progressLabel: $('#progressLabel'),
  scoreLabel: $('#scoreLabel'),
  scoreboard: $('#scoreboard'),
  handoff: $('#handoff'),
  handoffName: $('#handoffName'),
  handoffBtn: $('#handoffBtn'),
  finalOverlay: $('#finalOverlay'),
  finalContent: $('#finalContent'),
  homeBtn: $('#homeBtn'),
  themeBtn: $('#themeBtn'),
  soundBtn: $('#soundBtn'),
  infoBtn: $('#infoBtn'),
  infoDialog: $('#infoDialog'),
  closeInfo: $('#closeInfo'),
  restartBtn: $('#restartBtn')
};

function saveSetup() {
  const names = $$('.player-name').map(i => i.value.trim());
  localStorage.setItem('italia-setup', JSON.stringify({
    playersCount: +els.playersCount.value,
    names,
    questions: +els.questions.value,
    timer: +els.timer.value,
    training: els.training.checked,
    cats: [els.categoryRegion.checked, els.categoryCapitals.checked],
    direction: els.direction.value
  }));
}

function loadSetup() {
  try {
    const s = JSON.parse(localStorage.getItem('italia-setup') || 'null');
    if (!s) return;
    if (s.playersCount) els.playersCount.value = String(Math.min(6, Math.max(1, s.playersCount)));
    if (s.questions) els.questions.value = String(s.questions);
    if (Number.isFinite(s.timer)) els.timer.value = String(s.timer);
    els.training.checked = !!s.training;
    if (Array.isArray(s.cats)) {
      els.categoryRegion.checked = s.cats[0] !== false;
      els.categoryCapitals.checked = s.cats[1] !== false;
    }
    if (s.direction) els.direction.value = s.direction;
    renderPlayerInputs(s.names || []);
  } catch(e) {}
}

function renderPlayerInputs(saved=[]) {
  const n = +els.playersCount.value;
  els.playerNames.innerHTML = '';
  for (let i=0; i<n; i++) {
    const label = document.createElement('label');
    label.className='player-field';
    label.innerHTML=`<span>Giocatore ${i+1}</span><input class="player-name" maxlength="18" autocomplete="off" value="${escapeHtml(saved[i] || `Giocatore ${i+1}`)}">`;
    els.playerNames.appendChild(label);
  }
  updateTrainingUI();
}

function updateTrainingUI() {
  const training=els.training.checked;
  els.playersCount.disabled=training;
  els.questions.disabled=training;
  els.playerNames.classList.toggle('disabled-block', training);
  $$('.player-name').forEach(i => i.disabled=training);
  $('#questionsLabel').classList.toggle('disabled-block', training);
}

function escapeHtml(s) {
  return String(s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[c]));
}

function buildMap() {
  els.regionsLayer.innerHTML = '';
  REGIONS.forEach((r,i) => {
    const p=document.createElementNS('http://www.w3.org/2000/svg','path');
    p.setAttribute('d',REGION_PATHS[i]);
    p.setAttribute('class','region-shape');
    p.dataset.index=String(i);
    p.dataset.name=r.name;
    p.setAttribute('tabindex','0');
    p.setAttribute('role','button');
    p.setAttribute('aria-label',r.name);
    p.addEventListener('pointerdown', ev => onRegionTap(ev, i));
    p.addEventListener('keydown', ev => {
      if (ev.key==='Enter' || ev.key===' ') {
        ev.preventDefault();
        onRegionTap(ev, i);
      }
    });
    els.regionsLayer.appendChild(p);
  });
  els.map.addEventListener('pointerdown', onMapTap);
}

function resetMapVisuals() {
  $$('.region-shape', els.regionsLayer).forEach(p => {
    p.classList.remove('prompt-highlight','correct-highlight','wrong-highlight','dim');
  });
  els.markerLayer.innerHTML='';
  els.lineLayer.innerHTML='';
  state.selectedPoint=null;
}

function setTheme(theme) {
  state.theme = theme;
  document.documentElement.dataset.theme = theme;
  els.themeBtn.textContent = theme==='dark' ? '☀️' : '🌙';
  els.themeBtn.setAttribute('aria-label', theme==='dark' ? 'Modalità giorno' : 'Modalità notte');
  localStorage.setItem('italia-theme', theme);
}

function setSound(on) {
  state.sound=on;
  els.soundBtn.textContent=on ? '🔊' : '🔇';
  els.soundBtn.setAttribute('aria-label', on ? 'Disattiva suoni' : 'Attiva suoni');
  localStorage.setItem('italia-sound', on ? 'on':'off');
}

let audioCtx=null;
function tone(kind='click') {
  if (!state.sound) return;
  try {
    if (!audioCtx) audioCtx=new (window.AudioContext||window.webkitAudioContext)();
    const o=audioCtx.createOscillator(), g=audioCtx.createGain();
    o.connect(g); g.connect(audioCtx.destination);
    const t=audioCtx.currentTime;
    const table={
      click:[520,0.06,0.12],
      good:[760,0.16,0.18],
      bad:[170,0.18,0.16],
      next:[610,0.08,0.13]
    };
    const [f,d,v]=table[kind]||table.click;
    o.frequency.setValueAtTime(f,t);
    if(kind==='good') o.frequency.exponentialRampToValueAtTime(980,t+d);
    if(kind==='bad') o.frequency.exponentialRampToValueAtTime(120,t+d);
    g.gain.setValueAtTime(v,t);
    g.gain.exponentialRampToValueAtTime(0.001,t+d);
    o.start(t); o.stop(t+d);
  } catch(e) {}
}

function startGame() {
  const cats=[];
  if (els.categoryRegion.checked) cats.push('regions');
  if (els.categoryCapitals.checked) cats.push('capitals');
  if (!cats.length) {
    showSetupError('Scegli almeno una modalità: Regioni o Capoluoghi di regione.');
    return;
  }
  $('#setupError').textContent='';
  state.mode=els.training.checked ? 'training':'game';
  const names = $$('.player-name').map((i,idx)=>i.value.trim() || `Giocatore ${idx+1}`);
  state.players= state.mode==='training' ? ['Allenamento'] : names;
  state.activePlayer=0;
  state.questionsPerPlayer=+els.questions.value;
  state.categories=cats;
  state.direction=els.direction.value;
  state.timerSeconds=+els.timer.value;
  state.scores=state.players.map(()=>0);
  state.perPlayerAsked=state.players.map(()=>0);
  state.questionPools={};
  state.result=null;
  state.current=null;
  state.locked=false;
  saveSetup();
  els.setupScreen.hidden=true;
  els.gameScreen.hidden=false;
  els.endTrainingBtn.hidden=state.mode!=='training';
  els.finalOverlay.hidden=true;
  renderScoreboard();
  nextQuestion(true);
}

function showSetupError(msg) {
  $('#setupError').textContent=msg;
  tone('bad');
}

function makePool(key) {
  const arr=REGIONS.map((_,i)=>i);
  for(let i=arr.length-1;i>0;i--) {
    const j=Math.floor(Math.random()*(i+1));
    [arr[i],arr[j]]=[arr[j],arr[i]];
  }
  state.questionPools[key]=arr;
}
function drawIndex(key) {
  if (!state.questionPools[key] || !state.questionPools[key].length) makePool(key);
  return state.questionPools[key].pop();
}

function chooseQuestion() {
  const cat=state.categories[Math.floor(Math.random()*state.categories.length)];
  const dir=state.direction==='mixed' ? (Math.random()<.5 ? 'nameToMap':'mapToName') : state.direction;
  const key=`${cat}:${dir}`;
  const idx=drawIndex(key);
  return {cat,dir,idx, region:REGIONS[idx]};
}

function nextQuestion(first=false) {
  clearTimer();
  resetMapVisuals();
  hideResult();
  els.judgeControls.hidden=true;
  els.revealBtn.hidden=true;
  state.locked=false;
  state.result=null;

  if (state.mode==='game' && !first) {
    state.activePlayer=(state.activePlayer+1)%state.players.length;
  }
  if (state.mode==='game' && state.perPlayerAsked.every(n=>n>=state.questionsPerPlayer)) {
    showFinal();
    return;
  }
  // Skip players already complete when wrapping near the end.
  if (state.mode==='game') {
    let guard=0;
    while(state.perPlayerAsked[state.activePlayer]>=state.questionsPerPlayer && guard<state.players.length) {
      state.activePlayer=(state.activePlayer+1)%state.players.length; guard++;
    }
  }

  state.current=chooseQuestion();
  if (state.mode==='game') state.perPlayerAsked[state.activePlayer]++;
  renderQuestion();
  renderStatus();
  if (!first && state.mode==='game' && state.players.length>1) {
    els.handoffName.textContent=state.players[state.activePlayer];
    els.handoff.hidden=false;
  } else {
    startTimer();
  }
}

function renderQuestion() {
  resetMapVisuals();
  const q=state.current;
  els.promptKicker.textContent = q.cat==='regions' ? 'REGIONI' : 'CAPOLUOGHI DI REGIONE';
  if (q.dir==='nameToMap') {
    els.oralControls.hidden=true;
    els.mapControls.hidden=false;
    if(q.cat==='regions') {
      els.promptText.textContent=`Trova ${q.region.name}`;
      els.promptHint.textContent='Tocca o clicca la regione sulla carta.';
    } else {
      els.promptText.textContent=`Trova ${q.region.capital}`;
      els.promptHint.textContent='Indica sulla carta il punto in cui si trova la città. Più sei preciso, più punti ottieni.';
    }
  } else {
    els.oralControls.hidden=false;
    els.mapControls.hidden=true;
    els.revealBtn.hidden=false;
    if(q.cat==='regions') {
      els.promptText.textContent='Qual è questa regione?';
      els.promptHint.textContent='Dì il nome a voce, poi premi “Mostra risposta”.';
      regionPath(q.idx)?.classList.add('prompt-highlight');
    } else {
      els.promptText.textContent='Quale capoluogo si trova qui?';
      els.promptHint.textContent='Dì il nome della città a voce, poi premi “Mostra risposta”.';
      addMarker(q.region.x,q.region.y,'target visible','?');
    }
  }
}

function renderStatus() {
  const p=state.activePlayer;
  els.playerLabel.textContent=state.mode==='training' ? 'ALLENAMENTO' : state.players[p].toUpperCase();
  els.scoreLabel.textContent=`${state.scores[p] || 0} pt`;
  if(state.mode==='training') {
    els.progressLabel.textContent='modalità continua';
  } else {
    els.progressLabel.textContent=`${state.perPlayerAsked[p]} / ${state.questionsPerPlayer}`;
  }
  renderScoreboard();
}

function renderScoreboard() {
  if(state.mode==='training') {
    els.scoreboard.innerHTML=`<div class="score-chip active"><span>Allenamento</span><strong>${state.scores[0]||0} pt</strong></div>`;
    return;
  }
  els.scoreboard.innerHTML=state.players.map((n,i)=>`
    <div class="score-chip ${i===state.activePlayer?'active':''}">
      <span>${escapeHtml(n)}</span><strong>${state.scores[i]||0} pt</strong>
    </div>`).join('');
}

function regionPath(i) {
  return $(`.region-shape[data-index="${i}"]`,els.regionsLayer);
}

function onRegionTap(ev, idx) {
  if(state.locked || !state.current || els.handoff.hidden===false) return;
  const q=state.current;
  if(q.dir!=='nameToMap' || q.cat!=='regions') return;
  ev.preventDefault();
  stopTimer();
  state.locked=true;
  const correct=idx===q.idx;
  regionPath(idx)?.classList.add(correct?'correct-highlight':'wrong-highlight');
  if(!correct) regionPath(q.idx)?.classList.add('correct-highlight');
  const base=correct?1000:0;
  const gained=applyTimerBonus(base);
  addScore(gained);
  showResult(correct?'Corretto!':'Non è questa.', correct
    ? `${q.region.name} · +${gained} punti`
    : `La risposta corretta era ${q.region.name}. · +0 punti`, correct?'good':'bad');
}

function onMapTap(ev) {
  if(state.locked || !state.current || els.handoff.hidden===false) return;
  const q=state.current;
  if(q.dir!=='nameToMap' || q.cat!=='capitals') return;
  const pt=svgPointFromEvent(ev);
  if(!pt) return;
  stopTimer();
  state.locked=true;
  state.selectedPoint=pt;
  addMarker(pt.x,pt.y,'guess','TU');
  addMarker(q.region.x,q.region.y,'target','✓');
  addLine(pt.x,pt.y,q.region.x,q.region.y);
  const pix=Math.hypot(pt.x-q.region.x, pt.y-q.region.y);
  const km=Math.round(pix*0.86);
  const base=precisionScore(km);
  const gained=applyTimerBonus(base);
  addScore(gained);
  showResult(base>=900?'Centratissimo!':base>=650?'Molto vicino!':base>=300?'Ci sei quasi.':'Era più lontano.',
    `${q.region.capital} · distanza circa ${km} km · precisione ${base} pt${state.timerSeconds?` · totale +${gained} pt`:` · +${gained} pt`}`,
    base>=650?'good':'click');
}

function svgPointFromEvent(ev) {
  const ctm=els.map.getScreenCTM();
  if(!ctm) return null;
  const p=els.map.createSVGPoint();
  p.x=ev.clientX; p.y=ev.clientY;
  const r=p.matrixTransform(ctm.inverse());
  if(r.x<0 || r.x>1337 || r.y<0 || r.y>1600) return null;
  return {x:r.x,y:r.y};
}

function precisionScore(km) {
  if(km<=8) return 1000;
  if(km>=250) return 0;
  const t=1-(km-8)/242;
  return Math.max(0,Math.round(1000*Math.pow(t,1.25)));
}

function applyTimerBonus(base) {
  if(!state.timerSeconds || base<=0) return base;
  const ratio=Math.max(0,Math.min(1,state.timerStoppedRatio));
  const mult=1+0.25*ratio;
  return Math.round(base*mult);
}

function addScore(points) {
  state.scores[state.activePlayer]=(state.scores[state.activePlayer]||0)+points;
  renderStatus();
}

function revealAnswer() {
  if(state.locked || !state.current) return;
  stopTimer();
  state.locked=true;
  const q=state.current;
  els.revealBtn.hidden=true;
  els.judgeControls.hidden=false;
  if(q.cat==='regions') {
    regionPath(q.idx)?.classList.add('correct-highlight');
    showResult('Risposta',q.region.name,'click',false);
  } else {
    addMarker(q.region.x,q.region.y,'target','✓');
    showResult('Risposta',q.region.capital,'click',false);
  }
  tone('click');
}

function judge(correct) {
  if(!state.current) return;
  els.judgeControls.hidden=true;
  const base=correct?1000:0;
  const gained=applyTimerBonus(base);
  addScore(gained);
  const answer=state.current.cat==='regions'?state.current.region.name:state.current.region.capital;
  showResult(correct?'Corretto!':'Segnato come errato.',`${answer} · +${gained} punti`,correct?'good':'bad',true);
}

function showResult(title,text,sound='click',showNext=true) {
  els.resultTitle.textContent=title;
  els.resultText.textContent=text;
  els.resultBox.hidden=false;
  els.nextBtn.hidden=!showNext;
  tone(sound);
}
function hideResult() {
  els.resultBox.hidden=true;
  els.nextBtn.hidden=false;
  els.resultTitle.textContent='';
  els.resultText.textContent='';
}

function addMarker(x,y,kind,label) {
  const g=document.createElementNS('http://www.w3.org/2000/svg','g');
  g.setAttribute('class',`map-marker ${kind}`);
  const c=document.createElementNS('http://www.w3.org/2000/svg','circle');
  c.setAttribute('cx',x); c.setAttribute('cy',y); c.setAttribute('r', kind.includes('visible')?15:13);
  g.appendChild(c);
  if(label) {
    const t=document.createElementNS('http://www.w3.org/2000/svg','text');
    t.setAttribute('x',x); t.setAttribute('y',y+5); t.textContent=label;
    g.appendChild(t);
  }
  els.markerLayer.appendChild(g);
}
function addLine(x1,y1,x2,y2) {
  const l=document.createElementNS('http://www.w3.org/2000/svg','line');
  l.setAttribute('x1',x1);l.setAttribute('y1',y1);l.setAttribute('x2',x2);l.setAttribute('y2',y2);
  l.setAttribute('class','answer-line');
  els.lineLayer.appendChild(l);
}

function startTimer() {
  clearTimer();
  if(!state.timerSeconds) {
    els.timerWrap.hidden=true;
    state.timerStoppedRatio=1;
    return;
  }
  els.timerWrap.hidden=false;
  state.timeLeft=state.timerSeconds;
  state.timerStartedAt=performance.now();
  updateTimerDisplay();
  state.timerId=setInterval(()=>{
    const elapsed=(performance.now()-state.timerStartedAt)/1000;
    state.timeLeft=Math.max(0,state.timerSeconds-elapsed);
    updateTimerDisplay();
    if(state.timeLeft<=0.02) timeExpired();
  },100);
}
function updateTimerDisplay() {
  const sec=Math.ceil(state.timeLeft);
  els.timerText.textContent=`${sec} s`;
  const ratio=state.timerSeconds?state.timeLeft/state.timerSeconds:1;
  els.timerBar.style.transform=`scaleX(${Math.max(0,ratio)})`;
}
function stopTimer() {
  if(state.timerSeconds) {
    const elapsed=(performance.now()-state.timerStartedAt)/1000;
    state.timeLeft=Math.max(0,state.timerSeconds-elapsed);
    state.timerStoppedRatio=state.timeLeft/state.timerSeconds;
  } else state.timerStoppedRatio=1;
  clearTimer();
}
function clearTimer() {
  if(state.timerId) clearInterval(state.timerId);
  state.timerId=null;
}
function timeExpired() {
  clearTimer();
  state.timeLeft=0; state.timerStoppedRatio=0; updateTimerDisplay();
  if(state.locked) return;
  state.locked=true;
  const q=state.current;
  if(q.cat==='regions') regionPath(q.idx)?.classList.add('correct-highlight');
  else addMarker(q.region.x,q.region.y,'target','✓');
  const answer=q.cat==='regions'?q.region.name:q.region.capital;
  els.revealBtn.hidden=true;
  els.judgeControls.hidden=true;
  showResult('Tempo scaduto',`La risposta era ${answer}. · +0 punti`,'bad',true);
}

function showFinal() {
  clearTimer();
  els.finalOverlay.hidden=false;
  const order=state.players.map((n,i)=>({n,score:state.scores[i]})).sort((a,b)=>b.score-a.score);
  const top=order[0]?.score||0;
  els.finalContent.innerHTML=`
    <div class="final-cup">🏆</div>
    <h2>Partita conclusa!</h2>
    <div class="final-list">
      ${order.map((p,i)=>`<div class="final-row ${p.score===top?'winner':''}"><span>${i+1}. ${escapeHtml(p.n)}</span><strong>${p.score} pt</strong></div>`).join('')}
    </div>
    <button type="button" class="primary big" id="playAgainFinal">NUOVA PARTITA</button>`;
  $('#playAgainFinal').addEventListener('click',goHome);
  tone('good');
}

function endTraining() {
  clearTimer();
  els.finalOverlay.hidden=false;
  els.finalContent.innerHTML=`
    <div class="final-cup">🧭</div>
    <h2>Allenamento concluso</h2>
    <p>Hai totalizzato <strong>${state.scores[0]||0} punti</strong>.</p>
    <button type="button" class="primary big" id="playAgainFinal">TORNA ALLA HOME</button>`;
  $('#playAgainFinal').addEventListener('click',goHome);
}

function goHome() {
  clearTimer();
  els.gameScreen.hidden=true;
  els.finalOverlay.hidden=true;
  els.handoff.hidden=true;
  els.setupScreen.hidden=false;
  state.screen='setup';
  resetMapVisuals();
}

function openInfo() { els.infoDialog.showModal ? els.infoDialog.showModal() : els.infoDialog.setAttribute('open',''); }
function closeInfo() { els.infoDialog.close ? els.infoDialog.close() : els.infoDialog.removeAttribute('open'); }

els.playersCount.addEventListener('change',()=>{renderPlayerInputs();saveSetup();});
els.questions.addEventListener('change',saveSetup);
els.timer.addEventListener('change',saveSetup);
els.training.addEventListener('change',()=>{updateTrainingUI();saveSetup();});
els.categoryRegion.addEventListener('change',saveSetup);
els.categoryCapitals.addEventListener('change',saveSetup);
els.direction.addEventListener('change',saveSetup);
els.playerNames.addEventListener('input',saveSetup);
els.start.addEventListener('click',startGame);
els.revealBtn.addEventListener('click',revealAnswer);
els.correctBtn.addEventListener('click',()=>judge(true));
els.wrongBtn.addEventListener('click',()=>judge(false));
els.nextBtn.addEventListener('click',()=>{tone('next');nextQuestion(false);});
els.handoffBtn.addEventListener('click',()=>{els.handoff.hidden=true;tone('next');startTimer();});
els.endTrainingBtn.addEventListener('click',endTraining);
els.homeBtn.addEventListener('click',()=>{ if(confirm('Vuoi uscire dalla partita e tornare alla home?')) goHome(); });
els.themeBtn.addEventListener('click',()=>setTheme(state.theme==='dark'?'light':'dark'));
els.soundBtn.addEventListener('click',()=>setSound(!state.sound));
els.infoBtn.addEventListener('click',openInfo);
els.closeInfo.addEventListener('click',closeInfo);
els.restartBtn.addEventListener('click',()=>{ closeInfo(); goHome(); });
els.infoDialog.addEventListener('click',e=>{ if(e.target===els.infoDialog) closeInfo(); });

document.addEventListener('dblclick',e=>e.preventDefault(),{passive:false});
setTheme(state.theme);
setSound(state.sound);
renderPlayerInputs();
loadSetup();
buildMap();

if('serviceWorker' in navigator && location.protocol.startsWith('http')) {
  navigator.serviceWorker.register('./service-worker.js').catch(()=>{});
}
