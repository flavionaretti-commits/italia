const REGION_PATHS=[...document.querySelectorAll('.mini-map path')].map(p=>p.getAttribute('d'));
const $=(s,root=document)=>root.querySelector(s);
const $$=(s,root=document)=>[...root.querySelectorAll(s)];

const state={
  mode:"game",players:[],activePlayer:0,perPlayerAsked:[],questionsPerPlayer:10,
  categories:["regions","capitals"],physicalSubs:["seas","lakes","rivers","mountains","volcanoes","islands","coasts"],
  wonderSubs:["monuments","places","archaeology","nature"],direction:"mixed",timerSeconds:0,
  current:null,scores:[],timerId:null,timeLeft:0,timerStartedAt:0,timerStoppedRatio:1,locked:false,
  questionPools:{},sound:localStorage.getItem("italia-sound")!=="off",theme:localStorage.getItem("italia-theme")||"light"
};

const els={
  setupScreen:$("#setupScreen"),gameScreen:$("#gameScreen"),playersCount:$("#playersCount"),playerNames:$("#playerNames"),
  questions:$("#questionsPerPlayer"),timer:$("#timer"),training:$("#trainingMode"),start:$("#startGame"),
  categoryRegion:$("#catRegions"),categoryCapitals:$("#catCapitals"),categoryProvinces:$("#catProvinces"),
  categoryPhysical:$("#catPhysical"),categoryWonders:$("#catWonders"),physicalOptions:$("#physicalOptions"),
  wondersOptions:$("#wondersOptions"),direction:$("#direction"),map:$("#italyMap"),regionsLayer:$("#regionsLayer"),
  markerLayer:$("#markerLayer"),lineLayer:$("#lineLayer"),promptKicker:$("#promptKicker"),promptText:$("#promptText"),
  promptHint:$("#promptHint"),oralControls:$("#oralControls"),mapControls:$("#mapControls"),revealBtn:$("#revealBtn"),
  judgeControls:$("#judgeControls"),correctBtn:$("#correctBtn"),wrongBtn:$("#wrongBtn"),resultBox:$("#resultBox"),
  resultTitle:$("#resultTitle"),resultText:$("#resultText"),nextBtn:$("#nextBtn"),endTrainingBtn:$("#endTrainingBtn"),
  timerWrap:$("#timerWrap"),timerText:$("#timerText"),timerBar:$("#timerBar"),playerLabel:$("#playerLabel"),
  progressLabel:$("#progressLabel"),scoreLabel:$("#scoreLabel"),scoreboard:$("#scoreboard"),handoff:$("#handoff"),
  handoffName:$("#handoffName"),handoffBtn:$("#handoffBtn"),finalOverlay:$("#finalOverlay"),finalContent:$("#finalContent"),
  homeBtn:$("#homeBtn"),themeBtn:$("#themeBtn"),soundBtn:$("#soundBtn"),infoBtn:$("#infoBtn"),infoDialog:$("#infoDialog"),
  closeInfo:$("#closeInfo"),restartBtn:$("#restartBtn")
};

const MAP={lonMin:6.50,lonMax:18.60,latMin:36.30,latMax:47.25,xMin:20,xMax:1310,yMin:35,yMax:1560,kmPerPx:.82};
function geoToMap(lat,lon){
  const x=MAP.xMin+(lon-MAP.lonMin)/(MAP.lonMax-MAP.lonMin)*(MAP.xMax-MAP.xMin);
  const y=MAP.yMin+(MAP.latMax-lat)/(MAP.latMax-MAP.latMin)*(MAP.yMax-MAP.yMin);
  return{x,y};
}
function itemXY(item){return Number.isFinite(item.x)&&Number.isFinite(item.y)?{x:item.x,y:item.y}:geoToMap(item.lat,item.lon)}
function escapeHtml(s){return String(s).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[c]))}

