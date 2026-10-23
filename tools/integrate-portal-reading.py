from pathlib import Path
import json,hashlib,shutil
R=Path(__file__).resolve().parent.parent;D=R/'handoff/portal-reading-2026-10-23';B=D/'before';B.mkdir(parents=True,exist_ok=True)
files=['portal/index.html','portal/assets/core/shell.js','portal/assets/s17-home.js','portal/assets/s17.css','package.json','README.md','tools/package.mjs','handoff/package-lock.json','handoff/suite-build-lock.json','handoff/execution-status.json']
lock=[]
for n in files:
 p=R/n;q=B/n;q.parent.mkdir(parents=True,exist_ok=True)
 if not q.exists():shutil.copyfile(p,q)
 lock.append({'path':n,'sha256':hashlib.sha256(q.read_bytes()).hexdigest()})
(D/'before-files.json').write_text(json.dumps(lock,ensure_ascii=False,indent=2),encoding='utf-8')
def edit(n,pairs):
 p=R/n;s=p.read_text(encoding='utf-8')
 for a,b in pairs:
  assert a in s,(n,a)
  s=s.replace(a,b)
 p.write_text(s,encoding='utf-8',newline='\n')
edit('portal/assets/core/shell.js',[
 ('<b>智能化可能性地图</b><span>Petro × AI Atlas</span>','<b>井见 · 录井可视实验室</b><span>Petroleum × Intelligence</span>'),
 ("var b = c.tabs.background;","if (global.S17Reader) return global.S17Reader.background(sc, c);\n    var b = c.tabs.background;"),
 ("var w = c.tabs.workflow;","if (global.S17Reader) return global.S17Reader.workflow(sc, c);\n    var w = c.tabs.workflow;"),
 ("return '<div id=\"case-demo-root\"></div>';","return global.S17Reader ? global.S17Reader.demo(sc, c) : '<div id=\"case-demo-root\"></div>';"),
 ('if (c2) bindTabs(sc2, c2);','if (c2) { bindTabs(sc2, c2); if (global.S17Reader) global.S17Reader.init(); }'),
 ("esc(sc.id.toUpperCase()) + '</span>' +","esc(sc.id.toUpperCase()) + '</span>' +"),
 ("document.title = pageTitle(p) + ' · 智能化可能性地图';","document.title = pageTitle(p) + ' · 井见';")])
p=R/'portal/assets/core/shell.js';s=p.read_text(encoding='utf-8');a=s.index('  function footer() {');b=s.index('\n  function crumb(',a)
s=s[:a]+'''  function footer() {
    var s = Cases.stats();
    return '<footer class="s17-footer"><div class="wrap"><div><strong>井见</strong><p>跟着一口教学井，把观察变成可以回查的判断。</p><small>学号17 · 第4阶段录井 · 5个独立案例 · 门户1.6.0-preview</small></div><div><nav aria-label="页脚导航"><a href="#/">返回首页</a><a href="#/chain">完整作业链</a><a href="#/cases">案例库 · 本浏览器'+s.registered+'个已接入</a><a href="#/guide">添加案例指南</a><a href="../portal-original/index.html">老师原站</a></nav><small>原地图 '+A.stages.length+'阶段 / '+A.allScenes.length+'候选场景 · 纯前端 · 离线可运行</small></div></div></footer>';
  }
''' + s[b:]
p.write_text(s,encoding='utf-8',newline='\n')
edit('portal/index.html',[
 ('<link rel="stylesheet" href="assets/s17-assistant.css">','<link rel="stylesheet" href="assets/s17-reader.css?v=20261023-reading">\n<link rel="stylesheet" href="assets/s17-catalog.css?v=20261023-reading">\n<link rel="stylesheet" href="assets/s17-assistant.css">'),
 ('<script src="assets/core/shell.js?v=20261023-teaching"></script>','<script src="assets/s17-reader.js?v=20261023-reading"></script>\n<script src="assets/core/shell.js?v=20261023-reading"></script>'),
 ('<script src="assets/s17-home.js?v=20261023-interactive"></script>','<script src="assets/s17-catalog.js?v=20261023-reading"></script>\n<script src="assets/s17-home.js?v=20261023-reading"></script>')])
edit('portal/assets/s17-home.js',[
 ("if(!block){main.querySelector(':scope > .hero')?.remove();block=document.createElement('section');block.id='s17-personal';block.className='s17-home';main.prepend(block);}","if(!block){block=document.createElement('section');block.id='s17-personal';block.className='s17-home';main.classList.add('s17-home-main');main.replaceChildren(block);}"),
 ("</div>'+window.S17FieldAtlas.markup()+'<div class=\"s17-bottom\">","</div><div class=\"s17-path\"><div><small>01 / 看懂场景</small><b>专业背景</b><p>从井筒、样品与曲线，认识一个具体问题。</p></div><div><small>02 / 看懂方法</small><b>案例流程</b><p>每步读输入、动作与产物，展开图示看清细节。</p></div><div><small>03 / 动手验证</small><b>可运行示范</b><p>改变一个条件，观察结果，再回到证据。</p></div></div>'+window.S17FieldAtlas.markup()+window.S17Catalog.markup()+'<div class=\"s17-reference-row\"><article><span class=\"s17-kicker\">原样例 · 测井</span><h3>从一条 GR 曲线，理解智能分层</h3><p>老师的测井分层样例保留原有内容与算法，可对照专业背景、流程和交互演示。</p><a href=\"#/scene/w1?case=welllog-layer&tab=bg\">阅读老师样例 →</a><a href=\"reference/fluorescence.html\">看真实白光 / UV 对照</a></article><article><span class=\"s17-kicker\">让更多场景，有可运行的案例</span><h3>把你的案例带进来</h3><p>ZIP先解压，一次选择一个完整案例目录；添加后即可在门户阅读三部分并运行。</p><button data-import>＋ 添加案例</button><a href=\"#/guide\">查看接入说明 →</a></article></div><div class=\"s17-bottom\">"),
 ('../handoff/interactive-views-2026-10-23/acceptance.html','../handoff/portal-reading-2026-10-23/acceptance.html'),
 ('window.S17FieldAtlas.init();','window.S17FieldAtlas.init();window.S17Catalog.init();')])
p=R/'package.json';d=json.loads(p.read_text(encoding='utf-8'));d['version']='1.6.0-preview';p.write_text(json.dumps(d,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
print('Integrated portal reading and full homepage; case runtime packages unchanged')
