import fs from 'node:fs';import path from 'node:path';import vm from 'node:vm';import crypto from 'node:crypto';
const root=path.resolve(import.meta.dirname,'..'),ctx=vm.createContext({});
for(const p of ['shared/math.js','case-src/m4/engine.js'])vm.runInContext(fs.readFileSync(path.join(root,p),'utf8'),ctx);
fs.mkdirSync(path.join(root,'handoff/assistant-ui-2026-10-23'),{recursive:true});
const observed=ctx.M4Core.generate(17,{},'DEMO-017').observations;
const data={wellId:observed.wellId,datasetId:observed.datasetId,dataNature:observed.dataNature,seed:17,source:'M4Core.generate(17).observations; only observed drilling fields',columns:['depthMD_m','ROP_m_h','WOB_kN','RPM','active'],rows:observed.rows.map(r=>[r.depthMD_m,r.ROP_m_h,r.WOB_kN,r.RPM,r.active])};
fs.writeFileSync(path.join(root,'portal/assets/s17-log-data.js'),'window.S17LogData='+JSON.stringify(data)+';\n');
fs.writeFileSync(path.join(root,'handoff/assistant-ui-2026-10-23/log-data-provenance.json'),JSON.stringify({createdAt:new Date().toISOString(),source:data.source,wellId:data.wellId,datasetId:data.datasetId,dataNature:data.dataNature,rows:data.rows.length,onlyObservations:true,sourceFiles:['shared/math.js','case-src/m4/engine.js'].map(p=>({path:p,sha256:crypto.createHash('sha256').update(fs.readFileSync(path.join(root,p))).digest('hex')}))},null,2));

fs.writeFileSync(path.join(root,'portal/assets/s17-mudlogging-knowledge.js'),['shared/mudlogging-diagrams.js','shared/mudlogging-knowledge.js'].map(p=>fs.readFileSync(path.join(root,p),'utf8')).join('\n'));
