async page=>{
 const r={checkedAt:new Date().toISOString(),kind:'actual_Chrome_read_current_65_case_archive_without_bulk_install',checks:[]},ok=(name,v)=>{r.checks.push({name,passed:!!v});if(!v)throw Error(name);};
 try{
 await page.bringToFront();await page.goto('http://127.0.0.1:8755/portal/index.html');await page.evaluate(async()=>{await CaseImport.ready;CaseImport.open();});await page.locator('#imp-zip').setInputFiles('G:/可视化导论/5/dist/s17-all-65-cases-1.13.1.zip');await page.waitForFunction(()=>document.querySelectorAll('#imp-archive-case option').length===65,{},{timeout:15000});
 ok('Current 65-case archive is recognized as 65 independent packages',await page.locator('#imp-archive-case option').count()===65);ok('First case keeps its five-file contract',await page.locator('#imp-list .imp-row').count()===5);await page.evaluate(()=>{CaseImport.close();CaseImport.open();});
 const files=['case.json','README.txt','demo/index.html','demo/demo.css','demo/demo.js'].map(x=>'G:/可视化导论/5/dist/cases/s17-cuttings-lithology/'+x);files.push('G:/可视化导论/5/handoff/teacher-update-2026-11-02/fixtures/stored.zip');await page.locator('#imp-file').setInputFiles(files);await page.waitForFunction(()=>document.querySelectorAll('#imp-list .imp-row').length===6);ok('Original file selection can still contain a ZIP data attachment',await page.locator('#imp-id').inputValue()==='s17-cuttings-lithology');await page.evaluate(()=>CaseImport.close());
 }catch(e){r.failure=e.stack;r.checks.push({name:'Collection protocol completed',passed:false,detail:e.message});}
 r.passed=r.checks.filter(x=>x.passed).length;r.failed=r.checks.filter(x=>!x.passed).length;return r;
}
