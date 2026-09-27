const REGION_PATHS=[...document.querySelectorAll('.mini-map path')].map(p=>p.getAttribute('d'));
const $=(s,root=document)=>root.querySelector(s);
const $$=(s,root=document)=>[...root.querySelectorAll(s)];

const state={
  mode:"game",players:[],activePlayer:0,perPlayerAsked:[],questionsPerPlayer:10,
  categories:["regions","capitals"],physicalSubs:["seas","lakes","rivers","mountains","volcanoes","islands","coasts"],
  wonderSubs:["monuments","places","archaeology","nature"],direction:"mixed",timerSeconds:0,
  current:null,scores:[],timerId:null,timeLeft:0,timerStartedAt:0,timerStoppedRatio:1,locked:false,
  questionPools:{},sound:localStorage.getItem("italia-sound")!=="off",theme:localStorage.getItem("italia-theme")||"light",
  mapFullscreen:false,mapView:{x:0,y:0,w:1337,h:1600},wonderImageToken:0,repositioning:false
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
  closeInfo:$("#closeInfo"),restartBtn:$("#restartBtn"),studyRegionsBtn:$("#studyRegionsBtn"),studyCapitalsBtn:$("#studyCapitalsBtn"),
  wonderImageCard:$("#wonderImageCard"),wonderImage:$("#wonderImage"),wonderImageFallback:$("#wonderImageFallback"),wonderImageSource:$("#wonderImageSource"),
  gameLayout:$("#gameLayout"),mapFullscreenBtn:$("#mapFullscreenBtn"),mapZoomControls:$("#mapZoomControls"),
  zoomInBtn:$("#zoomInBtn"),zoomOutBtn:$("#zoomOutBtn"),zoomResetBtn:$("#zoomResetBtn")
};

const MAP={lonMin:6.50,lonMax:18.60,latMin:36.30,latMax:47.25,xMin:20,xMax:1310,yMin:35,yMax:1560,kmPerPx:.82};
function geoToMap(lat,lon){
  const x=MAP.xMin+(lon-MAP.lonMin)/(MAP.lonMax-MAP.lonMin)*(MAP.xMax-MAP.xMin);
  const y=MAP.yMin+(MAP.latMax-lat)/(MAP.latMax-MAP.latMin)*(MAP.yMax-MAP.yMin);
  return{x,y};
}

/*
 * La carta del progetto è una carta didattica vettorializzata, non una proiezione
 * geografica perfettamente lineare. Per i capoluoghi di provincia correggiamo
 * quindi la proiezione usando i 20 capoluoghi regionali già calibrati a mano.
 * La correzione è locale (media pesata dei 4 ancoraggi più vicini) e lascia
 * invariata tutta la logica del gioco.
 */
const REGION_GEO_ANCHORS=[
  ["Aosta",45.737,7.321],["Torino",45.070,7.687],["Genova",44.405,8.946],["Milano",45.464,9.190],
  ["Trento",46.074,11.121],["Venezia",45.440,12.315],["Trieste",45.650,13.770],["Bologna",44.494,11.342],
  ["Firenze",43.769,11.255],["Ancona",43.616,13.518],["Perugia",43.110,12.390],["Roma",41.903,12.496],
  ["L'Aquila",42.350,13.399],["Campobasso",41.560,14.668],["Napoli",40.852,14.268],["Bari",41.117,16.871],
  ["Potenza",40.640,15.805],["Catanzaro",38.910,16.588],["Cagliari",39.224,9.122],["Palermo",38.116,13.361]
].map(([name,lat,lon])=>{
  const region=REGIONS.find(r=>r.capital===name);
  const base=geoToMap(lat,lon);
  return{name,lat,lon,dx:region.x-base.x,dy:region.y-base.y};
});

function calibratedCityToMap(lat,lon){
  const base=geoToMap(lat,lon);
  const cos=Math.cos(lat*Math.PI/180);
  const nearest=REGION_GEO_ANCHORS.map(a=>{
    const dx=(lon-a.lon)*cos,dy=lat-a.lat;
    return{a,d2:dx*dx+dy*dy};
  }).sort((u,v)=>u.d2-v.d2).slice(0,4);

  // Se coincide con un ancoraggio regionale, usa esattamente il punto calibrato.
  if(nearest[0]&&nearest[0].d2<1e-10){
    const a=nearest[0].a;
    return{x:base.x+a.dx,y:base.y+a.dy};
  }

  let sum=0,cx=0,cy=0;
  for(const n of nearest){
    const w=1/Math.pow(Math.max(n.d2,0.0025),1.15);
    sum+=w;cx+=n.a.dx*w;cy+=n.a.dy*w;
  }
  return{x:base.x+cx/sum,y:base.y+cy/sum};
}

