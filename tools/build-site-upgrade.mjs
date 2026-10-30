import fs from 'node:fs';
import vm from 'node:vm';
import {transformSync} from 'esbuild';
import {ROOT,REPORT,SITE_VERSION,write,read,walk,record,caseFolders} from './site-upgrade-contract.mjs';
import {buildFour} from './build-four-exhibits.mjs';
import {buildM2} from './build-m2-exhibit.mjs';
import {buildExpansions} from './build-expansion.mjs';
import {buildCaseVariants} from './build-case-variants.mjs';

process.chdir(ROOT);
fs.mkdirSync(REPORT,{recursive:true});
const before=JSON.parse(read(REPORT+'/before.json'));
for(const f of before.protectedFiles)if(record(f.path).sha256!==f.sha256)throw Error('Protected source changed before build: '+f.path);
// Legacy source compilers still create the self-contained five-file exports.
// Their old eager portal bundles are intentionally not emitted in this release.
buildFour({version:'1.9.0',reportDir:REPORT,updated:'2026-10-30'});
buildM2({version:'1.9.0',reportDir:REPORT,updated:'2026-10-30',emitPortalKnowledge:false});
const expanded=buildExpansions({requireAll:true,destination:REPORT+'/original-expansion',lessons:true,emitPortalPlugin:false});
if(expanded.failed)throw Error('An original expansion source failed');
buildCaseVariants();
const {buildLazyPortal}=await import('./build-lazy-portal.mjs');
await buildLazyPortal({reportDir:REPORT});
const {buildMudlogging3D}=await import('./build-mudlogging-3d.mjs');
await buildMudlogging3D({reportDir:REPORT});
// Preserve any concurrently added assistant configuration/stream scripts in the current index.
let html=read('portal/index.html');
// Minify copies of the original framework; its protected source files remain byte-identical.
const compact=[['assets/data.js','assets/s17-data.min.js'],['assets/core/case-upload.js','assets/s17-case-import.min.js'],['assets/core/shell.js','assets/s17-shell.min.js'],['assets/core/admin.js','assets/s17-admin.min.js']];
for(const [source,output] of compact){write('portal/'+output,transformSync(read('portal/'+source),{minify:true,charset:'utf8',legalComments:'inline',target:'es2020'}).code);html=html.replaceAll('src="'+source,'src="'+output);}
if(!html.includes('as="image" href="assets/themes/theme-well-v1.webp"'))html=html.replace('</head>','<link rel="preload" as="image" href="assets/themes/theme-well-v1.webp" fetchpriority="high">\n</head>');
const eager=['s17-expansion-cases.js','s17-mudlogging-knowledge.js','welllog-layer.case.js','welllog-layer.demo.js','s17-welllog-demo.min.js','pixi-6.5.10.min.js','live2dcubismcore.min.js','pixi-live2d-0.4.0.min.js','s17-live2d-data.js','s17-live2d.js'];
html=html.replace(/<script\b[^>]*\bsrc=["']([^"']+)["'][^>]*>\s*<\/script>/gi,(tag,src)=>eager.includes(src.split('?')[0].split('/').at(-1))?'':tag);
for(const name of ['s17-case-loader.js','s17-case-catalog.js','s17-search.js','s17-upgrade-nav.js','s17-mudlogging-stage.js','s17-live2d-loader.js'])html=html.replace(new RegExp('<script\\b[^>]*src=["\'][^"\']*'+name.replaceAll('.','\\.')+'[^"\']*["\'][^>]*>\\s*</script>','gi'),'');
const kit=html.match(/<script\b[^>]*src=["']assets\/core\/kit\.js[^"']*["'][^>]*>\s*<\/script>/i)?.[0];
if(!kit)throw Error('Original kit script missing');
html=html.replace(kit,kit+'\n<script src="assets/s17-case-loader.js?v='+SITE_VERSION+'"></script>\n<script src="assets/s17-case-catalog.js?v='+SITE_VERSION+'"></script>');
html=html.replace('</body>',['s17-search.js','s17-upgrade-nav.js','s17-mudlogging-stage.js','s17-live2d-loader.js'].map(p=>'<script src="assets/'+p+'?v='+SITE_VERSION+'"></script>').join('\n')+'\n</body>');
for(const file of ['s17-lazy.css','s17-search.css','s17-upgrade.css','s17-mudlogging-stage.css']){
 const re=new RegExp('<link\\b[^>]*href=["\'][^"\']*'+file.replaceAll('.','\\.')+'[^"\']*["\'][^>]*>','gi');html=html.replace(re,'');
 html=html.replace('</head>','<link rel="stylesheet" href="assets/'+file+'?v='+SITE_VERSION+'">\n</head>');
}
// One minified stylesheet removes sequential cold-network connection waves.
// The protected teacher sources and the case-specific standalone CSS stay intact.
const styles=['portal/assets/core/tokens.css','portal/assets/core/layout.css','portal/assets/core/ui.css','portal/assets/s17.css','portal/assets/s17-field-atlas.css','portal/assets/s17-reader.css','portal/assets/s17-catalog.css','portal/assets/s17-log-preview.css','portal/assets/s17-visual-polish.css','portal/assets/s17-expansion-gallery.css','portal/assets/s17-assistant.css','portal/assets/s17-overview.css','shared/lesson-assistant-entry.css','shared/concept-interactions.css','shared/course-theme.css','shared/course-compass.css','portal/assets/s17-study.css','portal/assets/s17-lazy.css','portal/assets/s17-search.css','portal/assets/s17-upgrade.css','portal/assets/s17-mudlogging-stage.css'];
const stylesheet=styles.map(p=>{const css=read(p);if(/url\s*\(/i.test(css))throw Error('Rebase stylesheet URLs before combining: '+p);return '/* '+p+' */\n'+css;}).join('\n');
write('portal/assets/s17-portal.min.css',transformSync(stylesheet,{loader:'css',minify:true,charset:'utf8',legalComments:'inline',target:'es2020'}).code);
html=html.replace(/<link\b[^>]*rel=["']stylesheet["'][^>]*>/gi,'');
html=html.replace('</head>','<link rel="stylesheet" href="assets/s17-portal.min.css?v='+SITE_VERSION+'">\n</head>');
html=html.replace(/<script\b([^>]*\bsrc=["'][^"']+["'][^>]*)>/gi,(_,attrs)=>'<script'+attrs.replace(/\s+(?:defer|async)(?:=["'][^"']*["'])?/g,'')+' defer>');
html=html.replace(/(<meta name="description" content=")[^"]+/, '$1'+ '65个石油智能化教学案例，覆盖13个作业阶段与61个专业场景。录井3D导览、知识检索和可交互图表，纯前端离线运行。');
write('portal/index.html',html);
const scripts=[...html.replace(/<!--[\s\S]*?-->/g,'').matchAll(/<script\b[^>]*\bsrc=["']([^"']+)["']/gi)].map(m=>'portal/'+m[1].split('?')[0]).map(p=>p.replace('portal/../',''));
const folders=caseFolders();
const cases=folders.map(folder=>{const p=JSON.parse(read(folder+'/case.json'));return {id:p.id,scene:p.sceneId,version:p.version,files:walk(folder).map(record)};});
if(cases.length!==65||new Set(cases.map(c=>c.id)).size!==65||new Set(cases.map(c=>c.scene)).size!==61)throw Error('Expected 65 implementations across original 61 scenes');
for(const p of scripts)new vm.Script(read(p),{filename:p});
write(REPORT+'/build-lock.json',{builtAt:new Date().toISOString(),siteVersion:SITE_VERSION,caseCount:65,sceneCount:61,runtimeFiles:cases.flatMap(c=>c.files).length,cases,bootstrap:scripts.map(record),bootstrapJSBytes:scripts.reduce((n,p)=>n+record(p).bytes,0),styles:{sources:styles.map(record),bundle:record('portal/assets/s17-portal.min.css')},sourceOnlyBuild:true});
console.log(JSON.stringify({siteVersion:SITE_VERSION,cases:65,scenes:61,bootstrapJSBytes:scripts.reduce((n,p)=>n+record(p).bytes,0)}));
