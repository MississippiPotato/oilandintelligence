import fs from 'node:fs';
import path from 'node:path';
export const CASE_VERSION='1.4.0';
const root=path.resolve(import.meta.dirname,'..');
const read=p=>fs.readFileSync(path.join(root,p),'utf8');
export function casePageConfig(sceneId){return 'window.S17Page='+JSON.stringify({sceneId,caseVersion:CASE_VERSION,portalHref:'../../../../portal/index.html',referenceHref:'../../../../portal/reference/fluorescence.html'})+';\n';}
export function assistantJS(){return '\n/* S17_OPTIONAL_ASSISTANT_START: isolated from case inference and evaluation */\n(function(){function startAssistant(){\n'+['portal/assets/s17-assistant.js','portal/assets/s17-media.js','portal/assets/s17-volcengine.js'].map(read).join('\n')+'\n}if(document.readyState===\'loading\')document.addEventListener(\'DOMContentLoaded\',startAssistant,{once:true});else startAssistant();})();\n';}
export function assistantCSS({readability=true}={}){return (readability?'\n'+read('shared/readability.css'):'')+'\n'+read('portal/assets/s17-assistant.css');}