function saveSetup(){
  localStorage.setItem("italia-v2-setup",JSON.stringify({
    playersCount:+els.playersCount.value,names:$$(".player-name").map(i=>i.value.trim()),questions:+els.questions.value,
    timer:+els.timer.value,training:els.training.checked,
    cats:[els.categoryRegion.checked,els.categoryCapitals.checked,els.categoryProvinces.checked,els.categoryPhysical.checked,els.categoryWonders.checked],
    physical:$$(".subcat-physical").filter(i=>i.checked).map(i=>i.value),
    wonders:$$(".subcat-wonders").filter(i=>i.checked).map(i=>i.value),
    direction:els.direction.value
  }));
}
function loadSetup(){
  try{
    const s=JSON.parse(localStorage.getItem("italia-v2-setup")||localStorage.getItem("italia-setup")||"null");
    if(!s)return;
    if(s.playersCount)els.playersCount.value=String(Math.min(6,Math.max(1,s.playersCount)));
    if(s.questions)els.questions.value=String(s.questions);
    if(Number.isFinite(s.timer))els.timer.value=String(s.timer);
    els.training.checked=!!s.training;
    if(Array.isArray(s.cats)){
      els.categoryRegion.checked=s.cats[0]!==false;els.categoryCapitals.checked=s.cats[1]!==false;
      els.categoryProvinces.checked=!!s.cats[2];els.categoryPhysical.checked=!!s.cats[3];els.categoryWonders.checked=!!s.cats[4];
    }
    if(Array.isArray(s.physical))$$(".subcat-physical").forEach(i=>i.checked=s.physical.includes(i.value));
    if(Array.isArray(s.wonders))$$(".subcat-wonders").forEach(i=>i.checked=s.wonders.includes(i.value));
    if(s.direction)els.direction.value=s.direction;
    renderPlayerInputs(s.names||[]);updateCategoryOptions();
  }catch(e){}
}
function renderPlayerInputs(saved=[]){
  const n=+els.playersCount.value;els.playerNames.innerHTML="";
  for(let i=0;i<n;i++){
    const label=document.createElement("label");label.className="player-field";
    label.innerHTML=`<span>Giocatore ${i+1}</span><input class="player-name" maxlength="18" autocomplete="off" value="${escapeHtml(saved[i]||`Giocatore ${i+1}`)}">`;
    els.playerNames.appendChild(label);
  }
  updateTrainingUI();
}
function updateTrainingUI(){
  const training=els.training.checked;
  els.playersCount.disabled=training;els.questions.disabled=training;els.playerNames.classList.toggle("disabled-block",training);
  $$(".player-name").forEach(i=>i.disabled=training);$("#questionsLabel").classList.toggle("disabled-block",training);
}
function updateCategoryOptions(){
  els.physicalOptions.hidden=!els.categoryPhysical.checked;
  els.wondersOptions.hidden=!els.categoryWonders.checked;
}