const CITY_POINT_OFFSETS={
  "Agrigento":{dx:9.17,dy:-29.02},
  "Alessandria":{dx:-5.49,dy:-3.72},
  "Ancona":{dx:-16.9,dy:-21.23},
  "Andria":{dx:-1.48,dy:6.67},
  "Arezzo":{dx:2.62,dy:-7.85},
  "Ascoli Piceno":{dx:-21.37,dy:-12.91},
  "Asti":{dx:5.1,dy:-5.97},
  "Avellino":{dx:0.74,dy:0.77},
  "Bari":{dx:50.02,dy:26.76},
  "Barletta":{dx:16.33,dy:4.88},
  "Belluno":{dx:0,dy:6.72},
  "Benevento":{dx:7.74,dy:2.39},
  "Bergamo":{dx:-4.56,dy:7.79},
  "Biella":{dx:-7.92,dy:-3.71},
  "Bologna":{dx:30.72,dy:-4.26},
  "Bolzano":{dx:-10.06,dy:-2.08},
  "Brescia":{dx:-0.82,dy:5.71},
  "Brindisi":{dx:48.98,dy:26.45},
  "Cagliari":{dx:3.26,dy:-13.86},
  "Caltanissetta":{dx:0.45,dy:-9.37},
  "Campobasso":{dx:28.58,dy:14.67},
  "Carbonia":{dx:7.09,dy:-11.14},
  "Catania":{dx:7.47,dy:-0.75},
  "Catanzaro":{dx:7.19,dy:25.18},
  "Chieti":{dx:9.15,dy:25.95},
  "Como":{dx:-27,dy:-13.6},
  "Cosenza":{dx:-16.82,dy:1.23},
  "Cremona":{dx:0.44,dy:-3.55},
  "Crotone":{dx:-4.63,dy:5.65},
  "Cuneo":{dx:11.33,dy:-6.43},
  "Enna":{dx:-18.69,dy:-68.26},
  "Fermo":{dx:-10.9,dy:-15.35},
  "Ferrara":{dx:12.52,dy:6.72},
  "Firenze":{dx:13.66,dy:6.83},
  "Foggia":{dx:20,dy:-8.65},
  "Forlì":{dx:-0.79,dy:-0.4},
  "Frosinone":{dx:-19.09,dy:-4.96},
  "Genova":{dx:1.55,dy:-30.06},
  "Gorizia":{dx:13.66,dy:8.82},
  "Imperia":{dx:2.01,dy:-27.24},
  "Isernia":{dx:13.78,dy:15.02},
  "L'Aquila":{dx:-6.75,dy:11.8},
  "La Spezia":{dx:-13.45,dy:-32.92},
  "Latina":{dx:-17.68,dy:-15.9},
  "Lecce":{dx:42.42,dy:20.93},
  "Lecco":{dx:-16.5,dy:-3.83},
  "Livorno":{dx:13.63,dy:-8.97},
  "Lodi":{dx:-20.08,dy:-16.45},
  "Lucca":{dx:14.2,dy:-32.59},
  "Macerata":{dx:-5.39,dy:-19.27},
  "Mantova":{dx:-13.31,dy:4.88},
  "Massa":{dx:-2.23,dy:-30.98},
  "Matera":{dx:11.19,dy:16.54},
  "Messina":{dx:-11.76,dy:27.62},
  "Milano":{dx:-35.3,dy:-13.55},
  "Modena":{dx:16.65,dy:0.33},
  "Monza":{dx:-22.26,dy:-12.5},
  "Novara":{dx:-32.11,dy:-11.26},
  "Nuoro":{dx:-2.45,dy:-17.94},
  "Oristano":{dx:12.23,dy:-8.97},
  "Padova":{dx:-17.37,dy:0.48},
  "Palermo":{dx:10.88,dy:-13.67},
  "Parma":{dx:-15.58,dy:-11.87},
  "Pavia":{dx:-44.03,dy:5.51},
  "Perugia":{dx:-7.35,dy:-14.74},
  "Pesaro":{dx:-9.9,dy:-8.14},
  "Pescara":{dx:-5.35,dy:17.62},
  "Piacenza":{dx:-16.79,dy:-0.19},
  "Pisa":{dx:11.71,dy:-21.06},
  "Pistoia":{dx:2.62,dy:-8.68},
  "Pordenone":{dx:4.89,dy:-15.75},
  "Prato":{dx:4.48,dy:-0.81},
  "Ragusa":{dx:2.38,dy:-9.94},
  "Ravenna":{dx:-6.76,dy:0.53},
  "Reggio Calabria":{dx:15.76,dy:25.44},
  "Reggio Emilia":{dx:-1.45,dy:-4.71},
  "Rieti":{dx:-14.46,dy:-1.35},
  "Rimini":{dx:-11.45,dy:-16.45},
  "Roma":{dx:-7.8,dy:-25.21},
  "Rovigo":{dx:-24.26,dy:-12.09},
  "Savona":{dx:5.81,dy:-29.18},
  "Siracusa":{dx:-4.85,dy:-9.71},
  "Sondrio":{dx:-25.37,dy:2.52},
  "Taranto":{dx:30.92,dy:-6.07},
  "Teramo":{dx:-9.51,dy:9.85},
  "Terni":{dx:-18.32,dy:-35.14},
  "Torino":{dx:12.93,dy:0.3},
  "Trani":{dx:14.34,dy:23.27},
  "Trapani":{dx:11.01,dy:-4.86},
  "Trento":{dx:-18.33,dy:26.97},
  "Treviso":{dx:-46.83,dy:-21.12},
  "Trieste":{dx:12.3,dy:7.8},
  "Udine":{dx:4.59,dy:-17.97},
  "Varese":{dx:-32.61,dy:-3.89},
  "Venezia":{dx:-10.99,dy:-39.35},
  "Verbania":{dx:-25.66,dy:-25.61},
  "Vercelli":{dx:-20.99,dy:0.27},
  "Vibo Valentia":{dx:-4.23,dy:48.25},
  "Vicenza":{dx:4.22,dy:-40.62},
  "Viterbo":{dx:-27.9,dy:-5.01}
};
const CITY_CALIBRATION_VERSION="2.2.7";
let USER_CITY_OFFSETS={};
try{
  const localVersion=localStorage.getItem("italia-city-offsets-version");
  if(localVersion===CITY_CALIBRATION_VERSION){
    const saved=JSON.parse(localStorage.getItem("italia-city-offsets")||"{}");
    if(saved&&typeof saved==="object")USER_CITY_OFFSETS=saved;
  }else{
    localStorage.removeItem("italia-city-offsets");
    localStorage.setItem("italia-city-offsets-version",CITY_CALIBRATION_VERSION);
  }
}catch(e){}

