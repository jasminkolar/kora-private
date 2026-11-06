(() => {
const $ = s => document.querySelector(s);
const $$ = s => [...document.querySelectorAll(s)];
const gameStore = {
  get(k,f){ try { const v=localStorage.getItem(k); return v===null?f:JSON.parse(v);} catch { return f; } },
  set(k,v){ localStorage.setItem(k,JSON.stringify(v)); }
};
const defaultState = () => ({
  version:1,
  level:1,
  xp:0,
  growth:0,
  stats:{power:0,momentum:0,fuel:0,control:0,resilience:0},
  daily:{},
  defeated:[],
  cosmetics:['origin-mark'],
  equipped:{mantle:'none',sigil:'origin-mark',aura:'none'},
  style:'obsidian'
});
let G = gameStore.get('koraGameState', defaultState());
function save(){ gameStore.set('koraGameState',G); }
function todayKey(){ return new Date().toISOString().slice(0,10); }
function day(){ const k=todayKey(); if(!G.daily[k]) G.daily[k]={workout:false,steps:false,fuel:false}; return G.daily[k]; }
function xpNeed(level){ return 80 + (level-1)*35; }
function addXP(amount){ G.xp += amount; let leveled=false; while(G.xp>=xpNeed(G.level)){ G.xp-=xpNeed(G.level); G.level++; leveled=true; } return leveled; }
function grant(type, opts={}){
  const d=day();
  if(type==='workout'){
    if(d.workout && !opts.force) return {ok:false,msg:'Today’s training growth is already banked.'};
    d.workout=true; G.growth+=40; G.stats.power++; G.stats.control++; addXP(55);
  } else if(type==='steps'){
    if(d.steps && !opts.force) return {ok:false,msg:'Today’s movement growth is already banked.'};
    d.steps=true; G.growth+=20; G.stats.momentum++; addXP(30);
  } else if(type==='fuel'){
    if(d.fuel && !opts.force) return {ok:false,msg:'Today’s fueling growth is already banked.'};
    d.fuel=true; G.growth+=15; G.stats.fuel++; G.stats.resilience++; addXP(25);
  }
  save(); renderAll(); return {ok:true,msg:'Growth banked.'};
}
const nodes=[
 {id:'origin',name:'Origin',need:0,x:12,y:78,type:'home',desc:'Your journey begins here. Nothing behind you can be lost.'},
 {id:'glassroad',name:'The Glass Road',need:25,x:30,y:64,type:'explore',desc:'A pale road emerges from the fog as your first real-world growth accumulates.'},
 {id:'watcher',name:'The Watcher',need:55,x:48,y:48,type:'fight',enemy:{name:'Roadbound Watcher',hp:72,atk:9},reward:{type:'cosmetic',id:'road-sigil',name:'Road Sigil'}},
 {id:'moonwood',name:'Moonwood',need:85,x:66,y:37,type:'explore',desc:'A silver forest revealed by movement, training and fuel—not by perfection.'},
 {id:'warden',name:"Warden's Pass",need:120,x:84,y:20,type:'boss',enemy:{name:'Warden of the Pass',hp:150,atk:13,boss:true},reward:{type:'cosmetic',id:'warden-mantle',name:"Warden's Mantle"}}
];
function nodeStatus(n){ if(G.defeated.includes(n.id)) return 'cleared'; if(G.growth>=n.need) return 'open'; return 'locked'; }
function renderAll(){ renderHeader(); renderStats(); renderMap(); renderDaily(); renderAvatar(); renderArchive(); }
function renderHeader(){
  const lvl=$('#gameLevel'),xp=$('#gameXp'),bar=$('#gameXpBar'),growth=$('#gameGrowth');
  if(!lvl)return; lvl.textContent=G.level; xp.textContent=`${G.xp} / ${xpNeed(G.level)} XP`; bar.style.width=Math.min(100,G.xp/xpNeed(G.level)*100)+'%'; growth.textContent=G.growth;
}
function renderStats(){
 const el=$('#gameStats'); if(!el)return; const s=G.stats;
 el.innerHTML=`<div><b>${s.power}</b><span>Power</span></div><div><b>${s.momentum}</b><span>Momentum</span></div><div><b>${s.control}</b><span>Control</span></div><div><b>${s.resilience}</b><span>Resilience</span></div>`;
}
function renderDaily(){
 const d=day();
 [['workout','Training','+40 Growth'],['steps','Movement','+20 Growth'],['fuel','Fuel','+15 Growth']].forEach(([key,label,reward])=>{
   const b=$(`#claim-${key}`); if(!b)return; b.disabled=!!d[key]; b.classList.toggle('claimed',!!d[key]); b.innerHTML=d[key]?`✓ ${label} banked`:`${label}<span>${reward}</span>`;
 });
}
function renderAvatar(){
 const av=$('#avatarFigure'); if(!av)return;
 av.dataset.style=G.style; av.classList.toggle('has-mantle',G.cosmetics.includes('warden-mantle')); av.classList.toggle('has-road-sigil',G.cosmetics.includes('road-sigil'));
 const eq=$('#equippedText'); if(eq){const items=[]; if(G.cosmetics.includes('warden-mantle'))items.push("Warden's Mantle"); if(G.cosmetics.includes('road-sigil'))items.push('Road Sigil'); eq.textContent=items.length?items.join(' · '):'Origin attire';}
}
function renderMap(){
 const svg=$('#journeyMap'); if(!svg)return;
 const lines=[]; for(let i=0;i<nodes.length-1;i++){const a=nodes[i],b=nodes[i+1],open=G.growth>=b.need;lines.push(`<line x1="${a.x}" y1="${a.y}" x2="${b.x}" y2="${b.y}" class="path ${open?'open':''}"/>`)}
 const dots=nodes.map(n=>{const st=nodeStatus(n);return `<g class="map-node ${st}" data-node="${n.id}" tabindex="0" role="button" aria-label="${n.name}"><circle cx="${n.x}" cy="${n.y}" r="4.4"/><circle cx="${n.x}" cy="${n.y}" r="8.3" class="halo"/><text x="${n.x}" y="${n.y-9}" text-anchor="middle">${n.name}</text>${st==='locked'?`<text x="${n.x}" y="${n.y+12}" text-anchor="middle" class="need">${n.need} Growth</text>`:''}</g>`}).join('');
 svg.innerHTML=`<defs><linearGradient id="pathGrad" x1="0" x2="1"><stop offset="0" stop-color="var(--accent)"/><stop offset="1" stop-color="var(--game-gold)"/></linearGradient></defs>${lines.join('')}${dots}`;
 $$('.map-node').forEach(g=>{const open=()=>openNode(g.dataset.node);g.addEventListener('click',open);g.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();open();}})});
 const next=nodes.find(n=>nodeStatus(n)==='locked'); const hint=$('#journeyHint'); if(hint) hint.textContent=next?`${Math.max(0,next.need-G.growth)} Growth until ${next.name}.`:'Region cleared. The next frontier would open here.';
}
function openNode(id){
 const n=nodes.find(x=>x.id===id); if(!n)return; const st=nodeStatus(n); const title=$('#gameSheetTitle'),body=$('#gameSheetBody'); title.textContent=n.name;
 if(st==='locked') body.innerHTML=`<div class="game-lock">Locked</div><p>${n.need-G.growth} more Growth reveals this location.</p><div class="game-note">Extra exercise above your chosen healthy goals does not grant bonus Growth.</div>`;
 else if(n.type==='fight'||n.type==='boss'){
   const cleared=G.defeated.includes(n.id);
   body.innerHTML=`<p>${cleared?'You already defeated this encounter. You can replay it for fun; rewards are permanent and not duplicated.':n.type==='boss'?'The road ends at a sealed gate. The Warden is waiting.':'Something has been following your trail.'}</p><div class="enemy-preview"><div class="enemy-orb ${n.type==='boss'?'boss':''}"></div><div><b>${n.enemy.name}</b><span>${n.enemy.hp} HP · ${n.type==='boss'?'Boss encounter':'Encounter'}</span></div></div><button class="primary wide" id="startEncounter">${cleared?'REPLAY':'FIGHT'}</button>`;
   $('#startEncounter').addEventListener('click',()=>startCombat(n));
 } else body.innerHTML=`<p>${n.desc}</p><div class="game-note">Exploration never expires. This place remains part of your journey permanently.</div>`;
 openGameSheet();
}
function openGameSheet(){ $('#gameSheet').classList.remove('hidden'); }
function closeGameSheet(){ $('#gameSheet').classList.add('hidden'); }
$('#closeGameSheet')?.addEventListener('click',closeGameSheet);
$('#gameSheet')?.addEventListener('click',e=>{if(e.target.id==='gameSheet')closeGameSheet();});

