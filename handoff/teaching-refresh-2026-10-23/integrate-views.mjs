import fs from 'node:fs';
function change(file,from,to){const s=fs.readFileSync(file,'utf8').replaceAll('\r','');if(s.includes(to))return;if(!s.includes(from))throw Error('Missing '+file+' / '+from.slice(0,65));fs.writeFileSync(file,s.replace(from,to));}
for(const scene of ['m1','m2','m3','m4','m5']){const file=`case-src/${scene}/lesson.js`,name=scene.toUpperCase()+'Lesson';change(file,'})(globalThis);',`if(g.S17TeachingView)g.S17TeachingView.apply(g.${name},'${scene}');})(globalThis);`);}
change('tools/build.mjs',"const context=vm.createContext({});","const context=vm.createContext({});vm.runInContext(fs.readFileSync(path.join(root,'shared/teaching-view.js'),'utf8'),context);");
change('tools/build.mjs',"fs.copyFileSync(path.join(src,'demo.css'),path.join(out,'demo/demo.css'));","fs.writeFileSync(path.join(out,'demo/demo.css'),fs.readFileSync(path.join(src,'demo.css'),'utf8')+'\\n'+fs.readFileSync(path.join(root,'shared/teaching-view.css'),'utf8'));");
for(const file of ['tools/build.mjs','tools/build-cases.mjs']){change(file,"'shared/teaching.js',","'shared/teaching.js','shared/teaching-view.js',");}
change('tools/build-cases.mjs',"const ctx=vm.createContext({});","const ctx=vm.createContext({});vm.runInContext(fs.readFileSync(path.join(root,'shared/teaching-view.js'),'utf8'),ctx);");
change('tools/build-cases.mjs',"fs.copyFileSync(path.join(root,'shared/lab.css'),path.join(out,'demo/demo.css'));","fs.writeFileSync(path.join(out,'demo/demo.css'),fs.readFileSync(path.join(root,'shared/lab.css'),'utf8')+'\\n'+fs.readFileSync(path.join(root,'shared/teaching-view.css'),'utf8'));");
change('shared/lab.js',"const showTab=t=>{","const showTab=t=>{");
change('shared/lab.js',"b.classList.toggle('active',b.dataset.tab===t)","(b.classList.toggle('active',b.dataset.tab===t),b.setAttribute('aria-pressed',String(b.dataset.tab===t)))");
change('shared/lab.js',"s.stepRender=step;","s.stepRender=()=>{step();g.S17TeachingView?.magnify($('step-content'));};");
change('shared/lab.js',"s.step=Number(b.dataset.step);step();","s.step=Number(b.dataset.step);s.stepRender();");
change('shared/lab.js',"g.S17Inspect={snapshot:","g.S17TeachingView?.init(id==='s17-cuttings-lithology'?'m1':id==='s17-fluorescence-review'?'m3':id==='s17-drilltime-boundaries'?'m4':'m5',showTab);s.stepRender();\ng.S17Inspect={snapshot:");
change('case-src/m2/ui.js',"if(!r){$('step-output').textContent='请运行计算。';return;}","globalThis.S17TeachingView?.magnify($('step-content'));if(!r){$('step-output').textContent='请运行计算。';return;}");
change('case-src/m2/ui.js',"b.classList.toggle('active',b.dataset.tab===tab)","(b.classList.toggle('active',b.dataset.tab===tab),b.setAttribute('aria-pressed',String(b.dataset.tab===tab)))");
change('case-src/m2/ui.js',"window.addEventListener('pagehide'","globalThis.S17TeachingView?.init('m2',showTab);\nwindow.addEventListener('pagehide'");
change('shared/teaching.js',"g.S17Teach={palette,","const rockColors=['#b58a54','#557665','#8b8c79','#bc824a'];function classLegend(names){return '<div class=\"rock-legend\">'+names.map((name,i)=>'<span><i style=\"background:'+rockColors[i]+'\"></i><strong>'+name+'</strong></span>').join('')+'<span>✚ 当前颗粒 · 圆点为训练颗粒</span></div>';}\ng.S17Teach={rockColors,classLegend,palette,");
change('case-src/m1/enhance.js',"label:p.label,tip:C.labels[p.label]","label:p.label,color:T.rockColors[p.label],tip:C.labels[p.label]");
change('shared/lab.js',"const colors=['#b58a54','#738b7a','#b7b6a1','#cf9b65'];","const colors=g.S17Teach.rockColors;");
// Versions identify the new case contents; models, splits and frozen measured sources are unchanged.
for(const file of ['tools/build.mjs','tools/build-cases.mjs','tools/build-evidence-fixtures.mjs',...['m1','m2','m3','m4','m5'].flatMap(s=>[`case-src/${s}/ui.js`,`case-src/${s}/enhance.js`]),'case-src/m2/index.html']){let text=fs.readFileSync(file,'utf8');text=text.replaceAll('1.1.0','1.2.0');fs.writeFileSync(file,text);}
const p=JSON.parse(fs.readFileSync('package.json','utf8'));p.version='1.4.0-preview';fs.writeFileSync('package.json',JSON.stringify(p,null,2)+'\n');
// Readable diagrams also apply in the original portal's outer background/workflow panels.
for(const file of ['tools/build.mjs','tools/build-cases.mjs']){let text=fs.readFileSync(file,'utf8');for(const token of ['${v.html}','${s.figure}','${b.svg}','${s.svg}'])text=text.replaceAll(token,`<div tabindex="0" aria-label="图示可横向滚动" style="max-width:100%;overflow-x:auto"><div style="min-width:640px">${token}</div></div>`);fs.writeFileSync(file,text);}
console.log('Five teaching views integrated; case version 1.2.0, portal 1.4.0-preview.');
