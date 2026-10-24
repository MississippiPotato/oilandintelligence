import fs from 'node:fs';
import path from 'node:path';
import {spawnSync} from 'node:child_process';

// Focused browser storage test. The 4.9M-character migration fixture is explicitly
// synthetic; the two imports below use real folder inputs and production files.
const root = path.resolve(import.meta.dirname, '..');
const session = 's17-storage-only';
const reportDir = path.join(root, 'handoff/full-coverage-2026-10-24');
fs.mkdirSync(reportDir, {recursive: true});
function cli(args, report) {
  const result = spawnSync(process.execPath, ['tools/pw.mjs', session, ...args], {
    cwd: root, encoding: 'utf8', timeout: 95000, windowsHide: true,
    env: {...process.env, ...(report ? {S17_REPORT: path.join(reportDir, report)} : {})}
  });
  if (result.status || /### Error/.test(result.stdout ?? '')) throw new Error(result.stdout + result.stderr);
  process.stdout.write(result.stdout ?? '');
  if (report) {
    const data = JSON.parse(fs.readFileSync(path.join(reportDir, report), 'utf8'));
    if (!Array.isArray(data.checks)) throw Error('Browser did not return a completed storage report');
    if (data.failed) process.exitCode = 1;
  }
}
const base = 'http://127.0.0.1:8755/portal/index.html';
const m1 = path.join(root, 'dist/cases/s17-cuttings-lithology').replaceAll('\\', '/');
const g1 = path.join(root, 'dist/expansion-cases/s17x-g1-remote-lithology').replaceAll('\\', '/');
cli(['open', base, '--config=checks/playwright-local-file.json']);
cli(['snapshot']);
cli(['run-code', `async page => {
  const r={scope:'Real browser: synthetic large legacy fixture plus actual production folder imports; not full 61-case acceptance',checks:[],startedAt:new Date().toISOString()};
  const ok=(name,value,detail)=>{r.checks.push({name,passed:!!value,...(detail===undefined?{}:{detail})});if(!value)throw Error(name)};
  const BASE=${JSON.stringify(base)},M1=${JSON.stringify(m1)},G1=${JSON.stringify(g1)};
  const waitReady=async p=>p.evaluate(async()=>{await CaseImport.ready;return CaseImport.storageStatus()});
  const addFolder=async(p,dir,id)=>{await p.getByRole('banner').getByRole('button',{name:'＋ 添加案例',exact:true}).click();await p.locator('#imp-dir').setInputFiles(dir);await p.waitForFunction(id=>document.querySelector('#imp-id')?.value===id,id);};
  try {
    await page.goto(BASE.replace('/portal/','/portal-original/'));
    await page.evaluate(async()=>{
      await new Promise((resolve,reject)=>{const req=indexedDB.deleteDatabase('atlas.casepack.enhanced.v1');req.onsuccess=resolve;req.onerror=()=>reject(req.error);req.onblocked=()=>reject(Error('Fixture DB cleanup blocked'));});
      const record={v:2,meta:{id:'storage-migration-fixture',sceneId:'g1',title:'容量迁移测试',version:'1.0.0'},pkg:{id:'storage-migration-fixture',sceneId:'g1',title:'容量迁移测试',tabs:{background:{sections:[{title:'存储测试夹具',html:'<p>仅用于容量与迁移验证。</p>'}]} }},files:[],savedAt:new Date().toISOString(),storageFixturePadding:'x'.repeat(4900000)};
      localStorage.setItem('atlas.casepack.v2',JSON.stringify([record]));localStorage.removeItem('atlas.casepack.v1');localStorage.removeItem('atlas.case.blocked.v1');
    });
    await page.goto(BASE);r.migration=await waitReady(page);
    ok('legacy fixture migrated to IndexedDB',r.migration.backend==='indexedDB'&&r.migration.count===1,r.migration);
    ok('legacy backup retained for original portal',await page.evaluate(()=>localStorage.getItem('atlas.casepack.v2').length>4900000));
    await addFolder(page,M1,'s17-cuttings-lithology');
    await page.getByRole('button',{name:'校验并添加',exact:true}).click();
    await page.waitForFunction(()=>CaseImport.list().some(x=>x.id==='s17-cuttings-lithology'));
    const capacity=await page.evaluate(async()=>{const records=await new Promise((resolve,reject)=>{const req=indexedDB.open('atlas.casepack.enhanced.v1',1);req.onsuccess=()=>{const db=req.result,tx=db.transaction('catalog'),get=tx.objectStore('catalog').get('packages');tx.oncomplete=()=>{resolve(get.result);db.close()};tx.onerror=()=>reject(tx.error)};req.onerror=()=>reject(req.error)});const text=JSON.stringify(records);let quotaRejected=false;try{localStorage.setItem('s17-storage-quota-probe',text)}catch(e){quotaRejected=e.name==='QuotaExceededError'}localStorage.removeItem('s17-storage-quota-probe');return {characters:text.length,count:records.length,quotaRejected}});
    r.capacity=capacity;ok('actual folder plus migration fixture exceeds localStorage capacity and persists',capacity.count===2&&capacity.quotaRejected,capacity);
    await page.reload();await waitReady(page);
    ok('both packages survive refresh',await page.evaluate(()=>CaseImport.list().length===2&&Cases.get('s17-cuttings-lithology')?.imported));
    await page.goto(BASE+'#/scene/m1?case=s17-cuttings-lithology&tab=demo');await waitReady(page);
    const frame=page.frameLocator('iframe');await frame.locator('[data-study-mounted="true"]').first().waitFor({state:'attached'});
    await frame.locator('body').evaluate(()=>new Promise(resolve=>document.readyState==='complete'?resolve():window.addEventListener('load',resolve,{once:true})));
    await frame.locator('nav [data-tab="lab"]').click();await frame.locator('#run').click();
    await frame.locator('#status').waitFor();
    await frame.locator('body').evaluate(()=>new Promise((resolve,reject)=>{const check=()=>{const s=(globalThis.S17Inspect??globalThis.M2Inspect??globalThis.CaseInspect)?.snapshot();if(['ready','complete','completed','done'].includes(s?.status))resolve();else if(Date.now()>deadline)reject(Error('Demo computation did not finish'));else setTimeout(check,25)};const deadline=Date.now()+30000;check()}));
    ok('persisted production demo actually runs after refresh',await frame.locator('body').evaluate(()=>{const s=(globalThis.S17Inspect??globalThis.M2Inspect??globalThis.CaseInspect)?.snapshot();return ['ready','complete','completed','done'].includes(s?.status)}));
    await addFolder(page,G1,'s17x-g1-remote-lithology');
    ok('same-ID builtin replacement has explicit import warning',(await page.locator('#import-modal').innerText().catch(()=>page.locator('#imp-results').innerText())).includes('替换内置案例'));
    await page.getByRole('button',{name:'校验并添加',exact:true}).click();await page.waitForFunction(()=>Cases.get('s17x-g1-remote-lithology')?.imported);
    await page.reload();await waitReady(page);
    ok('uploaded replacement takes precedence after refresh',await page.evaluate(()=>Cases.get('s17x-g1-remote-lithology')?.imported&&CaseImport.list().length===3));
    const failure=await page.evaluate(async()=>{const old=IDBDatabase.prototype.transaction;IDBDatabase.prototype.transaction=function(names,mode){if(mode==='readwrite')throw new DOMException('Injected write failure','QuotaExceededError');return old.apply(this,arguments)};try{return {result:await CaseImport.updateMeta('storage-migration-fixture',{title:'不应保存'}),title:Cases.get('storage-migration-fixture').title}}finally{IDBDatabase.prototype.transaction=old}});
    ok('failed durable write does not mutate registered metadata',failure.result.ok===false&&failure.title==='容量迁移测试',failure);
    const edited=await page.evaluate(()=>CaseImport.updateMeta('storage-migration-fixture',{title:'容量迁移已验证'}));ok('metadata edit commits durably',edited.ok,edited);
    await page.reload();await waitReady(page);ok('edited metadata survives refresh',await page.evaluate(()=>Cases.get('storage-migration-fixture').title==='容量迁移已验证'));
    const fallback=await page.context().newPage();await fallback.addInitScript(()=>Object.defineProperty(window,'indexedDB',{value:undefined,configurable:true}));await fallback.goto(BASE);const fallbackStatus=await waitReady(fallback);
    ok('unavailable IndexedDB uses legacy storage explicitly',fallbackStatus.backend==='localStorage',fallbackStatus);
    await addFolder(fallback,M1,'s17-cuttings-lithology');await fallback.getByRole('button',{name:'校验并添加',exact:true}).click();await fallback.waitForFunction(()=>document.querySelector('.imp-tip.is-err')?.textContent.includes('保存失败'));
    ok('quota failure keeps import open and never registers a memory-only success',await fallback.evaluate(()=>!CaseImport.list().some(x=>x.id==='s17-cuttings-lithology')&&!Cases.get('s17-cuttings-lithology')&&document.querySelector('#imp-ok').disabled===false));
    ok('fallback metadata edit actually persists',await fallback.evaluate(async()=>(await CaseImport.updateMeta('storage-migration-fixture',{title:'回退修改已验证'})).ok));await fallback.close();
    await page.reload();await waitReady(page);ok('fallback changes reconcile when IndexedDB returns without dropping newer packages',await page.evaluate(()=>Cases.get('storage-migration-fixture')?.title==='回退修改已验证'&&CaseImport.list().length===3&&Cases.get('s17-cuttings-lithology')?.imported&&Cases.get('s17x-g1-remote-lithology')?.imported&&!localStorage.getItem('atlas.casepack.enhanced.pending.v1')));
    const offline=await page.context().newPage();await offline.goto('file:///'+${JSON.stringify(root.replaceAll('\\','/'))}+'/portal/index.html');const offlineStatus=await waitReady(offline);r.fileStatus=offlineStatus;
    ok('file portal initializes a durable backend',offlineStatus.backend==='indexedDB'||offlineStatus.backend==='localStorage',offlineStatus);
    await addFolder(offline,G1,'s17x-g1-remote-lithology');await offline.getByRole('button',{name:'校验并添加',exact:true}).click();await offline.waitForFunction(()=>Cases.get('s17x-g1-remote-lithology')?.imported);
    await offline.reload();await waitReady(offline);ok('actual file portal folder import persists through refresh',await offline.evaluate(()=>Cases.get('s17x-g1-remote-lithology')?.imported&&CaseImport.list().some(x=>x.id==='s17x-g1-remote-lithology')));await offline.close();
    ok('persisted fixture removal commits (API confirmation accepted in isolated test profile)',await page.evaluate(async()=>{const original=window.confirm;window.confirm=()=>true;try{return await CaseImport.remove('storage-migration-fixture')}finally{window.confirm=original}}));
    await page.reload();await waitReady(page);ok('deleted legacy fixture stays deleted despite retained compatibility backup',await page.evaluate(()=>!CaseImport.list().some(x=>x.id==='storage-migration-fixture')&&!Cases.get('storage-migration-fixture')));
  } catch(error) {r.exception=error.message;}
  r.finishedAt=new Date().toISOString();r.passed=r.checks.filter(x=>x.passed).length;r.failed=Math.max(r.checks.filter(x=>!x.passed).length,r.exception?1:0);return r;
}`], 'browser-storage-capacity.json');
cli(['close']);
