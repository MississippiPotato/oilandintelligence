import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import {execFileSync} from 'node:child_process';
import {transformSync} from 'esbuild';

const root=path.resolve(import.meta.dirname,'..');process.chdir(root);
const report='handoff/companion-ui-2026-11-01',read=p=>fs.readFileSync(p,'utf8'),hash=b=>crypto.createHash('sha256').update(b).digest('hex');
const walk=p=>fs.readdirSync(p,{withFileTypes:true}).flatMap(e=>e.isDirectory()?walk(p+'/'+e.name):[p+'/'+e.name]);
const folders=['dist/cases','dist/expansion-cases'].flatMap(p=>fs.readdirSync(p,{withFileTypes:true}).filter(e=>e.isDirectory()).map(e=>p+'/'+e.name));
fs.mkdirSync(report,{recursive:true});
const write=(p,v)=>fs.writeFileSync(p,typeof v==='string'?v:JSON.stringify(v,null,2));
const prefix=p=>read(p).split('/* S17_OPTIONAL_ASSISTANT_START')[0];
if(process.argv.includes('--capture')){
 if(fs.existsSync(report+'/before.json'))throw Error('Initial record already exists; do not overwrite it');
 const protectedFiles=['portal-original','石油勘探开发智能化案例集','case-src','expansion-src','case-variants'].flatMap(walk);
 write(report+'/before.json',{capturedAt:new Date().toISOString(),gitStatus:execFileSync('git',['status','--short'],{encoding:'utf8'}),protected:protectedFiles.map(p=>({path:p,sha256:hash(fs.readFileSync(p))})),cases:folders.map(p=>({path:p,calculationSHA256:hash(prefix(p+'/demo/demo.js')),staticFiles:['case.json','README.txt','demo/index.html'].map(f=>({path:p+'/'+f,sha256:hash(fs.readFileSync(p+'/'+f))}))})),oldEntryCSS:read('shared/lesson-assistant-entry.css')});
 console.log('Captured current sources, teacher copies and all 65 calculation boundaries.');
 process.exit(0);
}
const before=JSON.parse(read(report+'/before.json'));
const assetPattern=/(<(?:script|link)\b[^>]*\b(?:src|href)=["'])(demo\.(?:js|css)(?:\?[^"']*)?)(["'])/g;
const assetBefore=report+'/asset-references-before.json';
if(!fs.existsSync(assetBefore))write(assetBefore,folders.map(p=>({path:p,refs:[...read(p+'/demo/index.html').matchAll(assetPattern)].map(m=>m[2])})));
const originalRefs=JSON.parse(read(assetBefore));
execFileSync(process.execPath,['tools/sync-assistant.mjs','--base=HEAD','--report='+report+'/assistant','--revision=0.8.0'],{stdio:'inherit',windowsHide:true});
for(const folder of folders){
 const p=folder+'/demo/demo.css';let css=read(p);
 for(const old of [before.oldEntryCSS,before.oldEntryCSS.replace(/\r?\n/g,'\n'),before.oldEntryCSS.replace(/\r?\n/g,'\r\n')])if(css.includes(old))css=css.replace(old,read('shared/lesson-assistant-entry.css'));
 write(p,css);
 const html=folder+'/demo/index.html';
 write(html,read(html).replace(assetPattern,(_,start,url,end)=>start+url.split('?')[0]+'?v=20261101-companion'+end));
}
const styles=JSON.parse(read('handoff/site-upgrade-2026-10-30/build-lock.json')).styles.sources.map(s=>s.path);
write('portal/assets/s17-portal.min.css',transformSync(styles.map(p=>'/* '+p+' */\n'+read(p)).join('\n'),{loader:'css',minify:true,charset:'utf8',target:'es2020',legalComments:'inline'}).code);
let html=read('portal/index.html');
html=html.replace(/<script\b[^>]*src=["'][^"']*s17-reading-position\.js[^"']*["'][^>]*>\s*<\/script>\s*/gi,'');
html=html.replace(/(<script[^>]*src=["']assets\/s17-reader\.js)/,'<script src="assets/s17-reading-position.js?v=20261101-companion" defer></script>\n$1');
html=html.replace(/((?:s17-assistant|s17-live2d-loader|s17-case-loader|s17-portal\.min)\.(?:js|css))\?v=[^"']+/g,'$1?v=20261101-companion');
write('portal/index.html',html);
const checks=[];
for(const c of before.cases){
 if(hash(prefix(c.path+'/demo/demo.js'))!==c.calculationSHA256)throw Error('Calculation prefix changed: '+c.path);
 for(const f of c.staticFiles){
  const refs=originalRefs.find(r=>r.path===c.path)?.refs||[];
  const value=f.path.endsWith('/index.html')?read(f.path).replace(assetPattern,(_,start,url,end)=>start+(refs.find(ref=>ref.split('?')[0]===url.split('?')[0])||url)+end):fs.readFileSync(f.path);
  if(hash(value)!==f.sha256)throw Error('Case metadata or HTML markup changed beyond local asset versions: '+f.path);
 }
 const files=walk(c.path);if(files.length!==5)throw Error('Case must retain five files');
 const bytes=files.reduce((n,p)=>n+fs.statSync(p).size,0);if(bytes>6*1024*1024)throw Error('Original import size exceeded');
 checks.push({caseId:JSON.parse(read(c.path+'/case.json')).id,path:c.path,calculationSHA256:c.calculationSHA256,calculationPrefixPreserved:true,caseMetadataPreserved:true,htmlMarkupPreserved:true,assetVersion:'20261101-companion',bytes,files:files.map(p=>({path:p,sha256:hash(fs.readFileSync(p))}))});
}
const changedProtected=before.protected.filter(f=>hash(fs.readFileSync(f.path))!==f.sha256);
if(changedProtected.length)throw Error('Professional source or teacher copy changed: '+changedProtected.map(f=>f.path).join(','));
write(report+'/build.json',{builtAt:new Date().toISOString(),sourceOnly:true,caseCount:checks.length,runtimeFiles:checks.length*5,protectedFiles:before.protected.length,changedProtected,cases:checks});
console.log(JSON.stringify({cases:checks.length,protectedFiles:before.protected.length,calculationPrefixesPreserved:true,sourceOnly:true}));
