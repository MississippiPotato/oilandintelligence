import fs from 'node:fs';import vm from 'node:vm';import assert from 'node:assert/strict';import {execFileSync}from'node:child_process';
import {workbenchContext}from'../tools/workbench-workflow.mjs';
const g=workbenchContext();for(const p of ['shared/m4-kmeans-explainer.js','shared/m4-kmeans-cinema.js'])vm.runInContext(fs.readFileSync(p,'utf8'),g);
const D=g.S17WBData,c=D.defaults('m4'),r=D.run('m4',D.builtin('m4',c),c),fixed=JSON.stringify(r.library.models),checks=[],examples=[];
function check(name,condition){assert.ok(condition,name);checks.push(name);}
for(const init of ['near','spread']){
 const s={kmCinema:true,kmMode:'principle',kmInit:init},t=g.S17M4Explain.practiceTrace(r,s);
 check(init+' conserves24 records',t.frames.every(f=>f.counts.reduce((a,b)=>a+b,0)===24));
 check(init+' means match coordinate sums',t.frames.every(f=>f.counts.every((n,i)=>!n||f.next[i].every((v,j)=>Math.abs(v*n-f.sums[i][j])<1e-8))));
 check(init+' objective does not increase',t.frames.every((f,i)=>!i||f.SSE<=t.frames[i-1].SSE+1e-8));
 check(init+' converges',t.converged);
 const a=g.S17M4Explain.snapshot(r,s);for(let i=0;i<a.totalSteps;i++)assert.ok(!/NaN|undefined/.test(g.S17M4Explain.html(r,{...s,kmStep:i})));
 checks.push(init+' all stages render finite computed data');
 examples.push({initialization:init,rounds:t.frames.length,nominalSeconds:g.S17M4Explain.duration(r,s),groups:t.frames.at(-1).counts});
}
const moved=g.S17M4Explain.practicePoints();moved[0]=[1.6,-1.4];const changed=g.S17M4Explain.practiceTrace(r,{kmPractice:moved,kmInit:'near'}),normal=g.S17M4Explain.practiceTrace(r,{});
check('Moving one input changes actual group membership',JSON.stringify(changed.frames.at(-1).counts)!==JSON.stringify(normal.frames.at(-1).counts));
check('Practice never mutates the current-well fitted models',JSON.stringify(r.library.models)===fixed);
check('Default playback nominal duration under7seconds',g.S17M4Explain.duration(r,{kmCinema:true,kmMode:'principle'})<7);
check('Fast playback reduces duration',g.S17M4Explain.duration(r,{kmCinema:true,kmMode:'principle',kmSpeed:1.6})<4);
const actual=g.S17M4Explain.snapshot(r,{kmCinema:true,kmMode:'actual',kmStep:999});
check('Full fitted reference view retains1896 points',actual.trainingCount===1896&&actual.counts.reduce((a,b)=>a+b,0)===1896);
const paths=execFileSync('git',['diff','--name-only','HEAD','--','dist/cases','dist/expansion-cases','portal-original','石油勘探开发智能化案例集'],{encoding:'utf8'}).trim().split(/\r?\n/).filter(Boolean);
check('Only M4 runtime files changed',paths.every(p=>p.startsWith('dist/cases/s17-drilltime-boundaries/')));
check('Case computation engine unchanged',execFileSync('git',['diff','--numstat','HEAD','--','case-src/m4/engine.js','shared/workbench-data.js'],{encoding:'utf8'}).trim()==='');
const out={at:new Date().toISOString(),evidenceType:'Focused numerical and source checks, separate from browser observations',checks,examples,movedPointFinalCounts:changed.frames.at(-1).counts,changedRuntimeFiles:paths};
fs.writeFileSync('handoff/kmeans-cinema-2026-11-03/numeric-and-scope.json',JSON.stringify(out,null,2));process.stdout.write(JSON.stringify({passed:checks.length,examples,movedCounts:out.movedPointFinalCounts},null,2)+'\n');