function saveUserCityOffsets(){
  localStorage.setItem("italia-city-offsets",JSON.stringify(USER_CITY_OFFSETS));
  localStorage.setItem("italia-city-offsets-version",CITY_CALIBRATION_VERSION);
}
function applyCityOffset(name,p){
  const built=CITY_POINT_OFFSETS[name]||{dx:0,dy:0};
  const user=USER_CITY_OFFSETS[name]||{dx:0,dy:0};
  return{x:p.x+built.dx+user.dx,y:p.y+built.dy+user.dy};
}
function itemXY(item){
  let p;
  if(Number.isFinite(item.x)&&Number.isFinite(item.y))p={x:item.x,y:item.y};
  else if(item.cat==="provinces")p=calibratedCityToMap(item.lat,item.lon);
  else p=geoToMap(item.lat,item.lon);
  return (item.cat==="provinces"||item.cat==="capitals")?applyCityOffset(item.name,p):p;
}
const REGION_CAPITAL_NAMES=new Set(REGIONS.map(r=>r.capital));
const PROVINCE_ONLY=PROVINCES.filter(p=>!REGION_CAPITAL_NAMES.has(p.name));
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
    p.addEventListener("click",ev=>onRegionTap(ev,i));
    p.addEventListener("keydown",ev=>{if(ev.key==="Enter"||ev.key===" "){ev.preventDefault();onRegionTap(ev,i)}});
    els.regionsLayer.appendChild(p);
  });
  els.map.addEventListener("click",onMapTap);
  setupMapGestures();
}

const BASE_VIEW={x:0,y:0,w:1337,h:1600};
let activeMapPointers=new Map(),pinchGesture=null,panGesture=null,suppressMapClickUntil=0;

function applyMapView(view){
  const minW=BASE_VIEW.w/6;
  let w=Math.max(minW,Math.min(BASE_VIEW.w,view.w));
  const ratio=BASE_VIEW.h/BASE_VIEW.w;
  let h=w*ratio;
  if(h>BASE_VIEW.h){h=BASE_VIEW.h;w=h/ratio}
  const x=Math.max(BASE_VIEW.x,Math.min(BASE_VIEW.x+BASE_VIEW.w-w,view.x));
  const y=Math.max(BASE_VIEW.y,Math.min(BASE_VIEW.y+BASE_VIEW.h-h,view.y));
  state.mapView={x,y,w,h};
  els.map.setAttribute("viewBox",x+" "+y+" "+w+" "+h);
  els.zoomResetBtn.textContent=Math.round(BASE_VIEW.w/w*100)+"%";
}
function resetMapView(){applyMapView({...BASE_VIEW})}
function zoomMap(factor,focal=null){
  const v=state.mapView,px=focal?.x??(v.x+v.w/2),py=focal?.y??(v.y+v.h/2);
  const nw=v.w*factor,nh=v.h*factor,rx=(px-v.x)/v.w,ry=(py-v.y)/v.h;
  applyMapView({x:px-rx*nw,y:py-ry*nh,w:nw,h:nh});
}
function toggleMapFullscreen(force){
  const next=typeof force==="boolean"?force:!state.mapFullscreen;
  state.mapFullscreen=next;
  els.gameLayout.classList.toggle("map-fullscreen",next);
  document.body.classList.toggle("map-fullscreen-open",next);
  els.mapZoomControls.hidden=!next;
  els.mapFullscreenBtn.textContent=next?"✕ CHIUDI MAPPA":"⛶ MAPPA";
  resetMapView();
}
function setupMapGestures(){
  els.map.addEventListener("click",ev=>{
    if(Date.now()<suppressMapClickUntil){ev.preventDefault();ev.stopImmediatePropagation()}
  },true);
  els.map.addEventListener("pointerdown",ev=>{
    if(!state.mapFullscreen||ev.pointerType==="pen")return;
    activeMapPointers.set(ev.pointerId,{x:ev.clientX,y:ev.clientY});
    try{els.map.setPointerCapture(ev.pointerId)}catch(e){}
    if(activeMapPointers.size===2){
      const pts=[...activeMapPointers.values()],dx=pts[1].x-pts[0].x,dy=pts[1].y-pts[0].y;
      const midX=(pts[0].x+pts[1].x)/2,midY=(pts[0].y+pts[1].y)/2;
      pinchGesture={distance:Math.hypot(dx,dy),view:{...state.mapView},focal:svgPointFromClient(midX,midY)};
      panGesture=null;suppressMapClickUntil=Date.now()+500;
    }else if(activeMapPointers.size===1&&state.mapView.w<BASE_VIEW.w*.999){
      panGesture={id:ev.pointerId,startX:ev.clientX,startY:ev.clientY,view:{...state.mapView},moved:false};
    }
  });
  els.map.addEventListener("pointermove",ev=>{
    if(!state.mapFullscreen||ev.pointerType==="pen"||!activeMapPointers.has(ev.pointerId))return;
    activeMapPointers.set(ev.pointerId,{x:ev.clientX,y:ev.clientY});
    if(activeMapPointers.size>=2&&pinchGesture){
      ev.preventDefault();
      const pts=[...activeMapPointers.values()].slice(0,2),d=Math.hypot(pts[1].x-pts[0].x,pts[1].y-pts[0].y);
      if(d>10){
        const scale=pinchGesture.distance/d,v=pinchGesture.view,f=pinchGesture.focal||{x:v.x+v.w/2,y:v.y+v.h/2};
        const nw=v.w*scale,nh=v.h*scale,rx=(f.x-v.x)/v.w,ry=(f.y-v.y)/v.h;
        applyMapView({x:f.x-rx*nw,y:f.y-ry*nh,w:nw,h:nh});
        suppressMapClickUntil=Date.now()+500;
      }
    }else if(panGesture&&panGesture.id===ev.pointerId){
      const dx=ev.clientX-panGesture.startX,dy=ev.clientY-panGesture.startY;
      if(Math.hypot(dx,dy)>7)panGesture.moved=true;
      if(panGesture.moved){
        ev.preventDefault();
        const rect=els.map.getBoundingClientRect(),v=panGesture.view;
        applyMapView({x:v.x-dx*(v.w/rect.width),y:v.y-dy*(v.h/rect.height),w:v.w,h:v.h});
        suppressMapClickUntil=Date.now()+350;
      }
    }
  },{passive:false});
  const end=ev=>{
    activeMapPointers.delete(ev.pointerId);
    if(activeMapPointers.size<2)pinchGesture=null;
    if(panGesture?.id===ev.pointerId)panGesture=null;
  };
  els.map.addEventListener("pointerup",end);
  els.map.addEventListener("pointercancel",end);
}
function svgPointFromClient(clientX,clientY){
  const ctm=els.map.getScreenCTM();if(!ctm)return null;
  const p=els.map.createSVGPoint();p.x=clientX;p.y=clientY;
  const r=p.matrixTransform(ctm.inverse());return{x:r.x,y:r.y};
}

