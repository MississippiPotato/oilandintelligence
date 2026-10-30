import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';

export const ROOT = path.resolve(import.meta.dirname, '..');
export const REPORT = 'handoff/site-upgrade-2026-10-30';
export const SITE_VERSION = '1.12.0-preview';
export const VARIANTS = [
  {caseId:'s17x-g3-closure-spill', sceneId:'g3', stageId:'geology'},
  {caseId:'s17x-c1-cement-woc-strength', sceneId:'c1', stageId:'cementing'},
  {caseId:'s17x-co3-completion-seal-test', sceneId:'co3', stageId:'completion'},
  {caseId:'s17x-p1-perforation-depth-correlation', sceneId:'p1', stageId:'perforation'}
].map(c => ({...c, source:'case-variants/'+c.caseId, primary:false}));
export const PACKAGE_FILES = ['README.txt','case.json','demo/demo.css','demo/demo.js','demo/index.html'];
export const read = p => fs.readFileSync(path.join(ROOT,p),'utf8');
export const walk = p => fs.existsSync(path.join(ROOT,p)) ? fs.readdirSync(path.join(ROOT,p),{withFileTypes:true}).flatMap(e=>e.isDirectory()?walk(p+'/'+e.name):[p+'/'+e.name]).sort() : [];
export const record = p => {const b=fs.readFileSync(path.join(ROOT,p));return {path:p,bytes:b.length,sha256:crypto.createHash('sha256').update(b).digest('hex')};};
export function write(p, value) {fs.mkdirSync(path.dirname(path.join(ROOT,p)),{recursive:true});fs.writeFileSync(path.join(ROOT,p),typeof value==='string'?value:JSON.stringify(value,null,2));}
export function caseFolders() {return ['dist/cases','dist/expansion-cases'].flatMap(base=>fs.readdirSync(path.join(ROOT,base),{withFileTypes:true}).filter(e=>e.isDirectory()).map(e=>base+'/'+e.name)).sort();}