function buildMap(){
  els.regionsLayer.innerHTML="";
  REGIONS.forEach((r,i)=>{
    const p=document.createElementNS("http://www.w3.org/2000/svg","path");
    p.setAttribute("d",REGION_PATHS[i]);p.setAttribute("class","region-shape");p.dataset.index=String(i);p.dataset.name=r.name;
    p.setAttribute("tabindex","0");p.setAttribute("role","button");p.setAttribute("aria-label",r.name);
    p.addEventListener("pointerdown",ev=>onRegionTap(ev,i));
    p.addEventListener("keydown",ev=>{if(ev.key==="Enter"||ev.key===" "){ev.preventDefault();onRegionTap(ev,i)}});
    els.regionsLayer.appendChild(p);
  });
  els.map.addEventListener("pointerdown",onMapTap);
}
function regionPath(i){return $(`.region-shape[data-index="${i}"]`,els.regionsLayer)}
function resetMapVisuals(){
  $$(".region-shape",els.regionsLayer).forEach(p=>p.classList.remove("prompt-highlight","correct-highlight","wrong-highlight","dim"));
  els.markerLayer.innerHTML="";els.lineLayer.innerHTML="";
}
function setTheme(theme){
  state.theme=theme;document.documentElement.dataset.theme=theme;els.themeBtn.textContent=theme==="dark"?"☀️":"🌙";
  els.themeBtn.setAttribute("aria-label",theme==="dark"?"Modalità giorno":"Modalità notte");localStorage.setItem("italia-theme",theme);
}
function setSound(on){
  state.sound=on;els.soundBtn.textContent=on?"🔊":"🔇";els.soundBtn.setAttribute("aria-label",on?"Disattiva suoni":"Attiva suoni");
  localStorage.setItem("italia-sound",on?"on":"off");
}
let audioCtx=null;
function tone(kind="click"){
  if(!state.sound)return;
  try{
    if(!audioCtx)audioCtx=new(window.AudioContext||window.webkitAudioContext)();
    const o=audioCtx.createOscillator(),g=audioCtx.createGain();o.connect(g);g.connect(audioCtx.destination);
    const t=audioCtx.currentTime,table={click:[520,.07,.18],good:[760,.18,.24],bad:[170,.20,.22],next:[610,.09,.18]};
    const[f,d,v]=table[kind]||table.click;o.frequency.setValueAtTime(f,t);
    if(kind==="good")o.frequency.exponentialRampToValueAtTime(980,t+d);if(kind==="bad")o.frequency.exponentialRampToValueAtTime(120,t+d);
    g.gain.setValueAtTime(v,t);g.gain.exponentialRampToValueAtTime(.001,t+d);o.start(t);o.stop(t+d);
  }catch(e){}
}

function selectedValues(cls){return $$(`.${cls}`).filter(i=>i.checked).map(i=>i.value)}
function startGame(){
  const cats=[];
  if(els.categoryRegion.checked)cats.push("regions");
  if(els.categoryCapitals.checked)cats.push("capitals");
  if(els.categoryProvinces.checked)cats.push("provinces");
  if(els.categoryPhysical.checked)cats.push("physical");
  if(els.categoryWonders.checked)cats.push("wonders");
  const physicalSubs=selectedValues("subcat-physical"),wonderSubs=selectedValues("subcat-wonders");
  if(!cats.length)return showSetupError("Scegli almeno una categoria.");
  if(cats.includes("physical")&&!physicalSubs.length)return showSetupError("Per Italia fisica scegli almeno una sottocategoria.");
  if(cats.includes("wonders")&&!wonderSubs.length)return showSetupError("Per Meraviglie d'Italia scegli almeno una sottocategoria.");
  $("#setupError").textContent="";
  state.mode=els.training.checked?"training":"game";
  const names=$$(".player-name").map((i,idx)=>i.value.trim()||`Giocatore ${idx+1}`);
  state.players=state.mode==="training"?["Allenamento"]:names;state.activePlayer=0;state.questionsPerPlayer=+els.questions.value;
  state.categories=cats;state.physicalSubs=physicalSubs;state.wonderSubs=wonderSubs;state.direction=els.direction.value;state.timerSeconds=+els.timer.value;
  state.scores=state.players.map(()=>0);state.perPlayerAsked=state.players.map(()=>0);state.questionPools={};state.current=null;state.locked=false;
  saveSetup();els.setupScreen.hidden=true;els.gameScreen.hidden=false;els.endTrainingBtn.hidden=state.mode!=="training";els.finalOverlay.hidden=true;
  renderScoreboard();nextQuestion(true);
}
function showSetupError(msg){$("#setupError").textContent=msg;tone("bad")}

