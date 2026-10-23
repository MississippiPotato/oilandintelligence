from pathlib import Path
R=Path(__file__).resolve().parent.parent
p=R/'checks/browser-interactive-home.txt'
s=p.read_text(encoding='utf-8').replace('try{await page.context().setOffline(false);','try{await page.setViewportSize({width:1440,height:1000});await page.context().setOffline(false);')
p.write_text(s,encoding='utf-8')
p=R/'checks/browser-interactive-views.txt'
s=p.read_text(encoding='utf-8').replace("if(i===0||i===4){await page.locator('#show-truth').check();","if(i===0||i===4){await page.setViewportSize({width:1440,height:1000});await page.locator('#show-truth').check();")
p.write_text(s,encoding='utf-8')
