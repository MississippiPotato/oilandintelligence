(function(g){'use strict';
const names=['岩性接触线','产状符号','地层代号'];
function random(seed){let s=seed>>>0;return()=>{s=(1664525*s+1013904223)>>>0;return s/4294967296;};}
function symbol(c,shift=0){const a=Array(256).fill(0),put=(x,y)=>{if(x>=0&&x<16&&y>=0&&y<16)a[y*16+x]=1;};
if(c===0)for(let x=2;x<14;x++)put(x,7+shift+Math.round(Math.sin(x*.55)));
if(c===1){for(let x=2;x<14;x++)put(x,6+shift);for(let y=6+shift;y<13+shift;y++)put(8,y);}
if(c===2){for(let y=3+shift;y<13+shift;y++){put(3,y);put(8,y);put(12,y);}for(let x=3;x<9;x++){put(x,3+shift);put(x,12+shift);}for(let x=8;x<13;x++)put(x,7+shift);}
return a;}
function generate(seed,noise){const r=random(seed),observations=[],truth=[];for(let i=0;i<30;i++){const c=Math.floor(r()*3),shift=Math.floor(r()*3)-1,clean=symbol(c,shift);observations.push(clean.map(v=>r()<noise?1-v:v));truth.push(c);}return{observations,truth};}
function distance(a,b){return a.reduce((s,v,i)=>s+(v!==b[i]?1:0),0)/256;}
function predict(observations){const templates=names.flatMap((_,c)=>[-1,0,1].map(s=>({c,p:symbol(c,s)})));return observations.map(p=>{const ds=templates.map(t=>({c:t.c,d:distance(p,t.p)})).sort((a,b)=>a.d-b.d);return{label:ds[0].c,distance:ds[0].d,margin:ds.find(x=>x.c!==ds[0].c).d-ds[0].d};});}
function baseline(observations){return observations.map(p=>{let vertical=0;for(let y=1;y<16;y++)for(let x=0;x<16;x++)if(p[y*16+x]&&p[(y-1)*16+x])vertical++;return vertical>18?2:0;});}
function evaluate(pred,truth){const cm=names.map(()=>[0,0,0]);pred.forEach((v,i)=>cm[truth[i]][v]++);const f=names.map((_,i)=>{const tp=cm[i][i],den=cm[i].reduce((a,b)=>a+b,0)+cm.reduce((s,row)=>s+row[i],0);return den?2*tp/den:0;});return{accuracy:pred.filter((v,i)=>v===truth[i]).length/truth.length,macroF1:f.reduce((a,b)=>a+b,0)/3,cm,n:truth.length};}
function parseLegend(text){return text.split(/[\n；;]/).map(x=>x.trim()).filter(Boolean).map(line=>{const m=line.match(/^([A-Za-z][A-Za-z0-9]*)\s*[:：]\s*(.+)$/);return m?{code:m[1],description:m[2],valid:true}:{code:'待复核',description:line,valid:false};});}
function run(p={}){const params={seed:901,noise:.04,...p},fixture=generate(params.seed,params.noise),prediction=predict(fixture.observations),base=baseline(fixture.observations);return{params,observations:fixture.observations,prediction,baseline:base,evaluationTruth:fixture.truth,metrics:evaluate(prediction.map(p=>p.label),fixture.truth),baselineMetrics:evaluate(base,fixture.truth),dataSource:'自绘 16×16 图例符号，经平移与像素翻转产生独立教学图块；不代表真实扫描图准确率。'};}
g.G3Core={names,symbol,generate,predict,baseline,evaluate,parseLegend,run};
})(globalThis);
