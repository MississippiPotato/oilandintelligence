import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import assert from 'node:assert/strict';
import {fileURLToPath} from 'node:url';

// A source-only regression check. It does not build or open a browser.
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'../..');
const context=vm.createContext({});
for(const file of ['shared/math.js','case-src/m5/engine.js','case-src/m5/data.js']){
  vm.runInContext(fs.readFileSync(path.join(root,file),'utf8'),context,{filename:file});
}
const C=context.M5Core,library=C.train(),results=[];
const plain=value=>JSON.parse(JSON.stringify(value));
function check(name,text,verify){
  const result=C.infer(library.model,text,{margin:library.chosen.margin,sourceVersion:7});
  result.facts.forEach((fact,index)=>{
    const reference=result.claims[index].sourceRefs[0];
    assert.equal(text.slice(fact.sourceSpanStart,fact.sourceSpanEnd),fact.rawQuote,'original quote offsets');
    assert.equal(reference.sourceVersion,7,'source version retained');
    assert.equal(text.slice(reference.selector.start,reference.selector.end),fact.rawQuote,'claim selector offsets');
  });
  verify(result);
  results.push({name,status:'passed',text,facts:plain(result.facts.map(f=>({quote:f.rawQuote,fields:f.fields,flags:f.flags}))),support:result.claims.map(c=>c.supportStatus)});
}
for(const phrase of ['未见荧光','未见明显荧光','未发现荧光','未检出荧光','未观察到明显的荧光','无荧光']){
  check('explicit fluorescence negative: '+phrase,'1200–1210 m MD：'+phrase+'。',r=>{
    assert.equal(r.facts.length,1);assert.equal(r.facts[0].fields.negation,true);assert.equal(r.facts[0].flags.length,0);
  });
}
check('negative scope stays in first comma clause','1200–1210 m MD：未检出荧光，但气测总气升高至3.2 ppmv。',r=>{
  assert.equal(r.facts.length,2);assert.equal(r.facts[0].fields.negation,true);assert.equal(r.facts[1].fields.negation,false);
  assert.equal(r.facts[1].fields.gasUnit,'ppmv');assert.deepEqual(plain(r.facts[1].fields.depthRangeMD_m),[1200,1210]);
});
check('reverse negative scope','1200–1210 m MD：总气升高至3.2 ppmv，但未观察到荧光。',r=>{
  assert.equal(r.facts[0].fields.negation,false);assert.equal(r.facts[1].fields.negation,true);
});
check('gas negative retains own target','1200–1210 m MD：未观察到总气明显升高。',r=>assert.equal(r.facts[0].fields.negation,true));
check('mixed unseparated targets require review','1200–1210 m MD：未检出荧光但总气升高。',r=>{
  assert(r.facts[0].flags.some(v=>v.includes('否定作用域')));assert.equal(r.claims[0].supportStatus,'unchecked');
});
check('unsupported negative phrase requires review','1200–1210 m MD：不见明显荧光。',r=>{
  assert(r.facts[0].flags.some(v=>v.includes('否定表达')));assert.equal(r.claims[0].supportStatus,'unchecked');
});
for(const unit of ['ppmv','ppm','%','归一化单位']){
  check('whole gas unit: '+unit,'1200–1210 m MD：总气升高至3.2 '+unit+'。',r=>{
    assert.equal(r.facts[0].fields.gasValue,3.2);assert.equal(r.facts[0].fields.gasUnit,unit);
  });
}
check('unknown unit extension is not truncated','1200–1210 m MD：总气升高至3.2 ppmv_extra。',r=>{
  assert.equal(r.facts[0].fields.gasUnit,null);assert(r.facts[0].flags.some(v=>v.includes('单位')));
});
check('multiple ranges stay ambiguous','1200–1210 m MD与1220–1230 m MD：未检出荧光。',r=>{
  assert.equal(r.facts[0].fields.depthRangeMD_m,null);assert(r.facts[0].flags.some(v=>v.includes('多个范围')));
});
check('negative-positive same depth remains a conflict','1200–1210 m MD：未观察到荧光。1200–1210 m MD：可见荧光。',r=>{
  assert.equal(r.conflicts.length,1);assert.equal(r.conflicts[0].kind,'fluorescence_negation_conflict');
});
const builtIn=[];
for(const name of ['default','negation','conflict']){
  const fixture=context.M5Data.fixture(name),inference=C.infer(library.model,fixture.text,{margin:library.chosen.margin}),fields=C.evaluateFields(inference,fixture.evaluationTruth);
  assert.equal(fields.exactRecords,fields.totalRecords,name+' built-in exact fields');
  assert.equal(inference.conflicts.length,fixture.expectedConflictPairs,name+' expected conflicts');
  builtIn.push({name,exactRecords:fields.exactRecords,totalRecords:fields.totalRecords,conflicts:inference.conflicts.length});
}
console.log(JSON.stringify({status:'passed',verification:'source_node_vm_not_browser',fixtureCount:results.length,builtInCount:builtIn.length,results,builtIn},null,2));