function regionItems(){return REGIONS.map((r,i)=>({id:`region-${i}`,name:r.name,kind:"region",cat:"regions",regionIndex:i,region:r}))}
function capitalItems(){return REGIONS.map((r,i)=>({id:`capital-${i}`,name:r.capital,kind:"point",cat:"capitals",x:r.x,y:r.y,region:r,tolerance:8,maxDistance:250}))}
function getCandidates(cat){
  if(cat==="regions")return regionItems();
  if(cat==="capitals")return capitalItems();
  if(cat==="provinces")return PROVINCES;
  if(cat==="physical")return PHYSICAL.filter(i=>state.physicalSubs.includes(i.sub));
  if(cat==="wonders")return WONDERS.filter(i=>state.wonderSubs.includes(i.sub));
  return[];
}
function poolKey(cat,dir){
  const suffix=cat==="physical"?state.physicalSubs.slice().sort().join(","):cat==="wonders"?state.wonderSubs.slice().sort().join(","):"all";
  return`${cat}:${dir}:${suffix}`;
}
function makePool(cat,dir){
  const arr=getCandidates(cat).map(i=>i.id);
  for(let i=arr.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[arr[i],arr[j]]=[arr[j],arr[i]]}
  state.questionPools[poolKey(cat,dir)]=arr;
}
function drawItem(cat,dir){
  const key=poolKey(cat,dir);if(!state.questionPools[key]||!state.questionPools[key].length)makePool(cat,dir);
  const id=state.questionPools[key].pop();return getCandidates(cat).find(i=>i.id===id);
}
function chooseQuestion(){
  const cat=state.categories[Math.floor(Math.random()*state.categories.length)];
  const dir=state.direction==="mixed"?(Math.random()<.5?"nameToMap":"mapToName"):state.direction;
  return{cat,dir,item:drawItem(cat,dir)};
}
function nextQuestion(first=false){
  clearTimer();resetMapVisuals();hideResult();els.judgeControls.hidden=true;els.revealBtn.hidden=true;state.locked=false;
  if(state.mode==="game"&&!first)state.activePlayer=(state.activePlayer+1)%state.players.length;
  if(state.mode==="game"&&state.perPlayerAsked.every(n=>n>=state.questionsPerPlayer)){showFinal();return}
  if(state.mode==="game"){
    let guard=0;while(state.perPlayerAsked[state.activePlayer]>=state.questionsPerPlayer&&guard<state.players.length){
      state.activePlayer=(state.activePlayer+1)%state.players.length;guard++;
    }
  }
  state.current=chooseQuestion();if(state.mode==="game")state.perPlayerAsked[state.activePlayer]++;
  renderQuestion();renderStatus();
  if(!first&&state.mode==="game"&&state.players.length>1){els.handoffName.textContent=state.players[state.activePlayer];els.handoff.hidden=false}else startTimer();
}
function questionKicker(q){
  if(q.cat==="physical")return`${CATEGORY_LABELS.physical} · ${SUB_LABELS[q.item.sub]}`;
  if(q.cat==="wonders")return`${CATEGORY_LABELS.wonders} · ${SUB_LABELS[q.item.sub]}`;
  return CATEGORY_LABELS[q.cat];
}
function oralPrompt(q){
  if(q.cat==="regions")return"Qual è questa regione?";
  if(q.cat==="capitals")return"Quale capoluogo di regione si trova qui?";
  if(q.cat==="provinces")return"Quale capoluogo di provincia si trova qui?";
  if(q.cat==="wonders")return"Quale luogo famoso si trova qui?";
  const map={seas:"Quale mare è evidenziato?",lakes:"Quale lago si trova qui?",rivers:"Quale fiume è evidenziato?",mountains:"Quale monte o massiccio si trova qui?",volcanoes:"Quale vulcano si trova qui?",islands:"Quale isola è evidenziata?",coasts:"Quale elemento costiero è evidenziato?"};
  return map[q.item.sub]||"Quale elemento geografico è evidenziato?";
}
function locateHint(item){
  if(item.kind==="line")return"Tocca il più vicino possibile al suo corso.";
  if(item.kind==="area")return"Tocca una zona appartenente all'area corretta.";
  return"Indica sulla carta la posizione. Più sei preciso, più punti ottieni.";
}
function renderQuestion(){
  resetMapVisuals();const q=state.current;els.promptKicker.textContent=questionKicker(q);
  if(q.dir==="nameToMap"){
    els.oralControls.hidden=true;els.mapControls.hidden=false;els.promptText.textContent=`Trova ${q.item.name}`;
    els.promptHint.textContent=q.cat==="regions"?"Tocca o clicca la regione sulla carta.":locateHint(q.item);
  }else{
    els.oralControls.hidden=false;els.mapControls.hidden=true;els.revealBtn.hidden=false;els.promptText.textContent=oralPrompt(q);
    els.promptHint.textContent="Dì la risposta a voce, poi premi “Mostra risposta”.";
    if(q.item.kind==="region")regionPath(q.item.regionIndex)?.classList.add("prompt-highlight");else showTargetFeature(q.item,"?",false);
  }
}
function renderStatus(){
  const p=state.activePlayer;els.playerLabel.textContent=state.mode==="training"?"ALLENAMENTO":state.players[p].toUpperCase();
  els.scoreLabel.textContent=`${state.scores[p]||0} pt`;els.progressLabel.textContent=state.mode==="training"?"modalità continua":`${state.perPlayerAsked[p]} / ${state.questionsPerPlayer}`;
  renderScoreboard();
}
function renderScoreboard(){
  if(state.mode==="training"){els.scoreboard.innerHTML=`<div class="score-chip active"><span>Allenamento</span><strong>${state.scores[0]||0} pt</strong></div>`;return}
  els.scoreboard.innerHTML=state.players.map((n,i)=>`<div class="score-chip ${i===state.activePlayer?"active":""}"><span>${escapeHtml(n)}</span><strong>${state.scores[i]||0} pt</strong></div>`).join("");
}

