import fs from 'node:fs';
function change(file,from,to){const clean=v=>v.replaceAll('\r','');const s=clean(fs.readFileSync(file,'utf8'));from=clean(from);to=clean(to);if(s.includes(to))return;if(!s.includes(from))throw Error('Expected source not found: '+file+' / '+from.slice(0,80));fs.writeFileSync(file,s.replace(from,to));}
change('case-src/m2/index.html','G0 风险原型不计为完整案例；其余 m1 / m3 / m4 / m5 本轮未实现。','录井必做 m1–m5 已完成；本例为气测异常解释。五例可各自独立运行，也可显式交换证据。');
change('case-src/m1/enhance.js',"r.prediction.reasons.join('；')||'支持度较低，建议放大核对'","r.prediction.reasons.join('；')||(r.prediction.support<run.config.support?'近邻支持不足，建议复核':'常规抽查：核对轮廓、纹理与训练近邻')");
change('case-src/m1/enhance.js',"tip:p.group","tip:C.labels[p.label]+' · 训练组 '+p.group");
change('case-src/m1/enhance.js',"body.querySelector('#feature-scatter').innerHTML=T.scatter","body.querySelector('#feature-scatter').innerHTML=T.classLegend(C.labels)+T.scatter");
change('case-src/m5/ui.js',"function invalidateAll(trigger){","function reviewMessage(message){$('review-message').textContent=message;}\nfunction invalidateAll(trigger){reviewMessage('输入或来源已变化，重算后需重新核验当前句子。');");
change('case-src/m5/ui.js',"if(b.dataset.sentence!=null)s.selected=Number(b.dataset.sentence);","if(b.dataset.sentence!=null){s.selected=Number(b.dataset.sentence);reviewMessage(s.run.claims[s.selected]?.reviewStatus==='confirmed'?'当前句子已针对本修订核验。':'当前句子尚需核验，请检查语义、否定、单位与范围。');}");
change('case-src/m5/ui.js',"C.invalidateClaim(c,'人工改写句子语义/单位/否定/范围');","C.invalidateClaim(c,'人工改写句子语义/单位/否定/范围');reviewMessage('当前修订需重新核验：旧确认已撤销。');");
change('case-src/m5/ui.js',"$('relink').onclick=()=>{const c=current();if(!c)return;","$('relink').onclick=()=>{const c=current();if(!c)return;reviewMessage('来源已重新关联，当前修订仍需重新核验语义。');");
change('case-src/m5/ui.js',"C.invalidateClaim(c,'人工驳回');","C.invalidateClaim(c,'人工驳回');reviewMessage('当前句子已驳回，保留历史与来源供复核。');");
change('case-src/m5/ui.js',"async function run(){try{","async function run(){try{reviewMessage('已重新计算草稿，请逐句核验当前修订与来源。');");
// Keep the original importer and package schema. The working shell only labels delivered-but-unregistered scenes accurately.
change('portal/assets/core/shell.js',"'<h3>这个场景还没有配套案例</h3></div>'", "'<h3>' + (global.S17Course && global.S17Course.byScene(sc.id) ? '本案例成品已提供，此浏览器尚未导入' : '这个场景还没有配套案例') + '</h3></div>'");
change('portal/assets/core/shell.js',"'<p>它的元数据（问题、介入点、数据条件、难度）已经在地图里，但还没有写成可讲解、可运行的具体案例。案例是按插件方式接入的：写一个文件声明三块内容，注册后这个页面就会自动出现 tab 与示范。</p>'", "(global.S17Course && global.S17Course.byScene(sc.id) ? '<p>' + esc(global.S17Course.byScene(sc.id).scope) + '。独立成品包含专业背景、逐步方法与交互演示。通过下方原入口选择完整案例文件夹，添加后即可在门户查看三部分。</p><p><a class=\"btn\" href=\"../dist/cases/' + esc(global.S17Course.byScene(sc.id).id) + '/demo/index.html#background\">先看独立成品 →</a></p>' : '<p>这里保留原地图的候选场景说明。可通过添加案例接入新的专业背景、流程与可运行示范。</p>')");
// Make the add action visible independently of the horizontally scrolling navigation.
change('portal/assets/core/shell.js',"'<button class=\"nav-add\" data-import>＋ 添加案例</button>' +\n      '</nav></div></header>';".replaceAll('\n','\r\n'),"'</nav><button class=\"nav-add\" data-import>＋ 添加案例</button></div></header>';");
console.log('Four review defects and working-shell state wording patched.');
