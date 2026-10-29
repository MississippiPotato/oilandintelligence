import fs from 'node:fs';import path from 'node:path';import vm from 'node:vm';
import {ROOT,read} from './interactive-course-contract.mjs';
export function conceptPath(scene){return (scene.startsWith('m')?'case-src/':'expansion-src/')+scene+'/concept.js';}
export function conceptFor(scene,{required=false}={}){
 const file=conceptPath(scene);if(!fs.existsSync(path.join(ROOT,file))){if(required)throw Error('Missing knowledge interaction '+scene);return null;}
 const context=vm.createContext({console});vm.runInContext(read(file),context,{filename:file});const definition=context.S17Concepts?.[scene];
 if(!definition||typeof definition.mount!=='function')throw Error('Invalid interaction registration '+scene);
 for(const part of ['background','workflow']){const html=definition[part+'HTML']??'';if(/<script\b|\bon\w+\s*=|javascript\s*:/i.test(html))throw Error('Executable manifest markup '+scene+'/'+part);if(/<(?:img|image|iframe|script|link)\b[^>]*(?:src|href)\s*=\s*["']https?:/i.test(html))throw Error('Remote knowledge asset '+scene+'/'+part);}
 const readable=html=>(html??'').replace(/<svg\b[^>]*>/gi,tag=>{const width=Number(tag.match(/viewBox=["']\s*[\d.-]+\s+[\d.-]+\s+([\d.]+)/i)?.[1]);if(!width)return tag;const extra='min-width:'+width+'px;height:auto;max-height:none';return /\bstyle=["']/i.test(tag)?tag.replace(/\bstyle=(["'])(.*?)\1/i,(_,q,style)=>'style='+q+style+';'+extra+q):tag.replace(/>$/,' style="'+extra+'">');});
 return {...definition,backgroundHTML:readable(definition.backgroundHTML),workflowHTML:readable(definition.workflowHTML),file};
}
export const conceptCSS=()=>read('shared/concept-interactions.css');
export const conceptHostRuntime=()=>read('shared/concept-host.js');
export function conceptScripts(scenes){return scenes.filter(s=>fs.existsSync(path.join(ROOT,conceptPath(s)))).map(s=>read(conceptPath(s))).join('\n');}
export function appendConcept(sections,definition,part){if(!definition?.[part+'HTML'])return sections;const index=Math.max(0,Math.min(sections.length-1,Number(definition[part+'After'])||0));return sections.map((s,i)=>i===index?{...s,html:(s.html??s.body??'')+definition[part+'HTML']}:s);}
