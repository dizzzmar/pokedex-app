// ── FICHAS (EVs / IVs / naturaleza / habilidad), RECOMENDADORES Y SUGERENCIAS DE EQUIPO ──
// Se apoya en globales de index.html: S, GAMES, TYPES, TYPE_CHART, S_IDS, MY_IDS, cap, tc, spOf,
// _modFromMode, iPx, scheduleSave, renderTeam, refRow, _fetchPoke, toggleTeamFromCaptured.
(function(){
'use strict';

// ── Datos de juegos ─────────────────────────────────────────────
// Generación de mecánicas (no la región): Rojo Fuego usa mecánicas de 3ª gen, etc.
const MECH_GEN={red:1,blue:1,yellow:1,gold:2,silver:2,crystal:2,
ruby:3,sapphire:3,emerald:3,firered:3,leafgreen:3,
diamond:4,pearl:4,platinum:4,heartgold:4,soulsilver:4,
black:5,white:5,black2:5,white2:5,x:6,y:6,omegaruby:6,alphasapphire:6,
sun:7,moon:7,ultrasun:7,ultramoon:7,letsgopikachu:7,letsgoeevee:7,
sword:8,shield:8,brilliantdiamond:8,shiningpearl:8,legendsarceus:8,
scarlet:9,violet:9,legendsza:9};
const VERSION_GROUP={red:'red-blue',blue:'red-blue',yellow:'yellow',firered:'firered-leafgreen',leafgreen:'firered-leafgreen',
gold:'gold-silver',silver:'gold-silver',crystal:'crystal',heartgold:'heartgold-soulsilver',soulsilver:'heartgold-soulsilver',
ruby:'ruby-sapphire',sapphire:'ruby-sapphire',emerald:'emerald',diamond:'diamond-pearl',pearl:'diamond-pearl',platinum:'platinum',
black:'black-white',white:'black-white',black2:'black-2-white-2',white2:'black-2-white-2',x:'x-y',y:'x-y',
omegaruby:'omega-ruby-alpha-sapphire',alphasapphire:'omega-ruby-alpha-sapphire',sun:'sun-moon',moon:'sun-moon',
ultrasun:'ultra-sun-ultra-moon',ultramoon:'ultra-sun-ultra-moon',letsgopikachu:'lets-go-pikachu-lets-go-eevee',letsgoeevee:'lets-go-pikachu-lets-go-eevee',
sword:'sword-shield',shield:'sword-shield',brilliantdiamond:'brilliant-diamond-shining-pearl',shiningpearl:'brilliant-diamond-shining-pearl',
legendsarceus:'legends-arceus',scarlet:'scarlet-violet',violet:'scarlet-violet',legendsza:'legends-za'};
// Juegos sin EVs clásicos ni habilidades (Let's Go usa AVs; Leyendas usa niveles de esfuerzo)
const NO_EV_ABIL=new Set(['letsgopikachu','letsgoeevee','legendsarceus','legendsza']);

const mechGen=gid=>MECH_GEN[gid]||9;
const hasBuild=gid=>mechGen(gid)>=3;
const hasEVs=gid=>hasBuild(gid)&&!NO_EV_ABIL.has(gid);
const hasAbil=gid=>hasBuild(gid)&&!NO_EV_ABIL.has(gid);
const evCap=gid=>mechGen(gid)<=5?255:252;

// ── Stats y naturalezas ─────────────────────────────────────────
const STATS=[
{k:'hp',api:'hp',n:'PS'},{k:'atk',api:'attack',n:'Atq'},{k:'def',api:'defense',n:'Def'},
{k:'spa',api:'special-attack',n:'AtEsp'},{k:'spd',api:'special-defense',n:'DefEsp'},{k:'spe',api:'speed',n:'Vel'}];
const SN=Object.fromEntries(STATS.map(s=>[s.k,s.n]));
// Orden oficial: la fila es la stat que sube, la columna la que baja (Atq, Def, Vel, AtEsp, DefEsp)
const NAT_IDS=['hardy','lonely','brave','adamant','naughty','bold','docile','relaxed','impish','lax',
'timid','hasty','serious','jolly','naive','modest','mild','quiet','bashful','rash','calm','gentle','sassy','careful','quirky'];
const NAT_ES=['Fuerte','Huraña','Audaz','Firme','Pícara','Osada','Dócil','Plácida','Agitada','Floja',
'Miedosa','Activa','Seria','Alegre','Ingenua','Modesta','Afable','Mansa','Tímida','Alocada','Serena','Amable','Grosera','Cauta','Rara'];
const NAT_ORDER=['atk','def','spe','spa','spd'];
const NATURES=NAT_IDS.map((id,i)=>{
const up=NAT_ORDER[Math.floor(i/5)],down=NAT_ORDER[i%5];
return{id,n:NAT_ES[i],up:up===down?null:up,down:up===down?null:down};
});
const natById=id=>NATURES.find(n=>n.id===id);
const natLabel=n=>n.up?`${n.n} (+${SN[n.up]} −${SN[n.down]})`:`${n.n} (neutra)`;

// ── Helpers ─────────────────────────────────────────────────────
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const lsGet=k=>{try{return JSON.parse(localStorage.getItem(k)||'null');}catch(e){return null;}};
const lsSet=(k,v)=>{try{localStorage.setItem(k,JSON.stringify(v));}catch(e){}};
const baseIdOf=key=>parseInt(String(key).split('*')[0]);
function apiIdOf(key){
const f=String(key).split('*')[0].split('_')[1];
return f&&/^\d+$/.test(f)?parseInt(f):baseIdOf(key);
}
function emptyBuild(){return{nature:null,ability:null,ivs:{},evs:{}};}
function getBuild(key,gid){return S.track?.[key]?.[gid]?.build||null;}
function ensureBuild(key,gid){
if(!S.track[key])S.track[key]={};
if(!S.track[key][gid])S.track[key][gid]={captured:false,shiny:false,inBox:false,notes:'',ball:null,level:null};
const t=S.track[key][gid];
if(!t.build||typeof t.build!=='object')t.build=emptyBuild();
t.build.ivs=t.build.ivs||{};t.build.evs=t.build.evs||{};
return t.build;
}
function typeMult(atk,defTypes){
let m=1;(defTypes||[]).forEach(d=>{const r=(TYPE_CHART[d]||{})[atk];if(r!==undefined)m*=r;});return m;
}
const typeName=id=>TYPES.find(t=>t.id===id)?.n||cap(id);
const typeChip=id=>`<span class="tbadge" style="background:${tc(id)};font-size:8px;padding:2px 6px">${esc(typeName(id))}</span>`;

// ── Datos de habilidades (nombre y descripción en español) ──────
const _abCache=lsGet('bld_ab')||{};
async function abilityInfo(slug){
if(_abCache[slug])return _abCache[slug];
try{
const d=await fetch('https://pokeapi.co/api/v2/ability/'+slug).then(r=>r.json());
const es=(d.names||[]).find(n=>n.language.name==='es')?.name;
const fl=(d.flavor_text_entries||[]).filter(f=>f.language.name==='es').pop()?.flavor_text;
const gen=['','generation-i','generation-ii','generation-iii','generation-iv','generation-v','generation-vi','generation-vii','generation-viii','generation-ix'].indexOf(d.generation?.name);
_abCache[slug]={n:es||cap(slug.replace(/-/g,' ')),d:(fl||'').replace(/\s+/g,' '),g:gen>0?gen:3};
lsSet('bld_ab',_abCache);
}catch(e){return{n:cap(slug.replace(/-/g,' ')),d:'',g:3};}
return _abCache[slug];
}

// ── Recomendadores (reglas propias a partir de stats base) ──────
function baseStats(poke){
const b={};STATS.forEach(s=>{b[s.k]=poke.stats.find(x=>x.stat.name===s.api)?.base_stat||0;});return b;
}
function role(b){
const off=Math.max(b.atk,b.spa),bulk=(b.hp+b.def+b.spd)/3;
const style=b.atk>=b.spa+15?'phys':b.spa>=b.atk+15?'spec':'mixed';
const defensive=(off<80&&bulk>=80)||bulk>=off+25||Math.max(b.def,b.spd)>=off+30;
const speed=b.spe>=95?'fast':b.spe<=50?'slow':'mid';
return{style,defensive,speed};
}
function recNature(b){
const r=role(b);
if(r.defensive){
const dump=b.atk<=b.spa?'atk':'spa';
const pick=(up)=>NATURES.find(n=>n.up===up&&n.down===dump).id;
const first=b.def>=b.spd?'def':'spd',second=first==='def'?'spd':'def';
return{ids:[pick(first),pick(second)],why:`Perfil defensivo: sube ${SN[first]} y baja ${SN[dump]}, que no usa.`};
}
if(r.style==='phys'){
if(r.speed==='fast')return{ids:['jolly','adamant'],why:'Atacante físico rápido: más Velocidad para atacar primero, o más Ataque si ya supera a sus rivales.'};
if(r.speed==='slow')return{ids:['adamant','brave'],why:'Atacante físico lento: maximiza el Ataque. Audaz solo si juegas con Espacio Raro.'};
return{ids:['adamant','jolly'],why:'Atacante físico: más Ataque y baja el Ataque Especial, que no usa.'};
}
if(r.style==='spec'){
if(r.speed==='fast')return{ids:['timid','modest'],why:'Atacante especial rápido: más Velocidad, o más Ataque Especial si ya es suficientemente rápido.'};
if(r.speed==='slow')return{ids:['modest','quiet'],why:'Atacante especial lento: maximiza el Ataque Especial. Mansa solo con Espacio Raro.'};
return{ids:['modest','timid'],why:'Atacante especial: más Ataque Especial y baja el Ataque, que no usa.'};
}
// Mixto: baja la defensa más débil
const weak=b.def<=b.spd?'def':'spd';
if(r.speed!=='slow'){
return{ids:[weak==='def'?'hasty':'naive',b.atk>=b.spa?'jolly':'timid'],why:`Atacante mixto: sube Velocidad y baja ${SN[weak]}, su defensa más floja.`};
}
const main=b.atk>=b.spa?'atk':'spa';
const id=NATURES.find(n=>n.up===main&&n.down===weak).id;
return{ids:[id,main==='atk'?'adamant':'modest'],why:`Atacante mixto lento: sube ${SN[main]} y baja ${SN[weak]}.`};
}
function recEVs(b,gid){
const r=role(b);
const atkK=b.atk>=b.spa?'atk':'spa';
if(r.defensive){
const d1=b.def>=b.spd?'def':'spd',d2=d1==='def'?'spd':'def';
return{evs:{hp:252,[d1]:252,[d2]:4},why:`Aguante: 252 PS, 252 ${SN[d1]} y 4 ${SN[d2]}.`};
}
if(r.style==='mixed'&&r.speed!=='slow'){
return{evs:{spe:252,atk:128,spa:128},why:'Mixto: 252 Vel y el resto repartido entre Atq y AtEsp.'};
}
if(r.speed==='slow'){
const d=b.def<=b.spd?'def':'spd';
return{evs:{hp:252,[atkK]:252,[d]:4},why:`Lento: la Velocidad no compensa. 252 PS, 252 ${SN[atkK]} y 4 ${SN[d]}.`};
}
return{evs:{[atkK]:252,spe:252,hp:4},why:`Ofensivo: 252 ${SN[atkK]}, 252 Vel y 4 PS.`};
}
// Valoración de habilidades: [puntuación 0-5, perfil opcional p=físico s=especial]
const AB_SCORE={
'huge-power':[5,'p'],'pure-power':[5,'p'],'speed-boost':[5],'wonder-guard':[5],'protean':[5],'libero':[5],'adaptability':[5],
'regenerator':[5],'intimidate':[5],'drought':[5],'drizzle':[5],'sand-stream':[4],'snow-warning':[4],'magic-guard':[5],
'multiscale':[5],'shadow-tag':[5],'arena-trap':[4],'parental-bond':[5],'prankster':[4],'beast-boost':[5],'intrepid-sword':[5],
'fur-coat':[5],'good-as-gold':[5],'purifying-salt':[5],'sword-of-ruin':[5,'p'],'beads-of-ruin':[5,'s'],'tablets-of-ruin':[4],
'vessel-of-ruin':[4],'orichalcum-pulse':[5,'p'],'hadron-engine':[5,'s'],'disguise':[5],'water-bubble':[5],'battle-bond':[5],
'desolate-land':[5],'primordial-sea':[5],'delta-stream':[5],'levitate':[4],'unaware':[4],'sheer-force':[4],'technician':[4],
'tough-claws':[4,'p'],'moxie':[4,'p'],'guts':[4,'p'],'gorilla-tactics':[4,'p'],'contrary':[4],'serene-grace':[4],
'swift-swim':[4],'chlorophyll':[4],'sand-rush':[4],'slush-rush':[4],'unburden':[4],'magic-bounce':[4],'natural-cure':[4],
'poison-heal':[4],'thick-fat':[4],'flash-fire':[4],'water-absorb':[4],'volt-absorb':[4],'storm-drain':[4],'lightning-rod':[4],
'sap-sipper':[4],'filter':[4],'solid-rock':[4],'prism-armor':[4],'ice-scales':[4],'strong-jaw':[4,'p'],'sharpness':[4,'p'],
'mega-launcher':[4,'s'],'download':[4],'skill-link':[4,'p'],'tinted-lens':[4],'mold-breaker':[4],'teravolt':[4],'turboblaze':[4],
'defiant':[4,'p'],'competitive':[4,'s'],'dauntless-shield':[4],'well-baked-body':[4],'earth-eater':[4],'supreme-overlord':[4],
'protosynthesis':[4],'quark-drive':[4],'electric-surge':[4],'psychic-surge':[4],'grassy-surge':[4],'misty-surge':[4],
'stance-change':[4],'schooling':[4],'aerilate':[4,'p'],'pixilate':[4],'refrigerate':[4],'galvanize':[4],'dragons-maw':[4],
'transistor':[4],'triage':[4],'motor-drive':[3],'sturdy':[3],'iron-barbs':[3],'rough-skin':[3],'static':[3],'flame-body':[3],
'poison-point':[3],'effect-spore':[3],'cursed-body':[3],'iron-fist':[3,'p'],'reckless':[3,'p'],'solar-power':[3,'s'],
'analytic':[3],'sniper':[3],'super-luck':[3],'hustle':[3,'p'],'no-guard':[3],'compound-eyes':[3],'scrappy':[3],'pressure':[3],
'clear-body':[3],'white-smoke':[3],'simple':[3],'marvel-scale':[3],'quick-feet':[3],'toxic-boost':[3,'p'],'flare-boost':[3,'s'],
'dry-skin':[3],'hydration':[3],'shed-skin':[3],'justified':[3,'p'],'overcoat':[3],'soundproof':[3],'queenly-majesty':[3],
'dazzling':[3],'armor-tail':[3],'stamina':[3],'steelworker':[3],'mirror-armor':[3],'neutralizing-gas':[3],'sand-force':[3],
'harvest':[3],'gale-wings':[3],'shields-down':[3],'comatose':[3],'corrosion':[3],'air-lock':[3],'cloud-nine':[3],
'insomnia':[3],'vital-spirit':[3],'inner-focus':[2],'keen-eye':[2],'synchronize':[2],'own-tempo':[2],'oblivious':[2],
'truant':[0],'slow-start':[0],'defeatist':[0],'stall':[0],'klutz':[1],'ball-fetch':[1],'honey-gather':[1],'illuminate':[1],
'run-away':[1],'pickup':[1],'minus':[1],'plus':[1],'normalize':[1],'heavy-metal':[1],'light-metal':[1],'big-pecks':[1],
'tangled-feet':[1],'telepathy':[1],'friend-guard':[1],'weak-armor':[1],'magma-armor':[1]};
function scoreAbility(slug,b){
const [s0,prof]=AB_SCORE[slug]||[2];
let s=s0;
const r=role(b);
if(prof==='p'&&r.style==='spec')s-=2;
if(prof==='s'&&r.style==='phys')s-=2;
return s;
}
function abilityWhy(slug,b){
const [s0,prof]=AB_SCORE[slug]||[2];
const r=role(b);
if(prof==='p'&&r.style!=='spec')return'Potencia sus ataques físicos, que es lo que mejor se le da.';
if(prof==='s'&&r.style!=='phys')return'Potencia sus ataques especiales, que es lo que mejor se le da.';
if(s0>=5)return'Es una de las habilidades más fuertes del juego.';
if(s0>=4)return'Aporta una ventaja clara en la mayoría de combates.';
if(s0>=3)return'Es la que más aporta de las disponibles.';
return'Ninguna destaca; esta es la menos mala.';
}

// ── Ficha (hoja inferior) ───────────────────────────────────────
let cur=null; // {key,gid,poke,base,abilities:[{slug,hidden,info}],level}

function injectUI(){
if(document.getElementById('bld-sheet'))return;
const css=document.createElement('style');
css.textContent=`
#bld-sheet{position:fixed;inset:0;z-index:3000;display:none;align-items:flex-end;justify-content:center}
#bld-sheet.on{display:flex}
#bld-bg{position:absolute;inset:0;background:rgba(0,0,0,.4)}
#bld-body{position:relative;background:var(--bg);border-radius:24px 24px 0 0;padding:18px 16px calc(var(--sb,0px) + 24px);width:100%;max-width:480px;max-height:88vh;overflow-y:auto;z-index:1;animation:slideUp .25s ease;-webkit-overflow-scrolling:touch}
.bld-hdr{display:flex;align-items:center;gap:10px;margin-bottom:14px}
.bld-hdr img{width:56px;height:56px;object-fit:contain;image-rendering:auto}
.bld-ttl{font-size:19px;font-weight:900;color:var(--t1);line-height:1.1}
.bld-sub{font-size:11px;color:var(--t3);font-weight:700;margin-top:3px;display:flex;align-items:center;gap:5px}
.bld-x{margin-left:auto;width:32px;height:32px;border-radius:50%;border:none;background:var(--s2);font-size:16px;cursor:pointer;color:var(--t2);flex-shrink:0}
.bld-sec{background:rgba(255,255,255,.55);border:1px solid var(--bd);border-radius:16px;padding:12px;margin-bottom:10px}
.bld-lbl{font-size:10px;font-weight:800;text-transform:uppercase;letter-spacing:.6px;color:var(--t3);margin-bottom:8px}
.bld-sel{width:100%;padding:10px 12px;border-radius:12px;border:1px solid var(--bd);background:var(--s1);font-family:var(--fn);font-size:14px;font-weight:700;color:var(--t1)}
.bld-rec{margin-top:8px;padding:9px 11px;border-radius:12px;background:rgba(34,197,94,.09);border:1px solid rgba(34,197,94,.25);font-size:11.5px;color:var(--t2);line-height:1.45}
.bld-rec b{color:var(--t1)}
.bld-chipbtn{display:inline-flex;align-items:center;gap:4px;margin:6px 6px 0 0;padding:5px 10px;border-radius:99px;border:1px solid rgba(34,197,94,.4);background:var(--s1);font-family:var(--fn);font-size:11px;font-weight:800;color:var(--t1);cursor:pointer}
.bld-abils{display:flex;flex-direction:column;gap:6px}
.bld-ab{display:flex;align-items:center;gap:8px;width:100%;text-align:left;padding:10px 12px;border-radius:12px;border:1.5px solid var(--bd);background:var(--s1);font-family:var(--fn);cursor:pointer}
.bld-ab.on{border-color:var(--ac);background:rgba(196,30,30,.06)}
.bld-ab-n{font-size:13px;font-weight:800;color:var(--t1)}
.bld-ab-d{font-size:11px;color:var(--t3);line-height:1.4;margin-top:2px}
.bld-tag{font-size:9px;font-weight:800;padding:2px 6px;border-radius:99px;background:var(--s2);color:var(--t3);white-space:nowrap}
.bld-tag.rec{background:rgba(34,197,94,.15);color:#15803d}
.bld-tbl{width:100%;border-collapse:collapse;font-size:12px}
.bld-tbl th{font-size:9px;font-weight:800;text-transform:uppercase;color:var(--t3);padding:0 2px 6px;text-align:center}
.bld-tbl th:first-child{text-align:left}
.bld-tbl td{padding:3px 2px;text-align:center;font-weight:700;color:var(--t2)}
.bld-tbl td:first-child{text-align:left;color:var(--t1);font-weight:800}
.bld-tbl input{width:52px;padding:7px 4px;border-radius:9px;border:1px solid var(--bd);background:var(--s1);font-family:var(--fn);font-size:13px;font-weight:700;text-align:center;color:var(--t1)}
.bld-fin{font-size:13px;font-weight:900;color:var(--t1)}
.bld-up{color:#dc2626}.bld-down{color:#2563eb}
.bld-row{display:flex;align-items:center;justify-content:space-between;gap:8px;margin-top:10px;font-size:11px;color:var(--t3);font-weight:700}
.bld-mini{padding:6px 10px;border-radius:10px;border:1px solid var(--bd);background:var(--s1);font-family:var(--fn);font-size:11px;font-weight:800;color:var(--t2);cursor:pointer}
.bld-note{font-size:11px;color:var(--t3);line-height:1.45}
.bld-load{padding:30px 0;text-align:center;font-size:12px;color:var(--t3);font-weight:700}
.tslot-nat{font-size:8px;font-weight:800;color:var(--t3);margin-top:3px;text-transform:uppercase;letter-spacing:.3px}
.tsug-list{display:flex;flex-direction:column;gap:6px}
.tsug{display:flex;align-items:center;gap:10px;padding:8px 10px;border-radius:14px;background:var(--s1);border:1px solid var(--bd)}
.tsug img{width:44px;height:44px;object-fit:contain;flex-shrink:0}
.tsug-n{font-size:13px;font-weight:800;color:var(--t1)}
.tsug-why{font-size:10.5px;color:var(--t3);line-height:1.35;margin-top:3px}
.tsug-add{margin-left:auto;flex-shrink:0;padding:7px 11px;border-radius:99px;border:none;background:var(--ac);color:#fff;font-family:var(--fn);font-size:11px;font-weight:800;cursor:pointer}
.tsug-h{font-size:11px;font-weight:800;color:var(--t2);margin:12px 0 6px}
`;
document.head.appendChild(css);
const el=document.createElement('div');
el.id='bld-sheet';
el.innerHTML='<div id="bld-bg" onclick="bldClose()"></div><div id="bld-body"></div>';
document.body.appendChild(el);
}

async function bldOpen(key,gid){
injectUI();
key=String(key);
const game=GAMES.find(g=>g.id===gid);
if(!game)return;
const body=document.getElementById('bld-body');
document.getElementById('bld-sheet').classList.add('on');
document.body.style.overflow='hidden';
if(!hasBuild(gid)){
body.innerHTML=`<div class="bld-hdr"><div class="bld-ttl">Ficha</div><button class="bld-x" onclick="bldClose()">✕</button></div>
<div class="bld-note">${esc(game.n)} no tiene naturalezas, habilidades ni IVs/EVs como los juegos modernos, así que aquí no hay ficha.</div>`;
return;
}
body.innerHTML='<div class="bld-load">Cargando ficha…</div>';
let poke;
try{poke=await _fetchPoke(apiIdOf(key));}catch(e){poke=null;}
if(!poke||!poke.stats){body.innerHTML='<div class="bld-load">No se pudieron cargar los datos. Revisa tu conexión.</div>';return;}
const g=mechGen(gid);
let abilities=[];
if(hasAbil(gid)){
const raw=(poke.abilities||[]).filter(a=>g>=5||!a.is_hidden);
const infos=await Promise.all(raw.map(a=>abilityInfo(a.ability.name)));
abilities=raw.map((a,i)=>({slug:a.ability.name,hidden:a.is_hidden,info:infos[i]})).filter(a=>a.info.g<=g);
}
cur={key,gid,poke,base:baseStats(poke),abilities,level:S.track?.[key]?.[gid]?.level||50};
renderSheet();
}

function renderSheet(){
if(!cur)return;
const {key,gid,poke,base,abilities}=cur;
const game=GAMES.find(x=>x.id===gid);
const b=getBuild(key,gid)||emptyBuild();
const p=S.poke.find(x=>x.id===baseIdOf(key));
const shiny=String(key).endsWith('*s');
const sp=spOf(apiIdOf(key),_modFromMode(),shiny);
const nr=recNature(base);
const er=recEVs(base,gid);
const evOn=hasEVs(gid);

let abHtml='';
if(hasAbil(gid)&&abilities.length){
const best=abilities.slice().sort((a,c)=>scoreAbility(c.slug,base)-scoreAbility(a.slug,base))[0];
abHtml=`<div class="bld-sec"><div class="bld-lbl">Habilidad</div><div class="bld-abils">
${abilities.map(a=>`<button class="bld-ab${b.ability===a.slug?' on':''}" onclick="bldSet('ability','${a.slug}')">
<div style="flex:1;min-width:0"><div class="bld-ab-n">${esc(a.info.n)}</div>${a.info.d?`<div class="bld-ab-d">${esc(a.info.d)}</div>`:''}</div>
${a.slug===best.slug&&abilities.length>1?'<span class="bld-tag rec">★ Recomendada</span>':''}${a.hidden?'<span class="bld-tag">Oculta</span>':''}
</button>`).join('')}
</div>${abilities.length>1?`<div class="bld-rec"><b>${esc(best.info.n)}:</b> ${esc(abilityWhy(best.slug,base))}</div>`:''}</div>`;
}

body().innerHTML=`
<div class="bld-hdr">
<img src="${sp}" onerror="this.src='${iPx(baseIdOf(key))}'">
<div style="min-width:0"><div class="bld-ttl">${esc(cap(p?.name||poke.name))}</div>
<div class="bld-sub"><span style="width:8px;height:8px;border-radius:50%;background:${game.c}"></span>${esc(game.n)}${shiny?' · ✦ Shiny':''}</div>
<div style="display:flex;gap:3px;margin-top:5px">${(poke.types||[]).map(t=>typeChip(t.type.name)).join('')}</div></div>
<button class="bld-x" onclick="bldClose()">✕</button>
</div>

<div class="bld-sec"><div class="bld-lbl">Naturaleza</div>
<select class="bld-sel" onchange="bldSet('nature',this.value)">
<option value="">Sin indicar</option>
${NATURES.map(n=>`<option value="${n.id}"${b.nature===n.id?' selected':''}>${esc(natLabel(n))}</option>`).join('')}
</select>
<div class="bld-rec"><b>Recomendada:</b> ${nr.ids.map(id=>esc(natById(id).n)).join(' o ')}. ${esc(nr.why)}<br>
${nr.ids.map(id=>`<button class="bld-chipbtn" onclick="bldSet('nature','${id}')">Usar ${esc(natById(id).n)}</button>`).join('')}</div>
</div>

${abHtml}

<div class="bld-sec"><div class="bld-lbl">Estadísticas · nivel ${cur.level}</div>
<table class="bld-tbl"><thead><tr><th></th><th>Base</th><th>IV</th>${evOn?'<th>EV</th>':''}<th>Total</th></tr></thead><tbody>
${STATS.map(s=>`<tr><td id="bld-n-${s.k}">${s.n}</td><td>${base[s.k]}</td>
<td><input type="number" inputmode="numeric" min="0" max="31" placeholder="--" value="${b.ivs[s.k]??''}" onchange="bldStat('ivs','${s.k}',this)"></td>
${evOn?`<td><input type="number" inputmode="numeric" min="0" max="${evCap(gid)}" step="4" placeholder="0" value="${b.evs[s.k]||''}" onchange="bldStat('evs','${s.k}',this)"></td>`:''}
<td class="bld-fin" id="bld-f-${s.k}"></td></tr>`).join('')}
</tbody></table>
<div class="bld-row"><span id="bld-evtot"></span><span style="display:flex;gap:6px"><button class="bld-mini" onclick="bldMaxIVs()">IVs a 31</button>${evOn?'<button class="bld-mini" onclick="bldClearEVs()">Borrar EVs</button>':''}</span></div>
${evOn?`<div class="bld-rec"><b>Reparto recomendado:</b> ${esc(er.why)}<br><button class="bld-chipbtn" onclick="bldApplyEVs()">Aplicar reparto</button></div>`
:`<div class="bld-note" style="margin-top:8px">${esc(game.n)} no usa EVs clásicos (${/letsgo/.test(gid)?'usa AVs':'usa niveles de esfuerzo'}), así que solo se guardan los IVs.</div>`}
<div class="bld-note" style="margin-top:8px">El total se calcula con los IVs vacíos como 31. Cambia el nivel desde la fila del juego en la ficha del Pokémon.</div>
</div>`;
updateComputed();
}
const body=()=>document.getElementById('bld-body');

function statValue(k,bv,iv,ev,lvl,nat){
const core=Math.floor((2*bv+iv+Math.floor(ev/4))*lvl/100);
if(k==='hp')return bv===1?1:core+lvl+10;
let v=core+5;
if(nat?.up===k)v=Math.floor(v*1.1);
if(nat?.down===k)v=Math.floor(v*0.9);
return v;
}
function updateComputed(){
if(!cur)return;
const b=getBuild(cur.key,cur.gid)||emptyBuild();
const nat=natById(b.nature);
const evOn=hasEVs(cur.gid);
let tot=0;
STATS.forEach(s=>{
const iv=b.ivs[s.k]??31,ev=evOn?(b.evs[s.k]||0):0;tot+=ev;
const f=document.getElementById('bld-f-'+s.k);
if(f)f.textContent=statValue(s.k,cur.base[s.k],iv,ev,cur.level,nat);
const n=document.getElementById('bld-n-'+s.k);
if(n)n.className=nat?.up===s.k?'bld-up':nat?.down===s.k?'bld-down':'';
});
const t=document.getElementById('bld-evtot');
if(t)t.innerHTML=evOn?`EVs: <span style="color:${tot>510?'#dc2626':'var(--t1)'}">${tot}</span> / 510${tot>510?' · te pasas':''}`:'';
}

function afterChange(){
scheduleSave();
if(typeof refRow==='function'&&document.getElementById(`gr${cur.key}${cur.gid}`))refRow(cur.key,cur.gid);
if(S.tab==='team'&&typeof renderTeam==='function')renderTeam();
}
window.bldSet=function(field,val){
if(!cur)return;
const b=ensureBuild(cur.key,cur.gid);
b[field]=val||null;
afterChange();renderSheet();
};
window.bldStat=function(kind,k,inp){
if(!cur)return;
const b=ensureBuild(cur.key,cur.gid);
const max=kind==='ivs'?31:evCap(cur.gid);
const raw=inp.value.trim();
if(raw===''){delete b[kind][k];}
else{let n=parseInt(raw);if(isNaN(n))n=0;n=Math.max(0,Math.min(max,n));b[kind][k]=n;inp.value=n;}
scheduleSave();updateComputed();
};
window.bldMaxIVs=function(){
if(!cur)return;const b=ensureBuild(cur.key,cur.gid);
STATS.forEach(s=>b.ivs[s.k]=31);afterChange();renderSheet();
};
window.bldClearEVs=function(){
if(!cur)return;const b=ensureBuild(cur.key,cur.gid);
b.evs={};afterChange();renderSheet();
};
window.bldApplyEVs=function(){
if(!cur)return;const b=ensureBuild(cur.key,cur.gid);
b.evs={...recEVs(cur.base,cur.gid).evs};afterChange();renderSheet();
};
window.bldClose=function(){
document.getElementById('bld-sheet')?.classList.remove('on');
document.body.style.overflow='';
cur=null;
};
window.bldOpen=bldOpen;
window.bldHasBuild=hasBuild;

// Desde un hueco del equipo
function slotKey(slot){
const base=slot.formId&&slot.formId!==slot.pokeId?`${slot.pokeId}_${slot.formId}`:String(slot.pokeId);
if(slot.isShiny&&(S.track[base+'*s']||!S.track[base]))return base+'*s';
return base;
}
window.bldOpenSlot=function(idx){
const gid=S.teamGame;const slot=(S.teams[gid]||[])[idx];
if(slot)bldOpen(slotKey(slot),gid);
};
window.bldSlotLabel=function(slot,gid){
if(!hasBuild(gid))return'';
const b=getBuild(slotKey(slot),gid);
const n=b?.nature?natById(b.nature):null;
return n?`<div class="tslot-nat">${esc(n.n)}</div>`:'';
};

// ── Análisis de tipos ampliado y sugerencias de equipo ──────────
function teamMembers(gid){
return (S.teams[gid]||[]).map(slot=>{
const p=S.poke.find(x=>x.id===slot.pokeId);
if(!p)return null;
const form=(S.fc?.[slot.pokeId]||[]).find(f=>f.id===(slot.formId||slot.pokeId));
return{id:p.id,name:cap(p.name),types:form?.types||p.types||[]};
}).filter(Boolean);
}
function coverage(members){
return TYPES.map(t=>{
const weak=[],resist=[],x4=[];
members.forEach(m=>{const mu=typeMult(t.id,m.types);if(mu>=2)weak.push(m);if(mu>=4)x4.push(m);if(mu<1)resist.push(m);});
return{t,weak,resist,x4};
});
}

const _dexCache={};
async function gameDex(gid){
const vg=VERSION_GROUP[gid];if(!vg)return[];
if(_dexCache[vg])return _dexCache[vg];
const ls=lsGet('bld_dex_'+vg);
if(Array.isArray(ls)&&ls.length){_dexCache[vg]=ls;return ls;}
const d=await fetch('https://pokeapi.co/api/v2/version-group/'+vg).then(r=>r.json());
const dexes=await Promise.all((d.pokedexes||[]).map(x=>fetch(x.url).then(r=>r.json())));
const ids=new Set();
dexes.forEach(dx=>(dx.pokemon_entries||[]).forEach(e=>{
const id=parseInt(e.pokemon_species.url.split('/').filter(Boolean).pop());
if(id>=1&&id<=1025)ids.add(id);
}));
const arr=[...ids];
_dexCache[vg]=arr;lsSet('bld_dex_'+vg,arr);
return arr;
}
const _bst=lsGet('bld_bst')||{};
async function bstOf(ids){
const miss=ids.filter(id=>_bst[id]===undefined);
await Promise.all(miss.map(async id=>{
try{const p=await _fetchPoke(id);_bst[id]=p.stats.reduce((a,s)=>a+s.base_stat,0);}catch(e){}
}));
if(miss.length)lsSet('bld_bst',_bst);
return _bst;
}
function typeScore(types,cov,members){
let s=0;const helps=[],hurts=[];
cov.forEach(({t,weak,resist})=>{
const net=weak.length-resist.length;
const mu=typeMult(t.id,types);
if(net>0&&mu<1){s+=net*2+(mu===0?1:0);helps.push(t.id);}
if(mu>1&&weak.length>=1){s-=weak.length*2+(net>0?1:0);hurts.push(t.id);}
});
const shared=types.filter(ty=>members.some(m=>m.types.includes(ty))).length;
s-=shared*2;
return{s,helps,hurts};
}
function sugRow(c,gid){
return`<div class="tsug"><img src="${spOf(c.id,_modFromMode(),false)}" onerror="this.src='${iPx(c.id)}'">
<div style="min-width:0"><div class="tsug-n">${esc(cap(c.p.name))}</div>
<div style="display:flex;gap:3px;margin-top:3px">${c.p.types.map(typeChip).join('')}</div>
<div class="tsug-why">${c.helps.length?`Resiste ${c.helps.map(typeName).join(', ')}`:'Equilibra el equipo'}${c.hurts.length?` · débil a ${c.hurts.map(typeName).join(', ')}`:''}</div></div>
<button class="tsug-add" onclick="toggleTeamFromCaptured(${c.id},${c.id},'${gid}')">+ Equipo</button></div>`;
}

let _sugToken=0;
window.bldRenderTeamExtras=async function(){
const gid=S.teamGame;
const an=document.getElementById('team-analysis');
const box=document.getElementById('team-suggest');
if(!box)return;
const members=gid?teamMembers(gid):[];
if(!gid||!members.length){box.innerHTML='';}
const cov=coverage(members);

// 1) Ampliar el análisis: debilidades repetidas y dobles (x4)
if(an&&members.length){
const card=an.querySelector('.card');
if(card&&!card.querySelector('.bld-extra')){
const rep=cov.filter(c=>c.weak.length>=2).sort((a,c)=>c.weak.length-a.weak.length);
const x4=cov.filter(c=>c.x4.length);
let h='';
if(rep.length)h+=`<div style="margin-top:10px;font-size:11px;color:var(--t2);line-height:1.5"><b>Debilidades repetidas:</b><br>${rep.map(c=>`${typeChip(c.t.id)} <span style="color:var(--t3)">${c.weak.length} débiles (${c.weak.map(m=>esc(m.name)).join(', ')})${c.resist.length?` · ${c.resist.length} lo resiste${c.resist.length>1?'n':''}`:''}</span>`).join('<br>')}</div>`;
if(x4.length)h+=`<div style="margin-top:8px;font-size:11px;color:var(--t2);line-height:1.5"><b>Debilidad doble (x4):</b> ${x4.map(c=>`${c.x4.map(m=>esc(m.name)).join(', ')} a ${typeChip(c.t.id)}`).join(' · ')}</div>`;
if(!rep.length&&!x4.length)h=`<div style="margin-top:10px;font-size:11px;color:var(--t3)">Ningún tipo pega fuerte a más de un miembro del equipo.</div>`;
const div=document.createElement('div');div.className='bld-extra';div.innerHTML=h;card.appendChild(div);
}
}

// 2) Sugerencias si hay huecos
if(!gid||members.length>=6){box.innerHTML='';return;}
const token=++_sugToken;
const teamIds=new Set((S.teams[gid]||[]).map(s=>s.pokeId));
const capIds=new Set(Object.entries(S.track).filter(([k,g])=>g?.[gid]?.captured).map(([k])=>baseIdOf(k)));
const legal=id=>!S_IDS.has(id)&&!MY_IDS.has(id);
const score=id=>{const p=S.poke.find(x=>x.id===id);if(!p||!p.types?.length)return null;return{id,p,...typeScore(p.types,cov,members)};};
const header=`<div class="card" style="padding:14px;margin-top:10px"><div style="font-size:13px;font-weight:800;margin-bottom:2px">Sugerencias para tu equipo</div>
<div style="font-size:11px;color:var(--t3)">Te quedan ${6-members.length} hueco${6-members.length>1?'s':''}. Priorizo Pokémon que resisten lo que más daño hace a tu equipo y que no repiten tipo.</div>`;
box.innerHTML=header+'<div class="bld-load" style="padding:16px 0">Buscando sugerencias…</div></div>';

const fromCap=[...capIds].filter(id=>!teamIds.has(id)).map(score).filter(Boolean).sort((a,c)=>c.s-a.s).slice(0,5);
let fromDex=[],dexErr=false;
try{
const dex=await gameDex(gid);
const pool=dex.filter(id=>!teamIds.has(id)&&!capIds.has(id)&&legal(id)).map(score).filter(Boolean).sort((a,c)=>c.s-a.s).slice(0,40);
const bst=await bstOf(pool.map(c=>c.id));
fromDex=pool.filter(c=>(bst[c.id]||0)>=400).map(c=>({...c,f:c.s+((bst[c.id]||400)-450)/40})).sort((a,c)=>c.f-a.f).slice(0,6);
}catch(e){dexErr=true;}
if(token!==_sugToken)return;
box.innerHTML=header+
`<div class="tsug-h">De los que ya tienes en este juego</div>`+
(fromCap.length?`<div class="tsug-list">${fromCap.map(c=>sugRow(c,gid)).join('')}</div>`:'<div class="bld-note">No tienes más capturas marcadas en este juego.</div>')+
`<div class="tsug-h">Otros disponibles en el juego</div>`+
(dexErr?'<div class="bld-note">No se pudo cargar la Pokédex del juego. Revisa tu conexión.</div>'
:fromDex.length?`<div class="tsug-list">${fromDex.map(c=>sugRow(c,gid)).join('')}</div>`:'<div class="bld-note">No hay más sugerencias.</div>')+
`<div class="bld-note" style="margin-top:10px">Se excluyen legendarios y singulares, y Pokémon con estadísticas base totales por debajo de 400 (normalmente formas sin evolucionar). Los tipos son los actuales: en juegos antiguos alguno puede variar.</div></div>`;
};

})();
