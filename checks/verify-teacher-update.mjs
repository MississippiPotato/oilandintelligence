import fs from 'node:fs';import vm from 'node:vm';
import {read,write,walk,record,protectedCheck} from '../tools/teaching-map-contract.mjs';
import {caseFolders} from '../tools/site-upgrade-contract.mjs';
const REPORT='handoff/teacher-update-2026-11-02',checks=[];
const ok=(name,value,detail)=>{checks.push({name,passed:!!value,detail});if(!value)throw Error(name);};
const context={};context.window=context;vm.runInNewContext(read('shared/method-role.js'),context);
const roles=context.S17MethodRole.roles,folders=caseFolders();
ok('65 cases retain 325 five-file contract members',folders.length===65&&folders.every(p=>walk(p).length===5));
for(const folder of folders){
 const m=JSON.parse(read(folder+'/case.json'));
 ok('Method rationale and result reading: '+m.id,!!(roles[m.id]||roles[m.sceneId]));
 ok('Offline method explanation bundled: '+m.id,read(folder+'/demo/demo.js').includes('data-method-role'));
 new vm.Script(read(folder+'/demo/demo.js'));ok('Original 6 MiB limit: '+m.id,walk(folder).reduce((n,p)=>n+record(p).bytes,0)<=6*1024*1024);
}
ok('Teacher portal/calculation/data baseline unchanged',protectedCheck().length===0,protectedCheck());
const before=JSON.parse(read(REPORT+'/before.json'));
ok('Historical dated reports unchanged',before.historicalReports.every(f=>record(f.path).sha256===f.sha256));
const build=JSON.parse(read(REPORT+'/build-lock.json'));ok('Compiled portal assets match scoped build records',build.bootstrap.every(f=>record(f.path).sha256===f.sha256)&&record(build.styles.bundle.path).sha256===build.styles.bundle.sha256);
globalThis.window={};const {readArchive}=await import('../portal/assets/core/case-archive.js');
const file=name=>new File([fs.readFileSync(REPORT+'/fixtures/'+name+'.zip')],name+'.zip');
for(const [name,count]of [['single',1],['collection',2],['stored',1]]){const x=await readArchive(file(name));ok('ZIP decoding '+name,x.packages.length===count&&x.packages.every(p=>p.files.length===5&&!p.error));}
for(const name of ['traversal','missing','corrupt']){let message='';try{await readArchive(file(name));}catch(e){message=e.message;}ok('ZIP rejects '+name,!!message,message);}
const invalid=await readArchive(file('malformed'));ok('Malformed manifest remains a visible invalid case',!!invalid.packages[0].error);
const results={checkedAt:new Date().toISOString(),kind:'source_contract_and_archive_decoding_only',checks,passed:checks.length,failed:0};
write(REPORT+'/source-checks.json',results);
write(REPORT+'/runtime-lock.json',{createdAt:new Date().toISOString(),cases:folders.map(folder=>{const m=JSON.parse(read(folder+'/case.json'));return{id:m.id,scene:m.sceneId,version:m.version,folder,files:walk(folder).map(record)};})});
console.log(JSON.stringify({passed:checks.length,failed:0}));
