import fs from 'node:fs';
import vm from 'node:vm';
import {execFileSync} from 'node:child_process';
import {ROOT,read,walk,record} from './teaching-map-contract.mjs';
process.chdir(ROOT);
const REPORT='handoff/home-process-2026-11-03';
const source=JSON.parse(read(REPORT+'/source-checks.json'));
const browser=JSON.parse(read(REPORT+'/browser.json'));
if(source.failed||browser.failed)throw Error('Resolve failed checks before packaging');
const before=JSON.parse(read(REPORT+'/before.json'));
for(const [p,sha]of Object.entries(before.protected))if(record(p).sha256!==sha)throw Error('Protected file changed: '+p);
const box={};box.window=box;vm.runInNewContext(read('portal/assets/s17-case-catalog.js'),box);
const chunks=new Set([...box.S17CaseCatalog.cases,...box.S17CaseCatalog.teacherCases].map(c=>'portal/'+c.contentURL));
const unused=p=>/\/s17-(?:expansion-cases|mudlogging-knowledge)\.js$/.test(p)||p.includes('/vendor/three-r180/')||(p.includes('/case-content/')&&!chunks.has(p));
const files=[...new Set(['index.html','.nojekyll','README.md',...walk('portal').filter(p=>!unused(p)),...walk('portal-original'),...walk('shared'),...walk('data/real'),...Object.keys(before.protected).filter(p=>/^dist\/(cases|expansion-cases)\//.test(p)),...walk(REPORT).filter(p=>!p.endsWith('/package-lock.json')&&!p.endsWith('/publication.json')),...walk('output/playwright/home-process-2026-11-03')])];
const out='dist/s17-site-home-process-2026-11-03-offline.zip';
const python=`import sys,json,zipfile,hashlib,os
root,out=sys.argv[1:3];files=json.loads(sys.stdin.buffer.read().decode('utf8'))
with zipfile.ZipFile(os.path.join(root,out),'w',zipfile.ZIP_DEFLATED,compresslevel=6) as z:
 for p in files:z.write(os.path.join(root,p),p)
with zipfile.ZipFile(os.path.join(root,out)) as z:
 assert z.testzip() is None
 for p in files:assert hashlib.sha256(z.read(p)).digest()==hashlib.sha256(open(os.path.join(root,p),'rb').read()).digest()
print(len(files))`;
const members=Number(execFileSync('python',['-X','utf8','-c',python,ROOT,out],{input:JSON.stringify(files),encoding:'utf8',windowsHide:true}).trim());
const result={createdAt:new Date().toISOString(),...record(out),members,scope:'Homepage process panorama plus original 65 cases and teacher portal. Existing case engines were not rebuilt.',crcAndAllMemberHashesVerified:true,browserFileURLTest:'Not performed: browser tool disallows file URLs. Loaded-page offline interaction tested separately.'};
fs.writeFileSync(REPORT+'/package-lock.json',JSON.stringify(result,null,2));
console.log(JSON.stringify(result,null,2));