function regionPath(i){return $(`.region-shape[data-index="${i}"]`,els.regionsLayer)}
function resetMapVisuals(){
  $(".region-shape",els.regionsLayer).forEach(p=>p.classList.remove("prompt-highlight","correct-highlight","wrong-highlight","dim","study-region-selected"));
  els.markerLayer.innerHTML="";els.lineLayer.innerHTML="";hideWonderImage();
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
  els.scoreboard.hidden=false;els.scoreLabel.hidden=false;els.map.classList.remove("study-mode","study-capitals-mode","study-regions-mode","reposition-mode");els.mapControls.innerHTML="";
  renderScoreboard();nextQuestion(true);
}
function showSetupError(msg){$("#setupError").textContent=msg;tone("bad")}

function startStudyMode(){
  clearTimer();state.mode="study-capitals";state.current=null;state.locked=true;
  els.setupScreen.hidden=true;els.gameScreen.hidden=false;els.finalOverlay.hidden=true;els.handoff.hidden=true;
  els.timerWrap.hidden=true;els.scoreLabel.hidden=true;els.scoreboard.hidden=true;els.endTrainingBtn.hidden=true;
  els.oralControls.hidden=true;els.mapControls.hidden=false;els.judgeControls.hidden=true;els.revealBtn.hidden=true;
  els.map.classList.remove("study-regions-mode");els.map.classList.add("study-mode","study-capitals-mode");resetMapVisuals();
  els.playerLabel.textContent="MODALITÀ STUDIO";els.progressLabel.textContent=`20 regionali · ${PROVINCE_ONLY.length} provinciali`;
  els.promptKicker.textContent="CAPOLUOGHI";els.promptText.textContent="Esplora la carta";
  state.repositioning=false;
  els.promptHint.textContent="Tocca un punto per scoprire il nome della città.";
  els.mapControls.innerHTML=`
    <div class="study-legend">
      <div class="study-legend-row"><span class="legend-dot region"></span> Capoluogo di regione</div>
      <div class="study-legend-row"><span class="legend-dot province"></span> Capoluogo di provincia</div>
    </div>
    <div class="study-edit-actions">
      <button id="repositionBtn" type="button" class="secondary">✥ RIPOSIZIONA</button>
      <button id="exportPositionsBtn" type="button" class="secondary">⬆ ESPORTA POSIZIONI</button>
      <button id="resetPositionsBtn" type="button" class="secondary">↶ RIPRISTINA</button>
    </div>`;
  $("#repositionBtn").addEventListener("click",toggleRepositionMode);
  $("#exportPositionsBtn").addEventListener("click",exportSavedCityPositions);
  $("#resetPositionsBtn").addEventListener("click",resetSavedCityPositions);
  hideResult();renderStudyCapitals();
}
function startStudyRegions(){
  clearTimer();state.mode="study-regions";state.current=null;state.locked=true;state.repositioning=false;
  els.setupScreen.hidden=true;els.gameScreen.hidden=false;els.finalOverlay.hidden=true;els.handoff.hidden=true;
  els.timerWrap.hidden=true;els.scoreLabel.hidden=true;els.scoreboard.hidden=true;els.endTrainingBtn.hidden=true;
  els.oralControls.hidden=true;els.mapControls.hidden=false;els.judgeControls.hidden=true;els.revealBtn.hidden=true;
  els.map.classList.remove("study-capitals-mode","reposition-mode");
  els.map.classList.add("study-mode","study-regions-mode");
  resetMapVisuals();
  els.playerLabel.textContent="MODALITÀ STUDIO";els.progressLabel.textContent="20 regioni";
  els.promptKicker.textContent="REGIONI";els.promptText.textContent="Esplora la carta";
  els.promptHint.textContent="Tocca una regione per scoprirne il nome.";
  els.mapControls.innerHTML=`<div class="study-regions-note">Tocca una regione: si colorerà e comparirà il suo nome. Toccandone un'altra, la precedente tornerà normale.</div>`;
  hideResult();
}
function showStudyRegion(idx){
  $(".region-shape",els.regionsLayer).forEach(p=>p.classList.remove("study-region-selected"));
  const p=regionPath(idx);if(!p)return;
  p.classList.add("study-region-selected");
  els.resultBox.hidden=false;els.resultTitle.textContent=REGIONS[idx].name;
  els.resultText.textContent="Regione italiana";els.nextBtn.hidden=true;tone("click");
}

