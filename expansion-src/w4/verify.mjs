import fs from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';
const ctx=vm.createContext({});vm.runInContext(fs.readFileSync(new URL('engine.js',import.meta.url),'utf8'),ctx);const E=ctx.W4Engine;
const checks=[];function check(name,fn){fn();checks.push({name,status:'passed'});}
const p={preset:'default',noise:1,mode:'all',k:'auto',reject:true,support:.6};const result=E.run(p);
check('手算混淆、拒判分母与全拒判',()=>{const m=E.classification([0,0,1,2],[0,-1,1,0]);assert.equal(m.n,4);assert.equal(m.coverage,.75);assert.equal(m.accuracy,.5);assert.equal(m.confusion[0][3],1);assert.equal(m.perClass[0].f1,.5);const reject=E.classification([0,1,2],[-1,-1,-1]);assert.equal(reject.coverage,0);assert.equal(reject.acceptedError,null);assert.equal(reject.macroF1,0);assert.equal(E.classification([],[]).macroF1,null);});
check('整井切分且测试分母保留全部深度点',()=>{const ids=[...result.trained.groups.train,...result.trained.groups.validation,...result.test.groups];assert.equal(new Set(ids).size,10);assert.equal(result.metrics.model.n,320);assert.equal(result.metrics.baseline.n,320);});
check('标准化仅由训练井拟合',()=>{const xs=E.dataset('train').observations.map(o=>E.feature(o));assert.equal(JSON.stringify(E.fitScale(xs)),JSON.stringify(result.trained.model.scaler));});
check('改变测试真值不会改变预测',()=>{const before=JSON.stringify(E.infer(result.trained,result.test.observations,p));const truth={labels:result.test.evaluationTruth.labels.map(v=>(v+1)%3)};assert.equal(JSON.stringify(E.infer(result.trained,result.test.observations,p)),before);assert.notEqual(E.evaluate(result.predictions,truth).model.accuracy,result.metrics.model.accuracy);});
check('固定种子复现与实际通道消融',()=>{assert.equal(JSON.stringify(E.run(p).metrics),JSON.stringify(result.metrics));const gr=E.run({...p,mode:'gr'});assert.equal(gr.trained.model.channels.length,1);assert.notEqual(JSON.stringify(gr.predictions.map(v=>v.label)),JSON.stringify(result.predictions.map(v=>v.label)));});
check('域外与气层预设真实改变观测',()=>{const domain=E.run({...p,preset:'domain'}),gas=E.run({...p,preset:'gas'});assert.notEqual(JSON.stringify(domain.test.observations),JSON.stringify(result.test.observations));assert.ok(domain.metrics.model.accuracy<result.metrics.model.accuracy);assert.notEqual(JSON.stringify(gas.test.observations),JSON.stringify(result.test.observations));});
const report={sceneId:E.SCENE,kind:'calculation_checks_not_browser_acceptance',checks,metrics:result.metrics,validation:result.trained.trials,baselineRules:result.trained.rules};
fs.writeFileSync(new URL('calculation-checks.json',import.meta.url),JSON.stringify(report,null,2));console.log(JSON.stringify(report,null,2));