let combat=null;
function playerStats(){
 const s=G.stats; return {maxHp:95+G.level*8+s.resilience*3, atk:11+G.level*2+s.power*2, guard:0};
}
function startCombat(node){
 const p=playerStats(); combat={node,playerHp:p.maxHp,playerMax:p.maxHp,enemyHp:node.enemy.hp,enemyMax:node.enemy.hp,turn:1,guard:false,focus:0,log:[`You enter ${node.name}.`]}; closeGameSheet(); $('#combatShell').classList.remove('hidden'); renderCombat();
}
function enemyMove(){
 const boss=combat.node.enemy.boss; const pattern=boss?['strike','guardbreak','charge','crush']:['strike','strike','heavy']; const move=pattern[(combat.turn-1)%pattern.length]; let dmg=0,msg='';
 if(move==='charge'){msg=`${combat.node.enemy.name} is charging a crushing attack.`; combat.log.unshift(msg);combat.turn++;renderCombat();return;}
 if(move==='crush'){dmg=combat.node.enemy.atk+10;msg='Crushing Blow';}
 else if(move==='guardbreak'){dmg=combat.node.enemy.atk+3;msg='Rending strike';}
 else if(move==='heavy'){dmg=combat.node.enemy.atk+5;msg='Heavy strike';}
 else {dmg=combat.node.enemy.atk;msg='Strike';}
 if(combat.guard){dmg=Math.ceil(dmg*.35);combat.guard=false;msg+=' — guarded';}
 combat.playerHp=Math.max(0,combat.playerHp-dmg);combat.log.unshift(`${combat.node.enemy.name}: ${msg} for ${dmg}.`);combat.turn++;
 if(combat.playerHp<=0){renderCombat(true);return;} renderCombat();
}
function act(kind){if(!combat||combat.playerHp<=0||combat.enemyHp<=0)return; const p=playerStats();let dmg=0;
 if(kind==='strike'){dmg=p.atk+combat.focus;combat.focus=0;combat.log.unshift(`You strike for ${dmg}.`);}
 if(kind==='guard'){combat.guard=true;combat.log.unshift('You brace for the next attack.');}
 if(kind==='focus'){combat.focus+=6+G.stats.control;combat.log.unshift('You study the pattern. Your next strike is empowered.');}
 if(kind==='surge'){dmg=Math.round(p.atk*.75+G.stats.momentum*2);combat.log.unshift(`Momentum surge hits for ${dmg}.`);}
 if(dmg)combat.enemyHp=Math.max(0,combat.enemyHp-dmg);
 if(combat.enemyHp<=0){winCombat();return;} setTimeout(enemyMove,180);
}
function winCombat(){
 const n=combat.node; const first=!G.defeated.includes(n.id); if(first){G.defeated.push(n.id);addXP(n.type==='boss'?120:60);G.growth+=n.type==='boss'?25:10;if(n.reward?.id&&!G.cosmetics.includes(n.reward.id))G.cosmetics.push(n.reward.id);save();}
 combat.log.unshift(`Victory${first&&n.reward?` — ${n.reward.name} unlocked`:''}.`);renderCombat(true);renderAll();
}
function renderCombat(done=false){
 const c=combat;if(!c)return; $('#combatTitle').textContent=c.node.enemy.name;$('#playerHpBar').style.width=(c.playerHp/c.playerMax*100)+'%';$('#enemyHpBar').style.width=(c.enemyHp/c.enemyMax*100)+'%';$('#playerHpText').textContent=`${c.playerHp} / ${c.playerMax}`;$('#enemyHpText').textContent=`${c.enemyHp} / ${c.enemyMax}`;
 $('#combatTurn').textContent=`Turn ${c.turn}`;$('#combatLog').innerHTML=c.log.slice(0,4).map(x=>`<div>${x}</div>`).join('');
 const actions=$$('#combatActions button');actions.forEach(b=>b.disabled=done||c.playerHp<=0||c.enemyHp<=0);
 const result=$('#combatResult'); if(c.enemyHp<=0){result.classList.remove('hidden');result.innerHTML=`<b>VICTORY</b><span>${G.defeated.includes(c.node.id)?'This place is now part of your permanent history.':'Encounter cleared.'}</span><button class="primary wide" id="closeCombatWin">RETURN TO JOURNEY</button>`;$('#closeCombatWin').addEventListener('click',closeCombat);} else if(c.playerHp<=0){result.classList.remove('hidden');result.innerHTML=`<b>DEFEAT</b><span>Nothing is lost. Train, explore, change strategy—or simply try again.</span><button class="secondary wide" id="retryCombat">TRY AGAIN</button><button class="secondary wide" id="closeCombatLose">RETURN</button>`;$('#retryCombat').addEventListener('click',()=>startCombat(c.node));$('#closeCombatLose').addEventListener('click',closeCombat);} else result.classList.add('hidden');
}
function closeCombat(){combat=null;$('#combatShell').classList.add('hidden');renderAll();}
$('#combatClose')?.addEventListener('click',closeCombat);
$('#combatActions')?.addEventListener('click',e=>{const b=e.target.closest('button[data-act]');if(b)act(b.dataset.act);});

