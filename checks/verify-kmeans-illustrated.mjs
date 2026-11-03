import fs from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {workbenchContext} from '../tools/workbench-workflow.mjs';
const g=workbenchContext();
vm.runInContext(fs.readFileSync('shared/m4-kmeans-explainer.js','utf8'),g);
const D=g.S17WBData,c=D.defaults('m4'),r=D.run('m4',D.builtin('m4',c),c),modelBefore=JSON.stringify(r.library.models),checks=[],examples=[];
function check(name,condition){assert.ok(condition,name);checks.push(name);}
for(const init of ['near','spread']){
 const t=g.S17M4Explain.lessonTrace(r,init),last=t.frames.at(-1);
 check(init+': 36 selected reference inputs',t.rows.length===36&&t.rows.every(p=>p.sourceIndex>=0&&p.wellId.startsWith('RESP-TRAIN-')));
 check(init+': every point assigned once',t.frames.every(f=>f.counts.reduce((sum,n)=>sum+n,0)===36&&f.labels.every(i=>i>=0&&i<3)));
 check(init+': group mean preserves coordinate sums',t.frames.every(f=>f.counts.every((n,i)=>!n||f.next[i].every((v,j)=>Math.abs(v*n-f.sums[i][j])<1e-8))));
 check(init+': squared-distance objective never increases',t.frames.every((f,i)=>!i||f.SSE<=t.frames[i-1].SSE+1e-8));
 check(init+': converges to fixed centers',last.centers.every((p,i)=>p.every((v,j)=>Math.abs(v-last.next[i][j])<1e-5)));
 check(init+': point coordinates stay fixed throughout playback',t.rows.every(p=>p.z.length===2&&p.z.every(Number.isFinite)));
 for(let step=0;step<t.totalSteps;step++){const state={kmMode:'principle',kmInit:init,kmStep:step},snap=g.S17M4Explain.snapshot(r,state),html=g.S17M4Explain.html(r,state);assert.equal(snap.step,step);assert.ok(!/NaN|undefined/.test(html));}
 checks.push(init+': all rendered steps use finite computed data');
 examples.push({initialization:init,points:t.rows.length,iterations:t.frames.length,steps:t.totalSteps,SSE:t.frames.map(f=>f.SSE),finalGroupCounts:last.counts});
}
check('The explanatory subset never replaces production models',JSON.stringify(r.library.models)===modelBefore);
const full=g.S17M4Explain.trace(r);
check('Full playback still has original1896 reference records',full.rows.length===1896&&full.frames.every((f,i)=>Math.abs(f.SSE-r.library.models[r.config.k].history[i].SSE)<1e-8));
const changed=execFileSync('git',['diff','--name-only','HEAD','--','dist/cases','dist/expansion-cases','portal-original','石油勘探开发智能化案例集'],{encoding:'utf8'}).trim().split(/\r?\n/).filter(Boolean);
check('Only M1 and M4 runtime packages changed',changed.every(p=>/^dist\/cases\/s17-(cuttings-lithology|drilltime-boundaries)\//.test(p)));
for(const scene of ['m1','m4'])check(scene+' original engine unchanged',execFileSync('git',['diff','--numstat','HEAD','--','case-src/'+scene+'/engine.js'],{encoding:'utf8'}).trim()==='');
const out={at:new Date().toISOString(),evidenceType:'Focused numerical and source-scope checks, not browser acceptance',checks,examples,changedRuntimeFiles:changed};
fs.writeFileSync('handoff/kmeans-illustrated-2026-11-03/numeric-and-scope.json',JSON.stringify(out,null,2));process.stdout.write(JSON.stringify({passed:checks.length,examples},null,2)+'\n');
