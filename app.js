(() => {
'use strict';
const DATA_KEY='calistenia_plus_v1';
const PHOTO_JSON='https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/dist/exercises.json';
const VIDEO_BASE='https://cdn.jsdelivr.net/gh/namnq/workout-free-videos@v2.0.0/';
const VIDEO_JSON=VIDEO_BASE+'data/exercises.json';
const MAIN=document.querySelector('#main-content');
const MODAL=document.querySelector('#modal-root');
const NAV=[...document.querySelectorAll('.nav-item')];
const GROUPS=['Todos','Pecho','Espalda','Piernas','Glúteos','Core','Hombros','Tríceps','Movilidad'];
const DAYS=['L','M','X','J','V','S','D'];
const LEVELS={beginner:'Inicial',intermediate:'Medio',advanced:'Avanzado'};
const GEAR_LABEL={none:'Sin material',bar:'Barra',bars:'Paralelas',bench:'Banco o apoyo'};
const EXTRAS={
  'Bird_Dog':{name:'Bird dog',muscle:'Core'},
  'Sit-Up':{name:'Abdominal completo',muscle:'Core'},
  'Bodyweight_Squat':{name:'Sentadilla libre',muscle:'Piernas'},
  'Pushups':{name:'Flexiones',muscle:'Pecho'},
  'Plank':{name:'Plancha frontal',muscle:'Core'},
  'Pullups':{name:'Dominadas pronas',muscle:'Espalda'},
  'Glute_Bridge':{name:'Puente de glúteos',muscle:'Glúteos'}
};
const VIDEO_PHOTO_LINK={
  'wide-grip-pull-up':'Pullups','sit-up':'3_4_Sit-Up','lying-floor-leg-raise':'Leg_Lift',
  'superman':'Hyperextensions_With_No_Hyperextension_Bench',
  'nordic-hamstring-curl':'Natural_Glute_Ham_Raise'
};
const SAFE_URL = s => typeof s==='string' && /^https:\/\/(cdn\.jsdelivr\.net|raw\.githubusercontent\.com)\//.test(s);
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const max=(n,lo,hi)=>Math.max(lo,Math.min(hi,Number(n)||0));
const dKey=(date=new Date())=>[date.getFullYear(),String(date.getMonth()+1).padStart(2,'0'),String(date.getDate()).padStart(2,'0')].join('-');
const df=(date)=>new Intl.DateTimeFormat('es-ES',{day:'numeric',month:'short'}).format(new Date(date+'T12:00:00'));
const read=()=>{try{let r=JSON.parse(localStorage.getItem(DATA_KEY)||'{}');return typeof r==='object'&&r?r:{}}catch{return {}}};
let saved=read();
const state={tab:'home',view:'',group:'Todos',search:'',level:'all',gear:'all',onlyVideo:false,progressId:'',profile:saved.profile||null,records:Array.isArray(saved.records)?saved.records:[],weights:Array.isArray(saved.weights)?saved.weights:[],draft:saved.draft||null,custom:saved.custom||{},catalog:[...window.LOCAL_EXERCISES],loadedSources:[],isLoaded:false,workoutRpe:7,restUntil:0};
let toastTimeout;
const persist=()=>{try{localStorage.setItem(DATA_KEY,JSON.stringify({profile:state.profile,records:state.records.slice(-300),weights:state.weights.slice(-400),draft:state.draft,custom:state.custom}))}catch{toast('Almacenamiento lleno; exporta tus datos')}};
const toast=message=>{const e=document.querySelector('#toast');e.textContent=message;e.classList.add('show');clearTimeout(toastTimeout);toastTimeout=setTimeout(()=>e.classList.remove('show'),2800)};
const icon=(name)=>({time:'◷',check:'✓',arrow:'→',flash:'⚡',play:'▶',success:'✦'}[name]||name);
const photo=e=>SAFE_URL(e.photo)?`<img class="thumb" loading="lazy" src="${esc(e.photo)}" alt="Demostración de ${esc(e.name)}" onerror="this.style.display='none';this.nextElementSibling?.classList.remove('hidden')"><span class="img-placeholder hidden" style="width:73px;height:68px">◈</span>`:`<div class="thumb img-placeholder">◈</div>`;
const cardMedia=e=>SAFE_URL(e.photo)?`<img class="ex-img" src="${esc(e.photo)}" alt="${esc(e.name)}" loading="lazy" onerror="this.classList.add('broken-photo')">`:`<div class="ex-img img-placeholder">${e.video?'▶':'◈'}</div>`;
const videoAvailable=e=>SAFE_URL(e.video);
const getEx=id=>state.catalog.find(e=>e.id===id)||window.LOCAL_EXERCISES.find(e=>e.id===id);
const applyProfileDefaults=()=>state.profile||{level:'beginner',days:3,goal:'general',gear:'none',avoid:'',age:'',weight:'',height:'',pushups:8,plank:25};
function bodyGroup(primary,region){const v=(String(primary||'')+' '+String(region||'')).toLowerCase();if(/abdom|core|oblique|waist|abs/.test(v))return'Core';if(/chest|pectoral/.test(v))return'Pecho';if(/shoulder|deltoid/.test(v))return'Hombros';if(/tricep/.test(v))return'Tríceps';if(/back|latissimus|trap|bicep/.test(v))return'Espalda';if(/glute|hip/.test(v))return'Glúteos';if(/quadricep|hamstring|calf|thigh|leg|lower/.test(v))return'Piernas';return'Movilidad'}
function mapEquipment(eq){if(/body only|bodyweight/i.test(String(eq||'')))return'none';if(/pullupbar/i.test(String(eq||'')))return'bar';if(/dipbars/i.test(String(eq||'')))return'bars';if(/bench/i.test(String(eq||'')))return'bench';return'none'}
const normalize=s=>String(s||'').toLowerCase().replace(/[^a-z0-9]+/g,'');
async function loadCatalog(){
  const requests=await Promise.allSettled([
    fetch(PHOTO_JSON,{cache:'force-cache'}).then(r=>{if(!r.ok)throw Error(r.status);return r.json()}),
    fetch(VIDEO_JSON,{cache:'force-cache'}).then(r=>{if(!r.ok)throw Error(r.status);return r.json()})
  ]);
  const existing=new Map(state.catalog.map(e=>[e.id,e]));
  if(requests[0].status==='fulfilled'&&Array.isArray(requests[0].value)){
    let count=0;
    for(const x of requests[0].value.filter(x=>x.equipment==='body only')){
      if(!Array.isArray(x.images)||!x.images[0])continue;
      const id=x.id,cur=existing.get(id);
      const fallback={id,name:EXTRAS[id]?.name||x.name,en:x.name,muscle:EXTRAS[id]?.muscle||bodyGroup((x.primaryMuscles||[]).join(' ')),level:x.level||'beginner',equipment:mapEquipment(x.equipment),type:/stretch/i.test(x.category)?'seconds':'reps',cue:(x.instructions||[])[0]||'Realiza el movimiento de forma controlada.',instructions:x.instructions||[],jointStress:'',photo:'https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/'+x.images[0].split('/').map(encodeURIComponent).join('/'),source:'photo'};
      if(cur)existing.set(id,{...fallback,...cur,photo:fallback.photo,instructions:cur.instructions?.[0]===cur.cue?cur.instructions:(x.instructions||cur.instructions)}); else existing.set(id,fallback);
      count++;
    }
    state.loadedSources.push(`Fotografías: ${count}`);
  }
  // Semillas CC0: estas demostraciones siguen disponibles aunque falle la carga del índice remoto.
  for(const [slug,name,muscle,level,equipment,type,jointStress,cue] of (window.VIDEO_SEEDS||[])){
    const linked=VIDEO_PHOTO_LINK[slug];
    const target=linked&&existing.get(linked);
    const video=VIDEO_BASE+'media/video/'+slug+'.mp4';
    if(target) existing.set(linked,{...target,video, jointStress:target.jointStress||jointStress});
    else existing.set('vid-'+slug,{id:'vid-'+slug,name,en:slug.replace(/-/g,' '),muscle,level,equipment,type,cue,jointStress,video,source:'video',instructions:[cue]});
  }
  if(requests[1].status==='fulfilled'&&Array.isArray(requests[1].value)){
    let vcount=0;
    for(const x of requests[1].value){
      if(!Array.isArray(x.equipment)||!x.equipment.every(q=>['bodyweight','pullupBar','dipBars','bench'].includes(q)))continue;
      const path=x.video?.path;
      if(!path||!/^media\/video\/[a-z0-9-]+\.mp4$/.test(path))continue;
      let linked=VIDEO_PHOTO_LINK[x.slug];
      if(!linked){const match=[...existing.values()].find(e=>normalize(e.en)===normalize(x.name));linked=match?.id}
      const target=linked&&existing.get(linked);
      const vid=VIDEO_BASE+path;
      if(target && !target.video){existing.set(linked,{...target,video:vid,cue:target.cue||x.translations?.es?.cues?.[0]});}
      else if(!target){const localId='vid-'+x.slug;existing.set(localId,{id:localId,name:x.translations?.es?.name||x.name,en:x.name,muscle:bodyGroup(x.primaryMuscle,x.region),level:x.level||'beginner',equipment:x.equipment.includes('pullupBar')?'bar':x.equipment.includes('dipBars')?'bars':x.equipment.includes('bench')?'bench':'none',type:x.type==='mobility'||x.type==='recovery'?'seconds':'reps',cue:x.translations?.es?.cues?.[0]||x.cues?.[0]||'Mantén el movimiento controlado.',instructions:x.translations?.es?.cues||x.cues||[],jointStress:Array.isArray(x.jointStress)?x.jointStress.join(','):'',photo:VIDEO_PHOTO_LINK[x.slug]?existing.get(VIDEO_PHOTO_LINK[x.slug])?.photo:'',video:vid,source:'video'});}
      vcount++;
    }
    state.loadedSources.push(`Vídeos: ${vcount}`);
  }
  state.catalog=[...existing.values()];state.isLoaded=true;
  render();
}
function gearAllowed(e,profile=applyProfileDefaults()){
  const gear=profile.gear||'none';
  const have=gear==='full'?['none','bench','bar','bars']:gear==='bar'?['none','bar']:gear==='bench'?['none','bench']:gear==='bars'?['none','bar','bars']:['none'];
  return have.includes(e.equipment||'none');
}
function stressAllowed(e,profile=applyProfileDefaults()){
  const avoid=(profile.avoid||'').split(',').filter(Boolean);
  return !avoid.some(j=>(e.jointStress||'').toLowerCase().includes(j.toLowerCase()));
}
function dayNumbers(n){return {2:[0,3],3:[0,2,4],4:[0,1,3,5],5:[0,1,2,4,5],6:[0,1,2,3,4,5]}[n]||[0,2,4]}
function currentWeekDays(){const date=new Date(),offset=(date.getDay()+6)%7,monday=new Date(date.getFullYear(),date.getMonth(),date.getDate()-offset);return DAYS.map((w,i)=>{const d=new Date(monday);d.setDate(monday.getDate()+i);return{w,i,date:dKey(d),day:d.getDate(),today:dKey(d)===dKey(),active:dayNumbers(Number(applyProfileDefaults().days)||3).includes(i)}})}
function trainingDates(){return [...new Set(state.records.map(x=>x.date))]}
function weeklySessions(){const start=new Date(),dow=(start.getDay()+6)%7;start.setHours(0,0,0,0);start.setDate(start.getDate()-dow);return state.records.filter(r=>new Date(r.date+'T12:00:00')>=start).length}
function streak(){const days=new Set(trainingDates());let n=0,dt=new Date();dt.setHours(12,0,0,0);if(!days.has(dKey(dt)))dt.setDate(dt.getDate()-1);while(days.has(dKey(dt))){n++;dt.setDate(dt.getDate()-1)}return n}
function lastOf(id){for(let i=state.records.length-1;i>=0;i--){let ex=state.records[i].exercises?.find(e=>e.id===id);if(ex)return ex}return null}
function baseTarget(ex,profile=applyProfileDefaults()){
  const lv=profile.level||'beginner';
  const multiplier=profile.goal==='endurance'?1.25:profile.goal==='strength'?0.8:1;
  let base=ex.type==='seconds'?(lv==='advanced'?50:lv==='intermediate'?35:20):(lv==='advanced'?12:lv==='intermediate'?10:8);
  if(ex.id==='Pushups'&&Number(profile.pushups)>0)base=max(Math.round(profile.pushups*.65),3,15);
  if(ex.id==='Plank'&&Number(profile.plank)>0)base=max(Math.round(profile.plank*.65),10,90);
  if(profile.goal==='mobility'&&ex.type==='seconds')base=Math.round(base*1.2);
  return max(Math.round(base*multiplier),ex.type==='seconds'?10:3,ex.type==='seconds'?120:20);
}
function recommendation(ex){
  let old=lastOf(ex.id),amount=baseTarget(ex),reason='Punto de partida según tu nivel.';
  if(old){
    const recent=(old.sets||[]).filter(s=>s.done);
    let minDone=recent.length?Math.min(...recent.map(s=>Number(s.value)||0)):0;
    let count=Number(old.target)||amount;
    const satisfied=recent.length>=Math.min(Number(old.plannedSets)||3,2)&&recent.every(s=>Number(s.value)>=count);
    if(satisfied&&Number(old.rpe)<=7){amount=Math.min(ex.type==='seconds'?180:20,count+(ex.type==='seconds'?5:1));reason='Completaste el objetivo con esfuerzo moderado: aumentamos ligeramente.'}
    else if(Number(old.rpe)>=9||minDone<count-2){amount=Math.max(ex.type==='seconds'?10:3,count-(ex.type==='seconds'?5:1));reason='La última sesión fue exigente: reducimos un poco.'}
    else {amount=count;reason='Consolidamos tu objetivo antes de aumentar.'}
  }
  return{amount,reason};
}
const ALTERNATIVES={
  'Incline_Push-Up':['Pushups','Pushups'],
  'Pullups':['Bird_Dog','Dead_Bug','Rear_Leg_Raises'],
  'Dips_-_Triceps_Version':['Body_Tricep_Press','Pushups'],
  'Bench_Dips':['Pushups','Body_Tricep_Press'],
  'Bodyweight_Squat':['Butt_Lift_Bridge','Rear_Leg_Raises'],
  'Inchworm':['Dead_Bug','Butt_Lift_Bridge'],
  'Plank':['Reverse_Crunch','Butt_Lift_Bridge'],
  'Pushups':['Butt_Lift_Bridge','Dead_Bug']
};
const PLANS={
  A:['Pushups','Bodyweight_Squat','Butt_Lift_Bridge','Plank','Dead_Bug'],
  B:['Pullups','Incline_Push-Up','Glute_Kickback','Reverse_Crunch','Side_Bridge'],
  C:['Push-Ups_-_Close_Triceps_Position','Bodyweight_Squat','Inchworm','Air_Bike','Plank'],
  D:['Chin-Up','Push-Up_Wide','Rear_Leg_Raises','Russian_Twist','Side_Bridge']
};
function resolvedPlan(name){
  const profile=applyProfileDefaults();const n=profile.level==='beginner'?4:5;
  const ids=state.custom[name]||PLANS[name]||PLANS.A;
  const seen=new Set();
  return ids.flatMap(id=>{
    let ex=getEx(id);
    if(!ex)return[];
    if(!gearAllowed(ex,profile)||!stressAllowed(ex,profile)||(profile.level==='beginner'&&ex.level==='advanced')){
      for(const alt of (ALTERNATIVES[id]||['Bird_Dog','Dead_Bug','Butt_Lift_Bridge','Reverse_Crunch','Rear_Leg_Raises'])){
        let candidate=getEx(alt);if(candidate&&gearAllowed(candidate,profile)&&stressAllowed(candidate,profile)&&!(profile.level==='beginner'&&candidate.level==='advanced')&&!seen.has(candidate.id)){ex=candidate;break;}
      }
    }
    if(!ex||seen.has(ex.id)||!gearAllowed(ex,profile)||!stressAllowed(ex,profile)||(profile.level==='beginner'&&ex.level==='advanced'))return[];
    seen.add(ex.id);return[ex];
  }).slice(0,n);
}
function planForIndex(i){return (['A','B','C','D'][i%Math.min(4,Number(applyProfileDefaults().days)||3)])||'A'}
function nextTraining(){const days=currentWeekDays();const today=days.find(d=>d.today),future=days.find(d=>d.active&&d.i>=today.i)||days.find(d=>d.active);const idx=dayNumbers(Number(applyProfileDefaults().days)||3).indexOf(future.i);return{name:planForIndex(idx),date:future.date,day:future.w,today:future.today,index:idx}}
function upcomingPlan(){const x=nextTraining(),name=x.name;return{...x,exercises:resolvedPlan(name)}}
function titleHero(){return state.profile?'Tu siguiente paso empieza hoy.':'Tu fuerza. Tu ritmo. Tu progreso.'}
function renderHome(){const p=applyProfileDefaults(),plan=upcomingPlan(),sessions=weeklySessions(),total=state.records.length,load=Math.round(sessions/(Number(p.days)||3)*100);return `
<section class="page">
 <p class="eyebrow">ENTRENAMIENTO INTELIGENTE</p><div class="hero"><p class="eyebrow">${state.profile?`HOLA, ${esc(p.name||'ATLETA')} · NIVEL ${LEVELS[p.level]||'INICIAL'}`:'TU ENTRENADOR PERSONAL'}</p><h1>${titleHero()}</h1><p>${state.profile?'Cada repetición cuenta. Entrena con un plan flexible que aumenta según tus resultados.':'Personaliza tu edad, nivel y objetivos. Te prepararemos un plan para mejorar sin prisas.'}</p><button class="btn" data-action="${state.profile?'start':'profile'}">${state.profile?'Empezar entrenamiento':'Crear mi perfil'} &nbsp;→</button></div>
 ${!state.profile?`<div class="notice" style="margin-top:12px">Configura tu perfil para adaptar las series, días y dificultad. Puedes explorar antes la biblioteca.</div>`:''}
 <div class="stats-grid"><div class="stat-card"><b>${total}</b><p>Sesiones totales</p></div><div class="stat-card"><b>${sessions}<span class="small">/${esc(p.days||3)}</span></b><p>Esta semana</p></div><div class="stat-card"><b>${streak()} <span class="small streak-icon">◈</span></b><p>Días seguidos</p></div></div>
 <div class="section-top"><h2>Próxima sesión</h2><button data-action="nav" data-to="plan">Ver plan →</button></div>
 <div class="card"><div class="header-row"><div><span class="eyebrow">RUTINA ${plan.name}</span><h3 style="margin-top:4px">Cuerpo completo · ${plan.exercises.length} ejercicios</h3><p class="subhead">${esc(df(plan.date))} · ${p.level==='beginner'?'Adaptación técnica':p.level==='advanced'?'Control y fuerza':'Fuerza y resistencia'}</p></div><span style="font-size:34px">⚡</span></div><div class="routine-list" style="margin-top:16px">${plan.exercises.slice(0,3).map((e,i)=>`<div class="session-ex">${photo(e)}<div class="routine-info"><h3>${esc(e.name)}</h3><p class="small">${p.level==='beginner'?2:3} series · ${recommendation(e).amount} ${e.type==='seconds'?'seg':'reps'}</p></div></div>`).join('')}</div><div class="bar" style="margin:16px 0 10px"><span style="width:${max(load,0,100)}%"></span></div><div class="header-row"><small>Objetivo semanal: ${sessions} de ${p.days||3} sesiones</small><button class="btn sm" data-action="start">Entrenar →</button></div></div>
 <div class="section-top"><h2>Explora ejercicios</h2><button data-action="nav" data-to="library">Ver biblioteca →</button></div><div class="exercise-grid">${state.catalog.filter(e=>['Pushups','Plank','Bodyweight_Squat','Pullups'].includes(e.id)).slice(0,4).map(exCard).join('')}</div>
 <p class="footnote">La progresión se ajusta a tus registros, no solo a tu edad o peso. Para empezar, trabaja con una técnica cómoda y evita entrenar con dolor.</p>
</section>`}
function exCard(e){return `<button class="ex-card" data-action="exercise" data-id="${esc(e.id)}">${cardMedia(e)}<div class="ex-card-info"><h3>${esc(e.name)}</h3><p>${esc(e.muscle)} · ${LEVELS[e.level]||'Inicial'} ${videoAvailable(e)?'<span class="video-dot">· ▶ Vídeo</span>':''}</p></div></button>`}
function renderPlan(){const profile=applyProfileDefaults(),dates=currentWeekDays(),count=Number(profile.days)||3;return `<section class="page"><p class="eyebrow">TU PROGRAMA</p><h1 style="margin-top:7px">Plan personalizado</h1><p class="lead">${count} entrenamientos por semana · ${LEVELS[profile.level]||'Inicial'} · ${esc(({general:'Mejorar forma física',strength:'Ganar fuerza',endurance:'Más resistencia',mobility:'Movilidad',hypertrophy:'Ganar músculo'})[profile.goal]||'Forma física')}</p>
<div class="day-strip">${dates.map(d=>`<div class="day ${d.active?'active':'rest'}"><span>${d.w}</span><strong>${d.day}</strong><span>${d.active?'●':'—'}</span></div>`).join('')}</div>
${state.draft?`<div class="notice"><strong>Entrenamiento en curso.</strong> Puedes continuar donde lo dejaste.<button class="btn sm block" style="margin-top:10px" data-action="resume">Reanudar sesión</button></div>`:''}
${dayNumbers(count).map((_,i)=>{const name=planForIndex(i),exercises=resolvedPlan(name);return `<div class="session"><div class="session-title"><div><p class="eyebrow">DÍA ${i+1} · RUTINA ${name}</p><h3 style="margin-top:6px">${['Fuerza base','Control y estabilidad','Resistencia corporal','Fuerza y core'][i%4]}</h3><p class="subhead">${exercises.length} ejercicios · ${profile.level==='beginner'?'2':'3'} series de trabajo</p></div><button class="btn sm" data-action="start" data-name="${name}">Iniciar ↗</button></div><div class="routine-list" style="margin-top:14px">${exercises.map(e=>`<button class="routine-row" data-action="exercise" data-id="${esc(e.id)}" style="width:100%;color:inherit;text-align:left">${photo(e)}<div class="routine-info"><h3>${esc(e.name)}</h3><p class="small">${recommendation(e).amount} ${e.type==='seconds'?'segundos':'repeticiones'} · ${esc(e.muscle)}</p></div><span class="chev">›</span></button>`).join('')}</div></div>`}).join('')}
<div class="notice warn">${profile.gear==='none'?'Sin barra o anillas resulta difícil trabajar la tracción de espalda. Cuando puedas, añadir una barra estable mejorará el equilibrio del programa.':'Asegura una instalación estable del material antes de entrenar.'} El plan no sustituye una valoración profesional ante lesiones.</div></section>`}
function filtered(){let arr=state.catalog.filter(e=>state.group==='Todos'||e.muscle===state.group).filter(e=>state.level==='all'||e.level===state.level).filter(e=>state.gear==='all'||e.equipment===state.gear).filter(e=>!state.onlyVideo||videoAvailable(e));const q=normalize(state.search);if(q)arr=arr.filter(e=>normalize(e.name+' '+e.en+' '+e.muscle+' '+e.cue).includes(q));return arr}
function renderLibrary(){const xs=filtered();return `<section class="page"><p class="eyebrow">BIBLIOTECA DE MOVIMIENTOS</p><h1 style="margin:7px 0 7px">Descubre ejercicios</h1><p class="lead">${state.catalog.length} movimientos · Fotos e instrucciones · Vídeos cuando estén disponibles</p><div class="field" style="margin-top:20px"><input id="search-ex" aria-label="Buscar ejercicio" type="search" placeholder="Buscar: flexiones, pierna, plancha…" value="${esc(state.search)}"></div><div class="filter-bar">${GROUPS.map(g=>`<button data-action="group" data-group="${g}" class="chip ${state.group===g?'on':''}">${g}</button>`).join('')}</div><div class="inline-actions"><select id="level-filter" style="width:auto;flex:1"><option value="all" ${state.level==='all'?'selected':''}>Todos los niveles</option>${Object.entries(LEVELS).map(([k,v])=>`<option value="${k}" ${state.level===k?'selected':''}>${v}</option>`).join('')}</select><select id="gear-filter" style="width:auto;flex:1"><option value="all" ${state.gear==='all'?'selected':''}>Todo el material</option>${Object.entries(GEAR_LABEL).map(([k,v])=>`<option value="${k}" ${state.gear===k?'selected':''}>${v}</option>`).join('')}</select></div><label class="checkline" style="margin-top:12px"><input type="checkbox" id="only-video" ${state.onlyVideo?'checked':''}> Solo ejercicios con vídeo disponible</label><div class="section-top"><h3 id="catalog-count">${xs.length} resultados</h3><span class="small" id="catalog-status">${state.isLoaded?(state.loadedSources.length?state.loadedSources.join(' · '):'Catálogo inicial'):'Ampliando catálogo…'}</span></div><div id="catalog-results">${xs.length?`<div class="exercise-grid">${xs.map(exCard).join('')}</div>`:`<div class="empty"><span class="emoji">⌕</span><h3>Sin resultados</h3><p>Prueba otros filtros.</p></div>`}</div></section>`}
function updateLibraryResults(){const target=document.querySelector('#catalog-results');if(!target)return;const xs=filtered(),count=document.querySelector('#catalog-count');if(count)count.textContent=`${xs.length} resultados`;target.innerHTML=xs.length?`<div class="exercise-grid">${xs.map(exCard).join('')}</div>`:`<div class="empty"><h3>Sin resultados</h3><p>Prueba otros filtros.</p></div>`}
function weeklyBuckets(){let arr=[];for(let i=7;i>=0;i--){let start=new Date();start.setHours(0,0,0,0);start.setDate(start.getDate()-((start.getDay()+6)%7)-i*7);const end=new Date(start);end.setDate(start.getDate()+7);let n=state.records.filter(r=>{const date=new Date(r.date+'T12:00:00');return date>=start&&date<end}).length;arr.push({label:new Intl.DateTimeFormat('es-ES',{day:'2-digit',month:'short'}).format(start),n})}return arr}
function weightSvg(){const ws=state.weights.slice(-12);if(!ws.length)return`<div class="empty"><p>Registra tu peso para ver su evolución.</p></div>`;if(ws.length===1)return `<p class="lead">Último peso: <strong>${ws[0].weight} kg</strong> · ${df(ws[0].date)}</p>`;const nums=ws.map(w=>Number(w.weight)),low=Math.min(...nums)-1,high=Math.max(...nums)+1,points=ws.map((w,i)=>`${15+i*370/(ws.length-1)},${125-(Number(w.weight)-low)/(high-low)*95}`).join(' ');return`<svg role="img" aria-label="Evolución de peso corporal" viewBox="0 0 400 155" style="width:100%;height:155px"><line x1="15" y1="130" x2="385" y2="130" stroke="#47606c" stroke-dasharray="4 5"/><polyline points="${points}" stroke="#bcf77c" stroke-width="3.5" stroke-linejoin="round" stroke-linecap="round" fill="none"/>${ws.map((w,i)=>`<circle cx="${15+i*370/(ws.length-1)}" cy="${125-(Number(w.weight)-low)/(high-low)*95}" r="4.5" fill="#bcf77c"/>`).join('')}<text x="15" y="149" font-size="10" fill="#adbfca">${esc(df(ws[0].date))}</text><text x="385" y="149" font-size="10" text-anchor="end" fill="#adbfca">${esc(df(ws[ws.length-1].date))}</text></svg><p class="small">${nums[0]} kg → ${nums[nums.length-1]} kg (${(nums[nums.length-1]-nums[0])>0?'+':''}${(nums[nums.length-1]-nums[0]).toFixed(1)} kg)</p>`}
function renderExerciseTrend(){
  const workouts=state.records.flatMap(r=>(r.exercises||[]).map(ex=>({id:ex.id,name:ex.name,type:ex.type,date:r.date,sets:ex.sets||[]})));
  const unique=[...new Map(workouts.map(x=>[x.id,x.name])).entries()];
  if(!unique.length)return '<div class="empty"><p>Termina una rutina para ver cómo evolucionan tus repeticiones o segundos por ejercicio.</p></div>';
  const id=unique.some(x=>x[0]===state.progressId)?state.progressId:unique[0][0];
  const past=workouts.filter(x=>x.id===id).slice(-10);
  const counts=past.map(x=>Math.max(0,...x.sets.filter(y=>y.done).map(y=>Number(y.value)||0)));
  const maximum=Math.max(...counts,1);
  const u=past[0].type==='seconds'?'s':'reps';
  return `<div class="field"><label for="progress-ex">Ejercicio</label><select id="progress-ex">${unique.map(([eid,n])=>`<option value="${esc(eid)}" ${eid===id?'selected':''}>${esc(n)}</option>`).join('')}</select></div><div class="bars" style="margin-top:9px">${counts.map((v,i)=>`<div><b class="small accent">${v}</b><span class="column" style="height:${Math.round(85*v/maximum)}px"></span><small>${df(past[i].date)}</small></div>`).join('')}</div><p class="small" style="margin-top:15px">Mejor serie de cada sesión (${u}). ${counts.length>1?'Primera: '+counts[0]+' · Última: '+counts[counts.length-1]+'.':'Completa más sesiones para comparar.'}</p>`;
}
function renderProgress(){const buckets=weeklyBuckets(),peak=Math.max(1,...buckets.map(x=>x.n)),totalReps=state.records.reduce((a,r)=>a+(r.exercises||[]).reduce((b,e)=>b+(e.type==='seconds'?0:e.sets.filter(s=>s.done).reduce((v,s)=>v+(Number(s.value)||0),0)),0),0);const weight=state.weights.at(-1)?.weight||applyProfileDefaults().weight||'—';return `<section class="page"><p class="eyebrow">TUS RESULTADOS</p><h1 style="margin-top:7px">Tu progreso</h1><p class="lead">El progreso real se construye entrenamiento a entrenamiento.</p>
<div class="stats-grid"><div class="stat-card"><b>${state.records.length}</b><p>Entrenamientos</p></div><div class="stat-card"><b>${totalReps}</b><p>Repeticiones</p></div><div class="stat-card"><b>${esc(weight)}</b><p>Peso corporal kg</p></div></div>
<div class="section-top"><h2>Constancia</h2><span class="tag green">Últimas 8 semanas</span></div><div class="card"><div class="bars">${buckets.map(b=>`<div><span class="column" style="height:${Math.max(3,Math.round(88*b.n/peak))}px"></span><small>${esc(b.label.split(' ')[0])}</small></div>`).join('')}</div><p class="small" style="margin-top:12px">Número de sesiones realizadas cada semana.</p></div>
<div class="section-top"><h2>Progreso por ejercicio</h2></div><div class="card">${renderExerciseTrend()}</div>
<div class="section-top"><h2>Peso corporal</h2><span class="small">Historial personal</span></div><div class="card">${weightSvg()}<div class="weight-entry" style="margin-top:14px"><input id="weight-input" type="number" min="25" max="300" step="0.1" inputmode="decimal" placeholder="Peso en kg" aria-label="Peso en kilogramos"><button class="btn sm" data-action="add-weight">Guardar peso</button></div></div>
<div class="section-top"><h2>Historial de sesiones</h2></div><div class="card">${state.records.length?state.records.slice().reverse().slice(0,15).map((r,i)=>`<div class="history-row"><div><strong>Rutina ${esc(r.name||'Libre')}</strong><p>${df(r.date)} · ${(r.exercises||[]).length} ejercicios · ${r.duration||0} min</p></div><div style="text-align:right"><span class="tag green">Completado</span><p>Esfuerzo ${r.rpe||'—'}/10</p></div></div>`).join(''):`<div class="empty"><span class="emoji">◎</span><h3>Aún sin sesiones</h3><p>Tu primera sesión aparecerá aquí cuando la guardes.</p></div>`}</div>
<div class="section-top"><h2>Mis datos</h2></div><div class="card stack"><p class="small">Los registros solo se guardan en este navegador. Exporta una copia antes de borrar los datos de Safari o cambiar de iPhone.</p><div class="inline-actions"><button class="btn secondary sm" data-action="export">Exportar copia JSON</button><label class="btn secondary sm" for="import-file" style="cursor:pointer">Importar copia</label><input type="file" id="import-file" accept="application/json,.json" style="display:none"></div></div></section>`}
function renderWorkout(){const w=state.draft;if(!w){state.view='';return renderPlan()}const complete=w.items.reduce((a,x)=>a+x.sets.filter(s=>s.done).length,0);const count=w.items.reduce((a,x)=>a+x.sets.length,0);return `<section class="page"><div class="header-row"><div><p class="eyebrow">ENTRENAMIENTO EN CURSO</p><h1 style="margin-top:7px">Rutina ${esc(w.name)}</h1></div><button class="btn ghost sm" data-action="pause">Cerrar</button></div><p class="lead">Completa cada serie y marca ✓. Descansa 60–90 segundos entre series.</p>
<div class="bar" style="margin:16px 0 8px"><span style="width:${Math.round(100*complete/Math.max(1,count))}%"></span></div><p class="small">${complete} de ${count} series completadas</p>
${w.items.map((item,idx)=>{const ex=getEx(item.id)||item,rec=recommendation(ex);return`<div class="session ${item.sets.every(s=>s.done)?'session-done':''}"><div class="session-ex"><button data-action="exercise" data-id="${esc(item.id)}" style="padding:0;border:0;background:none">${photo(ex)}</button><div class="routine-info"><h3>${esc(item.name)}</h3><p class="small">Objetivo: ${item.target} ${item.type==='seconds'?'segundos':'repeticiones'}</p><span class="tag ${item.sets.every(s=>s.done)?'green':''}">${esc(ex.muscle||'Calistenia')}</span></div><button class="round-btn" data-action="exercise" data-id="${esc(item.id)}" aria-label="Ver técnica">?</button></div><div class="set-list">${item.sets.map((s,i)=>`<div class="set-row"><span class="set-n">Serie ${i+1}</span><input type="number" class="set-value" data-index="${idx}" data-set="${i}" value="${esc(s.value)}" min="0" max="500" inputmode="numeric" aria-label="Cantidad serie ${i+1}"><label>${item.type==='seconds'?'seg':'reps'}</label><input class="set-done" type="checkbox" data-index="${idx}" data-set="${i}" ${s.done?'checked':''} aria-label="Serie ${i+1} completada"></div>`).join('')}</div><p class="small" style="margin-top:11px">${esc(rec.reason)}</p></div>`}).join('')}
<div class="card"><div class="header-row"><div><h3>Esfuerzo percibido</h3><p class="small">1 = muy fácil · 10 = al límite</p></div><strong class="accent" id="rpe-number">${state.workoutRpe}/10</strong></div><input id="rpe-slider" type="range" min="1" max="10" value="${state.workoutRpe}" style="margin:18px 0 8px"><div class="notice">Progresaremos cuando completes las series con buena técnica y esfuerzo ≤ 7/10.</div><div class="timer-pill"><span>◷ Descanso <b id="rest-display">60 s</b></span><button class="btn sm secondary" data-action="rest">Iniciar 60 s</button></div><div class="form-actions"><button class="btn secondary" data-action="pause">Guardar y salir</button><button class="btn" data-action="finish" ${complete===0?'disabled':''}>Terminar sesión ✓</button></div></div></section>`}
function render(){let html;if(state.view==='workout')html=renderWorkout();else if(state.tab==='home')html=renderHome();else if(state.tab==='plan')html=renderPlan();else if(state.tab==='library')html=renderLibrary();else html=renderProgress();MAIN.innerHTML=html;NAV.forEach(n=>{n.classList.toggle('active',n.dataset.tab===state.tab);n.setAttribute('aria-current',n.dataset.tab===state.tab?'page':'false')});document.querySelector('#network-pill').innerHTML=navigator.onLine?'● Conectado':'● Sin conexión';document.querySelector('#network-pill').classList.toggle('offline',!navigator.onLine);updateRest()}
function navigate(tab){state.tab=tab;state.view='';MODAL.innerHTML='';state.search='';render();window.scrollTo({top:0,behavior:'instant'})}
function openExercise(id){const e=getEx(id);if(!e){toast('Ejercicio no disponible');return}const video=videoAvailable(e);MODAL.innerHTML=`<div class="dialog-backdrop" data-action="close" role="presentation"><section class="dialog" role="dialog" aria-modal="true" aria-label="Ejercicio ${esc(e.name)}"><div class="dialog-head"><div><p class="eyebrow">GUÍA DE MOVIMIENTO</p><h2>${esc(e.name)}</h2></div><button class="close" data-action="close" aria-label="Cerrar">×</button></div>${video?`<span class="video-label">▶ Demostración en vídeo</span><div class="detail-media"><video src="${esc(e.video)}" controls playsinline loop muted preload="metadata" poster="${esc(e.photo||'')}"></video></div>`:SAFE_URL(e.photo)?`<div class="detail-media"><img src="${esc(e.photo)}" alt="${esc(e.name)}" loading="lazy"></div>`:`<div class="detail-media img-placeholder">◈</div>`}<div class="tag-row"><span class="tag green">${esc(e.muscle)}</span><span class="tag">${LEVELS[e.level]||'Inicial'}</span><span class="tag">${GEAR_LABEL[e.equipment]||'Sin material'}</span></div><h3 style="margin-top:18px">Cómo hacerlo</h3><ol class="detail-list">${(e.instructions?.length?e.instructions:[e.cue]).slice(0,8).map(x=>`<li>${esc(x)}</li>`).join('')}</ol><p class="footnote">El vídeo o la imagen son una guía visual. Haz movimientos controlados y reduce la dificultad ante cualquier molestia. ${video?'Vídeo: namnq/workout-free-videos (CC0).':'Imágenes: yuhonas/free-exercise-db (Unlicense).'}</p><div class="form-actions"><button class="btn secondary" data-action="close">Cerrar</button><button class="btn" data-action="start" data-name="A">Ir a entrenar</button></div></section></div>`}
function profileModal(){let p=applyProfileDefaults();MODAL.innerHTML=`<div class="dialog-backdrop" data-action="close"><section class="dialog" role="dialog" aria-modal="true" aria-label="Perfil personal"><div class="dialog-head"><div><p class="eyebrow">PERSONALIZACIÓN</p><h2>Tu perfil</h2></div><button class="close" data-action="close" aria-label="Cerrar">×</button></div><p class="hint" style="margin-bottom:16px">Ajusta tu plan cuando quieras. Los datos se quedan en este dispositivo.</p>
<form id="profile-form"><div class="form-grid"><div class="field full"><label for="prof-name">Cómo quieres que te llamemos</label><input id="prof-name" name="name" maxlength="35" placeholder="Nombre (opcional)" value="${esc(p.name||'')}"></div><div class="field"><label>Edad (años)</label><input name="age" type="number" min="12" max="100" inputmode="numeric" value="${esc(p.age||'')}" placeholder="Ej. 40"></div><div class="field"><label>Peso (kg)</label><input name="weight" type="number" min="25" max="300" step="0.1" inputmode="decimal" value="${esc(p.weight||'')}" placeholder="Ej. 75"></div><div class="field"><label>Altura (cm)</label><input name="height" type="number" min="120" max="230" inputmode="numeric" value="${esc(p.height||'')}" placeholder="Ej. 178"></div><div class="field"><label>Nivel actual</label><select name="level">${Object.entries(LEVELS).map(([v,t])=>`<option value="${v}" ${v===p.level?'selected':''}>${t}</option>`).join('')}</select></div><div class="field"><label>Objetivo principal</label><select name="goal">${Object.entries({general:'Forma física',strength:'Ganar fuerza',endurance:'Más resistencia',mobility:'Movilidad',hypertrophy:'Ganar músculo'}).map(([v,t])=>`<option value="${v}" ${v===p.goal?'selected':''}>${t}</option>`).join('')}</select></div><div class="field"><label>Días por semana</label><select name="days">${[2,3,4,5,6].map(v=>`<option value="${v}" ${Number(v)==Number(p.days)?'selected':''}>${v} días</option>`).join('')}</select></div><div class="field full"><label>Equipo disponible</label><select name="gear">${Object.entries({none:'Solo mi cuerpo (sin equipo)',bench:'Banco, silla o apoyo estable',bar:'Barra de dominadas',bars:'Barra + paralelas / anillas',full:'Todo lo anterior'}).map(([v,t])=>`<option value="${v}" ${v===p.gear?'selected':''}>${t}</option>`).join('')}</select></div><div class="field"><label>Flexiones máximas</label><input name="pushups" type="number" min="0" max="100" inputmode="numeric" value="${esc(p.pushups??'')}"></div><div class="field"><label>Plancha máxima (s)</label><input name="plank" type="number" min="0" max="600" inputmode="numeric" value="${esc(p.plank??'')}"></div><div class="field full"><label>Evitar ejercicios que carguen…</label><div class="inline-actions" style="gap:13px; margin-top:5px">${[['wrist','Muñecas'],['knee','Rodillas'],['shoulder','Hombros'],['lowBack','Lumbar']].map(([id,t])=>`<label class="checkline"><input type="checkbox" name="avoid" value="${id}" ${(p.avoid||'').split(',').includes(id)?'checked':''}>${t}</label>`).join('')}</div></div></div><div class="notice warn" style="margin-top:16px">Las restricciones son una ayuda orientativa, no un diagnóstico. Si tienes lesiones, consulta a un profesional.</div><div class="form-actions"><button type="button" class="btn secondary" data-action="close">Cancelar</button><button type="submit" class="btn">Guardar perfil ✓</button></div></form></section></div>`;
const form=document.querySelector('#profile-form');form.addEventListener('submit',ev=>{ev.preventDefault();const f=new FormData(form);const age=f.get('age'),weight=f.get('weight'),height=f.get('height');if(age&&(Number(age)<12||Number(age)>100)||weight&&(Number(weight)<25||Number(weight)>300)||height&&(Number(height)<120||Number(height)>230)){toast('Comprueba la edad, peso y altura');return}state.profile={name:String(f.get('name')||'').slice(0,35),age:age?Number(age):'',weight:weight?Number(weight):'',height:height?Number(height):'',level:f.get('level'),goal:f.get('goal'),days:Number(f.get('days')),gear:f.get('gear'),pushups:Number(f.get('pushups')||0),plank:Number(f.get('plank')||0),avoid:f.getAll('avoid').join(',')};if(state.profile.weight)state.weights.push({date:dKey(),weight:Number(state.profile.weight)});persist();MODAL.innerHTML='';render();toast('Tu plan ya está personalizado')})}
function startWorkout(name){if(!state.profile){profileModal();return}if(state.draft){state.tab='plan';state.view='workout';MODAL.innerHTML='';render();return}const p=applyProfileDefaults(),plan=resolvedPlan(name||nextTraining().name);if(!plan.length){toast('No hay ejercicios compatibles con tu perfil');return}state.draft={date:dKey(),startedAt:new Date().toISOString(),name:name||nextTraining().name,items:plan.map(e=>{const v=recommendation(e).amount;const sets=p.level==='beginner'?2:(p.goal==='strength'||p.goal==='hypertrophy'?3:3);return{id:e.id,name:e.name,type:e.type||'reps',target:v,sets:Array.from({length:sets},()=>({value:v,done:false}))}})};state.workoutRpe=7;persist();state.tab='plan';state.view='workout';MODAL.innerHTML='';render();window.scrollTo(0,0)}
function finishWorkout(){const w=state.draft;if(!w)return;const completed=w.items.filter(e=>e.sets.some(s=>s.done)).map(item=>({...item,rpe:state.workoutRpe,plannedSets:item.sets.length}));if(!completed.length){toast('Marca al menos una serie completada');return}const rpe=state.workoutRpe;state.records.push({date:dKey(),name:w.name,duration:Math.max(1,Math.round((Date.now()-new Date(w.startedAt).getTime())/60000)),rpe,exercises:completed});state.draft=null;state.view='';state.tab='progress';persist();render();toast('¡Sesión guardada! Sigue así')}
function updateRest(){const el=document.querySelector('#rest-display');if(!el)return;if(!state.restUntil){el.textContent='60 s';return}const remaining=Math.max(0,Math.ceil((state.restUntil-Date.now())/1000));el.textContent=remaining?`${remaining} s`:'¡Listo!';if(!remaining)state.restUntil=0}
function importBackup(file){if(!file)return;if(file.size>2_000_000){toast('Archivo demasiado grande');return}const fr=new FileReader();fr.onload=()=>{try{const obj=JSON.parse(fr.result);if(!obj||!Array.isArray(obj.records)||!Array.isArray(obj.weights)){throw Error('Formato incorrecto')}if(!confirm('La importación sustituirá el perfil y los registros guardados en este iPhone. ¿Continuar?'))return;state.profile=obj.profile&&typeof obj.profile==='object'?obj.profile:null;state.records=obj.records.slice(-300);state.weights=obj.weights.slice(-400);state.draft=null;state.custom={};persist();navigate('progress');toast('Datos importados')}catch{toast('El archivo no parece una copia válida')}};fr.readAsText(file)}
function exportBackup(){const content=JSON.stringify({version:1,exportedAt:new Date().toISOString(),profile:state.profile,records:state.records,weights:state.weights},null,2);const blob=new Blob([content],{type:'application/json'}),url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download='calistenia-copia-'+dKey()+'.json';document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),3000);toast('Copia preparada')}
function dispatch(action,el){
  switch(action){
    case'profile':profileModal();break;
    case'close':MODAL.innerHTML='';break;
    case'nav':navigate(el.dataset.to);break;
    case'group':state.group=el.dataset.group;render();break;
    case'exercise':openExercise(el.dataset.id);break;
    case'start':startWorkout(el.dataset.name);break;
    case'resume':state.tab='plan';state.view='workout';render();break;
    case'pause':state.view='';persist();render();toast('Sesión guardada en curso');break;
    case'finish':finishWorkout();break;
    case'rest':state.restUntil=Date.now()+60000;updateRest();toast('Descanso iniciado');break;
    case'add-weight':{
      const val=Number(document.querySelector('#weight-input')?.value);if(!(val>=25&&val<=300)){toast('Escribe un peso válido (25–300 kg)');return}
      state.weights.push({date:dKey(),weight:val});persist();render();toast('Peso registrado');break;}
    case'export':exportBackup();break;
  }
}
document.addEventListener('click',ev=>{
  const nav=ev.target.closest('.nav-item');if(nav){navigate(nav.dataset.tab);return}
  const el=ev.target.closest('[data-action]');if(!el)return;
  if(el.dataset.action==='close'&&el.classList.contains('dialog-backdrop')&&ev.target!==el)return;
  dispatch(el.dataset.action,el);
});
document.querySelector('#profile-shortcut').addEventListener('click',profileModal);
document.addEventListener('input',ev=>{
 const el=ev.target;if(el.id==='search-ex'){state.search=el.value;updateLibraryResults()}
 if(el.id==='rpe-slider'){state.workoutRpe=Number(el.value);document.querySelector('#rpe-number').textContent=el.value+'/10'}
 if(el.classList.contains('set-value')&&state.draft){const i=Number(el.dataset.index),j=Number(el.dataset.set);state.draft.items[i].sets[j].value=max(el.value,0,500);persist()}
});
document.addEventListener('change',ev=>{
 const el=ev.target;if(el.id==='progress-ex'){state.progressId=el.value;render()}if(el.id==='level-filter'){state.level=el.value;updateLibraryResults()}if(el.id==='gear-filter'){state.gear=el.value;updateLibraryResults()}if(el.id==='only-video'){state.onlyVideo=el.checked;updateLibraryResults()}
 if(el.classList.contains('set-done')&&state.draft){const i=Number(el.dataset.index),j=Number(el.dataset.set);state.draft.items[i].sets[j].done=el.checked;persist();render()}
 if(el.id==='import-file')importBackup(el.files?.[0]);
});
window.addEventListener('online',render);window.addEventListener('offline',render);
if('serviceWorker' in navigator && (location.protocol==='https:'||location.hostname==='localhost'))navigator.serviceWorker.register('./sw.js').catch(()=>{});
setInterval(updateRest,1000);
render();loadCatalog().catch(()=>{state.isLoaded=true;render()});
})();