function onRegionTap(ev,idx){
  if(state.locked||!state.current||els.handoff.hidden===false)return;
  const q=state.current;if(q.dir!=="nameToMap"||q.item.kind!=="region")return;ev.preventDefault();stopTimer();state.locked=true;
  const correct=idx===q.item.regionIndex;regionPath(idx)?.classList.add(correct?"correct-highlight":"wrong-highlight");
  if(!correct)regionPath(q.item.regionIndex)?.classList.add("correct-highlight");
  const gained=applyTimerBonus(correct?1000:0);addScore(gained);
  showResult(correct?"Corretto!":"Non è questa.",correct?`${q.item.name} · +${gained} punti`:`La risposta corretta era ${q.item.name}. · +0 punti`,correct?"good":"bad");
}
function onMapTap(ev){
  if(state.locked||!state.current||els.handoff.hidden===false)return;
  const q=state.current;if(q.dir!=="nameToMap"||q.item.kind==="region")return;
  const pt=svgPointFromEvent(ev);if(!pt)return;stopTimer();state.locked=true;addMarker(pt.x,pt.y,"guess","TU");
  const near=nearestPointOnGeometry(q.item,pt);showTargetFeature(q.item,"✓",true);
  if(near&&near.point&&near.km>0)addLine(pt.x,pt.y,near.point.x,near.point.y);
  const km=Math.max(0,near?.km??999);const base=precisionScore(km,q.item.tolerance??8,q.item.maxDistance??250),gained=applyTimerBonus(base);addScore(gained);
  const distText=km<1?"posizione centrata":`distanza circa ${Math.round(km)} km`;
  showResult(base>=900?"Centratissimo!":base>=650?"Molto vicino!":base>=300?"Ci sei quasi.":"Era più lontano.",
    `${q.item.name} · ${distText} · precisione ${base} pt${state.timerSeconds?` · totale +${gained} pt`:` · +${gained} pt`}`,base>=650?"good":"click");
}
function svgPointFromEvent(ev){
  const ctm=els.map.getScreenCTM();if(!ctm)return null;const p=els.map.createSVGPoint();p.x=ev.clientX;p.y=ev.clientY;
  const r=p.matrixTransform(ctm.inverse());if(r.x<0||r.x>1337||r.y<0||r.y>1600)return null;return{x:r.x,y:r.y};
}
function precisionScore(km,full=8,zero=250){
  if(km<=full)return 1000;if(km>=zero)return 0;const t=1-(km-full)/(zero-full);return Math.max(0,Math.round(1000*Math.pow(t,1.25)));
}
function nearestPointOnGeometry(item,pt){
  if(item.kind==="point"){
    const target=itemXY(item),px=Math.hypot(pt.x-target.x,pt.y-target.y);return{point:target,km:px*MAP.kmPerPx};
  }
  if(item.kind==="area"){
    const c=itemXY(item),d=Math.hypot(pt.x-c.x,pt.y-c.y),r=(item.radiusKm||30)/MAP.kmPerPx;
    if(d<=r)return{point:pt,km:0};
    const u=r/d,edge={x:c.x+(pt.x-c.x)*u,y:c.y+(pt.y-c.y)*u};return{point:edge,km:(d-r)*MAP.kmPerPx};
  }
  if(item.kind==="line"){
    const pts=item.points.map(([lat,lon])=>geoToMap(lat,lon));let best={d:Infinity,point:null};
    for(let i=0;i<pts.length-1;i++){
      const a=pts[i],b=pts[i+1],vx=b.x-a.x,vy=b.y-a.y,wx=pt.x-a.x,wy=pt.y-a.y,den=vx*vx+vy*vy;
      const t=den?Math.max(0,Math.min(1,(wx*vx+wy*vy)/den)):0,q={x:a.x+t*vx,y:a.y+t*vy},d=Math.hypot(pt.x-q.x,pt.y-q.y);
      if(d<best.d)best={d,point:q};
    }
    return{point:best.point,km:best.d*MAP.kmPerPx};
  }
  return null;
}
function showTargetFeature(item,label="",correct=false){
  if(item.kind==="point"){const p=itemXY(item);addMarker(p.x,p.y,correct?"target":"target visible",label);return}
  const g=document.createElementNS("http://www.w3.org/2000/svg","g");g.setAttribute("class",`geo-feature ${correct?"correct":""}`);
  if(item.kind==="area"){
    const c=itemXY(item),circle=document.createElementNS("http://www.w3.org/2000/svg","circle");
    circle.setAttribute("cx",c.x);circle.setAttribute("cy",c.y);circle.setAttribute("r",(item.radiusKm||30)/MAP.kmPerPx);circle.setAttribute("class","geo-area");g.appendChild(circle);
    if(label)addFeatureLabel(g,c.x,c.y,label);
  }else if(item.kind==="line"){
    const poly=document.createElementNS("http://www.w3.org/2000/svg","polyline"),pts=item.points.map(([lat,lon])=>geoToMap(lat,lon));
    poly.setAttribute("points",pts.map(p=>`${p.x},${p.y}`).join(" "));poly.setAttribute("class","geo-line");g.appendChild(poly);
    if(label){const m=pts[Math.floor(pts.length/2)];addFeatureLabel(g,m.x,m.y,label)}
  }
  els.markerLayer.appendChild(g);
}
function addFeatureLabel(g,x,y,label){
  const t=document.createElementNS("http://www.w3.org/2000/svg","text");t.setAttribute("x",x);t.setAttribute("y",y-18);t.setAttribute("class","feature-label");t.textContent=label;g.appendChild(t);
}
function addMarker(x,y,kind,label){
  const g=document.createElementNS("http://www.w3.org/2000/svg","g");g.setAttribute("class",`map-marker ${kind}`);
  const c=document.createElementNS("http://www.w3.org/2000/svg","circle");c.setAttribute("cx",x);c.setAttribute("cy",y);c.setAttribute("r",kind.includes("visible")?15:13);g.appendChild(c);
  if(label){const t=document.createElementNS("http://www.w3.org/2000/svg","text");t.setAttribute("x",x);t.setAttribute("y",y+5);t.textContent=label;g.appendChild(t)}
  els.markerLayer.appendChild(g);
}
function addLine(x1,y1,x2,y2){
  const l=document.createElementNS("http://www.w3.org/2000/svg","line");l.setAttribute("x1",x1);l.setAttribute("y1",y1);l.setAttribute("x2",x2);l.setAttribute("y2",y2);l.setAttribute("class","answer-line");els.lineLayer.appendChild(l);
}
function applyTimerBonus(base){if(!state.timerSeconds||base<=0)return base;return Math.round(base*(1+.25*Math.max(0,Math.min(1,state.timerStoppedRatio))))}
function addScore(points){state.scores[state.activePlayer]=(state.scores[state.activePlayer]||0)+points;renderStatus()}

