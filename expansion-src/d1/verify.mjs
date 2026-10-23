import fs from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';
const ctx=vm.createContext({});vm.runInContext(fs.readFileSync(new URL('engine.js',import.meta.url),'utf8'),ctx);const E=ctx.D1Engine;
const checks=[];function check(name,fn){fn();checks.push({name,status:'passed'});}
const p={preset:'default',wob:90,rpm:120,flow:26,ucs:60,noise:2,maxWob:125,maxRpm:170,maxFlow:32,maxPressure:19.5,maxTorque:9,constrain:true};
const result=E.run(p);
check('手算回归指标与空分母',()=>{const m=E.regression([1,5],[3,3]);assert.equal(m.mae,2);assert.equal(m.rmse,2);assert.equal(m.bias,0);assert.equal(E.regression([],[]).rmse,null);});
check('整井训练、验证、测试不重叠',()=>{const splits=[...result.trained.groups.train,...result.trained.groups.validation,...result.test.groups];assert.equal(new Set(splits).size,13);assert.equal(result.metrics.model.n,128);});
check('标准化由训练样本独立拟合',()=>{const x=E.dataset('train').observations.map(E.features);const scale=E.fitScale(x);assert.equal(JSON.stringify(scale),JSON.stringify(result.trained.model.scaler));});
check('预测与寻优不接收评价真值',()=>{const before=JSON.stringify(E.infer(result.trained,result.test.observations));const plan=JSON.stringify(E.search(result.trained,p));const changed={rop:result.test.evaluationTruth.rop.map(v=>v+100)};assert.equal(JSON.stringify(E.infer(result.trained,result.test.observations)),before);assert.equal(JSON.stringify(E.search(result.trained,p)),plan);assert.ok(E.evaluate(result.predictions,changed).model.rmse>90);});
check('推荐点满足全部启用约束',()=>{assert.ok(result.recommendation);assert.equal(result.recommendation.reasons.length,0);assert.equal(result.grid.total,2145);assert.ok(result.grid.feasibleCount>0&&result.grid.feasibleCount<result.grid.total);});
check('无可行候选显式保留空结果',()=>{const g=E.search(result.trained,{...p,maxPressure:8,maxTorque:4,maxFlow:18,maxWob:40,maxRpm:60});assert.equal(g.recommended,null);assert.equal(g.admittedCount,0);});
check('固定种子复现且域外预设真实改变误差',()=>{const again=E.run(p),domain=E.run({...p,preset:'domain'});assert.equal(JSON.stringify(again.metrics),JSON.stringify(result.metrics));assert.ok(domain.metrics.model.rmse>result.metrics.model.rmse+5);assert.ok(domain.metrics.outsideCount>0);});
const report={sceneId:E.SCENE,kind:'calculation_checks_not_browser_acceptance',checks,metrics:result.metrics,grid:{total:result.grid.total,feasible:result.grid.feasibleCount},validation:result.trained.trials};
fs.writeFileSync(new URL('calculation-checks.json',import.meta.url),JSON.stringify(report,null,2));console.log(JSON.stringify(report,null,2));
