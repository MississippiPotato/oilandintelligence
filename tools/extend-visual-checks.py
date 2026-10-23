from pathlib import Path
import shutil
R=Path(__file__).resolve().parent.parent
D=R/'handoff/interactive-views-2026-10-23'
B=D/'pre-theme';B.mkdir(exist_ok=True)
for p in D.glob('browser-*.json'):
 if not (B/p.name).exists():shutil.copyfile(p,B/p.name)
p=R/'checks/browser-interactive-home.txt';s=p.read_text(encoding='utf-8')
s=s.replace('try{await page.goto(base);','try{await page.context().setOffline(false);await page.goto(base);')
s=s.replace("ok('existing interactive wellsite atlas is retained'", "ok('local petroleum theme image decoded on the live homepage',await page.locator('.s17-theme img').evaluate(e=>e.complete&&e.naturalWidth===1942&&e.naturalHeight===809));ok('existing interactive wellsite atlas is retained'")
s=s.replace("ok('no offline HTTP requests'", "ok('theme image also decodes after file offline refresh',await page.locator('.s17-theme img').evaluate(e=>e.complete&&e.naturalWidth===1942));ok('no offline HTTP requests'")
p.write_text(s,encoding='utf-8')
p=R/'checks/browser-interactive-views.txt';s=p.read_text(encoding='utf-8')
s=s.replace("try{for(let i=0;i<5;i++){","try{await page.context().setOffline(false);for(let i=0;i<5;i++){")
s=s.replace("  if(i===1)await page.locator('details.controls summary').click();", """  ok(scene+' visible teaching text omits audited defensive phrases',!/(偷偷加入训练|编造Recall|不伪造训练损失|冒充运行|不能假装成功|未经现场验证)/.test(await page.locator('body').innerText()));
  if(i===0||i===4){await page.locator('#show-truth').check();await page.locator('#metrics-panel').waitFor({state:'visible'});const cells=page.locator('.heat-matrix [data-cell]');ok(scene+' evaluation heatmap encodes actual row proportions',await cells.count()>0&&await cells.first().evaluate(e=>e.style.background.includes('rgba')));const cell=await cells.evaluateAll(es=>es.find(e=>Number(e.textContent)>0)?.dataset.cell);await page.locator('[data-cell="'+cell+'"]').click();ok(scene+' heatmap cell supports actual sample lookup',i===0?(await snapshot()).selected>=0:(await page.locator('#test-error').innerText()).includes('独立测试例'));await page.locator('.heat-matrix').first().screenshot({path:root+'output/playwright/interactive-views/'+scene+'-heatmap.png'});await page.locator('#show-truth').uncheck();}
  if(i===1)await page.locator('details.controls summary').click();""")
p.write_text(s,encoding='utf-8')
print('Extended live checks; pre-theme reports retained')