function revealAnswer(){
  if(state.locked||!state.current)return;stopTimer();state.locked=true;const q=state.current;els.revealBtn.hidden=true;els.judgeControls.hidden=false;
  if(q.item.kind==="region")regionPath(q.item.regionIndex)?.classList.add("correct-highlight");else showTargetFeature(q.item,"✓",true);
  showResult("Risposta",q.item.name,"click",false);tone("click");
}
function judge(correct){
  if(!state.current)return;els.judgeControls.hidden=true;const gained=applyTimerBonus(correct?1000:0);addScore(gained);
  showResult(correct?"Corretto!":"Segnato come errato.",`${state.current.item.name} · +${gained} punti`,correct?"good":"bad",true);
}
function showResult(title,text,sound="click",showNext=true){els.resultTitle.textContent=title;els.resultText.textContent=text;els.resultBox.hidden=false;els.nextBtn.hidden=!showNext;tone(sound)}
function hideResult(){els.resultBox.hidden=true;els.nextBtn.hidden=false;els.resultTitle.textContent="";els.resultText.textContent=""}

function startTimer(){
  clearTimer();if(!state.timerSeconds){els.timerWrap.hidden=true;state.timerStoppedRatio=1;return}
  els.timerWrap.hidden=false;state.timeLeft=state.timerSeconds;state.timerStartedAt=performance.now();updateTimerDisplay();
  state.timerId=setInterval(()=>{const elapsed=(performance.now()-state.timerStartedAt)/1000;state.timeLeft=Math.max(0,state.timerSeconds-elapsed);updateTimerDisplay();if(state.timeLeft<=.02)timeExpired()},100);
}
function updateTimerDisplay(){els.timerText.textContent=`${Math.ceil(state.timeLeft)} s`;const ratio=state.timerSeconds?state.timeLeft/state.timerSeconds:1;els.timerBar.style.transform=`scaleX(${Math.max(0,ratio)})`}
function stopTimer(){
  if(state.timerSeconds){const elapsed=(performance.now()-state.timerStartedAt)/1000;state.timeLeft=Math.max(0,state.timerSeconds-elapsed);state.timerStoppedRatio=state.timeLeft/state.timerSeconds}else state.timerStoppedRatio=1;
  clearTimer();
}
function clearTimer(){if(state.timerId)clearInterval(state.timerId);state.timerId=null}
function timeExpired(){
  clearTimer();state.timeLeft=0;state.timerStoppedRatio=0;updateTimerDisplay();if(state.locked)return;state.locked=true;const q=state.current;
  if(q.item.kind==="region")regionPath(q.item.regionIndex)?.classList.add("correct-highlight");else showTargetFeature(q.item,"✓",true);
  els.revealBtn.hidden=true;els.judgeControls.hidden=true;showResult("Tempo scaduto",`La risposta era ${q.item.name}. · +0 punti`,"bad",true);
}
function showFinal(){
  clearTimer();els.finalOverlay.hidden=false;
  const order=state.players.map((n,i)=>({n,score:state.scores[i]})).sort((a,b)=>b.score-a.score),top=order[0]?.score||0;
  els.finalContent.innerHTML=`<div class="final-cup">🏆</div><h2>Partita conclusa!</h2><div class="final-list">${order.map((p,i)=>`<div class="final-row ${p.score===top?"winner":""}"><span>${i+1}. ${escapeHtml(p.n)}</span><strong>${p.score} pt</strong></div>`).join("")}</div><button type="button" class="primary big" id="playAgainFinal">NUOVA PARTITA</button>`;
  $("#playAgainFinal").addEventListener("click",goHome);tone("good");
}
function endTraining(){
  clearTimer();els.finalOverlay.hidden=false;
  els.finalContent.innerHTML=`<div class="final-cup">🧭</div><h2>Allenamento concluso</h2><p>Hai totalizzato <strong>${state.scores[0]||0} punti</strong>.</p><button type="button" class="primary big" id="playAgainFinal">TORNA ALLA HOME</button>`;
  $("#playAgainFinal").addEventListener("click",goHome);
}
function goHome(){clearTimer();els.gameScreen.hidden=true;els.finalOverlay.hidden=true;els.handoff.hidden=true;els.setupScreen.hidden=false;resetMapVisuals()}
function openInfo(){els.infoDialog.showModal?els.infoDialog.showModal():els.infoDialog.setAttribute("open","")}
function closeInfo(){els.infoDialog.close?els.infoDialog.close():els.infoDialog.removeAttribute("open")}

