import fs from 'node:fs';
import vm from 'node:vm';
const root=new URL('../',import.meta.url);
export function d1Calculation(){
 const c=vm.createContext({});
 for(const p of ['shared/teaching-figures.js','expansion-src/d1/engine.js'])vm.runInContext(fs.readFileSync(new URL(p,root),'utf8'),c);
 const p={preset:'default',constrain:true,wob:90,rpm:120,flow:26,ucs:60,noise:2,maxWob:125,maxRpm:170,maxFlow:32,maxPressure:19.5,maxTorque:9},r=c.D1Engine.run(p);
 return c.S17TeachFigures.regression('一组实际工况怎样算出钻速',c.S17TeachFigures.d1Names,c.D1Engine.features(r.current),r.trained.model.scaler,r.trained.model.coef,'m/h')+'<p>输入：钻压90 kN、转速120 r/min、流量26 L/s、岩石强度60 MPa。相同计算在演示中随输入更新。</p>';
}
