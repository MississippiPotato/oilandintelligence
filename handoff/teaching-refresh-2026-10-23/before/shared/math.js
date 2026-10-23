(function(g){'use strict';
const mean=a=>a.length?a.reduce((s,x)=>s+x,0)/a.length:0,quantile=(a,q)=>{const s=a.slice().sort((x,y)=>x-y);return s.length?s[Math.floor((s.length-1)*q)]:0;};
function rng(seed){let a=seed>>>0;return()=>{a+=0x6D2B79F5;let t=a;t=Math.imul(t^t>>>15,t|1);t^=t+Math.imul(t^t>>>7,t|61);return((t^t>>>14)>>>0)/4294967296;};}
function classification(actual,pred,n=3){const matrix=Array.from({length:n},()=>Array(n+1).fill(0));actual.forEach((t,i)=>matrix[t][pred[i]]++);const perClass=matrix.map((row,c)=>{const tp=row[c],fn=row.reduce((a,b)=>a+b,0)-tp,fp=matrix.reduce((s,r,i)=>s+(i===c?0:r[c]),0);return {recall:tp+fn?tp/(tp+fn):null,f1:2*tp+fn+fp?2*tp/(2*tp+fn+fp):0};}),accepted=pred.filter(p=>p!==n).length,wrong=pred.filter((p,i)=>p!==n&&p!==actual[i]).length;return {matrix,perClass,macroF1:mean(perClass.map(x=>x.f1)),total:actual.length,accepted,wrong,coverage:actual.length?accepted/actual.length:null,acceptedError:accepted?wrong/accepted:null};}
function fitScale(rows){const mu=rows[0].map((_,j)=>mean(rows.map(x=>x[j]))),sd=mu.map((m,j)=>Math.max(.001,Math.sqrt(mean(rows.map(x=>(x[j]-m)**2)))));return{mu,sd};}
const scale=(x,s)=>x.map((v,j)=>(v-s.mu[j])/s.sd[j]);
function neighbors(samples,x,scaler,k){const z=scale(x,scaler);return samples.map((s,i)=>({index:i,label:s.label,distance:Math.sqrt(mean(z.map((v,j)=>(v-scale(s.x,scaler)[j])**2)))})).sort((a,b)=>a.distance-b.distance||a.index-b.index).slice(0,k);}
function vote(ns,n=3){const weights=Array(n).fill(0);ns.forEach(v=>weights[v.label]+=1/Math.max(.05,v.distance));const label=weights.indexOf(Math.max(...weights));return {label,support:weights[label]/Math.max(1e-9,weights.reduce((a,b)=>a+b,0)),weights};}
function binary(pred,truth,domain){let tp=0,fp=0,fn=0,tn=0;for(let i=0;i<truth.length;i++)if(!domain||domain[i]){if(pred[i])truth[i]?tp++:fp++;else truth[i]?fn++:tn++;}return{tp,fp,fn,tn,IoU:tp+fp+fn?tp/(tp+fp+fn):null,Dice:2*tp+fp+fn?2*tp/(2*tp+fp+fn):null,recall:tp+fn?tp/(tp+fn):null,precision:tp+fp?tp/(tp+fp):null};}
g.S17Math={mean,quantile,rng,classification,fitScale,scale,neighbors,vote,binary};
})(globalThis);
