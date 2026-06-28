const FOOD=window.FOOD_DB||[], EX=window.EXERCISES_DB||[];
const $=s=>document.querySelector(s), iso=d=>d.toISOString().slice(0,10), KEY='metodo-v20';
let selected=iso(new Date()), foodCat='Todos', exCat='Todos', foodMode='all';
let state=JSON.parse(localStorage.getItem(KEY)||'null')||JSON.parse(localStorage.getItem('metodo-v12')||localStorage.getItem('metodo-v11')||localStorage.getItem('metodo-v10')||'null')||JSON.parse(localStorage.getItem('metodo-v9')||'null')||{settings:{burnGoal:500,stepGoal:12000,minuteGoal:45,foodGoal:1800},days:{},fav:[],recent:[],plan:{days:3,time:45,next:0,active:[]}};
const plans={2:[['Full Body A',['Goblet squat','Press suelo mancuernas','Remo mancuerna','Peso muerto rumano mancuernas','Plancha']],['Full Body B',['Sentadilla búlgara','Flexiones','Dominadas supinas','Hip thrust banco','Elevación piernas']]],
3:[['Push',['Press banca mancuernas','Press militar mancuernas','Flexiones inclinadas','Elevaciones laterales','Extensión tríceps cabeza']],['Pull',['Dominadas pronas','Remo mancuerna','Remo invertido','Curl bíceps alterno','Face pull banda']],['Pierna',['Sentadilla barra','Peso muerto rumano mancuernas','Zancadas','Hip thrust banco','Plancha']]],
4:[['Torso A',['Press banca mancuernas','Remo mancuerna','Press militar mancuernas','Curl bíceps alterno']],['Pierna A',['Goblet squat','Peso muerto rumano mancuernas','Sentadilla búlgara']],['Torso B',['Flexiones','Dominadas supinas','Remo invertido','Elevaciones laterales']],['Pierna B',['Sentadilla barra','Peso muerto convencional','Zancadas','Elevación piernas']]],
5:[['Push A',['Press banca mancuernas','Press militar mancuernas','Elevaciones laterales']],['Pull A',['Dominadas pronas','Remo mancuerna','Curl bíceps alterno']],['Pierna A',['Sentadilla barra','Peso muerto rumano mancuernas','Hip thrust banco']],['Torso B',['Flexiones','Remo invertido','Face pull banda']],['Full body corto',['Goblet squat','Press suelo mancuernas','Plancha']]]};
function day(k=selected){return state.days[k]||(state.days[k]={activities:[],foods:[],training:[],measures:[]})}
function persist(){localStorage.setItem(KEY,JSON.stringify(state))}
function save(){persist();render()}
function sum(a,k){return a.reduce((t,x)=>t+(+x[k]||0),0)}
function fmt(n){return Math.round(n).toLocaleString('es-ES')}
function norm(s){return String(s).toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'')}
function arc(sel,val,goal,r){let c=$(sel),circ=2*Math.PI*r;c.style.strokeDasharray=circ;c.style.strokeDashoffset=circ*(1-Math.min(val/Math.max(goal,1),1))}