els.playersCount.addEventListener("change",()=>{renderPlayerInputs();saveSetup()});
els.questions.addEventListener("change",saveSetup);els.timer.addEventListener("change",saveSetup);
els.training.addEventListener("change",()=>{updateTrainingUI();saveSetup()});
[els.categoryRegion,els.categoryCapitals,els.categoryProvinces,els.categoryPhysical,els.categoryWonders].forEach(el=>el.addEventListener("change",()=>{updateCategoryOptions();saveSetup()}));
$$(".subcat-physical,.subcat-wonders").forEach(el=>el.addEventListener("change",saveSetup));
els.direction.addEventListener("change",saveSetup);els.playerNames.addEventListener("input",saveSetup);els.start.addEventListener("click",startGame);
els.revealBtn.addEventListener("click",revealAnswer);els.correctBtn.addEventListener("click",()=>judge(true));els.wrongBtn.addEventListener("click",()=>judge(false));
els.nextBtn.addEventListener("click",()=>{tone("next");nextQuestion(false)});els.handoffBtn.addEventListener("click",()=>{els.handoff.hidden=true;tone("next");startTimer()});
els.endTrainingBtn.addEventListener("click",endTraining);els.homeBtn.addEventListener("click",()=>{if(confirm("Vuoi uscire dalla partita e tornare alla home?"))goHome()});
els.themeBtn.addEventListener("click",()=>setTheme(state.theme==="dark"?"light":"dark"));els.soundBtn.addEventListener("click",()=>setSound(!state.sound));
els.infoBtn.addEventListener("click",openInfo);els.closeInfo.addEventListener("click",closeInfo);els.restartBtn.addEventListener("click",()=>{closeInfo();goHome()});
els.infoDialog.addEventListener("click",e=>{if(e.target===els.infoDialog)closeInfo()});
document.addEventListener("dblclick",e=>e.preventDefault(),{passive:false});

if(REGION_PATHS.length!==20)console.warn("Carta: attese 20 regioni, trovate",REGION_PATHS.length);
setTheme(state.theme);setSound(state.sound);renderPlayerInputs();loadSetup();updateCategoryOptions();buildMap();
if("serviceWorker" in navigator&&location.protocol.startsWith("http"))navigator.serviceWorker.register("./service-worker.js").catch(()=>{});