function renderArchive(){
 const el=$('#artifactList');if(!el)return;const defs={
 'origin-mark':{name:'Origin Mark',desc:'Carried from the beginning. Not earned; chosen.'},
 'road-sigil':{name:'Road Sigil',desc:'Defeated the Roadbound Watcher.'},
 'warden-mantle':{name:"Warden's Mantle",desc:'Defeated the Warden of the Pass.'}
 };el.innerHTML=G.cosmetics.map(id=>`<div class="artifact"><div class="artifact-icon ${id}"></div><div><b>${defs[id]?.name||id}</b><span>${defs[id]?.desc||'Permanent unlock.'}</span></div></div>`).join('');
}
$$('[data-style-choice]').forEach(b=>b.addEventListener('click',()=>{G.style=b.dataset.styleChoice;save();renderAvatar();$$('[data-style-choice]').forEach(x=>x.classList.toggle('selected',x===b));}));
$('#claim-workout')?.addEventListener('click',()=>grant('workout'));
$('#claim-steps')?.addEventListener('click',()=>grant('steps'));
$('#claim-fuel')?.addEventListener('click',()=>grant('fuel'));
$('#resetGame')?.addEventListener('click',()=>{if(confirm('Reset only the Journey prototype? Workout history is untouched.')){G=defaultState();save();renderAll();}});

window.KORA_GAME={grantWorkout:()=>grant('workout'),grantSteps:()=>grant('steps'),grantFuel:()=>grant('fuel'),getState:()=>structuredClone(G)};
renderAll();
})();