function activeDaysLast(n){
 let c=0, now=new Date(selected);
 for(let i=0;i<n;i++){let x=new Date(now);x.setDate(now.getDate()-i);let d=state.days[iso(x)];if(d&&(sum(d.activities||[],'minutes')>0 || sum(d.foods||[],'kcal')>0 || (d.training||[]).length))c++}
 return c;
}
function streak(){
 let s=0, now=new Date(selected);
 for(let i=0;i<60;i++){let x=new Date(now);x.setDate(now.getDate()-i);let d=state.days[iso(x)];let ok=d&&(sum(d.activities||[],'minutes')>0 || sum(d.foods||[],'kcal')>0 || (d.training||[]).length); if(ok)s++; else break;}
 let el=$('#streakText'); if(el)el.textContent=s?`${s} días con registro`:'Empieza registrando comida o actividad hoy';
}
function achievements(){
 let allDays=Object.values(state.days);
 let workouts=allDays.reduce((t,d)=>t+(d.training||[]).length,0);
 let foodDays=Object.values(state.days).filter(d=>sum(d.foods||[],'kcal')>0).length;
 let records=Object.values(state.days).flatMap(d=>d.training||[]).filter(x=>+x.kg>0).length;
 let items=[
  ['Primer registro', foodDays>0],
  ['Constancia 7 días', activeDaysLast(7)>=5],
  ['10 ejercicios registrados', workouts>=10],
  ['Primer récord con peso', records>0],
  ['Semana activa', activeDaysLast(7)>=6]
 ];
 let el=$('#achievements'); if(!el)return;
 el.innerHTML=items.map(x=>`<div><span><b>${x[1]?'✅':'⬜'} ${x[0]}</b></span></div>`).join('');
}
function makeWeekPlan(){
 let arr=plans[state.plan.days]||plans[3];
 let days=['Lunes','Martes','Miércoles','Jueves','Viernes','Sábado','Domingo'];
 let slots = state.plan.days===2?[0,3]:state.plan.days===3?[0,2,4]:state.plan.days===4?[0,1,3,5]:[0,1,2,4,5];
 state.weekPlan=days.map((d,i)=>{
   let idx=slots.indexOf(i);
   return {day:d, text:idx>=0 ? arr[idx%arr.length][0] : 'Descanso / paseo suave'};
 });
 save();
}
function renderWeekPlan(){
 let el=$('#weekPlan'); if(!el)return;
 let p=state.weekPlan||[];
 el.innerHTML=p.length?p.map(x=>`<div><span><b>${x.day}</b><br><small>${x.text}</small></span></div>`).join(''):'<div><small>Sin plan semanal generado.</small></div>';
}
function autoAdjustSuggestion(food, burn, s){
 let balance=food-burn;
 if(balance>s.foodGoal*0.25) return 'Estás bastante por encima del objetivo hoy. Cena ligera: proteína magra, verdura y agua.';
 if(food<s.foodGoal*0.55) return 'Vas bajo de calorías. Prioriza proteína y una fuente de hidratos si entrenas.';
 if(burn<s.burnGoal*0.5) return 'Te falta actividad. Un paseo de 20-30 minutos cuadraría bien.';
 return 'Día equilibrado. Mantén el plan.';
}

const RECIPES=[
 {name:'Pollo arroz brócoli',items:['Pechuga de pollo 150 g','Arroz cocido 150 g','Brócoli 200 g']},
 {name:'Yogur avena fruta',items:['Yogur proteico','Avena 50 g','Plátano']},
 {name:'Pasta con atún',items:['Pasta cocida 150 g','Atún natural']},
 {name:'Tortilla + pan',items:['Huevos 100 g','Pan integral 50 g','Tomate 150 g']},
 {name:'Ensalada proteica',items:['Atún natural','Aguacate 100 g','Tomate 150 g']}
];
function weeklySummary(){
 let now=new Date(selected), kcal=0, mins=0, food=0;
 for(let i=6;i>=0;i--){let x=new Date(now);x.setDate(now.getDate()-i);let d=state.days[iso(x)]||{activities:[],foods:[]};kcal+=sum(d.activities,'kcal');mins+=sum(d.activities,'minutes');food+=sum(d.foods,'kcal')}
 let el=$('#weeklySummary'); if(!el)return;
 el.innerHTML=`<div><small>Kcal quemadas</small><b>${fmt(kcal)}</b></div><div><small>Min entreno</small><b>${fmt(mins)}</b></div><div><small>Kcal comidas</small><b>${fmt(food)}</b></div>`;
}
function recipeButtons(){
 let el=$('#recipes'); if(!el)return;
 el.innerHTML=RECIPES.map((r,i)=>`<button data-recipe="${i}">${r.name}</button>`).join('');
}
function addRecipe(i){
 let r=RECIPES[i]; if(!r)return;
 r.items.forEach(n=>{let item=FOOD.find(f=>f[0]===n)||FOOD.find(f=>norm(f[0]).includes(norm(n).split(' ')[0])); if(item) day().foods.push({name:item[0],kcal:item[2],protein:item[3],carbs:item[4],fat:item[5]})});
 save();
}
function applyProfile(form){
 let w=+form.weight.value||70,h=+form.height.value||170,a=+form.age.value||35,goal=form.goal.value;
 let bmr=10*w+6.25*h-5*a-161; // aproximación femenina; editable después
 let cal=Math.round(bmr*1.45);
 if(goal==='lose') cal-=350; if(goal==='gain') cal+=250;
 state.settings.foodGoal=Math.max(1200,cal);
 state.settings.minuteGoal=45;
 state.settings.burnGoal=goal==='lose'?550:450;
 save();
}

