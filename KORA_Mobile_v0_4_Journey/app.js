(() => {
const iron = window.FORMA_IRON || [];
const $ = s => document.querySelector(s);
const $$ = s => [...document.querySelectorAll(s)];
const store = {
 get(k,fallback){ try { const v=localStorage.getItem(k); return v===null?fallback:JSON.parse(v);} catch{return fallback;} },
 set(k,v){ localStorage.setItem(k,JSON.stringify(v)); }
};
let theme=store.get('koraTheme',store.get('formaTheme','auto'));
function applyTheme(){
 const dark=theme==='dark'||(theme==='auto'&&matchMedia('(prefers-color-scheme: dark)').matches);
 document.documentElement.dataset.theme=dark?'dark':'light';
}
applyTheme();
$('#themeBtn').addEventListener('click',()=>{theme=theme==='auto'?'dark':theme==='dark'?'light':'auto';store.set('koraTheme',theme);applyTheme();});

// Navigation
$('#nav').addEventListener('click',e=>{const b=e.target.closest('button[data-go]'); if(!b)return; const go=b.dataset.go; $$('.screen').forEach(x=>x.classList.toggle('active',x.dataset.screen===go)); $$('#nav button').forEach(x=>x.classList.toggle('active',x===b)); if(go==='progress')renderHistory();});
$('[data-go-journey]')?.addEventListener('click',()=>{$$('.screen').forEach(x=>x.classList.toggle('active',x.dataset.screen==='journey'));$$('#nav button').forEach(x=>x.classList.toggle('active',x.dataset.go==='journey'));window.scrollTo({top:0,behavior:'smooth'});});

// Week strip
const names=['Mon','Tue','Wed','Thu','Fri','Sat','Sun'];
const training=new Set([0,1,3,5]);
const week=$('#weekStrip'); names.forEach((n,i)=>{const d=document.createElement('div');d.className='day '+(training.has(i)?'train':'');d.innerHTML=`<b>${n}</b><span>${training.has(i)?'IRON':'recovery'}</span>`;week.appendChild(d);});

// Calendar sample: sequence continues rather than tied to exact IRON week.
const cal=$('#calendarWeeks');
let seq=1;
for(let w=1;w<=3;w++){
 const card=document.createElement('div');card.className='glass';card.style.padding='14px';
 let html=`<div class="eyebrow">WEEK ${w}</div><div class="week" style="margin-top:10px">`;
 names.forEach((n,i)=>{let text='Rest';if(training.has(i)&&seq<=30){text='IRON '+String(seq++).padStart(2,'0');}html+=`<div class="day ${text.startsWith('IRON')?'train':''}"><b>${n}</b><span>${text}</span></div>`});
 html+='</div>';card.innerHTML=html;cal.appendChild(card);
}

// Step goal
const stepGoal=$('#stepGoal'); stepGoal.value=String(store.get('koraStepGoal',store.get('formaStepGoal',8000)));
function renderStepGoal(){const v=Number(stepGoal.value)||8000;store.set('koraStepGoal',v);$('#stepGoalQuick').textContent=(v/1000)+'k';const steps=3840;$('#stepsBar').style.width=Math.min(100,steps/v*100)+'%';}
stepGoal.addEventListener('change',renderStepGoal); renderStepGoal();

// Program
const list=$('#programList');
iron.forEach(d=>{const row=document.createElement('article');row.className='program-card';row.innerHTML=`<div><span class="num">IRON ${String(d.n).padStart(2,'0')}</span><b>${d.title}</b><span>${d.duration} min · ${d.scheme}</span></div><button>VIEW</button>`;row.querySelector('button').addEventListener('click',()=>openPreview(d.n));list.appendChild(row);});

// Sheet
const backdrop=$('#sheetBackdrop');
$('#closeSheet').addEventListener('click',()=>backdrop.classList.add('hidden'));
backdrop.addEventListener('click',e=>{if(e.target===backdrop)backdrop.classList.add('hidden')});
function openPreview(n){const d=iron[n-1];$('#sheetTitle').textContent=`IRON ${String(n).padStart(2,'0')} · ${d.title}`;const c=$('#sheetContent');c.innerHTML=`<div class="note">${d.scheme} · ${d.duration} min</div>`;const wrap=document.createElement('div');d.segments.forEach((s,i)=>{const r=document.createElement('div');r.className='preview-row';r.innerHTML=`<div><b>${i+1}. ${s.name}</b><span>${s.pattern||s.stage||''}</span></div><span>${s.sec}s${s.rest?` / ${s.rest}s rest`:''}</span>`;wrap.appendChild(r)});c.appendChild(wrap);const start=document.createElement('button');start.className='primary wide';start.style.marginTop='14px';start.textContent='START THIS WORKOUT';start.addEventListener('click',()=>{backdrop.classList.add('hidden');startWorkout(n)});c.appendChild(start);backdrop.classList.remove('hidden');}

// Load / cues
function suggested(seg){const n=seg.name.toLowerCase();
 if(/bodyweight|push-up|plank|crunch|dip|hold/.test(n)&&!/(weighted|dumbbell|goblet|press)/.test(n))return {kg:'Bodyweight',mode:'bodyweight',why:'No external load required.'};
 if(/lateral raise|rear-delt|frontal raise|arc raise/.test(n))return {kg:'4 kg each',val:4,mode:'each',why:'Conservative first exposure with your available pair.'};
 if(/shoulder press|arnold|curl|skull|tricep press/.test(n))return {kg:'7 kg each',val:7,mode:'each',why:'Calibration load; adjust after the first set.'};
 if(/row|chest press|fly/.test(n))return {kg:'7–10 kg each',val:7,mode:'each',why:'Start controllably; progress from your actual set history.'};
 if(/rdl|deadlift/.test(n))return {kg:'10 kg each',val:10,mode:'each',why:'Use active hip range; stop before lumbar compensation.'};
 if(/hip thrust|bridge/.test(n))return {kg:'20 kg single',val:20,mode:'single',why:'Single-load setup available; adjust for control.'};
 if(/squat|lunge|step/.test(n))return {kg:'7 kg each',val:7,mode:'each',why:'Calibration suggestion using your available equipment.'};
 return {kg:'Calibration',val:null,mode:'each',why:'First exposure: choose a load you can actively control.'};
}
function cue(seg){const n=seg.name.toLowerCase();
 if(/press|raise|shoulder/.test(n))return 'Ribs stacked over pelvis. Keep elbows controlled; do not borrow range from lumbar extension.';
 if(/lunge|step/.test(n))return 'Track knee with the foot and keep active hip stability. Do not hang into end range.';
 if(/rdl|deadlift/.test(n))return 'Hinge from the hips. Keep knees softly unlocked and stop ROM before your lumbar position changes.';
 if(/squat/.test(n))return 'Use the deepest range you can actively control. More depth is not automatically better.';
 if(/row/.test(n))return 'Let the scapula move, but do not hang passively at the bottom or twist for extra range.';
 if(/hip thrust|bridge/.test(n))return 'Finish with glutes rather than an exaggerated lower-back arch.';
 return 'Active range > passive range. End the set when joint control deteriorates.';
}

// Workout state
let S=null;
function blankLog(seg,index){const s=suggested(seg);return {id:`${Date.now()}-${index}`,index,name:seg.name,sec:seg.sec,completed:true,reps:null,kg:s.val,loadMode:s.mode,rating:null,note:'',logged:false,time:new Date().toISOString()};}
function startWorkout(day){
 const d=iron[day-1]; if(!d)return;
 S={day,index:0,phase:'prep',remaining:5,total:5,running:true,timer:null,logs:[],pending:null,started:new Date().toISOString()};
 $('#workoutShell').classList.remove('hidden');$('#workoutActive').classList.remove('hidden');$('#workoutComplete').classList.add('hidden');renderWorkout();startTimer();
}
function seg(){return iron[S.day-1].segments[S.index]}
function startTimer(){clearInterval(S.timer);S.timer=setInterval(()=>{if(!S||!S.running)return;S.remaining--;if(S.remaining<=0){S.remaining=0;renderTimer();setTimeout(advance,120);}else renderTimer();},1000)}
function chime(freq=780,dur=.09){try{const C=window.AudioContext||window.webkitAudioContext;const c=new C(),o=c.createOscillator(),g=c.createGain();o.frequency.value=freq;g.gain.value=.07;o.connect(g);g.connect(c.destination);o.start();o.stop(c.currentTime+dur)}catch{}}
function advance(){if(!S)return;const d=iron[S.day-1];
 if(S.phase==='prep'){S.phase='work';S.remaining=seg().sec;S.total=seg().sec;chime(700);renderWorkout();return;}
 if(S.phase==='work'){
   const current=seg(); const log=blankLog(current,S.index);S.logs.push(log);S.pending=log.id;chime(900);
   if(current.rest>0){S.phase='rest';S.remaining=current.rest;S.total=current.rest;renderWorkout();return;}
   // Preserve true no-rest structure. Move immediately; pending log stays editable from strip.
   S.index++; if(S.index>=d.segments.length){finishSession();return;} S.phase='work';S.remaining=seg().sec;S.total=seg().sec;renderWorkout();return;
 }
 if(S.phase==='rest'){
   savePanel(false);S.index++;if(S.index>=d.segments.length){finishSession();return;}S.phase='work';S.remaining=seg().sec;S.total=seg().sec;renderWorkout();
 }
}
function renderTimer(){if(!S)return;$('#timerValue').textContent=Math.max(0,S.remaining);$('#timerRing').style.setProperty('--deg',((S.total?S.remaining/S.total:0)*360)+'deg');$('#pauseSet').textContent=S.running?'PAUSE':'RESUME';}
function renderWorkout(){if(!S)return;const d=iron[S.day-1], s=seg();const pct=Math.min(100,(S.index/d.segments.length)*100);$('#workoutProgress').style.width=pct+'%';$('#workoutName').textContent=`IRON ${String(d.n).padStart(2,'0')} · ${d.title}`;$('#workoutBlock').textContent=`Block ${Math.min(S.index+1,d.segments.length)} of ${d.segments.length}`;
 const phase=S.phase;$('#phaseLabel').classList.toggle('rest',phase==='rest');$('#phaseWrap').classList.toggle('phase-rest',phase==='rest');$('#phaseText').textContent=phase==='prep'?'GET READY':phase==='rest'?'RECOVERY':'WORK';$('#exerciseName').textContent=phase==='rest'?'Recover':s.name;$('#exerciseMeta').textContent=phase==='prep'?'Workout begins in a moment':phase==='rest'?`${s.rest}s programmed recovery · log the set while you breathe`:`${s.sec}s timed set · reps are whatever you complete with control`;
 $('#patternLabel').textContent=s.pattern?'SPECIAL PATTERN':'MOVEMENT';$('#patternText').textContent=phase==='rest'?nextText():(s.pattern||'Controlled repetitions for the full interval. Count reps if practical.');const sug=suggested(s);$('#suggestedLoad').textContent=phase==='rest'?'Recover':sug.kg;$('#loadWhy').textContent=phase==='rest'?'Use +15 seconds only if setup or joint control needs it.':sug.why;$('#techniqueCue').textContent=cue(s);
 $('#logPanel').classList.toggle('hidden',phase!=='rest'||!S.pending);if(phase==='rest'&&S.pending)loadPanel(S.pending);renderTimer();renderStrip();}
function nextText(){const d=iron[S.day-1],n=d.segments[S.index+1];return n?`Next: ${n.name} · ${n.sec}s`:'Final recovery before completing the session.'}
function pendingLog(){return S?.logs.find(x=>x.id===S.pending)||null}
function loadPanel(id){const l=S.logs.find(x=>x.id===id);if(!l)return;S.pending=id;$('#logSetName').textContent=l.name;$('#repsInput').value=l.reps??'';$('#kgInput').value=l.kg??'';$('#loadMode').value=l.loadMode||'each';$('#noteInput').value=l.note||'';$$('#ratingButtons button').forEach(b=>b.classList.toggle('selected',b.dataset.rating===l.rating));$('#savedToast').classList.remove('show');}
function savePanel(show=true){const l=pendingLog();if(!l)return;const reps=$('#repsInput').value.trim(), kg=$('#kgInput').value.trim();l.reps=reps===''?null:Number(reps);l.kg=kg===''?null:Number(kg);l.loadMode=$('#loadMode').value;l.note=$('#noteInput').value.trim();l.logged=!!(l.reps!==null||l.kg!==null||l.rating||l.note);if(show){$('#savedToast').classList.add('show');setTimeout(()=>$('#savedToast').classList.remove('show'),1200)}renderStrip();}
$('#saveLog').addEventListener('click',()=>savePanel(true));
$('#ratingButtons').addEventListener('click',e=>{const b=e.target.closest('button[data-rating]');if(!b)return;const l=pendingLog();if(!l)return;l.rating=b.dataset.rating;$$('#ratingButtons button').forEach(x=>x.classList.toggle('selected',x===b));});
function renderStrip(){if(!S)return;const el=$('#setStrip');el.innerHTML='';S.logs.slice(-8).forEach(l=>{const b=document.createElement('button');b.className='set-chip '+(l.logged?'logged':'');b.innerHTML=`<b>${l.name}</b><span>${l.reps??'—'} reps · ${l.kg??'—'} kg</span>`;b.addEventListener('click',()=>{S.pending=l.id;$('#logPanel').classList.remove('hidden');loadPanel(l.id)});el.appendChild(b)});}

// Manual player actions
$('#pauseSet').addEventListener('click',()=>{if(!S)return;S.running=!S.running;renderTimer()});
$('#skipSet').addEventListener('click',()=>{if(!S)return;advance()});
$('#backSet').addEventListener('click',()=>{if(!S||S.index<=0)return;S.index--;S.phase='work';S.remaining=seg().sec;S.total=seg().sec;renderWorkout()});
$('#exitWorkout').addEventListener('click',()=>{if(!S)return;if(confirm('Exit this workout? Completed set logs from this active session will be discarded.')){clearInterval(S.timer);S=null;$('#workoutShell').classList.add('hidden')}});
$('#openQueue').addEventListener('click',()=>{if(!S)return;const d=iron[S.day-1];$('#sheetTitle').textContent='Session queue';const c=$('#sheetContent');c.innerHTML='';d.segments.forEach((x,i)=>{const r=document.createElement('div');r.className='preview-row';r.innerHTML=`<div><b>${i+1}. ${x.name}</b><span>${x.pattern||x.stage||''}</span></div><span>${x.sec}s</span>`;c.appendChild(r)});backdrop.classList.remove('hidden')});
$('#editLoad').addEventListener('click',()=>{const l=pendingLog();if(l)$('#kgInput').focus();else alert('Your actual load is logged after the timed set. The recommendation will become personalized from history in the next progression-engine milestone.')});
$('#startToday').addEventListener('click',()=>startWorkout(1));

// Voice parser
const SpeechRecognition=window.SpeechRecognition||window.webkitSpeechRecognition;
let rec=null;
const wordNums={zero:0,one:1,two:2,three:3,four:4,five:5,six:6,seven:7,eight:8,nine:9,ten:10,eleven:11,twelve:12,thirteen:13,fourteen:14,fifteen:15,sixteen:16,seventeen:17,eighteen:18,nineteen:19,twenty:20,thirty:30,forty:40,fifty:50};
function normalizeNums(t){return t.toLowerCase().replace(/\b(zero|one|two|three|four|five|six|seven|eight|nine|ten|eleven|twelve|thirteen|fourteen|fifteen|sixteen|seventeen|eighteen|nineteen|twenty|thirty|forty|fifty)\b/g,m=>String(wordNums[m]));}
function parseVoice(raw){const t=normalizeNums(raw).replace(/kilograms?/g,'kilos').replace(/kgs?/g,'kilos');const out={};
 let m=t.match(/(\d+(?:[.,]\d+)?)\s*(?:reps?|repetitions?)/);if(m)out.reps=Number(m[1].replace(',','.'));
 m=t.match(/(\d+(?:[.,]\d+)?)\s*(?:kilos?|kg)/);if(m)out.kg=Number(m[1].replace(',','.'));
 if(/body ?weight/.test(t))out.mode='bodyweight';else if(/single|one dumbbell/.test(t))out.mode='single';else if(/total/.test(t))out.mode='total';else if(/each|pair|two dumbbells/.test(t))out.mode='each';
 if(/joint|unstable|pain/.test(t))out.rating='Joint issue';else if(/too hard|too heavy/.test(t))out.rating='Too hard';else if(/\bhard\b|brutal/.test(t))out.rating='Hard';else if(/\beasy\b|light/.test(t))out.rating='Easy';else if(/\bgood\b|fine|solid/.test(t))out.rating='Good';
 if(/same weight|same load/.test(t)){const previous=[...S.logs].reverse().find(x=>x.id!==S.pending&&x.kg!=null);if(previous){out.kg=previous.kg;out.mode=previous.loadMode;}}
 return out;
}
function applyVoice(raw){const p=parseVoice(raw),l=pendingLog();if(!l)return;if(p.reps!=null)$('#repsInput').value=p.reps;if(p.kg!=null)$('#kgInput').value=p.kg;if(p.mode)$('#loadMode').value=p.mode;if(p.rating){l.rating=p.rating;$$('#ratingButtons button').forEach(x=>x.classList.toggle('selected',x.dataset.rating===p.rating));}savePanel(true);}
$('#voiceBtn').addEventListener('click',()=>{
 if(!SpeechRecognition){$('#transcript').textContent='Speech recognition is unavailable here. Tap the Reps/Load fields and use the iPhone keyboard microphone instead.';$('#repsInput').focus();return;}
 if(rec){try{rec.stop()}catch{}rec=null;return;}
 rec=new SpeechRecognition();rec.lang='en-US';rec.interimResults=false;rec.maxAlternatives=1;$('#voiceBtn').classList.add('listening');$('#voiceBtn span').textContent='LISTENING…';$('#transcript').textContent='Say e.g. “12 reps, 7 kilos each, good.”';
 rec.onresult=e=>{const raw=e.results[0][0].transcript;$('#transcript').textContent='Heard: “'+raw+'”';applyVoice(raw)};
 rec.onerror=e=>{$('#transcript').textContent='Voice input failed ('+e.error+'). You can use normal iPhone dictation in the fields.'};
 rec.onend=()=>{$('#voiceBtn').classList.remove('listening');$('#voiceBtn span').textContent='TAP & SAY “12 REPS, 7 KILOS, GOOD”';rec=null};
 try{rec.start()}catch(e){$('#transcript').textContent='Could not start voice input. Use iPhone dictation as fallback.';}
});

function finishSession(){clearInterval(S.timer);savePanel(false);const d=iron[S.day-1];const saved={day:S.day,title:d.title,started:S.started,finished:new Date().toISOString(),sets:S.logs};const hist=store.get('koraWorkoutHistory',store.get('formaWorkoutHistory',[]));hist.unshift(saved);store.set('koraWorkoutHistory',hist.slice(0,100)); if(window.KORA_GAME) window.KORA_GAME.grantWorkout();$('#workoutActive').classList.add('hidden');$('#workoutComplete').classList.remove('hidden');const logged=S.logs.filter(x=>x.logged).length;$('#completeSummary').textContent=`${S.logs.length} timed blocks completed · ${logged} set records include reps/load/feedback.`;const r=$('#reviewList');r.innerHTML='';S.logs.slice(0,12).forEach(l=>{const row=document.createElement('div');row.className='review-row';row.innerHTML=`<div><b>${l.name}</b><span>${l.rating||'No rating'}</span></div><span>${l.reps??'—'} reps · ${l.kg??'—'} ${l.loadMode==='each'?'kg each':l.loadMode==='bodyweight'?'BW':'kg'}</span>`;r.appendChild(row)});chime(980,.18);}
$('#finishWorkout').addEventListener('click',()=>{S=null;$('#workoutShell').classList.add('hidden');renderHistory();});
function renderHistory(){const h=store.get('koraWorkoutHistory',store.get('formaWorkoutHistory',[])),el=$('#historyList');el.innerHTML='';if(!h.length){el.innerHTML='<div class="note">No sessions yet. Your completed workouts will appear here.</div>';return;}h.slice(0,8).forEach(x=>{const logged=x.sets.filter(s=>s.logged).length;const row=document.createElement('div');row.className='review-row';row.innerHTML=`<div><b>IRON ${String(x.day).padStart(2,'0')} · ${x.title}</b><span>${new Date(x.finished).toLocaleDateString()}</span></div><span>${logged}/${x.sets.length} logged</span>`;el.appendChild(row)});}
renderHistory();

// Service worker registration
if('serviceWorker' in navigator){window.addEventListener('load',()=>navigator.serviceWorker.register('./sw.js').catch(()=>{}));}
})();