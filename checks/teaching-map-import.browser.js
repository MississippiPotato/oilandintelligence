async page=>{
 const base='http://127.0.0.1:8755/portal/index.html',id='s17-cuttings-lithology',r={checkedAt:new Date().toISOString(),kind:'actual_Chrome_uploaded_version_priority_hide_restore_confirm_autoaccepted',checks:[]},ok=(name,v)=>{r.checks.push({name,passed:!!v});if(!v)throw Error(name)};
 try{
 await page.goto(base);await page.waitForFunction(()=>S17HomeReady());await page.evaluate(id=>{globalThis.confirm=()=>true;if(Cases.get(id)?.imported)CaseImport.remove(id);S17CaseLoader.registerCatalog();},id);await page.getByRole('banner').getByRole('button',{name:'＋ 添加案例',exact:true}).click();await page.locator('#imp-dir').setInputFiles('G:/可视化导论/5/dist/cases/'+id);await page.waitForFunction(id=>document.querySelector('#imp-id').value===id,id);await page.locator('#imp-ver').fill('9.9.9');await page.getByRole('button',{name:'校验并添加',exact:true}).click();await page.waitForFunction(id=>Cases.get(id)?.imported===true,id);await page.waitForTimeout(800);
 ok('Same-ID upload wins registration with its own version',await page.evaluate(id=>Cases.get(id).version==='9.9.9',id));
 ok('Homepage/3D case helper keeps uploaded version in portal',await page.evaluate(()=>S17Course.href(S17Course.byScene('m1'),'background').startsWith('#/scene/m1?')));
 await page.reload();await page.waitForFunction(id=>Cases.get(id)?.imported===true&&Cases.get(id).version==='9.9.9',id);ok('Uploaded priority survives refresh',true);
 await page.evaluate(()=>{globalThis.confirm=()=>true;});await page.evaluate(id=>CaseImport.remove(id),id);await page.evaluate(()=>S17CaseLoader.registerCatalog());await page.reload();await page.waitForFunction(id=>Cases.get(id)?.version==='1.10.0'&&!Cases.get(id).imported,id);ok('Removing upload restores packaged original',true);
 await page.evaluate(()=>{globalThis.confirm=()=>true;});await page.evaluate(id=>CaseImport.remove(id),id);ok('Hide removes builtin from directory',await page.evaluate(id=>CaseImport.blockedList().includes(id)&&!S17Catalog.entries().some(c=>c.id===id),id));
 await page.evaluate(id=>CaseImport.restore(id),id);await page.waitForLoadState('load');await page.waitForFunction(id=>Cases.get(id)&&!CaseImport.blockedList().includes(id),id);ok('Restore returns builtin after refresh',await page.evaluate(id=>S17Catalog.entries().some(c=>c.id===id),id));
 }catch(e){r.failure=e.stack;r.checks.push({name:'Import priority completed',passed:false,detail:e.message});}
 r.passed=r.checks.filter(x=>x.passed).length;r.failed=r.checks.filter(x=>!x.passed).length;return r;
}