function render(){dates();let d=day(),s=state.settings,b=sum(d.activities,'kcal'),steps=sum(d.activities,'steps'),mins=sum(d.activities,'minutes'),food=sum(d.foods,'kcal'),p=sum(d.foods,'protein'),c=sum(d.foods,'carbs'),f=sum(d.foods,'fat');$('#burned').textContent=fmt(b);$('#steps').textContent=fmt(steps);$('#minutes').textContent=fmt(mins);$('#goalBurn').textContent=s.burnGoal;$('#goalFood').textContent=s.foodGoal;$('#homeFood').textContent=fmt(food)+' kcal';$('#homeBalance').textContent=fmt(food-b)+' kcal';$('#dietTotal').textContent=fmt(food);$('#protein').textContent=fmt(p)+'g';$('#carbs').textContent=fmt(c)+'g';$('#fat').textContent=fmt(f)+'g';let ms=Object.values(state.days).flatMap(x=>x.measures||[]);$('#homeWeight').textContent=ms.length&&ms[ms.length-1].weight?ms[ms.length-1].weight+' kg':'—';arc('#burnRing',b,s.burnGoal,102);arc('#stepsRing',steps,s.stepGoal,61);arc('#minutesRing',mins,s.minuteGoal,61);foodCats();foodLib();exCats();exLib();lists();planRender();records();coach(b,steps,mins,food,s);drawWeek();drawWeight(ms);weeklySummary();recipeButtons();streak();achievements();renderWeekPlan()}
function dates(){let now=new Date(),h='';for(let i=-3;i<=3;i++){let x=new Date(now);x.setDate(now.getDate()+i);let k=iso(x);h+=`<button class="${k===selected?'active':''}" data-date="${k}">${x.toLocaleDateString('es-ES',{weekday:'short'}).slice(0,3).toUpperCase()}<br>${x.getDate()}</button>`}$('#dates').innerHTML=h}
function foodCats(){let cats=['Todos',...new Set(FOOD.map(x=>x[1]))];$('#foodCats').innerHTML=cats.map(c=>`<button class="${c===foodCat?'active':''}" data-foodcat="${c}">${c}</button>`).join('')}
function exCats(){let cats=['Todos',...new Set(EX.map(x=>x[2]))];$('#exerciseCats').innerHTML=cats.map(c=>`<button class="${c===exCat?'active':''}" data-excat="${c}">${c}</button>`).join('')}
function foodLib(){let source=FOOD;if(foodMode==='fav')source=state.fav.map(i=>FOOD[i]).filter(Boolean);if(foodMode==='recent')source=state.recent.map(i=>FOOD[i]).filter(Boolean);let q=norm($('#foodSearch')?.value||''),list=source.filter(x=>(foodCat==='Todos'||x[1]===foodCat)&&norm(x[0]).includes(q)).slice(0,90);$('#foodLib').innerHTML=list.map(x=>{let i=FOOD.indexOf(x),fav=state.fav.includes(i);return `<div class="card"><span><b>${x[0]}</b><small>${x[1]} · ${x[2]} kcal · P ${x[3]} · H ${x[4]} · G ${x[5]}</small></span><div><button data-fav="${i}">${fav?'★':'☆'}</button><button data-food="${i}">Añadir</button></div></div>`}).join('')||'<div class="card"><small>Sin resultados</small></div>'}
function exLib(){let q=norm($('#exerciseSearch')?.value||''),list=EX.filter(x=>(exCat==='Todos'||x[2]===exCat)&&(norm(x[0]).includes(q)||norm(x[1]).includes(q)||norm(x[2]).includes(q))).slice(0,90);$('#exerciseLib').innerHTML=list.map(x=>`<div class="card"><span><b>${x[0]}</b><small>${x[1]} · ${x[2]} · ${x[3]}x${x[4]} · ${x[5]}</small></span><button data-ex="${EX.indexOf(x)}">Añadir</button></div>`).join('')}
function lists(){let d=day();$('#foodList').innerHTML=d.foods.length?d.foods.map((x,i)=>`<div><span><b>${x.name}</b><br><small>${x.kcal} kcal · P ${x.protein||0} · H ${x.carbs||0} · G ${x.fat||0}</small></span><button class="del" data-list="foods" data-i="${i}">×</button></div>`).join(''):'<div><small>Sin comidas</small></div>';$('#trainList').innerHTML=d.training.length?d.training.map((x,i)=>`<div><span><b>${x.name}</b><br><small>${x.sets}x${x.reps} · ${x.kg||0} kg · ${x.notes||''}</small></span><button class="del" data-list="training" data-i="${i}">×</button></div>`).join(''):'<div><small>Sin ejercicios</small></div>';let ms=Object.values(state.days).flatMap(x=>x.measures||[]);$('#measureList').innerHTML=ms.length?ms.slice(-8).reverse().map(x=>`<div><span><b>${x.weight||'—'} kg</b><br><small>${x.date} · cintura ${x.waist||'—'} · pecho ${x.chest||'—'} · cadera ${x.hip||'—'}</small></span></div>`).join(''):'<div><small>Sin medidas</small></div>'}
function session(){let arr=plans[state.plan.days]||plans[3];return arr[state.plan.next%arr.length]}
function exByName(n){return EX.find(e=>e[0]===n)||[n,'Libre','Libre',3,'10','']}
function lastKg(name){let all=Object.values(state.days).flatMap(x=>x.training||[]).filter(x=>x.name===name&&+x.kg);return all.length?all[all.length-1].kg:0}
function planRender(){let s=session();$('#planSummary').textContent=`${state.plan.days} días/semana · ${state.plan.time} min. Si saltas un día, continúas la siguiente sesión.`;$('#sessionTitle').textContent='Próxima: '+s[0];$('#sessionInfo').textContent=s[1].join(' · ');$('#activeWorkout').innerHTML=state.plan.active.length?state.plan.active.map((x,i)=>`<div class="card ${x.done?'done':''}"><span><b>${x.name}</b><small>${x.muscle} · ${x.material} · objetivo ${x.sets}x${x.reps}</small><div class="setgrid"><input data-aw="${i}" data-field="sets" value="${x.sets}"><input data-aw="${i}" data-field="reps" value="${x.reps}"><input data-aw="${i}" data-field="kg" type="number" value="${x.kg||0}"></div></span><button data-complete="${i}">${x.done?'OK':'Hecho'}</button></div>`).join(''):'<div class="card"><small>No hay sesión cargada</small></div>'}
function loadRoutine(){let s=session();state.plan.active=s[1].map(n=>{let e=exByName(n);return {name:e[0],muscle:e[1],material:e[2],sets:e[3],reps:e[4],notes:e[5],kg:lastKg(e[0]),done:false}});save()}
function finishWorkout(){if(!state.plan.active.length)return;let d=day();state.plan.active.forEach(x=>d.training.push({name:x.name,sets:x.sets,reps:x.reps,kg:x.kg||0,notes:session()[0]+' · '+x.notes}));d.activities.push({type:'gym',minutes:state.plan.time,steps:0,kcal:Math.round(state.plan.time*6)});state.plan.active=[];state.plan.next++;save()}
function records(){let all=Object.values(state.days).flatMap(x=>x.training||[]),m={};all.forEach(x=>{let kg=+x.kg||0;if(!m[x.name]||kg>m[x.name].kg)m[x.name]={kg,sets:x.sets,reps:x.reps}});let rows=Object.entries(m).filter(([n,x])=>x.kg>0).sort((a,b)=>b[1].kg-a[1].kg).slice(0,8);$('#recordsList').innerHTML=rows.length?rows.map(([n,x])=>`<div><span><b>${n}</b><br><small>${x.kg} kg · ${x.sets}x${x.reps}</small></span></div>`).join(''):'<div><small>Aún no hay récords</small></div>'}
function coach(b,steps,m,food,s){let rm=Math.max(s.minuteGoal-m,0),rf=Math.max(s.foodGoal-food,0),rs=Math.max(s.stepGoal-steps,0);$('#coachFood').textContent=rf+' kcal';$('#coachActivity').textContent=rm?rm+' min':'Objetivo cumplido';let msg=`Te faltan ${fmt(rs)} pasos. Dieta restante: ${rf} kcal. Próximo entreno: ${session()[0]}. `+autoAdjustSuggestion(food,b,s); $('#coachText').textContent=msg}
function drawWeek(){let c=$('#weekChart'),ctx=c.getContext('2d'),w=c.width=c.clientWidth*devicePixelRatio,h=c.height=120*devicePixelRatio;ctx.clearRect(0,0,w,h);let vals=[],now=new Date(selected);for(let i=6;i>=0;i--){let x=new Date(now);x.setDate(now.getDate()-i);vals.push(sum((state.days[iso(x)]||{activities:[]}).activities,'kcal'))}let max=Math.max(state.settings.burnGoal,...vals,1),step=w/6;ctx.strokeStyle='#74f14d';ctx.lineWidth=5*devicePixelRatio;ctx.beginPath();vals.forEach((v,i)=>{let x=i*step,y=h-(v/max)*h*.75-h*.1;i?ctx.lineTo(x,y):ctx.moveTo(x,y)});ctx.stroke()}
function drawWeight(ms){let c=$('#weightChart'),ctx=c.getContext('2d'),w=c.width=c.clientWidth*devicePixelRatio,h=c.height=120*devicePixelRatio;ctx.clearRect(0,0,w,h);let vals=ms.filter(x=>x.weight).slice(-14).map(x=>+x.weight);if(vals.length<2)return;let mn=Math.min(...vals)-1,mx=Math.max(...vals)+1,step=w/(vals.length-1);ctx.strokeStyle='#74f14d';ctx.lineWidth=5*devicePixelRatio;ctx.beginPath();vals.forEach((v,i)=>{let x=i*step,y=h-((v-mn)/(mx-mn))*h*.8-h*.1;i?ctx.lineTo(x,y):ctx.moveTo(x,y)});ctx.stroke()}
function estimate(t,min){return Math.round(({walk:4.2,run:10,bike:7,gym:6}[t]||5)*min)}
function parseSmartMeal(txt){let raw=txt, s=norm(txt), totals={name:'Estimación: '+raw.slice(0,45),kcal:0,protein:0,carbs:0,fat:0}, matched=false;let re=/(\d+)\s*g?\s+([a-záéíóúñ ]+)/g, m;while((m=re.exec(s))){let grams=+m[1], term=m[2].trim().split(/ y |,| con /)[0].trim();let item=FOOD.find(f=>norm(f[0]).includes(term)||term.includes(norm(f[0]).split(' ')[0]));if(item){let factor=grams/100;totals.kcal+=item[2]*factor;totals.protein+=item[3]*factor;totals.carbs+=item[4]*factor;totals.fat+=item[5]*factor;matched=true}}if(!matched){if(s.includes('pizza'))totals={name:'Pizza estimada',kcal:850,protein:35,carbs:95,fat:35};else if(s.includes('bocadillo'))totals={name:'Bocadillo estimado',kcal:520,protein:28,carbs:60,fat:16};else if(s.includes('tortilla'))totals={name:'Tortilla estimada',kcal:450,protein:22,carbs:30,fat:25};else if(s.includes('ensalada'))totals={name:'Ensalada estimada',kcal:320,protein:18,carbs:18,fat:16};else totals={name:'Comida estimada',kcal:450,protein:22,carbs:45,fat:15}}['kcal','protein','carbs','fat'].forEach(k=>totals[k]=Math.round(totals[k]));return totals}
let timer=null;function startTimer(sec){clearInterval(timer);let left=sec;$('#timerText').textContent='Descanso: '+left+' s';timer=setInterval(()=>{left--;$('#timerText').textContent=left>0?'Descanso: '+left+' s':'Descanso terminado';if(left<=0){clearInterval(timer);if(navigator.vibrate)navigator.vibrate([200,100,200]);}},1000)}
$('#activityBtn').onclick=()=>$('#activityDialog').showModal();$('#settingsBtn').onclick=()=>{let f=$('#settingsForm'),s=state.settings;f.burnGoal.value=s.burnGoal;f.stepGoal.value=s.stepGoal;f.minuteGoal.value=s.minuteGoal;f.foodGoal.value=s.foodGoal;$('#settingsDialog').showModal()};
$('#activityForm').onsubmit=e=>{e.preventDefault();let f=e.target,min=+f.minutes.value||0;day().activities.push({type:f.type.value,minutes:min,steps:+f.steps.value||0,kcal:+f.kcal.value||estimate(f.type.value,min)});f.reset();$('#activityDialog').close();save()};
$('#settingsForm').onsubmit=e=>{e.preventDefault();let f=e.target;state.settings={burnGoal:+f.burnGoal.value||500,stepGoal:+f.stepGoal.value||12000,minuteGoal:+f.minuteGoal.value||45,foodGoal:+f.foodGoal.value||1800};$('#settingsDialog').close();save()};
$('#foodForm').onsubmit=e=>{e.preventDefault();let f=e.target;day().foods.push({name:f.name.value,kcal:+f.kcal.value||0,protein:+f.protein.value||0,carbs:+f.carbs.value||0,fat:+f.fat.value||0});f.reset();save()};
$('#measureForm').onsubmit=e=>{e.preventDefault();let f=e.target;day().measures.push({date:selected,weight:f.weight.value,waist:f.waist.value,chest:f.chest.value,hip:f.hip.value});f.reset();save()};
$('#profileForm').onsubmit=e=>{e.preventDefault();applyProfile(e.target)};
$('#foodSearch').oninput=foodLib;$('#exerciseSearch').oninput=exLib;
document.body.addEventListener('input',e=>{if(e.target.dataset.aw){state.plan.active[+e.target.dataset.aw][e.target.dataset.field]=e.target.value;persist();}});
document.body.onclick=e=>{if(e.target.classList.contains('tab')){document.querySelectorAll('.tab,.page').forEach(x=>x.classList.remove('active'));e.target.classList.add('active');$('#'+e.target.dataset.page).classList.add('active');render()}if(e.target.dataset.date){selected=e.target.dataset.date;render()}if(e.target.dataset.foodcat){foodCat=e.target.dataset.foodcat;foodMode='all';render()}if(e.target.id==='favBtn'){foodMode='fav';foodLib()}if(e.target.id==='recBtn'){foodMode='recent';foodLib()}if(e.target.id==='allFoodBtn'){foodMode='all';foodLib()}if(e.target.dataset.fav){let i=+e.target.dataset.fav;state.fav=state.fav.includes(i)?state.fav.filter(x=>x!==i):[i,...state.fav];save()}if(e.target.dataset.food){let i=+e.target.dataset.food,x=FOOD[i];state.recent=[i,...state.recent.filter(r=>r!==i)].slice(0,20);day().foods.push({name:x[0],kcal:x[2],protein:x[3],carbs:x[4],fat:x[5]});save()}if(e.target.id==='estimateMeal'){let meal=parseSmartMeal($('#aiText').value);day().foods.push(meal);$('#aiText').value='';save()}if(e.target.dataset.recipe){addRecipe(+e.target.dataset.recipe)}if(e.target.id==='makeWeekPlan'){makeWeekPlan()}if(e.target.dataset.excat){exCat=e.target.dataset.excat;render()}if(e.target.dataset.ex){let x=EX[+e.target.dataset.ex];day().training.push({name:x[0],sets:x[3],reps:x[4],kg:0,notes:x[5]});save()}if(e.target.classList.contains('del')){day()[e.target.dataset.list].splice(+e.target.dataset.i,1);save()}if(e.target.dataset.plan){state.plan.days=+e.target.dataset.plan;state.plan.next=0;state.plan.active=[];save()}if(e.target.dataset.time){state.plan.time=+e.target.dataset.time;save()}if(e.target.id==='loadRoutine')loadRoutine();if(e.target.id==='finishWorkout')finishWorkout();if(e.target.dataset.complete){let x=state.plan.active[+e.target.dataset.complete];x.done=!x.done;save()}if(e.target.dataset.rest)startTimer(+e.target.dataset.rest);if(e.target.id==='exportData'){let blob=new Blob([JSON.stringify(state,null,2)],{type:'application/json'});let a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download='mi-metodo-backup.json';a.click();}};
$('#importData').onchange=e=>{let f=e.target.files[0];if(!f)return;let r=new FileReader();r.onload=()=>{state=JSON.parse(r.result);save()};r.readAsText(f)};
if('serviceWorker' in navigator) navigator.serviceWorker.register('sw.js?v=20').then(r=>r.update()).catch(()=>{});
render();