function renderStudyCapitals(){
  els.markerLayer.innerHTML="";
  REGIONS.forEach(r=>{const p=applyCityOffset(r.capital,{x:r.x,y:r.y});addStudyMarker({name:r.capital,x:p.x,y:p.y,type:"region"})});
  PROVINCE_ONLY.forEach(p=>{const xy=itemXY(p);addStudyMarker({name:p.name,x:xy.x,y:xy.y,type:"province"})});
}
function toggleRepositionMode(){
  state.repositioning=!state.repositioning;
  els.map.classList.toggle("reposition-mode",state.repositioning);
  const b=$("#repositionBtn");
  if(b)b.textContent=state.repositioning?"✓ FINE RIPOSIZIONA":"✥ RIPOSIZIONA";
  els.promptHint.textContent=state.repositioning
    ?"Trascina un puntino nella posizione corretta: al rilascio viene memorizzato su questo dispositivo."
    :"Tocca un punto per scoprire il nome della città.";
  if(state.repositioning){
    els.resultBox.hidden=false;els.resultTitle.textContent="Riposizionamento attivo";
    els.resultText.textContent="Trascina i capoluoghi con dito o Apple Pencil. Le correzioni valgono anche nelle domande del gioco.";
    els.nextBtn.hidden=true;
  }else hideResult();
}
async function exportSavedCityPositions(){
  const names=Object.keys(USER_CITY_OFFSETS);
  if(!names.length){
    els.resultBox.hidden=false;els.resultTitle.textContent="Nessuna correzione da esportare";
    els.resultText.textContent="Prima riposiziona almeno un capoluogo.";els.nextBtn.hidden=true;return;
  }

  const cities=names.sort((a,b)=>a.localeCompare(b,"it")).map(name=>{
    const regional=REGIONS.find(r=>r.capital===name);
    const provincial=PROVINCES.find(p=>p.name===name);
    let base;
    if(regional)base={x:regional.x,y:regional.y};
    else if(provincial)base=calibratedCityToMap(provincial.lat,provincial.lon);
    else base={x:0,y:0};
    const built=CITY_POINT_OFFSETS[name]||{dx:0,dy:0};
    const user=USER_CITY_OFFSETS[name]||{dx:0,dy:0};
    return{
      name,
      dx:+user.dx.toFixed(2),
      dy:+user.dy.toFixed(2),
      x:+(base.x+built.dx+user.dx).toFixed(2),
      y:+(base.y+built.dy+user.dy).toFixed(2)
    };
  });

  const payload={
    app:"ITALIA!",
    type:"city-position-calibration",
    version:"2.2.7",
    exportedAt:new Date().toISOString(),
    cities
  };
  const text=JSON.stringify(payload,null,2);
  const file=new File([text],"italia-coordinate-capoluoghi.json",{type:"application/json"});

  try{
    if(navigator.canShare&&navigator.canShare({files:[file]})&&navigator.share){
      await navigator.share({files:[file],title:"ITALIA! – coordinate capoluoghi",text:"Coordinate corrette dei capoluoghi"});
      els.resultBox.hidden=false;els.resultTitle.textContent="Coordinate pronte";
      els.resultText.textContent="Condividi o salva il file e poi allegalo nella chat: potrò trasferire le correzioni nella versione GitHub.";
      els.nextBtn.hidden=true;return;
    }
  }catch(e){
    if(e?.name==="AbortError")return;
  }

  const blob=new Blob([text],{type:"application/json"});
  const url=URL.createObjectURL(blob),a=document.createElement("a");
  a.href=url;a.download="italia-coordinate-capoluoghi.json";
  document.body.appendChild(a);a.click();a.remove();
  setTimeout(()=>URL.revokeObjectURL(url),1500);
  els.resultBox.hidden=false;els.resultTitle.textContent="Coordinate esportate";
  els.resultText.textContent="Allega qui il file italia-coordinate-capoluoghi.json: potrò inserirle nella versione GitHub.";
  els.nextBtn.hidden=true;
}

