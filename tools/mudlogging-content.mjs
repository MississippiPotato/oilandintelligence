import fs from 'node:fs';import vm from 'node:vm';import path from 'node:path';
import {decorateKnowledge,studyRuntime} from './mudlogging-study-content.mjs';
const root=path.resolve(import.meta.dirname,'..'),context=vm.createContext({});
for(const file of ['shared/mudlogging-diagrams.js','shared/mudlogging-knowledge.js'])vm.runInContext(fs.readFileSync(path.join(root,file),'utf8'),context);
export const knowledgeFor=scene=>decorateKnowledge(scene,JSON.parse(JSON.stringify(context.S17MudKnowledge[scene])));
export const knowledgeBundle=scene=>studyRuntime+'\nglobalThis.S17MudKnowledge='+JSON.stringify({[scene]:knowledgeFor(scene)})+';\n';
export const portalKnowledgeBundle=()=>studyRuntime+'\nglobalThis.S17MudKnowledge='+JSON.stringify(Object.fromEntries(['m1','m2','m3','m4','m5'].map(s=>[s,knowledgeFor(s)])))+';\n';
export function backgroundSections(scene,lesson){const k=knowledgeFor(scene),sections=k.sections.map((s,i)=>({no:i+1,...s}));
return sections;}
