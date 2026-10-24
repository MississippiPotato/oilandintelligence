(function(g){'use strict';
const mean=a=>a.reduce((s,v)=>s+v,0)/Math.max(1,a.length),clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
function rng(s){return()=>{s=(Math.imul(1664525,s)+1013904223)>>>0;return s/4294967296}}
function solve(a,b){a=a.map((r,i)=>[...r,b[i]]);for(let j=0;j<b.length;j++){let q=j;for(let k=j+1;k<b.length;k++)if(Math.abs(a[k][j])>Math.abs(a[q][j]))q=k;[a[q],a[j]]=[a[j],a[q]];let v=a[j][j]||1e-9;for(let k=j;k<=b.length;k++)a[j][k]/=v;for(let i=0;i<b.length;i++)if(i!==j){v=a[i][j];for(let k=j;k<=b.length;k++)a[i][k]-=v*a[j][k]}}return a.map(r=>r[b.length])}
function fit(xs,ys){let d=xs[0].length,A=Array.from({length:d},()=>Array(d).fill(0)),b=Array(d).fill(0);xs.forEach((x,i)=>x.forEach((v,j)=>{b[j]+=v*ys[i];x.forEach((w,k)=>A[j][k]+=v*w)}));for(let j=1;j<d;j++)A[j][j]+=.02;return solve(A,b)}
const pred=(m,x)=>m.reduce((s,v,i)=>s+v*x[i],0), rmse=(y,p)=>Math.sqrt(mean(y.map((v,i)=>(v-p[i])**2))),mae=(y,p)=>mean(y.map((v,i)=>Math.abs(v-p[i])));
function knn(xs,ys,x,k=9){const near=xs.map((z,i)=>({i,d:z.reduce((s,v,j)=>s+(v-x[j])**2,0)})).sort((a,b)=>a.d-b.d).slice(0,k);return mean(near.map(n=>ys[n.i]))}
function logistic(xs,ys){let m=Array(xs[0].length).fill(0);for(let z=0;z<220;z++){let grad=m.map(()=>0);xs.forEach((x,i)=>{let e=1/(1+Math.exp(-clamp(pred(m,x),-25,25)))-ys[i];x.forEach((v,j)=>grad[j]+=e*v)});m=m.map((v,j)=>v-.15*(grad[j]/xs.length+.003*(j?v:0)))}return m}
function score(y,p){let tp=0,fp=0,fn=0; y.forEach((v,i)=>{tp+=v&&p[i]?1:0;fp+=!v&&p[i]?1:0;fn+=v&&!p[i]?1:0});return{precision:tp/(tp+fp||1),recall:tp/(tp+fn||1),f1:2*tp/(2*tp+fp+fn||1),tp,fp,fn,n:y.length}}
function series(title,xLabel,yLabel,traces,extra={}){return{title,xLabel,yLabel,traces,...extra}}
function trace(name,values,color){return{name,values,color}}
function pair(a){return a.map((v,i)=>[i,v])}
function metric(label,value,unit=''){return{label,value,unit}}

function data(seed,n,noise=1){const r=rng(seed);return Array.from({length:n},(_,i)=>{const sh=r(),phi=.06+.25*r(),rh=2.65*(1-phi)+1.03*phi+.12*sh+noise*.025*(r()-.5),np=phi+.10*sh+noise*.035*(r()-.5),gr=25+105*sh+noise*8*(r()-.5);return{rh,np,gr,phi,depth:1800+i*.5}})}
const feature=(o,mode)=>mode==='density'?[1,o.rh]:[1,o.rh,o.np,o.gr/100];
function run(p){const train=data(313,p.count),test=data(819,120,p.noise),m=fit(train.map(o=>feature(o,p.mode)),train.map(o=>o.phi)),out=test.map(o=>pred(m,feature(o,p.mode))),base=test.map(o=>(2.65-o.rh)/(2.65-1.03)),truth=test.map(o=>o.phi);return{params:p,metrics:[metric('多曲线孔隙度 RMSE',100*rmse(truth,out),'百分点'),metric('密度公式 RMSE',100*rmse(truth,base),'百分点'),metric('独立测试岩心点',test.length,'点')],views:[series('预测—岩心标定：偏离对角线就是误差','标定孔隙度 / %','预测孔隙度 / %',[trace('学习回归',truth.map((v,i)=>[v*100,out[i]*100]),'#14796f'),trace('密度公式',truth.map((v,i)=>[v*100,base[i]*100]),'#c07648')],{scatter:true,diagonal:true}),series('沿深度查看泥质影响与预测残差','MD / m','孔隙度误差 / 百分点',[trace('学习回归误差',test.map((o,i)=>[o.depth,100*(out[i]-o.phi)]),'#14796f'),trace('密度公式误差',test.map((o,i)=>[o.depth,100*(base[i]-o.phi)]),'#c07648')])],notes:[`训练 ${train.length} 个独立井段标定点；测试 120 点，没有用于拟合。`,`密度公式固定骨架 2.65 与流体 1.03 g/cm³；教学泥质项使单密度解释产生偏差。`,`学习系数 ${m.map(v=>v.toFixed(3)).join('，')}；模型MAE ${(100*mae(truth,out)).toFixed(2)} 个孔隙度百分点。`],observations:test.map(({phi,...o})=>o),predictions:out,baseline:base,evaluationTruth:truth,split:'CAL-313 / TEST-819',training:{coefficients:m,count:train.length}}}
g.Experiment={run,sceneId:'w2',caseId:'s17x-w2-porosity-calibration'};})(globalThis);