function resetSavedCityPositions(){
  if(!Object.keys(USER_CITY_OFFSETS).length){
    els.resultBox.hidden=false;els.resultTitle.textContent="Nessuna correzione salvata";
    els.resultText.textContent="I puntini stanno già usando le posizioni predefinite dell'app.";els.nextBtn.hidden=true;return;
  }
  if(!confirm("Vuoi cancellare tutte le correzioni manuali dei capoluoghi salvate su questo dispositivo?"))return;
  USER_CITY_OFFSETS={};localStorage.removeItem("italia-city-offsets");renderStudyCapitals();
  els.resultBox.hidden=false;els.resultTitle.textContent="Posizioni ripristinate";
  els.resultText.textContent="Sono tornate le posizioni predefinite dell'app.";els.nextBtn.hidden=true;
}
function addStudyMarker(city){
  const g=document.createElementNS("http://www.w3.org/2000/svg","g");
  g.setAttribute("class",`study-marker ${city.type}`);
  g.setAttribute("tabindex","0");g.setAttribute("role","button");
  g.setAttribute("aria-label",state.repositioning?"Trascina "+city.name:"Scopri il nome del capoluogo");
  g.dataset.city=city.name;
  const c=document.createElementNS("http://www.w3.org/2000/svg","circle");
  c.setAttribute("cx",city.x);c.setAttribute("cy",city.y);c.setAttribute("r",city.type==="region"?12:8);g.appendChild(c);

  let drag=null;
  g.addEventListener("pointerdown",ev=>{
    if(!state.repositioning)return;
    ev.preventDefault();ev.stopPropagation();
    const p=svgPointFromClient(ev.clientX,ev.clientY);if(!p)return;
    drag={pointerId:ev.pointerId,startPointer:p,startCity:{x:+c.getAttribute("cx"),y:+c.getAttribute("cy")},moved:false};
    try{g.setPointerCapture(ev.pointerId)}catch(e){}
    g.classList.add("dragging");
  });
  g.addEventListener("pointermove",ev=>{
    if(!state.repositioning||!drag||drag.pointerId!==ev.pointerId)return;
    ev.preventDefault();ev.stopPropagation();
    const p=svgPointFromClient(ev.clientX,ev.clientY);if(!p)return;
    const dx=p.x-drag.startPointer.x,dy=p.y-drag.startPointer.y;
    if(Math.hypot(dx,dy)>1.5)drag.moved=true;
    c.setAttribute("cx",drag.startCity.x+dx);c.setAttribute("cy",drag.startCity.y+dy);
  });
  const finishDrag=ev=>{
    if(!drag||drag.pointerId!==ev.pointerId)return;
    ev.preventDefault();ev.stopPropagation();
    const nx=+c.getAttribute("cx"),ny=+c.getAttribute("cy");
    if(drag.moved){
      const old=USER_CITY_OFFSETS[city.name]||{dx:0,dy:0};
      USER_CITY_OFFSETS[city.name]={dx:old.dx+(nx-drag.startCity.x),dy:old.dy+(ny-drag.startCity.y)};
      saveUserCityOffsets();
      city.x=nx;city.y=ny;
      els.resultBox.hidden=false;els.resultTitle.textContent=city.name+" riposizionata";
      els.resultText.textContent="Nuova posizione memorizzata su questo dispositivo.";els.nextBtn.hidden=true;tone("click");
    }
    drag=null;g.classList.remove("dragging");
  };
  g.addEventListener("pointerup",finishDrag);g.addEventListener("pointercancel",finishDrag);

  const show=ev=>{
    if(state.repositioning)return;
    ev.preventDefault();ev.stopPropagation();showStudyCity(city);
  };
  g.addEventListener("click",show);
  g.addEventListener("keydown",ev=>{if(!state.repositioning&&(ev.key==="Enter"||ev.key===" "))show(ev)});
  els.markerLayer.appendChild(g);
}
function showStudyCity(city){
  els.resultBox.hidden=false;els.resultTitle.textContent=city.name;
  els.resultText.textContent=city.type==="region"?"Capoluogo di regione":"Capoluogo di provincia";
  els.nextBtn.hidden=true;tone("click");
}

