import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
const ctx=vm.createContext({});vm.runInContext(fs.readFileSync(new URL('./engine.js',import.meta.url),'utf8'),ctx);const E=ctx.T1Core,checks=[];
function check(name,fn){fn();checks.push({name,status:'passed'});}
const normal=E.run();
check('默认固定种子、真实拟合与评价可复现',()=>{assert.equal(JSON.stringify(normal),JSON.stringify(E.run()));assert.equal(normal.split.trainRows,864);assert.equal(normal.metrics.model.truthCount,3);assert.ok(normal.model.q.some(x=>Math.abs(x)>.1));});
check('运行组不跨训练验证测试',()=>{const ids=[...normal.split.train,...normal.split.validation,...normal.split.test];assert.equal(new Set(ids).size,ids.length);});
check('流量变化特征只由相邻可见流量计算',()=>{for(const group of E.generate().groups)for(let i=1;i<group.rows.length;i++)assert.ok(Math.abs(group.rows[i].dq-(group.rows[i].qIn-group.rows[i-1].qIn))<1e-10);});
check('连续三点确认的起点和不足三点拒绝',()=>{const rows=Array.from({length:7},(_,i)=>({group:'A',minute:i}));assert.equal(E.segments(rows,[false,true,true,true,false,true,true]).length,1);assert.equal(E.segments(rows,[false,true,true,true,false,true,true])[0].start,3);});
check('一对一匹配、多报漏检与F1分母手算',()=>{const pred=[{group:'A',start:11,end:15},{group:'A',start:70,end:75}],truth=[{group:'A',start:10,end:20},{group:'A',start:40,end:50}],m=E.evaluate(pred,truth,60);assert.equal(m.tp,1);assert.equal(m.fp,1);assert.equal(m.fn,1);assert.equal(m.f1,.5);assert.equal(m.delay_min,1);assert.equal(m.falseEventsPerHour,1);assert.equal(E.match([pred[0],pred[0]],truth).length,1);});
check('开始远早于参考的既有长告警不算命中',()=>assert.equal(E.match([{group:'A',start:1,end:40}],[{group:'A',start:20,end:30}]).length,0));
check('空事件分母不伪造召回和F1',()=>{const empty=E.evaluate([],[],60);assert.equal(empty.recall,null);assert.equal(empty.precision,null);assert.equal(empty.f1,null);const no=E.run({scenario:'no-event'});assert.equal(no.metrics.model.truthCount,0);assert.equal(no.metrics.model.recall,null);});
check('改变评价真值不改变预测，改变评价',()=>{const data=E.generate(),train=data.groups.filter(g=>g.split==='train'),test=data.groups.filter(g=>g.split==='test'),model=E.fit(train.flatMap(g=>g.rows)),a=JSON.stringify(E.infer(test,model,normal.threshold));data.evaluationTruth.forEach(t=>{t.start=-999;t.end=-900;});assert.equal(JSON.stringify(E.infer(test,model,normal.threshold)),a);assert.notEqual(E.evaluate(normal.prediction.events,[],510).recall,normal.metrics.model.recall);});
check('验证选阈值不随本轮测试损失和仪表噪声变化',()=>{const small=E.run({severity:1,noise:4}),changed=E.run({scenario:'drift'});assert.equal(small.selection.threshold,normal.selection.threshold);assert.equal(changed.selection.threshold,normal.selection.threshold);assert.equal(JSON.stringify(small.model),JSON.stringify(normal.model));});
check('失败情景确实改变结果，无必胜约束',()=>{const tiny=E.run({severity:.4}),drift=E.run({scenario:'drift'}),outside=E.run({scenario:'outside'});assert.ok(tiny.metrics.baseline.recall<normal.metrics.baseline.recall);assert.ok(drift.metrics.model.fp>normal.metrics.model.fp);assert.ok(outside.metrics.model.fp>0);});
const report={sceneId:'t1',kind:'node-computation-checks-not-browser',checkedAt:new Date().toISOString(),passed:checks.length,failed:0,checks,defaultMetrics:normal.metrics,scenarios:Object.fromEntries(['normal','tiny','drift','outside','no-event'].map(s=>[s,E.run({scenario:s,severity:s==='tiny'?1.2:7}).metrics]))};
fs.writeFileSync(new URL('./computation-checks.json',import.meta.url),JSON.stringify(report,null,2));console.log(JSON.stringify(report,(k,v)=>k==='pairs'?undefined:v,2));
