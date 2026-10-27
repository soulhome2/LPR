/* LPR prototype — fixture data + screens. Plain JS, no build. ICONS injected by build. */
(function(){
'use strict';
const $=(s,r=document)=>r.querySelector(s), $$=(s,r=document)=>Array.from(r.querySelectorAll(s));
const esc=s=>String(s??'').replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const ic=(n,c='')=>`<svg class="ic ${c}" viewBox="0 0 16 16" aria-hidden="true">${ICONS[n]||''}</svg>`;
const pad=n=>String(n).padStart(2,'0');
const hms=d=>`${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
const hm=d=>`${pad(d.getHours())}:${pad(d.getMinutes())}`;
const dmy=d=>`${pad(d.getDate())}.${pad(d.getMonth()+1)}.${d.getFullYear()}`;
const NOW=()=>new Date();
let seed=7; const rnd=()=>(seed=(seed*16807)%2147483647)/2147483647; const pick=a=>a[Math.floor(rnd()*a.length)];

/* ---------------- normalisation & matching (ТЗ LPR-REC-08, LPR-LST-05) ---------------- */
const L2C={A:'А',B:'В',E:'Е',K:'К',M:'М',H:'Н',O:'О',P:'Р',C:'С',T:'Т',Y:'У',X:'Х'};
const norm=s=>(s||'').toUpperCase().replace(/[\s\-|]/g,'').replace(/[ABEKMHOPCTYX]/g,c=>L2C[c]);
const SIM=[['0','О','D'],['8','В'],['1','I'],['5','S'],['2','Z']];
const same=(a,b)=>a===b||SIM.some(g=>g.includes(a)&&g.includes(b));
function lev1(a,b){ // ≤1 edit with similar-symbol substitution free
  if(Math.abs(a.length-b.length)>1) return false;
  let i=0,j=0,e=0;
  while(i<a.length&&j<b.length){
    if(same(a[i],b[j])){i++;j++;continue}
    if(++e>1) return false;
    if(a.length>b.length) i++; else if(b.length>a.length) j++; else {i++;j++}
  }
  return e+(a.length-i)+(b.length-j)<=1;
}
function plateMatch(q,p,fuzzy){
  if(!q) return true; if(!p) return false;
  q=norm(q); p=norm(p);
  if(/[?*]/.test(q)){const re=new RegExp('^'+q.replace(/[.+^${}()|[\]\\]/g,'\\$&').replace(/\?/g,'.').replace(/\*/g,'.*')+'$');return re.test(p)}
  if(fuzzy) return lev1(q,p)||p.includes(q);
  return p.includes(q);
}

/* ---------------- fixture ---------------- */
const LISTS=[
  {id:'emp',name:'Сотрудники',type:'allow',count:1284,prio:50,sound:'Тон 1',recipients:'—',actions:'Открыть шлагбаум',owner:'Отдел кадров'},
  {id:'ctr',name:'Подрядчики',type:'allow',count:312,prio:40,sound:'Тон 1',recipients:'—',actions:'Открыть шлагбаум',owner:'Служба логистики'},
  {id:'svc',name:'Служебный транспорт',type:'allow',count:46,prio:45,sound:'—',recipients:'—',actions:'Открыть шлагбаум',owner:'Автохозяйство'},
  {id:'guest',name:'Гости',type:'guest',count:27,prio:30,sound:'Тон 2',recipients:'Пригласивший',actions:'Открыть шлагбаум, уведомить пригласившего',owner:'Бюро пропусков'},
  {id:'vip',name:'VIP',type:'info',count:18,prio:60,sound:'Тон 3',recipients:'Начальник смены',actions:'Открыть шлагбаум',owner:'Служба безопасности'},
  {id:'viol',name:'Нарушители',type:'info',count:23,prio:35,sound:'—',recipients:'Начальник смены',actions:'—',owner:'Служба безопасности'},
  {id:'black',name:'Чёрный список',type:'deny',count:64,prio:80,sound:'Сирена',recipients:'Дежурный СБ → Начальник СБ',actions:'Тревога, запись HQ, PTZ на ТС',owner:'Служба безопасности'},
  {id:'wanted',name:'Розыск',type:'wanted',count:9,prio:90,hidden:true,sound:'Сирена',recipients:'Дежурный СБ → Начальник СБ',actions:'Тревога, PTZ на ТС, запись HQ',owner:'Служба безопасности'},
];
const LBY=Object.fromEntries(LISTS.map(l=>[l.id,l]));
const POINTS=[
  {id:'k1in',name:'КПП-1 · Въезд №1',short:'КПП-1 въезд',x:110,y:300},
  {id:'k1out',name:'КПП-1 · Выезд №1',short:'КПП-1 выезд',x:150,y:330},
  {id:'k2',name:'КПП-2 «Юг» · грузовой',short:'КПП-2 Юг',x:470,y:370},
  {id:'p1',name:'Парковка П1 · въезд',short:'Парковка П1',x:250,y:160},
  {id:'s2',name:'Склад №2 · ворота А',short:'Склад №2',x:330,y:255},
  {id:'s5',name:'Склад №5 · рампа',short:'Склад №5',x:505,y:120},
  {id:'tr',name:'Транзит · ул. Северная',short:'ул. Северная',x:60,y:80},
];
const PBY=Object.fromEntries(POINTS.map(p=>[p.id,p]));
const ENTRIES={ // known plates → list entry
  'А123ВС77':{list:'emp',owner:'Иванов И. И.',org:'Отдел логистики',until:'31.12.2026',make:'Toyota',model:'Camry',reason:'Приказ № 112-к от 12.01.2026'},
  'Е555КХ77':{list:'emp',owner:'Петрова М. С.',org:'Бухгалтерия',until:'31.12.2026',make:'Kia',model:'Rio',reason:'Приказ № 140-к от 03.02.2026'},
  'В001АВ50':{list:'ctr',owner:'ООО «СтройМонтаж»',org:'Подрядчик, договор 77/26',until:'30.11.2026',make:'ГАЗ',model:'ГАЗель Next',reason:'Договор № 77/26'},
  'М314ММ77':{list:'ctr',owner:'ООО «ТрансЛайн»',org:'Перевозчик',until:'03.11.2026',make:'КАМАЗ',model:'54901',reason:'Заявка ERP № 5521'},
  'Т808ТТ199':{list:'svc',owner:'Автохозяйство',org:'Служебный',until:'—',make:'Lada',model:'Largus',reason:'Путевой лист'},
  'Р777РР97':{list:'vip',owner:'Орлов Д. К.',org:'Генеральный директор',until:'—',make:'Mercedes-Benz',model:'S-класс',reason:'Распоряжение СБ'},
  'Н321ОР777':{list:'guest',owner:'Смирнов П. А.',org:'Пригласила Кузнецова Е. В.',until:'сегодня 18:00',make:'Skoda',model:'Octavia',reason:'Гостевая заявка № 3318'},
  'О777ОО99':{list:'wanted',owner:'—',org:'—',until:'31.01.2027',make:'Lada',model:'Vesta',reason:'Ориентировка ГУ МВД № 2026/1187 от 20.10.2026'},
  'Х909УУ50':{list:'black',owner:'—',org:'—',until:'—',make:'ГАЗ',model:'ГАЗель Next',reason:'Хищение со склада, акт № 14 от 21.10.2026'},
  'С808СС190':{list:'black',owner:'—',org:'—',until:'—',make:'Kia',model:'Rio',reason:'Нарушение пропускного режима, акт № 9'},
};
const MAKES=[['Toyota','Camry','легковой'],['Kia','Rio','легковой'],['Hyundai','Solaris','легковой'],['Lada','Vesta','легковой'],['Lada','Granta','легковой'],['Volkswagen','Polo','легковой'],['Skoda','Octavia','легковой'],['ГАЗ','ГАЗель Next','грузовой'],['КАМАЗ','54901','грузовой'],['Haval','Jolion','легковой'],['Chery','Tiggo 7','легковой'],['Ford','Transit','грузовой'],['Scania','R450','грузовой'],['ПАЗ','3204','автобус']];
const LET='АВЕКМНОРСТУХ', REG=['77','97','99','177','197','199','777','50','150','190','750','78','178','47'];
const randPlate=()=>pick(LET)+String(100+Math.floor(rnd()*899))+pick(LET)+pick(LET)+pick(REG);
const POOL=['А123ВС77','Е555КХ77','В001АВ50','М314ММ77','Т808ТТ199','Р777РР97','Н321ОР777','Х909УУ50','С808СС190'];
for(let i=0;i<40;i++) POOL.push(randPlate());
POOL.push('KZ 123ABC02','BY 4567 AB-7');
const mkFor=pl=>{const e=ENTRIES[pl]; if(e){const m=MAKES.find(x=>x[0]===e.make&&x[1]===e.model); return m||[e.make,e.model,'легковой']} let h=0;for(const c of pl)h=(h*31+c.charCodeAt(0))%997; return MAKES[h%MAKES.length]};

let PID=1;
function mkPassage(plate,pointId,t,opts={}){
  const m=plate?mkFor(norm(plate)):pick(MAKES); const n=plate?norm(plate):null; const e=n&&ENTRIES[n];
  const conf=opts.conf??(plate?Math.round(86+rnd()*13):0);
  const dir=pointId==='k1out'?'выезд':pointId==='tr'?'транзит':'въезд';
  const lists=e?[e.list]:[]; let decision='none', src='auto';
  if(['k1in','k1out','k2','p1'].includes(pointId)){
    if(!plate) decision='operator';
    else if(e&&['allow','guest','info'].includes(LBY[e.list].type)) decision='allow';
    else if(e&&LBY[e.list].type==='deny') decision='deny';
    else decision='operator';
  }
  return {id:'P'+(PID++),plate:n,country:plate&&/^[A-Z]{2} /.test(plate)?plate.slice(0,2):(plate?'RU':''),raw:plate,ts:t,point:pointId,dir,
    make:m[0],model:m[1],cls:m[2],conf,vconf:Math.round(80+rnd()*19),speed:pointId==='tr'?Math.round(38+rnd()*35):(pointId==='k2'?Math.round(8+rnd()*14):null),
    lists,decision,src,by:null,reason:null,corrected:null,...opts};
}
const PASSAGES=[];
(function gen(){const n=NOW();for(let i=0;i<140;i++){const t=new Date(n-(i*4.3+rnd()*3)*60000);const pt=pick(['k1in','k1in','k1out','k1out','k2','p1','s2','s5','tr','tr']);const pl=rnd()<.04?null:pick(POOL);const p=mkPassage(pl,pt,t,{conf:pl?(rnd()<.1?Math.round(70+rnd()*14):Math.round(86+rnd()*13)):0});if(p.decision==='operator'){p.decision=rnd()<.8?'allow':'deny';p.src='operator';p.by='Сидоров А. В.';p.reason=p.decision==='allow'?'Доставка по звонку':'Нет заявки';}PASSAGES.push(p)}
  // investigation history for Х909УУ50
  const d=(day,h,m)=>{const x=new Date(n);x.setDate(x.getDate()-day);x.setHours(h,m,12,0);return x};
  PASSAGES.push(mkPassage('Х909УУ50','s2',d(9,23,41)),mkPassage('Х909УУ50','s5',d(7,0,12)),mkPassage('Х909УУ50','k2',d(6,1,5)),mkPassage('М314ММ77','s2',d(9,23,52)),mkPassage('М314ММ77','s5',d(7,0,31)),mkPassage('М314ММ77','k2',d(6,1,48)),mkPassage('С808СС190','s2',d(9,22,58)),mkPassage('С808СС190','k2',d(6,2,15)),mkPassage('0777ОО99','tr',d(1,18,20),{conf:81}),mkPassage('О777ОО99','tr',d(3,9,5)));
  PASSAGES.sort((a,b)=>b.ts-a.ts);
})();

/* ---------------- state ---------------- */
const S={ds:'data',offline:false,buffer:0,route:'kpp',
  kpp:{last:null,pending:[]},
  alerts:[],alertSel:null,
  j:{q:'',fuzzy:false,chips:{},view:'table',group:false,page:0,point:''},
  inv:{tool:'common',ran:true,sel:0,purpose:'Дело № 2026-114 «Хищение со склада»',heat:false},
  list:{sel:'emp',chip:''},
  ch:{sel:'c1',step:5},
};
(function initKpp(){
  const n=NOW();
  S.kpp.last=mkPassage('А123ВС77','k1in',new Date(n-23000),{conf:98});
  S.kpp.last.barrierAt=new Date(n-22400);
  const pend=mkPassage('К456МР178','k1in',new Date(n-12000),{conf:87}); S.kpp.pending=[pend];
  PASSAGES.unshift(S.kpp.last,pend);
  S.alerts=[
    {id:'A1',plate:'О777ОО99',raw:'0777ОО99',list:'wanted',match:'нечёткое: 0 → О',point:'k2',t0:+n-25000,rep:1,rec:['Lada','Vesta',91],exp:['Lada','Vesta'],status:'new'},
    {id:'A2',plate:'Х909УУ50',raw:'Х909УУ50',list:'black',match:'точное',point:'s5',t0:+n-48000,rep:3,rec:['ГАЗ','ГАЗель Next',96],exp:['ГАЗ','ГАЗель Next'],status:'new'},
    {id:'A3',plate:'С808СС190',raw:'С808СС190',list:'black',match:'точное',point:'k1in',t0:+n-130000,rep:1,rec:['Hyundai','Solaris',93],exp:['Kia','Rio'],status:'new',esc:'Петров А. В. (начальник СБ)'},
  ];
  S.alertSel='A1';
})();

/* ---------------- rendering helpers ---------------- */
function plate(p,o={}){
  if(!p) return `<span class="plate unk ${o.lg?'lg':''}" title="ГРЗ не прочитан"><span class="pm">????</span></span>`;
  const n=norm(p); const m=n.match(/^([А-Я])(\d{3})([А-Я]{2})(\d{2,3})$/);
  const m2=!m&&!/^[A-Z]{2} /.test(p)&&n.match(/^(.{4,6}?)(\d{2,3})$/);
  let inner = m||m2?`<span class="pm">${esc((m||m2).slice(1,-1).join(''))}</span><span class="pr"><b>${(m||m2).slice(-1)[0]}</b><i>RUS</i></span>`
               :`<span class="pm">${esc(p.replace(/^[A-Z]{2} /,''))}</span><span class="pr"><b>${esc((p.match(/^([A-Z]{2}) /)||[,'—'])[1])}</b></span>`;
  const lc=o.conf!=null&&o.conf<85?`<span class="lowconf" title="Уверенность ${o.conf} % — ниже 85 %">${ic('alert')}</span>`:'';
  const tag=`<span class="plate-w"><span class="plate ${o.lg?'lg':''}">${inner}</span>${lc}</span>`;
  return o.static?tag:`<button class="plate-btn" data-plate="${esc(n)}" aria-label="Карточка ТС ${esc(n)}">${tag}</button>`;
}
function listBadge(id,o={}){const l=LBY[id]; if(!l) return '';
  const cls={allow:'badge-success',guest:'badge-success',info:'badge-info',deny:'badge-danger',wanted:'badge-danger'}[l.type];
  const icn={allow:'check',guest:'check',info:'tag',deny:'stop',wanted:'alert'}[l.type];
  return `<span class="badge ${cls}">${ic(icn)}${o.short||typeName(l.type)===l.name?esc(l.name):esc(typeName(l.type)+': '+l.name)}</span>`}
const typeName=t=>({allow:'Белый список',guest:'Гостевой',info:'Информационный',deny:'Чёрный список',wanted:'Розыск'}[t]);
const noList=()=>`<span class="badge badge-neutral">Нет в списках</span>`;
function statusBadges(p,kppView){
  const ls=p.lists.filter(id=>!(kppView&&LBY[id].hidden));
  if(!p.plate) return `<span class="badge badge-warning">${ic('alert')}ГРЗ не прочитан</span>`;
  return ls.length?ls.map(id=>listBadge(id,{short:true})).join(' '):noList();
}
function decisionBadge(p){
  if(p.decision==='allow') return `<span class="badge badge-success">${ic('check')}Пропущен · ${p.src==='auto'?'авто':'оператор'}</span>`;
  if(p.decision==='deny') return `<span class="badge badge-danger">${ic('x')}Отказ · ${p.src==='auto'?'авто':'оператор'}</span>`;
  if(p.decision==='operator') return `<span class="badge badge-warning">${ic('clock')}Ждёт решения</span>`;
  return `<span class="cap subtle">—</span>`;
}
function scene(o={}){ // abstract camera scene, theme-aware
  return `<svg class="scene" viewBox="0 0 400 225" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
   <defs><pattern id="st${o.id||''}" width="14" height="14" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><rect width="7" height="14" fill="var(--one-surface-subtle)"/></pattern></defs>
   <rect width="400" height="225" fill="url(#st${o.id||''})" opacity=".55"/>
   <path d="M0 225 L150 90 L250 90 L400 225Z" fill="var(--one-surface-subtle)" opacity=".8"/>
   ${o.car!==false?`<g fill="none" stroke="var(--one-fg-subtle)" stroke-width="2"><path d="M135 185 L150 140 Q155 128 170 128 L230 128 Q245 128 250 140 L265 185 Z"/><rect x="128" y="182" width="144" height="26" rx="5"/><circle cx="150" cy="196" r="5"/><circle cx="250" cy="196" r="5"/></g><rect x="181" y="188" width="38" height="12" rx="2" fill="var(--one-surface)" stroke="var(--one-fg-subtle)"/>`:''}
   ${o.bbox?`<rect x="176" y="184" width="48" height="20" fill="none" stroke="${o.bbox.c}" stroke-width="2"/>${o.bbox.t?`<rect x="176" y="168" width="${o.bbox.t.length*5.6+10}" height="15" fill="${o.bbox.c}"/><text x="181" y="179" font-size="9.5" font-weight="600" font-family="var(--one-font-mono)" fill="var(--one-accent-on)">${o.bbox.t}</text>`:''}`:''}
  </svg>`;
}
const thumb=(cls='')=>`<div class="thumb ${cls}">${scene({id:Math.random().toString(36).slice(2,6)})}</div>`;
function dataBlock(render,{rows=5,emptyText='Нет данных за выбранный период',emptyAct='Сбросить фильтры',emptyIcon='search'}={}){
  if(S.ds==='loading') return `<div class="col" style="padding:16px">${Array.from({length:rows},()=>`<div class="skeleton" style="height:28px"></div>`).join('')}</div>`;
  if(S.ds==='empty') return `<div class="empty">${ic(emptyIcon,'ic-32')}<div class="h-sm" style="color:var(--one-fg)">${emptyText}</div><button class="btn btn-outline" data-act="ds-reset">${emptyAct}</button></div>`;
  if(S.ds==='error') return `<div class="empty">${ic('alert','ic-32')}<div class="h-sm" style="color:var(--one-fg)">Сервер LPR не ответил за 10 с</div><div class="cap">Проверьте соединение с сервером Интеллект X «SRV-LPR-01».</div><button class="btn btn-outline" data-act="ds-reset">${ic('sync')}Повторить</button></div>`;
  return render();
}
function toast(msg,kind=''){const t=document.createElement('div');t.className='toast '+kind;t.innerHTML=`${kind==='alarm'?ic('alert','t-danger'):ic('check','t-success')}<div>${msg}</div>`;$('#toasts').append(t);setTimeout(()=>t.remove(),5200)}
const fmtAgo=ms=>{const s=Math.max(0,Math.floor(ms/1000));return `${Math.floor(s/60)}:${pad(s%60)}`};

/* ================= SCREENS ================= */
const TITLES={kpp:'КПП / Проезды',alerts:'Срабатывания',territory:'Территория и парковки',journal:'Журнал проездов',inv:'Расследования',reports:'Отчёты',violations:'Нарушения на территории',lists:'Списки контроля',channels:'Каналы и качество распознавания'};

/* ---------- Э1 КПП ---------- */
function vKpp(){
  const L=S.kpp.last, e=ENTRIES[L.plate], cur=S.kpp.pending[0];
  const feed=PASSAGES.filter(p=>['k1in','k1out'].includes(p.point)).slice(0,10);
  const conn=S.offline?`<span class="badge badge-warning">${ic('alert')}Автономный режим · копия разрешающих списков от ${hm(new Date(Date.now()-17*60000))} · в буфере ${S.buffer} проездов</span>`
                      :`<span class="badge badge-success">${ic('broadcast')}Связь с центром</span>`;
  return `
  <div class="page-h">
    <select class="field" style="width:auto" aria-label="Точка доступа"><option>КПП-1 · Въезд №1</option><option>КПП-1 · Выезд №1</option><option>КПП-2 «Юг» · грузовой</option></select>
    ${conn}<span class="sp"></span>
    <span class="cap muted">F2 пропустить · F4 отказать · F6 исправить ГРЗ · F8 гостевой пропуск</span>
  </div>
  <div class="kpp">
    <div class="cams">
      <div class="cam">${scene({id:'m',bbox:{c:L.conf<85?'var(--one-warning-icon)':'var(--one-success-icon)',t:(L.corrected||L.plate||'????')+' · '+L.conf+' %'}})}
        <span class="cam-l"><span class="live"></span>Камера «Въезд 1 — ГРЗ» · live</span>
        <span class="cam-meta"><span class="q g"><i></i>ГРЗ 148 пикс</span>·<span>распознано 97 % за 15 мин</span></span>
      </div>
      <div class="cam">${scene({id:'o',car:false})}<span class="cam-l">Обзорная камера</span></div>
      <div class="cam">${scene({id:'x'})}<span class="cam-l">Выезд 1 — ГРЗ</span></div>
    </div>
    <div class="col" style="gap:16px">
      <section class="card ${L.decision==='allow'?'ok':L.decision==='deny'?'alarm':''}">
        <div class="card-h"><h2>Последний проезд · ${hms(L.ts)}</h2><span class="sp"></span>${decisionBadge(L)}</div>
        <div class="card-b row" style="align-items:flex-start;gap:12px">
          ${thumb('lg')}
          <div class="col grow" style="gap:6px">
            <div>${plate(L.corrected||L.plate,{lg:1,conf:L.conf})}</div>
            ${L.corrected?`<div class="cap muted">Исправлен: было ${esc(L.plate)} · ${esc(L.correctedBy)}</div>`:''}
            <div>${statusBadges(L,true)}</div>
            <div class="cap muted">${esc(L.make)} ${esc(L.model)} · ${L.cls} · ${L.dir} · ${L.conf} %</div>
            ${e&&!LBY[e.list].hidden?`<div class="cap muted">${esc(e.owner)}, ${esc(e.org)} · до ${esc(e.until)}</div>`:''}
            ${L.barrierAt?`<div class="cap muted">Шлагбаум открыт ${hms(L.barrierAt)}${L.src==='operator'?' · '+esc(L.by)+': '+esc(L.reason):''}</div>`:''}
          </div>
        </div>
        <div class="card-b row wrap" style="padding-top:0">
          <button class="btn btn-outline" data-act="fix">${ic('pencil')}Исправить ГРЗ<span class="hk">F6</span></button>
          <button class="btn btn-outline" data-plate="${esc(L.plate||'')}">Карточка ТС</button>
          <button class="btn btn-subtle" data-act="addlist" data-p="${esc(L.plate||'')}">${ic('plus')}В список</button>
        </div>
      </section>
      <section class="card ${cur?'attn':''}">
        <div class="card-h"><h2>Ожидает решения оператора</h2>${S.kpp.pending.length>1?`<span class="badge badge-warning">ещё ${S.kpp.pending.length-1}</span>`:''}<span class="sp"></span>${cur?`<span class="timer" data-t0="${+cur.ts}">${fmtAgo(Date.now()-cur.ts)}</span>`:''}</div>
        ${cur?`<div class="card-b row" style="align-items:flex-start;gap:12px">${thumb()}
          <div class="col grow" style="gap:6px"><div class="row wrap">${plate(cur.plate,{conf:cur.conf})} ${cur.plate?noList():`<span class="badge badge-warning">${ic('alert')}ГРЗ не прочитан</span>`}</div>
          <div class="cap muted">${cur.plate?'Гостевой пропуск не найден':'Нечитаемый или отсутствующий ГРЗ'} · ${esc(cur.make)} ${esc(cur.model)} · ${cur.plate?cur.conf+' %':'—'}</div></div></div>
        <div class="card-b row wrap" style="padding-top:0">
          <button class="btn btn-green" data-act="decide" data-d="allow">${ic('check')}Пропустить…<span class="hk">F2</span></button>
          <button class="btn btn-red" data-act="decide" data-d="deny">${ic('x')}Отказать…<span class="hk">F4</span></button>
          <button class="btn btn-outline" data-act="guest">Гостевой пропуск<span class="hk">F8</span></button>
        </div>`:`<div class="empty" style="padding:24px">${ic('check','ic-32')}<div>Очередь пуста — все проезды обработаны</div></div>`}
      </section>
      <section class="card">
        <div class="card-h"><h2>Лента распознаваний</h2><span class="badge badge-neutral">${feed.length}</span><span class="sp"></span><a class="link-action link" href="#journal" style="text-decoration:none">Журнал</a></div>
        ${dataBlock(()=>`<div id="feed">${feed.map(p=>feedRow(p)).join('')}</div>`,{emptyText:'Проездов за смену нет'})}
      </section>
    </div>
  </div>`;
}
function feedRow(p,isNew){return `<button class="feed-row ${isNew?'new':''}" data-plate="${esc(p.plate||'')}" data-pid="${p.id}">${thumb('sm')}<span class="col grow" style="gap:2px"><span class="row wrap">${plate(p.plate,{conf:p.conf,static:1})} ${statusBadges(p,true)}</span><span class="cap muted">${esc(PBY[p.point].short)} · ${esc(p.make)} ${esc(p.model)}</span></span><span class="cap muted mono">${hms(p.ts)}</span></button>`}

/* ---------- Э2 Срабатывания ---------- */
function vAlerts(){
  const open=S.alerts.filter(a=>a.status==='new').sort((a,b)=>LBY[b.list].prio-LBY[a.list].prio||a.t0-b.t0);
  const a=open.find(x=>x.id===S.alertSel)||open[0]; if(a) S.alertSel=a.id;
  const e=a&&ENTRIES[a.plate]; const mism=a&&(a.rec[0]!==a.exp[0]||a.rec[1]!==a.exp[1]);
  const hist=a?PASSAGES.filter(p=>p.plate===a.plate).slice(0,5):[];
  return `<div class="alerts">
   <section class="card">
     <div class="card-h"><h2>Очередь срабатываний</h2><span class="badge badge-danger">${open.length}</span></div>
     ${dataBlock(()=>open.length?open.map(x=>`<button class="q-item" data-act="asel" data-id="${x.id}" aria-selected="${x.id===S.alertSel}">
        <span class="row wrap">${plate(x.plate,{static:1})}${x.rep>1?`<span class="badge badge-neutral">×${x.rep}</span>`:''}</span>
        <span class="timer ${Date.now()-x.t0>60000?'late':''}" data-t0="${x.t0}">${fmtAgo(Date.now()-x.t0)}</span>
        <span class="row wrap" style="grid-column:1/3">${listBadge(x.list)}${LBY[x.list].hidden?`<span class="badge badge-neutral">${ic('eye-closed')}скрытое</span>`:''}</span>
        <span class="cap muted" style="grid-column:1/3">${esc(PBY[x.point].name)}${x.esc?` · <span class="t-warning">эскалировано → ${esc(x.esc)}</span>`:''}</span>
      </button>`).join(''):`<div class="empty">${ic('check','ic-32')}<div class="h-sm" style="color:var(--one-fg)">Открытых срабатываний нет</div><a class="btn btn-outline" href="#journal">Открыть журнал</a></div>`,{rows:3,emptyText:'Открытых срабатываний нет',emptyAct:'Открыть журнал',emptyIcon:'bell'})}
     <div class="card-b cap subtle">Без реакции 60 с — эскалация следующему получателю. Повторы по одному ГРЗ и списку за 10 мин объединяются.</div>
   </section>
   ${a?`<section class="card ${['wanted','deny'].includes(LBY[a.list].type)?'alarm':''}">
     <div class="card-h"><h2>Сверка · ${esc(LBY[a.list].name)}</h2><span class="badge badge-warning">${ic('dot-fill')}Нужна реакция</span><span class="sp"></span><span class="cap muted">${esc(PBY[a.point].name)} · ${hms(new Date(a.t0))}</span></div>
     <div class="card-b col" style="gap:12px">
       <div class="grid2"><div class="cam" style="aspect-ratio:16/9">${scene({id:'a1',bbox:{c:'var(--one-danger-icon)'}})}<span class="cam-l">Кадр проезда</span></div>
         <div class="col"><div class="cam" style="aspect-ratio:4/1;min-height:70px;display:grid;place-items:center">${plate(a.raw,{lg:1,static:1})}</div><div class="cap muted">Изображение ГРЗ · уверенность ${a.rec[2]} %</div>
         ${mism?`<div class="badge badge-warning" style="white-space:normal">${ic('alert')}Возможная подмена ГРЗ: марка/модель не совпадают с записью и профилем ТС</div>`:''}</div></div>
       <div class="cmp">
         <div class="hd"></div><div class="hd">Распознано</div><div class="hd c-list">Запись списка</div>
         <div class="k">ГРЗ</div><div>${plate(a.raw,{static:1})}</div><div class="c-list">${plate(a.plate,{static:1})}</div>
         <div class="k">Совпадение</div><div class="${a.match.startsWith('нечёт')?'diff':''}">${esc(a.match)}</div><div class="c-list">${listBadge(a.list)}</div>
         <div class="k">Марка, модель</div><div class="${mism?'diff':''}">${esc(a.rec[0])} ${esc(a.rec[1])}</div><div class="c-list ${mism?'diff':''}">${esc(a.exp[0])} ${esc(a.exp[1])}</div>
         <div class="k">Основание</div><div class="cap muted">—</div><div class="c-list">${esc(e?.reason||'—')}</div>
         <div class="k">Ответственный</div><div class="cap muted">—</div><div class="c-list">${esc(LBY[a.list].owner)}</div>
       </div>
       <div><label class="label" for="a-com">Комментарий</label><textarea class="field" id="a-com" rows="2" style="height:auto;padding-top:6px" placeholder="Например: наряд направлен к КПП-2"></textarea></div>
       <div class="row wrap">
         <button class="btn btn-primary" data-act="aconfirm">${ic('check')}Подтвердить</button>
         <button class="btn btn-outline" data-act="areject">Отклонить…</button>
         <button class="btn btn-outline" data-kit-menu="#m-transfer">${ic('arrow-right')}Передать</button>
         <span class="sp"></span>
         <button class="btn btn-subtle" data-act="video" data-p="${a.plate}">${ic('video')}Видео</button>
         <button class="btn btn-subtle" data-act="route" data-p="${a.plate}">${ic('milestone')}Маршрут</button>
       </div>
       <div class="menu" id="m-transfer" hidden role="menu" style="width:260px"><div class="menu-subheader ov" style="padding:6px 12px">Передать</div>
         ${['Петров А. В. · начальник СБ','Наряд №2 · территория','Дежурная часть ОМВД'].map(n=>`<button class="menu-item" role="menuitem" data-act="atransfer" data-to="${n}">${ic('person')}${n}</button>`).join('')}</div>
     </div>
   </section>
   <section class="card c3">
     <div class="card-h"><h2>Последние проезды ГРЗ</h2></div>
     <div class="card-b col">${miniMap(hist)}
       ${hist.map((p,i)=>`<div class="pt"><span class="pt-l">${i+1}</span><span class="grow">${esc(PBY[p.point].name)}</span><span class="cap muted mono">${dmy(p.ts)===dmy(NOW())?hms(p.ts):dmy(p.ts)}</span></div>`).join('')||'<div class="cap muted">Ранее не фиксировался</div>'}
       <div class="cap muted">Направление: ${hist[0]?esc(PBY[hist[0].point].short)+' → территория':'—'}</div>
     </div>
   </section>`:`<section class="card" style="grid-column:2/4"><div class="empty">${ic('check','ic-32')}<div class="h-sm" style="color:var(--one-fg)">Все срабатывания обработаны</div><a class="btn btn-outline" href="#journal">Открыть журнал</a></div></section>`}
  </div>`;
}
function mapBase(){return `<rect width="600" height="420" fill="var(--one-surface-muted)"/>
  <g stroke="var(--one-surface-subtle)" stroke-width="14" fill="none" stroke-linecap="round"><path d="M0 70 L600 40"/><path d="M90 0 L140 420"/><path d="M0 300 L600 330"/><path d="M330 40 L330 420"/><path d="M140 160 L600 140"/></g>
  <g fill="var(--one-surface)" stroke="var(--one-table-row-divider)"><rect x="180" y="190" width="110" height="70" rx="4"/><rect x="360" y="170" width="120" height="110" rx="4"/><rect x="380" y="70" width="100" height="45" rx="4"/><rect x="200" y="350" width="100" height="50" rx="4"/></g>`}
function miniMap(hist){
  const pts=hist.slice().reverse().map(p=>PBY[p.point]);
  return `<div class="map"><svg viewBox="0 0 600 420" role="img" aria-label="Карта последних проездов">${mapBase()}
   ${pts.length>1?`<polyline points="${pts.map(p=>p.x+','+p.y).join(' ')}" fill="none" stroke="var(--one-danger-icon)" stroke-width="3" stroke-dasharray="8 6"/>`:''}
   ${POINTS.map(p=>`<circle cx="${p.x}" cy="${p.y}" r="6" fill="var(--one-surface)" stroke="var(--one-fg-subtle)" stroke-width="2"/>`).join('')}
   ${pts.map((p,i)=>`<g><circle cx="${p.x}" cy="${p.y}" r="13" fill="var(--one-danger-icon)" stroke="var(--one-surface)" stroke-width="2"/><text x="${p.x}" y="${p.y+4}" text-anchor="middle" font-size="12" font-weight="600" fill="var(--one-accent-on)">${pts.length-i}</text></g>`).join('')}
  </svg></div>`;
}

/* ---------- Э3 Журнал ---------- */
function jFilter(){
  const J=S.j; return PASSAGES.filter(p=>{
    if(J.q&&!plateMatch(J.q,p.corrected||p.plate,J.fuzzy)) return false;
    if(J.point&&p.point!==J.point) return false;
    if(J.chips.low&&!(p.plate&&p.conf<85)) return false;
    if(J.chips.noplate&&p.plate) return false;
    if(J.chips.lists&&!p.lists.length) return false;
    if(J.chips.manual&&p.src!=='operator') return false;
    if(J.chips.entry&&p.dir!=='въезд') return false;
    return true;});
}
function vJournal(){
  const J=S.j;
  return `<section class="card">
    <div class="toolbar">
      <div class="search-big">${ic('search')}<input class="field" id="j-q" value="${esc(J.q)}" placeholder="ГРЗ в любой раскладке, маска: А*77, ?123??" aria-label="ГРЗ или маска"></div>
      <label class="choice"><input type="checkbox" class="check" id="j-fz" ${J.fuzzy?'checked':''}> Нечёткий ±1</label>
      <select class="field" style="width:auto" aria-label="Период"><option>Последние 24 ч</option><option>7 дней</option><option>30 дней</option><option>Период…</option></select>
      <select class="field" id="j-pt" style="width:auto" aria-label="Точка"><option value="">Все точки</option>${POINTS.map(p=>`<option value="${p.id}" ${J.point===p.id?'selected':''}>${esc(p.name)}</option>`).join('')}</select>
      <span class="sp"></span>
      <div class="seg" data-kit-seg id="j-view"><button class="btn" value="table" aria-pressed="${J.view==='table'}">Таблица</button><button class="btn" value="tiles" aria-pressed="${J.view==='tiles'}">Плитки</button></div>
      <button class="btn btn-outline" data-act="savesearch">${ic('bell')}Сохранить поиск</button>
      <button class="btn btn-outline" data-kit-menu="#m-exp">${ic('download')}Экспорт</button>
      <div class="menu" id="m-exp" hidden role="menu" style="width:180px">${['XLSX','CSV','PDF'].map(f=>`<button class="menu-item" role="menuitem" data-act="export" data-f="${f}">${f}</button>`).join('')}</div>
    </div>
    <div class="chips">
      ${[['low','Уверенность < 85 %'],['noplate','Без ГРЗ'],['lists','В списках'],['manual','Решение оператора'],['entry','Только въезд']].map(([k,t])=>`<button class="chip" data-act="chip" data-k="${k}" aria-pressed="${!!J.chips[k]}">${t}</button>`).join('')}
      <span class="sp"></span><label class="choice choice-dense"><input type="checkbox" class="switch switch-dense" role="switch" id="j-grp" ${J.group?'checked':''}> Группировать по ТС</label>
    </div>
    <div id="j-res">${jResults()}</div>
  </section>`;
}
function jResults(){
  return dataBlock(()=>{
    const all=jFilter(), J=S.j, per=J.view==='tiles'?24:15, pages=Math.max(1,Math.ceil(all.length/per)); J.page=Math.min(J.page,pages-1);
    if(!all.length) return `<div class="empty">${ic('search','ic-32')}<div class="h-sm" style="color:var(--one-fg)">Проездов по запросу нет</div><div class="cap">Проверьте маску или включите нечёткий поиск</div><button class="btn btn-outline" data-act="jreset">Сбросить фильтры</button></div>`;
    const rows=all.slice(J.page*per,J.page*per+per);
    let body;
    if(J.view==='tiles') body=`<div class="tiles">${rows.map(p=>`<button class="tile" data-plate="${esc(p.plate||'')}">${thumb()}<span class="tb"><span class="row wrap">${plate(p.plate,{conf:p.conf,static:1})}</span><span class="row wrap">${statusBadges(p)}</span><span class="cap muted">${hms(p.ts)} · ${esc(PBY[p.point].short)} · ${esc(p.make)} ${esc(p.model)}</span></span></button>`).join('')}</div>`;
    else {
      const tr=p=>`<tr data-clickable data-plate="${esc(p.plate||'')}"><td class="mono cap">${dmy(p.ts)===dmy(NOW())?'':dmy(p.ts)+' '}${hms(p.ts)}</td><td>${plate(p.corrected||p.plate,{conf:p.conf,static:1})}</td><td>${esc(PBY[p.point].short)}</td><td>${p.dir}</td><td>${esc(p.make)} ${esc(p.model)}<div class="cap muted">${p.cls}</div></td><td class="num">${p.speed??'—'}</td><td class="num">${p.plate?p.conf+' %':'—'}</td><td>${statusBadges(p)}</td><td>${decisionBadge(p)}</td></tr>`;
      let tb='';
      if(J.group){const g={};rows.forEach(p=>{(g[p.plate||'—']=g[p.plate||'—']||[]).push(p)});tb=Object.entries(g).map(([k,ps])=>`<tr class="grp"><td colspan="9">${k==='—'?'Без ГРЗ':esc(k)} · ${ps.length} проезд(а)</td></tr>${ps.map(tr).join('')}`).join('')}
      else tb=rows.map(tr).join('');
      body=`<div class="scroll-x"><table class="table"><thead><tr><th>Время</th><th>ГРЗ</th><th>Точка</th><th>Направление</th><th>ТС</th><th class="num">км/ч</th><th class="num">Уверенность</th><th>Списки</th><th>Решение</th></tr></thead><tbody>${tb}</tbody></table></div>`;
    }
    return body+`<div class="pager"><span class="cap muted">${J.page*per+1}–${Math.min(all.length,J.page*per+per)} из ${all.length}</span><span class="sp"></span><button class="btn btn-icon" data-act="pg" data-d="-1" aria-label="Предыдущая страница" ${J.page?'':'disabled'}>‹</button><span class="cap">${J.page+1} / ${pages}</span><button class="btn btn-icon" data-act="pg" data-d="1" aria-label="Следующая страница" ${J.page<pages-1?'':'disabled'}>›</button></div>`;
  },{rows:8,emptyText:'Проездов по запросу нет'});
}

/* ---------- Vehicle card (sheet) ---------- */
function openVehicle(pl){
  if(!pl){toast('ГРЗ не прочитан — карточка ТС недоступна, откройте проезд в архиве');return}
  const ps=PASSAGES.filter(p=>p.plate===pl); const e=ENTRIES[pl]; const mk={};ps.forEach(p=>mk[p.make+' '+p.model]=(mk[p.make+' '+p.model]||0)+1);
  const first=ps[ps.length-1], last=ps[0];
  openSheet(`<div class="sheet-h">${plate(pl,{lg:1,static:1})}<div class="col grow" style="gap:2px"><div class="h-sm">Карточка ТС</div><div class="cap muted">${esc(Object.keys(mk)[0]||'—')}</div></div><button class="btn btn-icon" data-act="sheet-close" aria-label="Закрыть">${ic('x','ic-18')}</button></div>
   <div class="sheet-b">
     <div class="row wrap">${e?listBadge(e.list):noList()}<span class="tag">${ic('tag')}постоянный</span><span class="tag">${ic('plus')}тег</span></div>
     <div class="player">${scene({id:'pl'})}<div class="bar">${ic('play')}<div class="track"><i></i></div><span class="cap mono">−10 с · ${last?hms(last.ts):''} · +20 с</span></div></div>
     <dl class="dl"><dt>Первое появление</dt><dd>${first?dmy(first.ts)+' '+hm(first.ts):'—'}</dd><dt>Последнее</dt><dd>${last?dmy(last.ts)+' '+hm(last.ts)+' · '+esc(PBY[last.point].short):'—'}</dd><dt>Проездов</dt><dd>${ps.length}</dd><dt>Марка, модель</dt><dd>${Object.entries(mk).map(([k,v])=>esc(k)+' ('+v+')').join(', ')||'—'}</dd>${e?`<dt>Владелец</dt><dd>${esc(e.owner)} · ${esc(e.org)}</dd><dt>Основание</dt><dd>${esc(e.reason)}</dd>`:''}</dl>
     <div data-kit-tabs><div class="tabs" role="tablist"><button class="tab" role="tab" aria-controls="vt1" aria-selected="true">Проезды<span class="badge badge-neutral">${ps.length}</span></button><button class="tab" role="tab" aria-controls="vt2">Визиты</button><button class="tab" role="tab" aria-controls="vt3">Заметки</button></div>
       <div id="vt1" role="tabpanel"><table class="table"><tbody>${ps.slice(0,8).map(p=>`<tr><td class="mono cap">${dmy(p.ts)} ${hms(p.ts)}</td><td>${esc(PBY[p.point].short)}</td><td>${p.dir}</td><td>${decisionBadge(p)}</td></tr>`).join('')}</tbody></table></div>
       <div id="vt2" role="tabpanel" hidden><table class="table"><thead><tr><th>Въезд</th><th>Выезд</th><th class="num">Пребывание</th></tr></thead><tbody><tr><td>${hm(new Date(Date.now()-3*3600e3))}</td><td><span class="badge badge-info">на территории</span></td><td class="num">3 ч 00 мин</td></tr><tr><td>вчера 08:12</td><td>вчера 17:46</td><td class="num">9 ч 34 мин</td></tr></tbody></table></div>
       <div id="vt3" role="tabpanel" hidden class="col" style="padding-top:12px"><textarea class="field" rows="3" style="height:auto" placeholder="Комментарий к ТС"></textarea><div class="cap muted">Комментарии видны всем пользователям с доступом к журналу.</div></div>
     </div>
     <div class="row wrap"><button class="btn btn-primary" data-act="addlist" data-p="${esc(pl)}">${ic('plus')}В список…</button><button class="btn btn-outline" data-act="evidence">${ic('file-zip')}Доказательный пакет</button><button class="btn btn-outline" data-act="tocase">${ic('briefcase')}В дело</button><button class="btn btn-subtle" data-act="route" data-p="${esc(pl)}">${ic('milestone')}Маршрут</button></div>
   </div>`);
}
function openSheet(html){const s=$('#sheet');s.innerHTML=html;s.setAttribute('data-open','');$('#sheet-scrim').hidden=false;OnePsimKit.init(s);s.focus()}
function closeSheet(){$('#sheet').removeAttribute('data-open');$('#sheet-scrim').hidden=true}

/* ---------- Э4 Расследования ---------- */
const TOOLS={
  common:{name:'Общие ГРЗ',d:'ТС, замеченные во всех заданных точках',pts:[['A','s2','18.10 22:00–02:00'],['B','s5','20.10 23:00–03:00'],['C','k2','21.10 00:00–04:00']],
    head:['ГРЗ','Точек','Проездов'],res:[['Х909УУ50','3 / 3',7],['М314ММ77','3 / 3',4],['С808СС190','2 / 3',2]],title:'ТС во всех 3 точках'},
  poi:{name:'Точка интереса',d:'Все ТС в радиусе и окне времени',pts:[['A','s2','R 150 м · 18.10 22:00–02:00']],head:['ГРЗ','Проездов','Первый'],res:[['Х909УУ50',2,'23:41'],['М314ММ77',1,'23:52'],['С808СС190',1,'22:58'],['А123ВС77',1,'22:05']],title:'ТС в точке A'},
  convoy:{name:'Совместное движение',d:'ТС, движущиеся вместе с целевым',pts:[['T','—','Целевое ТС: Х909УУ50'],['','','Интервал ≤ 60 с · не менее 3 раз · 30 дней']],head:['ГРЗ','Совпадений','Мин. интервал'],res:[['М314ММ77',3,'11 с'],['С808СС190',2,'47 с']],title:'Сопровождающие Х909УУ50'},
  route:{name:'Маршрут ТС',d:'Последовательность проездов на карте',pts:[['T','—','ТС: Х909УУ50 · 30 дней']],head:['Точка','Время','Ср. скорость'],res:[['Склад №2','18.10 23:41','—'],['Склад №5','20.10 00:12','—'],['КПП-2 Юг','21.10 01:05','—']],title:'Маршрут Х909УУ50'},
  twins:{name:'Двойники',d:'Физически невозможные переезды',pts:[['','','Порог: > 150 км/ч между точками · 7 дней']],head:['ГРЗ','Точки','Нужная скорость'],res:[['Е555КХ77','КПП-1 → ул. Северная','212 км/ч'],['К456МР178','Склад №5 → КПП-2','168 км/ч']],title:'Подозрение на двойники'},
};
function vInv(){
  const I=S.inv, T=TOOLS[I.tool];
  return `<div class="inv">
   <section class="card"><div class="card-h"><h2>Инструмент анализа</h2></div>
     <div class="card-b col" style="gap:2px" role="listbox" aria-label="Инструменты">${Object.entries(TOOLS).map(([k,t])=>`<button class="tool" role="option" aria-selected="${k===I.tool}" data-act="tool" data-k="${k}"><b>${t.name}</b><span>${t.d}</span></button>`).join('')}</div>
     <div class="card-b"><div class="h-sm" style="margin-bottom:6px">Точки и окна времени</div>
       ${T.pts.map(([l,p,w])=>`<div class="pt">${l?`<span class="pt-l">${l}</span>`:''}<span class="grow">${p&&PBY[p]?esc(PBY[p].short)+' · ':''}${esc(w)}</span></div>`).join('')}
       <button class="btn btn-subtle" style="margin-top:6px">${ic('plus')}Добавить точку</button>
       <div style="margin-top:12px"><label class="label" data-required for="inv-p">Цель запроса</label><input class="field" id="inv-p" value="${esc(I.purpose)}" ${I.purposeErr?'aria-invalid="true"':''}><span class="helper" ${I.purposeErr?'data-error':''}>${I.purposeErr?'Укажите дело или основание — запрос записывается в журнал аудита':'Запрос будет записан в журнал аудита'}</span></div>
       <button class="btn btn-primary" data-act="run" style="margin-top:8px">Рассчитать</button></div>
   </section>
   <section class="card"><div class="card-h"><h2>Карта точек фиксации</h2><span class="sp"></span><label class="choice choice-dense"><input type="checkbox" class="switch switch-dense" role="switch" id="inv-heat" ${I.heat?'checked':''}> Тепловая карта</label></div>
     <div class="card-b">${invMap()}</div></section>
   <section class="card c3"><div class="card-h"><h2>${I.ran?'Результат: '+T.title:'Результат'}</h2></div><div id="inv-res">${invRes()}</div></section>
  </div>`;
}
function invMap(){const I=S.inv,T=TOOLS[I.tool];
  const zones=T.pts.filter(x=>PBY[x[1]]).map(([l,p])=>({l,...PBY[p]}));
  const route=I.tool==='route'||I.tool==='convoy'?['s2','s5','k2'].map(i=>PBY[i]):[];
  return `<div class="map"><svg viewBox="0 0 600 420" role="img" aria-label="Карта">${mapBase()}
   ${I.heat?POINTS.map((p,i)=>`<circle cx="${p.x}" cy="${p.y}" r="${30+(i*17)%45}" fill="var(--one-palette-orange)" opacity=".18"/>`).join(''):''}
   ${zones.map(z=>`<circle cx="${z.x}" cy="${z.y}" r="${I.tool==='poi'?70:52}" fill="var(--one-palette-purple)" fill-opacity=".1" stroke="var(--one-palette-purple)" stroke-width="2" stroke-dasharray="6 5"/>`).join('')}
   ${route.length?`<polyline points="${route.map(p=>p.x+','+p.y).join(' ')}" fill="none" stroke="var(--one-palette-purple)" stroke-width="3"/>`:''}
   ${POINTS.map(p=>`<g><circle cx="${p.x}" cy="${p.y}" r="7" fill="var(--one-surface)" stroke="var(--one-fg-subtle)" stroke-width="2"/><text x="${p.x+11}" y="${p.y-9}" font-size="12" fill="var(--one-fg-muted)">${esc(p.short)}</text></g>`).join('')}
   ${zones.map(z=>`<g><circle cx="${z.x}" cy="${z.y}" r="11" fill="var(--one-palette-purple)"/><text x="${z.x}" y="${z.y+4}" text-anchor="middle" font-size="12" font-weight="600" fill="var(--one-accent-on)">${z.l}</text></g>`).join('')}
  </svg></div>`}
function invRes(){const I=S.inv,T=TOOLS[I.tool];
  if(I.loading) return `<div class="col" style="padding:16px">${'<div class="skeleton" style="height:28px"></div>'.repeat(4)}</div>`;
  if(!I.ran) return `<div class="empty">${ic('telescope','ic-32')}<div class="h-sm" style="color:var(--one-fg)">Задайте точки и нажмите «Рассчитать»</div><div class="cap">Результат появится здесь с ранжированием</div></div>`;
  return dataBlock(()=>{const r=T.res[I.sel]||T.res[0]; const isPlate=/[А-Я]\d{3}/.test(r[0]);
    return `<table class="table"><thead><tr>${T.head.map((h,i)=>`<th class="${i?'num':''}">${h}</th>`).join('')}</tr></thead><tbody>${T.res.map((x,i)=>`<tr data-clickable data-act="isel" data-i="${i}" aria-selected="${i===I.sel}"><td>${/[А-Я]\d{3}/.test(x[0])?plate(x[0],{static:1}):esc(x[0])}</td><td class="num">${x[1]}</td><td class="num">${x[2]}</td></tr>`).join('')}</tbody></table>
    <div class="card-b col">${thumb('lg')}<div class="cap muted">${isPlate?esc(r[0])+' · '+esc(mkFor(r[0])[0]+' '+mkFor(r[0])[1]):esc(r[0])+' · '+esc(r[1])}</div>
    <div class="row wrap"><button class="btn btn-primary" data-act="tocase">${ic('briefcase')}В дело</button><button class="btn btn-red" data-act="towanted" data-p="${esc(isPlate?r[0]:'')}">В список розыска</button><button class="btn btn-outline" data-act="evidence">${ic('download')}Экспорт</button>${isPlate?`<button class="btn btn-subtle" data-plate="${esc(r[0])}">Карточка ТС</button>`:''}</div>
    <div class="cap subtle">Цель: ${esc(I.purpose)} · запрос записан в журнал аудита</div></div>`},{rows:4});
}

/* ---------- Э5 Списки ---------- */
function entriesFor(id){
  const base=Object.entries(ENTRIES).filter(([,e])=>e.list===id).map(([pl,e])=>({pl,...e,added:'12.10.2026'}));
  seed=id.length*97+3; const n=Math.min(LBY[id].count,22)-base.length; const owners=['Кузнецов А. П.','Соколова Т. Н.','Морозов Д. И.','Волкова Е. А.','Лебедев С. В.','Новиков К. Р.','ООО «Альфа-Сервис»','ООО «ТехСнаб»'];
  for(let i=0;i<n;i++){const m=pick(MAKES);const d=Math.floor(rnd()*60);base.push({pl:randPlate(),owner:pick(owners),org:pick(['Цех №3','Склад','ИТ-отдел','Охрана труда','Подрядчик']),until:i%5===0?`0${1+i%7}.11.2026`:'31.12.2026',make:m[0],model:m[1],reason:i%6===0?'':'Приказ № '+(100+i)+'-к',added:`${pad(1+(i*3)%27)}.10.2026`,soon:i%5===0})}
  return base;
}
function vLists(){
  const L=LBY[S.list.sel]; let es=entriesFor(L.id);
  if(S.list.chip==='soon') es=es.filter(e=>e.soon); if(S.list.chip==='noreason') es=es.filter(e=>!e.reason); if(S.list.chip==='week') es=es.filter(e=>+e.added.slice(0,2)>=20);
  const dotc={allow:'var(--one-success-icon)',guest:'var(--one-palette-teal)',info:'var(--one-palette-purple)',deny:'var(--one-danger-icon)',wanted:'var(--one-danger-icon)'};
  return `<div class="lists">
   <section class="card"><div class="card-h"><h2>Списки</h2><span class="sp"></span><button class="btn btn-icon" aria-label="Создать список">${ic('plus','ic-18')}</button></div>
     <div class="card-b col" style="gap:2px" role="tree">${['allow','guest','info','deny','wanted'].map(t=>LISTS.filter(l=>l.type===t).map(l=>`<button class="tree-i" role="treeitem" data-act="lsel" data-id="${l.id}" aria-selected="${l.id===L.id}"><span class="dot" style="background:${dotc[l.type]}"></span><span class="grow">${esc(l.name)}</span>${l.hidden?ic('eye-closed','ic-muted'):''}<span class="badge badge-neutral">${l.count.toLocaleString('ru')}</span></button>`).join('')).join('')}</div></section>
   <section class="card">
     <div class="card-h"><h2>${esc(L.name)}</h2>${listBadge(L.id)}${L.hidden?`<span class="badge badge-neutral">${ic('eye-closed')}Скрытое оповещение</span>`:''}<span class="sp"></span>
       <button class="btn btn-outline" data-act="import">${ic('upload')}Импорт CSV/XLSX</button><button class="btn btn-primary" data-act="addentry">${ic('plus')}Добавить</button></div>
     <div class="card-b"><dl class="dl" style="grid-template-columns:max-content 1fr max-content 1fr"><dt>Приоритет</dt><dd>${L.prio}</dd><dt>Звук</dt><dd>${esc(L.sound)}</dd><dt>Получатели</dt><dd>${esc(L.recipients)}</dd><dt>Действия</dt><dd>${esc(L.actions)}</dd><dt>Владелец</dt><dd>${esc(L.owner)}</dd><dt>Синхронизация</dt><dd>${L.id==='emp'?'1С:ЗУП · ежедневно 06:00 · ок':'вручную'}</dd></dl></div>
     <div class="chips">${[['soon','Истекают ≤ 7 дн'],['noreason','Без основания'],['week','Добавлены за неделю']].map(([k,t])=>`<button class="chip" data-act="lchip" data-k="${k}" aria-pressed="${S.list.chip===k}">${t}</button>`).join('')}</div>
     ${dataBlock(()=>es.length?`<div class="scroll-x"><table class="table"><thead><tr><th>ГРЗ</th><th>Владелец, организация</th><th>Срок</th><th>Ожидаемое ТС</th><th>Основание</th><th>Добавлена</th></tr></thead><tbody>${es.map(e=>`<tr data-clickable data-act="entry" data-p="${esc(e.pl)}"><td>${plate(e.pl,{static:1})}</td><td>${esc(e.owner)}<div class="cap muted">${esc(e.org)}</div></td><td>${esc(e.until)} ${e.soon?`<span class="badge badge-warning">истекает</span>`:''}</td><td>${esc(e.make)} ${esc(e.model)}</td><td>${e.reason?esc(e.reason):`<span class="badge badge-warning">нет основания</span>`}</td><td class="mono cap">${e.added}</td></tr>`).join('')}</tbody></table></div><div class="pager"><span class="cap muted">Показано ${es.length} из ${L.count.toLocaleString('ru')}</span></div>`
       :`<div class="empty">${ic('checklist','ic-32')}<div class="h-sm" style="color:var(--one-fg)">Записей по фильтру нет</div><button class="btn btn-outline" data-act="lchip" data-k="${S.list.chip}">Сбросить фильтр</button></div>`)}
   </section></div>`;
}
function openEntry(pl){
  const e=ENTRIES[pl]||entriesFor(S.list.sel).find(x=>x.pl===pl)||{}; const ps=PASSAGES.filter(p=>p.plate===pl).slice(0,5);
  openSheet(`<div class="sheet-h">${plate(pl,{lg:1,static:1})}<div class="col grow" style="gap:2px"><div class="h-sm">Запись списка «${esc(LBY[S.list.sel].name)}»</div><div class="cap muted">${esc(e.owner||'')}</div></div><button class="btn btn-icon" data-act="sheet-close" aria-label="Закрыть">${ic('x','ic-18')}</button></div>
  <div class="sheet-b"><div class="grid2">
    <div><label class="label">ГРЗ</label><input class="field mono" value="${esc(pl)}"></div><div><label class="label">Страна</label><select class="field"><option>RU · Россия</option><option>KZ · Казахстан</option><option>BY · Беларусь</option></select></div>
    <div><label class="label">Действует с</label><input class="field" value="01.01.2026"></div><div><label class="label">по</label><input class="field" value="${esc(e.until||'')}"></div>
    <div><label class="label">Расписание</label><select class="field"><option>Пн–Пт 07:00–21:00</option><option>Круглосуточно</option></select></div><div><label class="label">Точки доступа</label><select class="field"><option>Все КПП</option><option>КПП-1</option></select></div>
    <div><label class="label">Ожидаемая марка</label><input class="field" value="${esc(e.make||'')}"></div><div><label class="label">Модель</label><input class="field" value="${esc(e.model||'')}"></div>
    <div style="grid-column:1/3"><label class="label" data-required>Основание</label><input class="field" value="${esc(e.reason||'')}" ${e.reason?'':'aria-invalid="true"'}>${e.reason?'':'<span class="helper" data-error>Без основания запись не участвует в автопропуске</span>'}</div>
  </div>
  <div data-kit-tabs><div class="tabs" role="tablist"><button class="tab" role="tab" aria-controls="et1" aria-selected="true">История изменений</button><button class="tab" role="tab" aria-controls="et2">Проезды ГРЗ<span class="badge badge-neutral">${ps.length}</span></button></div>
   <div id="et1" role="tabpanel"><table class="table"><tbody><tr><td class="mono cap">21.10.2026 09:14</td><td>Соколова Т. Н.</td><td>Срок: 30.09 → ${esc(e.until||'—')}</td></tr><tr><td class="mono cap">12.01.2026 11:02</td><td>Импорт 1С:ЗУП</td><td>Создана</td></tr></tbody></table></div>
   <div id="et2" role="tabpanel" hidden><table class="table"><tbody>${ps.map(p=>`<tr><td class="mono cap">${hms(p.ts)}</td><td>${esc(PBY[p.point].short)}</td><td>${decisionBadge(p)}</td></tr>`).join('')||'<tr><td class="muted">Проездов не было</td></tr>'}</tbody></table></div></div>
  <div class="row"><button class="btn btn-red">Удалить</button><span class="sp"></span><button class="btn btn-outline" data-act="sheet-close">Отмена</button><button class="btn btn-primary" data-act="entry-save">Сохранить</button></div></div>`);
}

/* ---------- Э6 Территория ---------- */
function vTerritory(){
  const h=NOW().getHours(); seed=11;
  const hours=Array.from({length:24},(_,i)=>{const peak=Math.exp(-((i-8.5)**2)/4)*110+Math.exp(-((i-17.5)**2)/4)*95+8;return {h:i,in:i<=h?Math.round(peak*(0.9+rnd()*.2)*(i<12?1:.55)):null,out:i<=h?Math.round(peak*(0.9+rnd()*.2)*(i<12?.35:1)):null}});
  const occ=Array.from({length:24},(_,i)=>i<=h?Math.round(Math.min(246,20+230/(1+Math.exp(-(i-8)*1.4))-(i>17?(i-17)*28:0))):null);
  const over=[['М314ММ77','грузовой','КАМАЗ 54901','06:12','5 ч 48 мин','4 ч'],['Н777ХК750','грузовой','Scania R450','07:40','4 ч 20 мин','4 ч'],['Н321ОР777','гость','Skoda Octavia','09:02','2 ч 58 мин','2 ч']];
  return `<div class="grid4">
    <button class="card kpi" data-go="journal"><span class="lbl muted">ТС на территории сейчас</span><span class="kpi-value">148</span><span class="row"><span class="badge badge-neutral">+12 к вчера в это время</span></span><div class="stack" title="Сотрудники 96 · Подрядчики 31 · Гости 9 · Прочие 12"><i style="flex:96;background:var(--one-accent)"></i><i style="flex:31;background:var(--one-palette-magenta)"></i><i style="flex:9;background:var(--one-palette-amber)"></i><i style="flex:12;background:var(--one-fg-subtle)"></i></div><span class="cap muted">Сотрудники 96 · Подрядчики 31 · Гости 9 · Прочие 12</span></button>
    <button class="card kpi" data-go="territory"><span class="lbl muted">Парковка П1 · заполненность</span><span class="kpi-value">212<span class="h-md muted"> / 250</span></span><div class="prog warn"><i style="width:85%"></i></div><span class="cap muted">85 % · свободно 38 мест · табло обновлено ${hm(NOW())}</span></button>
    <button class="card kpi alarm" data-act="scroll-over"><span class="lbl muted">Превышение времени пребывания</span><span class="kpi-value t-danger">3</span><span class="cap muted">Грузовые > 4 ч, гости > 2 ч</span><span class="link-action" style="color:var(--one-link);font:var(--one-type-label)">Показать ТС →</span></button>
    <button class="card kpi attn" data-go="alerts"><span class="lbl muted">Открытые срабатывания</span><span class="kpi-value">${S.alerts.filter(a=>a.status==='new').length}</span><span class="cap muted">Среднее время реакции за смену — 0:42</span><span class="link-action" style="color:var(--one-link);font:var(--one-type-label)">К обработке →</span></button>
  </div>
  <div class="grid2">
    <section class="card"><div class="card-h"><h2>Проезды по часам · сегодня</h2><span class="sp"></span><span class="legend"><span><i style="background:var(--one-accent)"></i>Въезд</span><span><i style="background:var(--one-palette-magenta)"></i>Выезд</span></span></div><div class="card-b">${dataBlock(()=>barChart(hours))}</div></section>
    <section class="card"><div class="card-h"><h2>Заполненность парковки П1 · сутки</h2></div><div class="card-b">${dataBlock(()=>lineChart(occ,250))}</div></section>
  </div>
  <div class="grid2">
    <section class="card" id="over"><div class="card-h"><h2>Превышение времени пребывания</h2><span class="badge badge-danger">${over.length}</span></div>
      ${dataBlock(()=>`<div class="scroll-x"><table class="table"><thead><tr><th>ГРЗ</th><th>Категория</th><th>Въезд</th><th class="num">На территории</th><th class="num">Лимит</th></tr></thead><tbody>${over.map(o=>`<tr data-clickable data-plate="${o[0]}"><td>${plate(o[0],{static:1})}<div class="cap muted">${o[2]}</div></td><td>${o[1]}</td><td class="mono cap">${o[3]}</td><td class="num t-danger">${o[4]}</td><td class="num">${o[5]}</td></tr>`).join('')}</tbody></table></div>`)}</section>
    <section class="card"><div class="card-h"><h2>Проезды по точкам · последний час</h2><span class="sp"></span><a class="link link-action" href="#channels" style="text-decoration:none">Качество каналов</a></div>
      ${dataBlock(()=>`<table class="table"><thead><tr><th>Точка</th><th class="num">Проездов</th><th class="num">Без ГРЗ</th><th>Качество канала</th></tr></thead><tbody>${[['k1in',64,1,'g'],['k1out',58,0,'g'],['k2',21,2,'y'],['p1',37,0,'g'],['tr',212,9,'r']].map(([p,n,z,q])=>`<tr data-clickable data-go="channels"><td>${esc(PBY[p].name)}</td><td class="num">${n}</td><td class="num">${z}</td><td><span class="q ${q}"><i></i>${{g:'норма',y:'снижение',r:'деградация'}[q]}</span></td></tr>`).join('')}</tbody></table>`)}</section>
  </div>`;
}
function barChart(d){const W=560,H=200,pl=32,pb=22,max=140,bw=(W-pl)/24;
  return `<svg class="chart" viewBox="0 0 ${W} ${H}" role="img" aria-label="Проезды по часам">
   ${[0,50,100].map(v=>{const y=H-pb-(v/max)*(H-pb-8);return `<line class="grid" x1="${pl}" x2="${W}" y1="${y}" y2="${y}"/><text class="axis" x="${pl-6}" y="${y+4}" text-anchor="end">${v}</text>`}).join('')}
   ${d.map((x,i)=>{if(x.in==null) return '';const x0=pl+i*bw+2,w=(bw-6)/2,hi=(x.in/max)*(H-pb-8),ho=(x.out/max)*(H-pb-8);
     return `<g class="b" data-tip="${pad(x.h)}:00–${pad(x.h+1)}:00 · въезд ${x.in} · выезд ${x.out}"><rect class="hit" x="${x0-2}" y="0" width="${bw}" height="${H-pb}"/><rect class="s1" x="${x0}" y="${H-pb-hi}" width="${w}" height="${hi}" rx="2"/><rect class="s2" x="${x0+w+2}" y="${H-pb-ho}" width="${w}" height="${ho}" rx="2"/></g>`}).join('')}
   ${[0,6,12,18,23].map(h=>`<text class="axis" x="${pl+h*bw+bw/2}" y="${H-6}" text-anchor="${h===23?'end':'middle'}">${pad(h)}:00</text>`).join('')}
  </svg>`}
function lineChart(d,cap){const W=560,H=200,pl=32,pb=22,max=280,st=(W-pl)/23;const pts=d.map((v,i)=>v==null?null:[pl+i*st,H-pb-(v/max)*(H-pb-8)]).filter(Boolean);const cy=H-pb-(cap/max)*(H-pb-8);
  return `<svg class="chart" viewBox="0 0 ${W} ${H}" role="img" aria-label="Заполненность парковки">
   ${[0,100,200].map(v=>{const y=H-pb-(v/max)*(H-pb-8);return `<line class="grid" x1="${pl}" x2="${W}" y1="${y}" y2="${y}"/><text class="axis" x="${pl-6}" y="${y+4}" text-anchor="end">${v}</text>`}).join('')}
   <line class="cap-line" x1="${pl}" x2="${W}" y1="${cy}" y2="${cy}"/><text class="axis" x="${W-4}" y="${cy-5}" text-anchor="end">Вместимость ${cap}</text>
   <path class="area" d="M${pts[0][0]},${H-pb} ${pts.map(p=>'L'+p.join(',')).join(' ')} L${pts[pts.length-1][0]},${H-pb}Z"/>
   <polyline class="ln" points="${pts.map(p=>p.join(',')).join(' ')}"/>
   <circle cx="${pts[pts.length-1][0]}" cy="${pts[pts.length-1][1]}" r="4" fill="var(--one-accent)" stroke="var(--one-surface)" stroke-width="2"/>
   ${d.map((v,i)=>v==null?'':`<rect class="hit" data-tip="${pad(i)}:00 · занято ${v} из ${cap} (${Math.round(v/cap*100)} %)" x="${pl+i*st-st/2}" y="0" width="${st}" height="${H-pb}"/>`).join('')}
   ${[0,6,12,18,23].map(h=>`<text class="axis" x="${pl+h*st}" y="${H-6}" text-anchor="${h===23?'end':'middle'}">${pad(h)}:00</text>`).join('')}
  </svg>`}

/* ---------- Э8 Каналы ---------- */
const CHANNELS=[
  {id:'c1',name:'Въезд 1 — ГРЗ',pt:'k1in',role:'въезд',mode:'парковочный · 8 к/с',cn:'RU, KZ, BY',w:148,rec:97,day:[97,98],night:[93,95],q:'g'},
  {id:'c2',name:'Выезд 1 — ГРЗ',pt:'k1out',role:'выезд',mode:'парковочный · 8 к/с',cn:'RU',w:141,rec:96,day:[96,97],night:[92,94],q:'g'},
  {id:'c3',name:'КПП-2 — ГРЗ',pt:'k2',role:'въезд',mode:'парковочный · 8 к/с',cn:'RU, KZ, BY, UZ',w:122,rec:88,day:[91,96],night:[84,93],q:'y'},
  {id:'c4',name:'П1 — въезд',pt:'p1',role:'парковка',mode:'парковочный · 8 к/с',cn:'RU',w:155,rec:98,day:[98,98],night:[95,96],q:'g'},
  {id:'c5',name:'Северная — поток',pt:'tr',role:'проезд',mode:'потоковый · 25 к/с',cn:'RU',w:104,rec:71,day:[78,95],night:[64,92],q:'r'},
];
const STEPS=['Роль канала','Зона','Страны','Пороги','Проверка кадра','Тестовый прогон','Ввод в эксплуатацию'];
function vChannels(){
  const c=CHANNELS.find(x=>x.id===S.ch.sel); const wq=w=>w>=130?'g':w>=111?'y':'r';
  return `<section class="card"><div class="card-h"><h2>Каналы распознавания</h2><span class="badge badge-neutral">${CHANNELS.length}</span><span class="sp"></span><button class="btn btn-outline">Копировать настройки на группу</button><button class="btn btn-primary">${ic('plus')}Добавить канал</button></div>
   ${dataBlock(()=>`<div class="scroll-x"><table class="table"><thead><tr><th>Канал</th><th>Точка</th><th>Роль</th><th>Режим</th><th>Страны</th><th class="num">Ширина ГРЗ</th><th class="num">Распознано, 15 мин</th><th>День / ночь к базе</th><th>Состояние</th></tr></thead><tbody>
   ${CHANNELS.map(x=>`<tr data-clickable data-act="csel" data-id="${x.id}" aria-selected="${x.id===c.id}"><td>${esc(x.name)}</td><td>${esc(PBY[x.pt].short)}</td><td>${x.role}</td><td class="cap">${x.mode}</td><td class="cap">${x.cn}</td><td class="num"><span class="q ${wq(x.w)}"><i></i><span class="wpx">${x.w} пикс</span></span></td><td class="num">${x.rec} %</td><td class="cap">${x.day[0]} / ${x.day[1]} % · ${x.night[0]} / ${x.night[1]} %</td><td><span class="q ${x.q}"><i></i>${{g:'норма',y:'снижение',r:'деградация −17 % за 30 мин'}[x.q]}</span></td></tr>`).join('')}</tbody></table></div>`)}
  </section>
  <section class="card"><div class="card-h"><h2>Мастер ввода в эксплуатацию · ${esc(c.name)}</h2><span class="sp"></span><button class="btn btn-outline">Выборочная проверка (50)</button></div>
   <div class="card-b"><div class="steps">${STEPS.map((s,i)=>`<button class="step ${i<S.ch.step?'done':''}" data-act="step" data-i="${i}" ${i===S.ch.step?'aria-current="step"':''}><b>${i<S.ch.step?'✓':i+1}</b>${s}</button>`).join('')}</div></div>
   <div class="card-b grid2">${stepBody(c)}</div>
   <div class="card-b row"><button class="btn btn-outline" data-act="step" data-i="${Math.max(0,S.ch.step-1)}">Назад</button><span class="sp"></span><span class="cap muted">Оценка нагрузки: CPU 34 % → 41 % · GPU 0 · вычислитель — CPU</span><button class="btn btn-primary" data-act="step" data-i="${Math.min(6,S.ch.step+1)}">${S.ch.step===6?'Ввести в эксплуатацию':'Далее'}</button></div>
  </section>`;
}
function stepBody(c){const s=S.ch.step;
  const cam=`<div class="cam" style="aspect-ratio:16/9">${scene({id:'w'})}<svg viewBox="0 0 400 225" style="position:absolute;inset:0;width:100%;height:100%"><polygon points="110,150 290,150 330,215 70,215" fill="var(--one-accent)" fill-opacity=".12" stroke="var(--one-accent)" stroke-width="2"/>${s>=3?'<polygon points="140,95 260,95 300,140 100,140" fill="none" stroke="var(--one-palette-purple)" stroke-width="2" stroke-dasharray="6 4"/>':''}</svg><span class="cam-l">Зона распознавания${s>=3?' · калибровка':''}</span><span class="cam-meta"><span class="q ${c.w>=130?'g':c.w>=111?'y':'r'}"><i></i>ГРЗ ${c.w} пикс</span></span></div>`;
  if(s===0) return cam+`<div class="col"><label class="label">Роль канала</label><div class="seg" data-kit-seg>${['Въезд','Выезд','Проезд','Парковка','Зона'].map((r,i)=>`<button class="btn" aria-pressed="${i===0}">${r}</button>`).join('')}</div><div class="helper">Предложен режим «парковочный» — до 8 к/с, меньше нагрузка на сервер</div><label class="label">Точка доступа</label><select class="field"><option>Шлагбаум КПП-1 въезд</option></select><label class="label">Обзорные камеры</label><select class="field"><option>КПП-1 обзор</option></select></div>`;
  if(s===1) return cam+`<div class="col"><div class="h-sm">Зона распознавания ГРЗ</div><div class="cap muted">Перетащите вершины полигона на кадре. Зона калибровки сцены нужна для расчёта скорости.</div><button class="btn btn-outline">Добавить зону калибровки</button><label class="label">Направление «к камере»</label><select class="field"><option>= въезд</option><option>= выезд</option></select><label class="label">Интервал объединения повторов, с</label><input class="field" value="30"></div>`;
  if(s===2) return cam+`<div class="col"><div class="h-sm">Страны распознавания (до 5)</div>${['Россия','Казахстан','Беларусь','Узбекистан','Армения'].map((n,i)=>`<label class="choice"><input type="checkbox" class="check" ${i<3?'checked':''}> ${n}</label>`).join('')}<div class="badge badge-warning" style="white-space:normal">${ic('alert')}Каждая дополнительная страна снижает скорость и точность распознавания</div></div>`;
  if(s===3) return cam+`<div class="col"><label class="label">Минимальное качество ГРЗ, %</label><input class="field" value="80"><label class="label">Минимальное качество ТС, %</label><input class="field" value="30"><label class="label">Помечать низкую уверенность ниже, %</label><input class="field" value="85"></div>`;
  if(s===4) return cam+`<div class="col"><div class="h-sm">Проверка кадра</div>${[['Ширина ГРЗ ≥ 130 пикс (день)',c.w>=130,c.w+' пикс'],['Ширина ГРЗ ≥ 130 пикс (ночь)',c.w>=136,(c.w-6)+' пикс'],['Угол обзора ≤ 30°',true,'22°'],['Резкость (день)',true,'хорошо'],['Резкость (ночь, ИК)',c.q!=='r','удовл.']].map(([t,ok,v])=>`<div class="check-row">${ok?ic('check','t-success'):ic('alert','t-warning')}<span class="grow">${t}</span><span class="cap muted">${v}</span></div>`).join('')}</div>`;
  if(s===5) return `<div class="col"><div class="h-sm">Тестовый прогон · архив 26.10 08:00–10:00</div><div class="grid2"><div class="card kpi"><span class="lbl muted">С распознанным ГРЗ</span><span class="kpi-value">96,4 %</span></div><div class="card kpi"><span class="lbl muted">Средняя уверенность</span><span class="kpi-value">93 %</span></div></div><div class="cap muted">Проездов: 412 · ошибок: 15 · без ГРЗ: 6. Значения станут базовыми для контроля качества.</div></div><div class="col"><div class="h-sm">Примеры ошибок</div><div class="row wrap">${['О777ОО99 → 0777ОО99','В001АВ50 → 8001АВ50','К456МР178 → К456МР17'].map(t=>`<div class="col" style="gap:4px">${thumb()}<span class="cap mono muted">${t}</span></div>`).join('')}</div></div>`;
  return `<div class="col"><div class="h-sm">Готово к вводу</div><div class="cap muted">Будут сохранены базовые значения: день ${c.day[1]} %, ночь ${c.night[1]} %, уверенность 93 %. Отклонение > 15 % за 30 мин — уведомление администратору.</div></div><div class="col">${cam}</div>`;
}

/* ---------- Э10 Нарушения (расширение) ---------- */
function vViolations(){
  const V=[['М314ММ77','Превышение скорости','38 км/ч при лимите 20','Территория · проезд у Склада №2','14:12','new'],['Н777ХК750','Движение против направления','Въезд через выездной контур','КПП-2 «Юг»','13:47','new'],['В001АВ50','Стоянка в запрещённой зоне','12 мин · пожарный проезд','Склад №5','13:05','confirmed'],['Т808ТТ199','Превышение скорости','27 км/ч при лимите 20','Территория · ул. Заводская','11:31','rejected'],['Е555КХ77','Грузовой в пешеходной зоне','—','Административный корпус','10:02','confirmed']];
  return `<div class="badge badge-info" style="align-self:flex-start;white-space:normal">${ic('tag')}Модуль-расширение M13 — вне ФТ, на согласовании. Нарушения фиксируются для внутренних регламентов объекта, без юридической значимости.</div>
  <div class="grid4">
   <div class="card kpi"><span class="lbl muted">Нарушений сегодня</span><span class="kpi-value">5</span><span class="badge badge-neutral" style="align-self:flex-start">−3 к среднему</span></div>
   <div class="card kpi"><span class="lbl muted">Превышение скорости</span><span class="kpi-value">2</span><span class="cap muted">Лимит 20 км/ч · допуск +5</span></div>
   <div class="card kpi attn"><span class="lbl muted">Не обработано</span><span class="kpi-value">2</span><span class="cap muted">Ответственный — начальник смены</span></div>
   <div class="card kpi"><span class="lbl muted">Повторные нарушители (30 сут)</span><span class="kpi-value">4</span><span class="cap muted">≥ 3 нарушений → список «Нарушители»</span></div>
  </div>
  <section class="card"><div class="card-h"><h2>Журнал нарушений</h2><span class="sp"></span><select class="field" style="width:auto"><option>Все типы</option><option>Превышение скорости</option><option>Против направления</option><option>Стоянка</option></select></div>
   ${dataBlock(()=>`<div class="scroll-x"><table class="table"><thead><tr><th>Время</th><th>ГРЗ</th><th>Нарушение</th><th>Значение</th><th>Зона</th><th>Статус</th><th></th></tr></thead><tbody>${V.map(v=>`<tr data-clickable data-plate="${v[0]}"><td class="mono cap">${v[4]}</td><td>${plate(v[0],{static:1})}</td><td>${v[1]}</td><td>${v[2]}</td><td>${v[3]}</td><td>${v[5]==='new'?'<span class="badge badge-warning">Не обработано</span>':v[5]==='confirmed'?'<span class="badge badge-success">Подтверждено</span>':'<span class="badge badge-neutral">Отклонено</span>'}</td><td>${v[5]==='new'?'<button class="btn btn-outline" style="height:28px" data-act="vconfirm">Подтвердить</button>':''}</td></tr>`).join('')}</tbody></table></div>`)}
  </section>`;
}

/* ---------- Э7 Отчёты ---------- */
function vReports(){
  const R=[['Журнал проездов за период','XLSX, CSV, PDF','—'],['Посещаемость и время пребывания','XLSX, PDF','пн 08:00 → security@zavod-sever.ru'],['Срабатывания и обработка','PDF','ежедневно 07:30 → начальник СБ'],['Работа КПП: авто и ручные решения','XLSX','—'],['Качество распознавания по каналам','PDF','ежедневно 06:00 → администратор'],['Состояние списков: истекающие, без основания','XLSX','пт 16:00 → владельцы списков'],['Парковки: заполненность и оборачиваемость','XLSX, PDF','—']];
  return `<section class="card"><div class="card-h"><h2>Шаблоны отчётов</h2></div>
   ${dataBlock(()=>`<div class="scroll-x"><table class="table"><thead><tr><th>Отчёт</th><th>Форматы</th><th>Расписание и рассылка</th><th></th></tr></thead><tbody>${R.map(r=>`<tr><td class="h-sm" style="font-weight:500">${r[0]}</td><td class="cap">${r[1]}</td><td class="cap muted">${r[2]}</td><td style="text-align:right;white-space:nowrap"><button class="btn btn-outline" style="height:28px" data-act="report">Сформировать</button> <button class="btn btn-subtle" style="height:28px">${ic('clock')}Расписание</button></td></tr>`).join('')}</tbody></table></div>`)}
   <div class="card-b cap subtle">Из ячейки отчёта открывается список соответствующих проездов в журнале.</div></section>`;
}

/* ================= router ================= */
const VIEWS={kpp:vKpp,alerts:vAlerts,territory:vTerritory,journal:vJournal,inv:vInv,reports:vReports,violations:vViolations,lists:vLists,channels:vChannels};
function render(){
  const r=(location.hash||'#kpp').slice(1); S.route=VIEWS[r]?r:'kpp';
  $('#page-title').textContent=TITLES[S.route]; document.title='LPR · '+TITLES[S.route]+' — прототип';
  $$('#nav .nav-item').forEach(a=>a.toggleAttribute('aria-current',a.getAttribute('href')==='#'+S.route)); $$('#nav .nav-item[aria-current]').forEach(a=>a.setAttribute('aria-current','page'));
  $('#view').innerHTML=VIEWS[S.route](); OnePsimKit.init($('#view'));
  $('#nav-alerts').textContent=S.alerts.filter(a=>a.status==='new').length;
  $('#side').removeAttribute('data-open');
}
function rerender(){const y=window.scrollY;render();window.scrollTo(0,y)}
window.addEventListener('hashchange',()=>{closeSheet();render();window.scrollTo(0,0)});

/* ================= dialogs ================= */
function dlg(html){const d=$('#dlg');d.innerHTML=html;OnePsimKit.init(d);d.showModal();const f=$('input,select,textarea',d);f&&f.focus()}
const REASONS_OPEN=['Доставка по звонку инициатора','Аварийная служба','Служебная необходимость (по распоряжению)','ГРЗ загрязнён — личность водителя подтверждена','Другое'];
function dlgDecide(kind){const p=S.kpp.pending[0]; if(!p) return;
  dlg(`<div class="dlg-h"><h2 class="dialog-title">${kind==='allow'?'Пропустить ТС':'Отказать в проезде'}</h2><span class="sp"></span>${plate(p.plate,{static:1})}</div>
  <div class="dlg-b"><div><label class="label" data-required for="d-r">Причина</label><select class="field" id="d-r"><option value="">Выберите причину</option>${(kind==='allow'?REASONS_OPEN:['Нет заявки','Не совпадает с заявкой','Нарушение пропускного режима','Другое']).map(r=>`<option>${r}</option>`).join('')}</select><span class="helper" id="d-err"></span></div>
  <div><label class="label" for="d-c">Комментарий</label><input class="field" id="d-c" placeholder="Необязательно"></div>
  <div class="cap muted">Решение и причина сохраняются в журнале проездов и журнале аудита.</div></div>
  <div class="dlg-f"><button class="btn btn-outline" data-kit-close>Отмена</button><button class="btn ${kind==='allow'?'btn-green':'btn-red'}" data-act="decide-ok" data-d="${kind}">${kind==='allow'?'Открыть шлагбаум':'Отказать'}</button></div>`)}
function dlgFix(){const L=S.kpp.last;
  dlg(`<div class="dlg-h"><h2 class="dialog-title">Исправить ГРЗ</h2></div><div class="dlg-b">
   <div class="row">${plate(L.plate,{static:1,conf:L.conf})}<span class="cap muted">распознано · ${L.conf} %</span></div>
   <div><label class="label" data-required for="f-v">Правильный ГРЗ</label><input class="field mono" id="f-v" value="${esc(L.corrected||L.plate||'')}" autocomplete="off"><span class="helper">Латиница и кириллица равнозначны: A123BC77 = А123ВС77</span></div>
   <div class="cap muted">Исходное значение, автор и время сохранятся. Исправленный ГРЗ будет повторно проверен по спискам.</div></div>
   <div class="dlg-f"><button class="btn btn-outline" data-kit-close>Отмена</button><button class="btn btn-primary" data-act="fix-ok">Сохранить и проверить</button></div>`)}
function dlgGuest(pl){
  dlg(`<div class="dlg-h"><h2 class="dialog-title">Гостевой пропуск</h2></div><div class="dlg-b">
   <div class="grid2"><div><label class="label" data-required>ГРЗ</label><input class="field mono" id="g-pl" value="${esc(pl||'')}"></div><div><label class="label" data-required>Пригласивший</label><select class="field"><option>Кузнецова Е. В. · закупки</option><option>Орлов Д. К. · дирекция</option></select></div>
   <div><label class="label">С</label><input class="field" value="${hm(NOW())}"></div><div><label class="label">По</label><input class="field" value="18:00"></div>
   <div><label class="label">Гость</label><input class="field" placeholder="ФИО водителя"></div><div><label class="label">Точки доступа</label><select class="field"><option>КПП-1</option><option>КПП-1, Парковка П1</option></select></div></div>
   <div class="seg" data-kit-seg><button class="btn" aria-pressed="true">Разовый</button><button class="btn" aria-pressed="false">Многоразовый</button></div>
   <div class="cap muted">Разовый пропуск закроется после выезда. Пригласивший получит уведомление о прибытии.</div></div>
   <div class="dlg-f"><button class="btn btn-outline" data-kit-close>Отмена</button><button class="btn btn-primary" data-act="guest-ok">Оформить и пропустить</button></div>`)}
function dlgAddList(pl){
  dlg(`<div class="dlg-h"><h2 class="dialog-title">Добавить в список</h2><span class="sp"></span>${plate(pl,{static:1})}</div><div class="dlg-b">
   <div><label class="label" data-required>Список</label><select class="field" id="al-l">${LISTS.map(l=>`<option value="${l.id}">${esc(l.name)}</option>`).join('')}</select></div>
   <div><label class="label" data-required>Основание</label><input class="field" placeholder="Например: служебная записка № 45"></div>
   <div class="grid2"><div><label class="label">Действует по</label><input class="field" value="31.12.2026"></div><div><label class="label">Ожидаемое ТС</label><input class="field" value="${esc(pl?mkFor(pl).slice(0,2).join(' '):'')}"></div></div></div>
   <div class="dlg-f"><button class="btn btn-outline" data-kit-close>Отмена</button><button class="btn btn-primary" data-act="addlist-ok" data-p="${esc(pl)}">Добавить</button></div>`)}
function dlgImport(){
  dlg(`<div class="dlg-h"><h2 class="dialog-title">Импорт в список «${esc(LBY[S.list.sel].name)}»</h2></div><div class="dlg-b">
   <div class="dz">${ic('upload','ic-32')}<div>Перетащите файл CSV или XLSX</div><div class="cap">sotrudniki_okt.xlsx · 1 312 строк — загружено</div></div>
   <div class="h-sm">Предпросмотр до применения</div>
   <div class="grid4" style="gap:8px">${[['Новые','28','badge-success'],['Изменённые','14','badge-info'],['Дубли','1 266','badge-neutral'],['Ошибки формата','4','badge-danger']].map(([t,n,c])=>`<div class="card kpi" style="padding:10px"><span class="lbl muted">${t}</span><span class="h-md"><span class="dot" style="display:inline-block;margin-right:6px;background:var(--one-${{'badge-success':'success-icon','badge-info':'info-icon','badge-neutral':'fg-subtle','badge-danger':'danger-icon'}[c]})"></span>${n}</span></div>`).join('')}</div>
   <table class="table"><thead><tr><th>Строка</th><th>Значение</th><th>Ошибка</th></tr></thead><tbody><tr><td class="num">57</td><td class="mono">А12ВС77</td><td class="t-danger">Не соответствует шаблону RU</td></tr><tr><td class="num">310</td><td class="mono">—</td><td class="t-danger">Пустой ГРЗ</td></tr></tbody></table>
   <label class="choice"><input type="checkbox" class="check" checked> Пропустить строки с ошибками</label></div>
   <div class="dlg-f"><button class="btn btn-outline" data-kit-close>Отмена</button><button class="btn btn-primary" data-act="import-ok">Применить 42 изменения</button></div>`)}
function dlgReject(){
  dlg(`<div class="dlg-h"><h2 class="dialog-title">Отклонить срабатывание</h2></div><div class="dlg-b">
   <div><label class="label" data-required for="r-r">Причина</label><select class="field" id="r-r"><option value="">Выберите причину</option><option>Ошибка распознавания</option><option>Другой регион</option><option>Запись устарела</option><option>ТС проверено на месте</option></select><span class="helper" id="r-err"></span></div>
   <div><label class="label">Комментарий</label><input class="field"></div></div>
   <div class="dlg-f"><button class="btn btn-outline" data-kit-close>Отмена</button><button class="btn btn-primary" data-act="areject-ok">Отклонить</button></div>`)}

/* ================= actions ================= */
function decideCurrent(kind,reason){
  const p=S.kpp.pending.shift(); if(!p) return; p.decision=kind; p.src='operator'; p.by='Сидоров А. В.'; p.reason=reason;
  if(kind==='allow'){p.barrierAt=NOW()} S.kpp.last=p;
  toast(kind==='allow'?`Шлагбаум открыт · ${p.plate||'без ГРЗ'} · причина записана в журнал`:`Отказ в проезде · ${p.plate||'без ГРЗ'}`); if(S.route==='kpp') rerender();
}
const A={
  'ds-reset':()=>{S.ds='data';$('#pp-state').value='data';rerender()},
  decide:el=>dlgDecide(el.dataset.d),
  'decide-ok':el=>{const r=$('#d-r').value; if(!r){$('#d-r').setAttribute('aria-invalid','true');const e=$('#d-err');e.textContent='Укажите причину — без неё решение не сохраняется';e.setAttribute('data-error','');return} $('#dlg').close(); decideCurrent(el.dataset.d,r)},
  fix:()=>dlgFix(),
  'fix-ok':()=>{const v=norm($('#f-v').value); if(!/^[А-Я]\d{3}[А-Я]{2}\d{2,3}$/.test(v)){$('#f-v').setAttribute('aria-invalid','true');return} const L=S.kpp.last; $('#dlg').close();
    if(v===L.plate){return} L.corrected=v; L.correctedBy='Сидоров А. В., '+hm(NOW()); const e=ENTRIES[v]; L.lists=e?[e.list]:[];
    toast(`ГРЗ исправлен: ${L.plate} → ${v}. Повторная проверка: ${e&&!LBY[e.list].hidden?LBY[e.list].name:'нет в списках'}`); rerender()},
  guest:()=>dlgGuest(S.kpp.pending[0]?.plate),
  'guest-ok':()=>{const pl=norm($('#g-pl').value); $('#dlg').close(); if(pl) ENTRIES[pl]={list:'guest',owner:'Гость',org:'Пригласила Кузнецова Е. В.',until:'сегодня 18:00',make:'',model:'',reason:'Оформлен на КПП'}; if(S.kpp.pending[0]){S.kpp.pending[0].lists=['guest']; decideCurrent('allow','Гостевой пропуск оформлен на месте')} else toast('Гостевой пропуск оформлен')},
  addlist:el=>dlgAddList(el.dataset.p),
  'addlist-ok':el=>{const l=$('#al-l').value; $('#dlg').close(); toast(`${el.dataset.p} добавлен в список «${LBY[l].name}»`)},
  'sheet-close':()=>closeSheet(),
  asel:el=>{S.alertSel=el.dataset.id;rerender()},
  aconfirm:()=>{const a=S.alerts.find(x=>x.id===S.alertSel); a.status='confirmed'; S.alertSel=null; toast(`Срабатывание ${a.plate} подтверждено · реакция ${fmtAgo(Date.now()-a.t0)}`); rerender()},
  areject:()=>dlgReject(),
  'areject-ok':()=>{const r=$('#r-r').value; if(!r){$('#r-r').setAttribute('aria-invalid','true');$('#r-err').textContent='Причина обязательна';$('#r-err').setAttribute('data-error','');return} $('#dlg').close(); const a=S.alerts.find(x=>x.id===S.alertSel); a.status='rejected'; S.alertSel=null; toast(`Отклонено: ${a.plate} · ${r}`); rerender()},
  atransfer:el=>{const a=S.alerts.find(x=>x.id===S.alertSel); a.esc=el.dataset.to; toast(`Передано: ${el.dataset.to}`); rerender()},
  video:el=>openVehicle(el.dataset.p),
  route:el=>{closeSheet(); S.inv.tool='route'; S.inv.ran=true; location.hash='#inv'},
  chip:el=>{const k=el.dataset.k; S.j.chips[k]=!S.j.chips[k]; S.j.page=0; el.setAttribute('aria-pressed',S.j.chips[k]); $('#j-res').innerHTML=jResults()},
  jreset:()=>{S.j={...S.j,q:'',fuzzy:false,chips:{},point:'',page:0}; rerender()},
  pg:el=>{S.j.page+=+el.dataset.d; $('#j-res').innerHTML=jResults()},
  savesearch:()=>toast(`Поиск «${S.j.q||'все проезды'}» сохранён · оповещение о новых проездах включено`),
  export:el=>toast(`Выгрузка ${el.dataset.f}: ${jFilter().length} проездов · записано в журнал аудита`),
  tool:el=>{S.inv.tool=el.dataset.k; S.inv.ran=false; S.inv.sel=0; rerender()},
  run:()=>{const v=$('#inv-p').value.trim(); S.inv.purpose=v; if(!v){S.inv.purposeErr=true; rerender(); return} S.inv.purposeErr=false; S.inv.loading=true; S.inv.ran=true; $('#inv-res').innerHTML=invRes(); setTimeout(()=>{S.inv.loading=false; if(S.route==='inv') $('#inv-res').innerHTML=invRes()},700)},
  isel:el=>{S.inv.sel=+el.dataset.i; $('#inv-res').innerHTML=invRes()},
  tocase:()=>toast('Добавлено в дело № 2026-114 «Хищение со склада»'),
  towanted:el=>dlgAddList(el.dataset.p),
  evidence:()=>toast('Доказательный пакет сформирован: 14 файлов, манифест SHA-256, водяной знак «Сидоров А. В. · '+hm(NOW())+'» · выгрузка записана в аудит'),
  lsel:el=>{S.list.sel=el.dataset.id; S.list.chip=''; rerender()},
  lchip:el=>{S.list.chip=S.list.chip===el.dataset.k?'':el.dataset.k; rerender()},
  entry:el=>openEntry(el.dataset.p),
  'entry-save':()=>{closeSheet(); toast('Запись сохранена · изменение записано в журнал списка')},
  addentry:()=>dlgAddList(''),
  import:()=>dlgImport(),
  'import-ok':()=>{$('#dlg').close(); toast('Импорт применён: 28 новых, 14 изменённых · 4 строки с ошибками пропущены · отчёт отправлен владельцу')},
  csel:el=>{S.ch.sel=el.dataset.id; rerender()},
  step:el=>{if(S.ch.step===6&&+el.dataset.i===6&&el.classList.contains('btn-primary')){toast('Канал введён в эксплуатацию · базовые значения сохранены');return} S.ch.step=+el.dataset.i; rerender()},
  vconfirm:(el,e)=>{e.stopPropagation(); el.closest('tr').querySelector('td:nth-child(6)').innerHTML='<span class="badge badge-success">Подтверждено</span>'; el.remove(); toast('Нарушение подтверждено')},
  report:()=>toast('Отчёт формируется — ссылка придёт на e-mail и появится в «Загрузках»'),
  'scroll-over':()=>$('#over').scrollIntoView({behavior:'smooth'}),
};
document.addEventListener('click',e=>{
  const act=e.target.closest('[data-act]');
  if(act&&A[act.dataset.act]){ if(act.dataset.act!=='vconfirm'){} A[act.dataset.act](act,e); return }
  const go=e.target.closest('[data-go]'); if(go){location.hash='#'+go.dataset.go;return}
  const pl=e.target.closest('[data-plate]'); if(pl){openVehicle(pl.dataset.plate);return}
});
$('#sheet-scrim').addEventListener('click',closeSheet);
$('#menu-btn').addEventListener('click',()=>$('#side').toggleAttribute('data-open'));
document.addEventListener('input',e=>{
  if(e.target.id==='j-q'){S.j.q=e.target.value;S.j.page=0;$('#j-res').innerHTML=jResults()}
});
document.addEventListener('change',e=>{
  const t=e.target;
  if(t.id==='j-fz'){S.j.fuzzy=t.checked;$('#j-res').innerHTML=jResults()}
  if(t.id==='j-pt'){S.j.point=t.value;S.j.page=0;$('#j-res').innerHTML=jResults()}
  if(t.id==='j-grp'){S.j.group=t.checked;$('#j-res').innerHTML=jResults()}
  if(t.id==='inv-heat'){S.inv.heat=t.checked;rerender()}
  if(t.id==='pp-state'){S.ds=t.value;rerender()}
  if(t.id==='pp-offline'){S.offline=t.checked;if(!t.checked&&S.buffer){toast(`Связь восстановлена · передано ${S.buffer} проездов из буфера, дублей нет`);S.buffer=0}rerender()}
  if(t.id==='pp-big'){document.documentElement.classList.toggle('big',t.checked)}
});
document.addEventListener('kit:seg',e=>{if(e.target.id==='j-view'){S.j.view=e.detail;S.j.page=0;$('#j-res').innerHTML=jResults()}});
document.addEventListener('keydown',e=>{
  if((e.ctrlKey||e.metaKey)&&e.key.toLowerCase()==='k'){e.preventDefault();$('#gsearch').focus();return}
  if(e.key==='Escape'&&$('#sheet').hasAttribute('data-open')) closeSheet();
  if(S.route!=='kpp'||$('#dlg').open) return;
  const m={F2:()=>S.kpp.pending[0]&&dlgDecide('allow'),F4:()=>S.kpp.pending[0]&&dlgDecide('deny'),F6:()=>dlgFix(),F8:()=>dlgGuest(S.kpp.pending[0]?.plate)}[e.key];
  if(m){e.preventDefault();m()}
});
$('#gsearch').addEventListener('keydown',e=>{if(e.key==='Enter'){S.j.q=e.target.value;S.j.page=0;e.target.blur();if(S.route==='journal')rerender();else location.hash='#journal'}});

/* tooltips for charts */
document.addEventListener('mousemove',e=>{const t=e.target.closest&&e.target.closest('[data-tip]');const tip=$('#tip');if(!t){tip.hidden=true;return}tip.textContent=t.dataset.tip;tip.hidden=false;const x=Math.min(e.clientX+12,innerWidth-tip.offsetWidth-8);tip.style.left=x+'px';tip.style.top=(e.clientY-36)+'px'});

/* live: timers + simulated passages (ТЗ: лента push) */
const ESC_TO='Петров А. В. (начальник СБ)', ESC_AFTER=60000; // LPR-ALR-05: [60] с
function tick(now=Date.now()){
  $$('.timer[data-t0]').forEach(t=>{const d=now-(+t.dataset.t0);t.textContent=fmtAgo(d);t.classList.toggle('late',d>ESC_AFTER)});
  let changed=false; S.alerts.forEach(a=>{if(a.status==='new'&&!a.esc&&now-a.t0>ESC_AFTER){a.esc=ESC_TO;changed=true}});
  if(changed&&S.route==='alerts') rerender();
}
const SCRIPT=[['Е555КХ77'],['О777ОО99',{conf:91}],['Н321ОР777'],[null],['В001АВ50',{conf:79}],['Р777РР97'],['Т808ТТ199']];let si=0;
function simStep(pl,o){ // one recognised passage on КПП-1 entry; pl/o — explicit for selftest, otherwise next from SCRIPT
  if(pl===undefined) [pl,o]=SCRIPT[si++%SCRIPT.length];
  const p=mkPassage(pl,'k1in',NOW(),o||{}); PASSAGES.unshift(p); if(S.offline) S.buffer++;
  const e=pl&&ENTRIES[norm(pl)];
  if(e&&LBY[e.list].type==='wanted'){ // LPR-LST-04 hidden alert: KPP sees an ordinary passage, SB gets the alert
    p.decision='operator'; S.kpp.pending.push(p);
    S.alerts.push({id:'A'+p.id,plate:p.plate,raw:pl,list:e.list,match:'точное',point:'k1in',t0:+p.ts,rep:1,rec:[p.make,p.model,p.conf],exp:[e.make,e.model],status:'new'});
    toast(`Скрытое срабатывание «Розыск» · ${p.plate} · КПП-1. На рабочем месте КПП не отображается.`,'alarm');
  } else if(p.decision==='operator'){S.kpp.pending.push(p)} else {S.kpp.last=p; p.barrierAt=new Date(+p.ts+600); if(e&&e.list==='guest') toast(`Гость ${e.owner} прибыл · ${e.org.replace('Пригласила ','')} уведомлена`)}
  if(S.route==='kpp'&&!$('#dlg').open) rerender(); else $('#nav-alerts').textContent=S.alerts.filter(a=>a.status==='new').length;
  const f=$('#feed .feed-row'); f&&f.classList.add('new');
  return p;
}
const SELFTEST=/[?&]selftest\b/.test(location.search);
if(SELFTEST) $('#pp-sim').checked=false;
setInterval(()=>tick(),1000);
setInterval(()=>{if($('#pp-sim').checked) simStep()},9000);
/* hooks for prototypes/src/selftest.js — not part of the product */
window.LPR={S,A,PASSAGES,ENTRIES,LBY,norm,plateMatch,lev1,jFilter,render,rerender,tick,simStep,closeSheet,ESC_AFTER};

$('#fx-time').textContent=hm(NOW());
render();
})();