function regionItems(){return REGIONS.map((r,i)=>({id:`region-${i}`,name:r.name,kind:"region",cat:"regions",regionIndex:i,region:r}))}
function capitalItems(){return REGIONS.map((r,i)=>{const p=applyCityOffset(r.capital,{x:r.x,y:r.y});return{id:`capital-${i}`,name:r.capital,kind:"point",cat:"capitals",x:p.x,y:p.y,region:r,tolerance:8,maxDistance:250}})}
function getCandidates(cat){
  if(cat==="regions")return regionItems();
  if(cat==="capitals")return capitalItems();
  if(cat==="provinces")return PROVINCE_ONLY;
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
  if(q.cat==="wonders")loadWonderImage(q.item);
  if(q.dir==="nameToMap"){
    els.oralControls.hidden=true;els.mapControls.hidden=false;els.promptText.textContent=`Trova ${q.item.name}`;
    els.promptHint.textContent=q.cat==="regions"?"Tocca o clicca la regione sulla carta.":locateHint(q.item);
  }else{
    els.oralControls.hidden=false;els.mapControls.hidden=true;els.revealBtn.hidden=false;els.promptText.textContent=oralPrompt(q);
    els.promptHint.textContent="Dì la risposta a voce, poi premi “Mostra risposta”.";
    if(q.item.kind==="region")regionPath(q.item.regionIndex)?.classList.add("prompt-highlight");else showTargetFeature(q.item,"?",false);
  }
}
function hideWonderImage(){
  state.wonderImageToken=(state.wonderImageToken||0)+1;els.wonderImageCard.hidden=true;els.wonderImage.hidden=true;els.wonderImage.removeAttribute("src");els.wonderImageSource.hidden=true;els.wonderImageSource.removeAttribute("href");
}
function wonderFallbackEmoji(sub){return({monuments:"🏛️",places:"🏘️",archaeology:"🏺",nature:"🏞️"})[sub]||"🇮🇹"}

/*
 * Le Meraviglie non usano più una ricerca libera su Wikipedia:
 * ogni voce è collegata a una pagina precisa. In questo modo, per esempio,
 * "Torre di Pisa" non può più mostrare una foto generica della città di Pisa.
 */
const WONDER_WIKI_TITLES={
  "wonder-colosseo":"Colosseo",
  "wonder-san-pietro":"Basilica di San Pietro in Vaticano",
  "wonder-trevi":"Fontana di Trevi",
  "wonder-duomo-milano":"Duomo di Milano",
  "wonder-mole":"Mole Antonelliana",
  "wonder-san-marco":"Piazza San Marco",
  "wonder-arena-verona":"Arena di Verona",
  "wonder-torre-pisa":"Torre pendente di Pisa",
  "wonder-duomo-firenze":"Cattedrale di Santa Maria del Fiore",
  "wonder-ponte-vecchio":"Ponte Vecchio",
  "wonder-reggia-caserta":"Reggia di Caserta",
  "wonder-castel-del-monte":"Castel del Monte",
  "wonder-assisi":"Basilica di San Francesco (Assisi)",
  "wonder-san-nicola":"Basilica di San Nicola",
  "wonder-santa-croce":"Basilica di Santa Croce (Lecce)",
  "wonder-palazzo-ducale-urbino":"Palazzo Ducale (Urbino)",
  "wonder-san-vitale":"Basilica di San Vitale",
  "wonder-campo-siena":"Piazza del Campo",
  "wonder-cinque-terre":"Cinque Terre",
  "wonder-portofino":"Portofino",
  "wonder-venezia":"Venezia",
  "wonder-san-gimignano":"San Gimignano",
  "wonder-civita":"Civita di Bagnoregio",
  "wonder-sassi-matera":"Sassi di Matera",
  "wonder-alberobello":"Trulli di Alberobello",
  "wonder-positano":"Positano",
  "wonder-amalfi":"Amalfi",
  "wonder-taormina":"Taormina",
  "wonder-erice":"Erice",
  "wonder-orvieto":"Orvieto",
  "wonder-burano":"Burano",
  "wonder-pompei":"Scavi archeologici di Pompei",
  "wonder-ercolano":"Scavi archeologici di Ercolano",
  "wonder-valle-templi":"Valle dei Templi",
  "wonder-teatro-taormina":"Teatro antico di Taormina",
  "wonder-su-nuraxi":"Su Nuraxi",
  "wonder-paestum":"Paestum",
  "wonder-ostia-antica":"Ostia (città antica)",
  "wonder-villa-adriana":"Villa Adriana",
  "wonder-cerveteri":"Necropoli della Banditaccia",
  "wonder-selinunte":"Selinunte",
  "wonder-neapolis":"Parco archeologico della Neapolis",
  "wonder-tre-cime":"Tre Cime di Lavaredo",
  "wonder-braies":"Lago di Braies",
  "wonder-marmore":"Cascata delle Marmore",
  "wonder-gran-paradiso":"Parco nazionale del Gran Paradiso",
  "wonder-frasassi":"Grotte di Frasassi",
  "wonder-castellana":"Grotte di Castellana",
  "wonder-scala-turchi":"Scala dei Turchi",
  "wonder-costa-smeralda":"Costa Smeralda",
  "wonder-cala-goloritze":"Cala Goloritzé",
  "wonder-stromboli":"Stromboli",
  "wonder-etna":"Etna",
  "wonder-vesuvio":"Vesuvio"
};

