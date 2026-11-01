async page=>{
 await page.goto('http://127.0.0.1:8755/portal-original/index.html');
 const before=await page.evaluate(()=>({storedChars:localStorage.getItem('atlas.casepack.v2')?.length,ids:CaseImport.list().map(x=>x.id)}));
 await page.getByRole('banner').getByRole('button',{name:'＋ 添加案例',exact:true}).click();
 await page.locator('#imp-dir').setInputFiles('G:/可视化导论/5/dist/cases/s17-mudgas-context');
 await page.waitForFunction(()=>document.getElementById('imp-id')?.value==='s17-mudgas-context');
 await page.getByRole('button',{name:'校验并添加',exact:true}).click();
 const toast=await page.locator('.toast.on').innerText(),temporary=await page.evaluate(()=>!!Cases.get('s17-mudgas-context')?.imported);
 await page.waitForTimeout(800);await page.reload();
 const after=await page.evaluate(()=>({storedChars:localStorage.getItem('atlas.casepack.v2')?.length,ids:CaseImport.list().map(x=>x.id)}));
 return {scope:'Original portal cumulative localStorage limit in isolated test browser',before,toast,temporary,after,persisted:after.ids.includes('s17-mudgas-context')};
}
