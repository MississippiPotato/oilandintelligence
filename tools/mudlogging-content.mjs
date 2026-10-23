import fs from 'node:fs';import vm from 'node:vm';import path from 'node:path';
const root=path.resolve(import.meta.dirname,'..'),context=vm.createContext({});
for(const file of ['shared/mudlogging-diagrams.js','shared/mudlogging-knowledge.js'])vm.runInContext(fs.readFileSync(path.join(root,file),'utf8'),context);
export const knowledgeFor=scene=>JSON.parse(JSON.stringify(context.S17MudKnowledge[scene]));
export const knowledgeBundle=scene=>'globalThis.S17MudKnowledge='+JSON.stringify({[scene]:knowledgeFor(scene)})+';\n';
export function backgroundSections(scene,lesson){const k=knowledgeFor(scene),sections=k.sections.map((s,i)=>({no:i+1,...s}));
const diagrams=lesson.background.map((b,i)=>'<figure><h4>'+b.title+'</h4><div style="max-width:100%;overflow-x:auto"><div style="min-width:640px">'+(b.svg??b.html)+'</div></div><figcaption>'+b.caption+'</figcaption></figure>').join('');
sections.at(-1).html+='<details class="knowledge-supplement"><summary>补充图解：展开原有场景示意与概念图</summary><p>读完上面的知识后，可用这些图回看采集过程和概念关系。</p>'+diagrams+'</details>';return sections;}
