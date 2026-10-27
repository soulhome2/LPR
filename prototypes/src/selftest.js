/* LPR prototype self-test. Runs only with ?selftest: index.html?selftest
 * Result: <html data-selftest="pass|fail">, report in <pre id="selftest-log">.
 * Each step names the requirement of the ТЗ it protects. A new button, form or behaviour gets a step here.
 * Steps are independent: every step starts from reset() — no dialog, no sheet, route КПП. */
(function(){
'use strict';
if(!/[?&]selftest\b/.test(location.search)) return;
const L=window.LPR, $=(s,r=document)=>r.querySelector(s), $$=(s,r=document)=>Array.from(r.querySelectorAll(s));
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
const steps=[]; const step=(name,fn)=>steps.push({name,fn});
function ok(cond,msg){if(!cond) throw new Error(msg)}
function eq(a,b,msg){if(a!==b) throw new Error(`${msg}: ожидалось ${JSON.stringify(b)}, получено ${JSON.stringify(a)}`)}
async function go(route){if(location.hash!=='#'+route){location.hash='#'+route;await sleep(30)} L.render()}
const click=sel=>{const el=typeof sel==='string'?$(sel):sel; ok(el,`нет элемента ${sel}`); el.click(); return el};
const key=k=>document.dispatchEvent(new KeyboardEvent('keydown',{key:k,bubbles:true}));
async function reset(){const d=$('#dlg'); if(d.open) d.close(); L.closeSheet(); L.S.ds='data'; L.S.offline=false; await go('kpp')}
const ROUTES=['kpp','alerts','territory','journal','inv','reports','violations','lists','channels'];

/* ---------- ядро ---------- */
step('Все экраны открываются без ошибок, у каждого свой заголовок · ТЗ 9.2',async()=>{
  for(const r of ROUTES){await go(r); ok($('#view').children.length>0,`экран ${r} пуст`); ok($('#page-title').textContent.trim(),`нет заголовка ${r}`);
    eq($('#nav .nav-item[aria-current=page]')?.getAttribute('href'),'#'+r,`текущий пункт навигации на ${r}`)}
});
step('Нормализация ГРЗ: латиница = кириллица · LPR-REC-08',()=>{
  eq(L.norm('a123bc 77'),'А123ВС77','нормализация');
  for(const [lat,cyr] of [['A','А'],['B','В'],['E','Е'],['K','К'],['M','М'],['H','Н'],['O','О'],['P','Р'],['C','С'],['T','Т'],['Y','У'],['X','Х']]) eq(L.norm(lat),cyr,`пара ${lat}/${cyr}`);
});
step('Поиск по маске ? и * · LPR-SRH-01',()=>{
  ok(L.plateMatch('А*77','А123ВС77'),'маска * не нашла'); ok(L.plateMatch('?123??77','А123ВС77'),'маска ? не нашла');
  ok(!L.plateMatch('В*77','А123ВС77'),'маска нашла лишнее');
});
step('Нечёткое совпадение ±1 с похожими символами · LPR-LST-05',()=>{
  ok(L.lev1('О777ОО99','0777ОО99'),'0/О не считаются похожими'); ok(L.lev1('В001АВ50','8001АВ50'),'8/В не считаются похожими');
  ok(L.lev1('А123ВС77','А124ВС77'),'одна замена не найдена'); ok(!L.lev1('А123ВС77','А125ВК77'),'две замены найдены');
});

/* ---------- КПП ---------- */
step('КПП: «Пропустить» без причины не сохраняется · LPR-ACC-03',async()=>{
  await reset(); if(!L.S.kpp.pending.length) L.simStep('К777КК777');
  const n=L.S.kpp.pending.length; key('F2'); ok($('#dlg').open,'F2 не открыл диалог');
  click('[data-act=decide-ok]'); ok($('#dlg').open,'диалог закрылся без причины'); eq($('#d-r').getAttribute('aria-invalid'),'true','поле причины не помечено');
  eq(L.S.kpp.pending.length,n,'решение сохранилось без причины');
});
step('КПП: «Пропустить» с причиной — решение оператора в журнале · LPR-ACC-03, LPR-LOG-01',async()=>{
  await reset(); if(!L.S.kpp.pending.length) L.simStep('К777КК777');
  const p=L.S.kpp.pending[0], n=L.S.kpp.pending.length; key('F2'); $('#d-r').selectedIndex=1; click('[data-act=decide-ok]');
  ok(!$('#dlg').open,'диалог не закрылся'); eq(L.S.kpp.pending.length,n-1,'очередь не уменьшилась');
  eq(p.decision,'allow','решение'); eq(p.src,'operator','источник решения'); ok(p.reason,'причина не записана'); ok(p.barrierAt,'нет факта открытия');
});
step('КПП: «Отказать» требует причину · LPR-ACC-03',async()=>{
  await reset(); L.simStep('К778КК777'); const p=L.S.kpp.pending[0];
  key('F4'); click('[data-act=decide-ok]'); ok($('#dlg').open,'отказ без причины');
  $('#d-r').selectedIndex=1; click('[data-act=decide-ok]'); eq(p.decision,'deny','решение');
});
step('КПП: исправление ГРЗ сохраняет исходное и перепроверяет списки · LPR-REC-10',async()=>{
  await reset(); const last=L.S.kpp.last, was=last.plate; key('F6'); ok($('#dlg').open,'F6 не открыл диалог');
  $('#f-v').value='E555KX77'; click('[data-act=fix-ok]'); // латиница
  eq(last.plate,was,'исходное значение потеряно'); eq(last.corrected,'Е555КХ77','исправленное значение'); ok(last.correctedBy,'нет автора исправления');
  ok(last.lists.includes('emp'),'исправленный ГРЗ не перепроверен по спискам');
});
step('КПП: гостевой пропуск на месте — проезд пропущен · LPR-ACC-04',async()=>{
  await reset(); const p=L.simStep('Т321ТТ750'); key('F8'); ok($('#dlg').open,'F8 не открыл диалог'); eq(L.norm($('#g-pl').value),p.plate,'ГРЗ не подставлен');
  click('[data-act=guest-ok]'); eq(p.decision,'allow','гость не пропущен'); ok(p.lists.includes('guest'),'не в гостевом списке');
});
step('КПП: срабатывание «Розыск» скрыто на рабочем месте КПП · LPR-LST-04',async()=>{
  await reset(); const n=L.S.alerts.length; const p=L.simStep('О777ОО99'); await go('kpp');
  eq(L.S.alerts.length,n+1,'срабатывание не создано'); ok(L.S.kpp.pending.includes(p),'проезд не ждёт решения по правилу точки');
  ok(!/Розыск/.test($('#view').textContent),'на экране КПП видно «Розыск»');
});
step('КПП: автономный режим показывает возраст копии списков и буфер · LPR-ACC-09',async()=>{
  await reset(); L.S.offline=true; L.S.buffer=0; L.simStep('Е555КХ77'); await go('kpp');
  ok(/Автономный режим/.test($('#view').textContent),'нет признака автономного режима'); eq(L.S.buffer,1,'проезд не в буфере');
  L.S.offline=false; L.S.buffer=0;
});

/* ---------- срабатывания ---------- */
step('Срабатывания: отклонение только с причиной · LPR-ALR-04',async()=>{
  await reset(); L.simStep('О777ОО99'); await go('alerts'); const id=L.S.alertSel, a=L.S.alerts.find(x=>x.id===id);
  click('[data-act=areject]'); click('[data-act=areject-ok]'); ok($('#dlg').open,'отклонено без причины'); eq(a.status,'new','статус изменился');
  $('#r-r').selectedIndex=1; click('[data-act=areject-ok]'); eq(a.status,'rejected','не отклонено');
});
step('Срабатывания: эскалация через 60 с без реакции · LPR-ALR-05',async()=>{
  await reset(); L.simStep('О777ОО99'); const a=L.S.alerts[L.S.alerts.length-1];
  L.tick(a.t0+L.ESC_AFTER-1000); ok(!a.esc,'эскалировано раньше срока'); L.tick(a.t0+L.ESC_AFTER+1000); ok(a.esc,'нет эскалации после срока');
});
step('Срабатывания: подмена ГРЗ видна при расхождении марки и модели · LPR-LST-06',async()=>{
  await reset(); const a=L.S.alerts.find(x=>x.rec[0]!==x.exp[0]&&x.status==='new'); ok(a,'в демо-данных нет расхождения');
  L.S.alertSel=a.id; await go('alerts'); ok(/Возможная подмена ГРЗ/.test($('#view').textContent),'нет признака подмены');
});

/* ---------- журнал ---------- */
step('Журнал: фильтр «Уверенность < 85 %» · LPR-REC-09',async()=>{
  await reset(); await go('journal'); L.S.j.chips={low:true}; const rows=L.jFilter(); ok(rows.length,'нет строк'); ok(rows.every(p=>p.conf<85),'в выборке уверенность ≥ 85'); L.S.j.chips={};
});
step('Журнал: строка открывает карточку ТС, Esc закрывает · LPR-CRD-01',async()=>{
  await reset(); await go('journal'); click('#j-res tbody tr[data-plate]:not([data-plate=""])'); ok($('#sheet').hasAttribute('data-open'),'карточка не открылась');
  key('Escape'); ok(!$('#sheet').hasAttribute('data-open'),'Esc не закрыл карточку');
});

/* ---------- расследования, списки ---------- */
step('Расследования: без цели запроса не считается · LPR-SRH-12',async()=>{
  await reset(); await go('inv'); $('#inv-p').value=''; click('[data-act=run]'); eq($('#inv-p').getAttribute('aria-invalid'),'true','поле цели не помечено');
  L.S.inv.purpose='Дело № 2026-114 «Хищение со склада»'; L.S.inv.purposeErr=false;
});
step('Списки: импорт показывает предпросмотр до применения · LPR-LST-07',async()=>{
  await reset(); await go('lists'); click('[data-act=import]'); ok($('#dlg').open,'нет диалога'); ok(/Предпросмотр/.test($('#dlg').textContent),'нет предпросмотра'); $('#dlg').close();
});

/* ---------- состояния данных ---------- */
step('Блоки данных: загрузка, пусто, ошибка · ТЗ UI-08',async()=>{
  await reset(); await go('journal');
  for(const [ds,sel] of [['loading','.skeleton'],['empty','.empty'],['error','.empty']]){L.S.ds=ds; L.render(); ok($(sel,$('#j-res')),`нет состояния ${ds}`)}
  L.S.ds='error'; L.render(); ok(/Повторить/.test($('#j-res').textContent),'ошибка без «Повторить»'); L.S.ds='data';
});

/* ---------- run ---------- */
window.addEventListener('load',async()=>{
  await sleep(50); const log=[]; let fail=0;
  for(const s of steps){try{await s.fn(); log.push('✅ '+s.name)}catch(e){fail++; log.push('❌ '+s.name+' — '+(e&&e.message||e))}}
  await reset();
  log.push('', `Итог: ${steps.length-fail} из ${steps.length} прошли`);
  const pre=document.createElement('pre'); pre.id='selftest-log'; pre.textContent=log.join('\n');
  pre.style.cssText='position:fixed;right:8px;bottom:8px;z-index:99;max-width:min(640px,90vw);max-height:60vh;overflow:auto;margin:0;padding:10px;background:var(--one-popup);color:var(--one-fg);border:1px solid var(--one-border);border-radius:6px;font:12px/1.5 var(--one-font-mono)';
  document.body.append(pre); document.documentElement.dataset.selftest=fail?'fail':'pass';
  console.log(pre.textContent);
});
})();