async function loadWonderImage(item){
  const token=(state.wonderImageToken||0)+1;
  state.wonderImageToken=token;
  els.wonderImageCard.hidden=false;
  els.wonderImage.hidden=true;
  els.wonderImageFallback.hidden=false;
  els.wonderImageFallback.textContent=wonderFallbackEmoji(item.sub);
  els.wonderImageSource.hidden=true;

  try{
    const wikiTitle=WONDER_WIKI_TITLES[item.id]||item.name;
    const qs=new URLSearchParams({
      action:"query",
      origin:"*",
      format:"json",
      redirects:"1",
      titles:wikiTitle,
      prop:"pageimages|info",
      piprop:"thumbnail",
      pithumbsize:"640",
      inprop:"url"
    });
    const res=await fetch("https://it.wikipedia.org/w/api.php?"+qs.toString());
    if(!res.ok)throw new Error("image page");
    const json=await res.json();
    if(token!==state.wonderImageToken)return;

    const pages=Object.values(json.query?.pages||{});
    const page=pages.find(p=>!p.missing&&p.thumbnail?.source);
    if(!page?.thumbnail?.source)throw new Error("no exact image");

    els.wonderImage.onload=()=>{
      if(token===state.wonderImageToken){
        els.wonderImage.hidden=false;
        els.wonderImageFallback.hidden=true;
      }
    };
    els.wonderImage.onerror=()=>{
      els.wonderImage.hidden=true;
      els.wonderImageFallback.hidden=false;
    };
    els.wonderImage.src=page.thumbnail.source;
    els.wonderImage.alt="Foto: "+item.name;
    els.wonderImageSource.href=page.fullurl||("https://it.wikipedia.org/wiki/"+encodeURIComponent(wikiTitle.replace(/ /g,"_")));
    els.wonderImageSource.hidden=false;
  }catch(e){
    if(token===state.wonderImageToken){
      // Meglio nessuna foto che una foto sbagliata.
      els.wonderImage.hidden=true;
      els.wonderImageFallback.hidden=false;
      els.wonderImageSource.hidden=true;
    }
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
  if(state.mode==="study-regions"){ev.preventDefault();showStudyRegion(idx);return}
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
function svgPointFromEvent(ev){const r=svgPointFromClient(ev.clientX,ev.clientY);if(!r||r.x<0||r.x>1337||r.y<0||r.y>1600)return null;return r;}
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
function goHome(){clearTimer();state.repositioning=false;els.map.classList.remove("reposition-mode");toggleMapFullscreen(false);els.gameScreen.hidden=true;els.finalOverlay.hidden=true;els.handoff.hidden=true;els.setupScreen.hidden=false;els.scoreboard.hidden=false;els.scoreLabel.hidden=false;els.map.classList.remove("study-mode","study-capitals-mode","study-regions-mode");els.mapControls.innerHTML="";resetMapVisuals()}
function openInfo(){els.infoDialog.showModal?els.infoDialog.showModal():els.infoDialog.setAttribute("open","")}
function closeInfo(){els.infoDialog.close?els.infoDialog.close():els.infoDialog.removeAttribute("open")}

els.playersCount.addEventListener("change",()=>{renderPlayerInputs();saveSetup()});
els.questions.addEventListener("change",saveSetup);els.timer.addEventListener("change",saveSetup);
els.training.addEventListener("change",()=>{updateTrainingUI();saveSetup()});
[els.categoryRegion,els.categoryCapitals,els.categoryProvinces,els.categoryPhysical,els.categoryWonders].forEach(el=>el.addEventListener("change",()=>{updateCategoryOptions();saveSetup()}));
$$(".subcat-physical,.subcat-wonders").forEach(el=>el.addEventListener("change",saveSetup));
els.direction.addEventListener("change",saveSetup);els.playerNames.addEventListener("input",saveSetup);els.start.addEventListener("click",startGame);els.studyRegionsBtn?.addEventListener("click",startStudyRegions);els.studyCapitalsBtn.addEventListener("click",startStudyMode);
els.mapFullscreenBtn.addEventListener("click",()=>toggleMapFullscreen());
els.zoomInBtn.addEventListener("click",()=>zoomMap(.75));
els.zoomOutBtn.addEventListener("click",()=>zoomMap(1.333333));
els.zoomResetBtn.addEventListener("click",resetMapView);
els.revealBtn.addEventListener("click",revealAnswer);els.correctBtn.addEventListener("click",()=>judge(true));els.wrongBtn.addEventListener("click",()=>judge(false));
els.nextBtn.addEventListener("click",()=>{tone("next");nextQuestion(false)});els.handoffBtn.addEventListener("click",()=>{els.handoff.hidden=true;tone("next");startTimer()});
els.endTrainingBtn.addEventListener("click",endTraining);els.homeBtn.addEventListener("click",()=>{if(state.mode.startsWith("study")||confirm("Vuoi uscire dalla partita e tornare alla home?"))goHome()});
els.themeBtn.addEventListener("click",()=>setTheme(state.theme==="dark"?"light":"dark"));els.soundBtn.addEventListener("click",()=>setSound(!state.sound));
els.infoBtn.addEventListener("click",openInfo);els.closeInfo.addEventListener("click",closeInfo);els.restartBtn.addEventListener("click",()=>{closeInfo();goHome()});
els.infoDialog.addEventListener("click",e=>{if(e.target===els.infoDialog)closeInfo()});
document.addEventListener("dblclick",e=>e.preventDefault(),{passive:false});
document.addEventListener("keydown",e=>{if(e.key==="Escape"&&state.mapFullscreen)toggleMapFullscreen(false)});

if(REGION_PATHS.length!==20)console.warn("Carta: attese 20 regioni, trovate",REGION_PATHS.length);
setTheme(state.theme);setSound(state.sound);renderPlayerInputs();loadSetup();updateCategoryOptions();buildMap();
if("serviceWorker" in navigator&&location.protocol.startsWith("http"))navigator.serviceWorker.register("./service-worker.js").catch(()=>{});
