import {read} from './expansion-lesson-contract.mjs';
import {profiles} from './expansion-lesson-profiles.mjs';
export const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const text=s=>String(s||'').replace(/<svg\b[\s\S]*?<\/svg>/gi,'').replace(/<[^>]*>/g,' ').replace(/\s+/g,' ').trim();
// Only release metadata is rewritten in the assembled copy. Original engine/app sources stay byte identical.
export function versionedScript(code,version){return code.replace(/(\bcaseVersion\s*:\s*)(['"])\d+\.\d+\.\d+\2/g,(_,prefix)=>prefix+JSON.stringify(version)).replace(/(["']version["']\s*:\s*)(['"])\d+\.\d+\.\d+\2/g,(_,prefix)=>prefix+JSON.stringify(version));}
export function lessonContent(manifest){
 const p=profiles[manifest.sceneId];if(!p)throw new Error('Missing editorial profile '+manifest.sceneId);
 const style='<style>'+read('shared/expansion-lessons.css')+'</style>';
 const sections=manifest.tabs.background.sections.map((s,i)=>({...s,html:(i===0?style:'')+'<div class="xl-knowledge">'+(p.reading[i]?'<p class="xl-read"><b>看图时留意</b>'+esc(p.reading[i])+'</p>':'')+(s.html||s.body||'')+'</div>'}));
 const opening='<div class="xl-opening"><span class="xl-kicker">认识问题 · 再看方法</span><h2>'+esc(p.insight)+'</h2><p>从'+esc(p.object)+'出发，把专业含义、图中位置和计算结果连起来。</p><div class="xl-reading-path">'+sections.slice(0,3).map((s,i)=>'<a href="#xl-chapter-'+i+'" data-xl-chapter="'+i+'"><span>0'+(i+1)+'</span>'+esc(s.title.replace(/^图\s*B\d+[｜|]\s*/,''))+'</a>').join('')+'</div></div>';
 const background=opening+sections.map((s,i)=>'<article class="xl-chapter" id="xl-chapter-'+i+'"><span class="xl-kicker">'+String(i+1).padStart(2,'0')+' / '+esc(i<3?'专业知识':'继续阅读')+'</span><h2>'+esc(s.title.replace(/^图\s*B\d+[｜|]\s*/,''))+'</h2>'+s.html+'</article>').join('')+'<div class="xl-next"><button type="button" data-xl-tab="workflow">这些观测怎样进入方法 →</button></div>';
 return{...p,sections,opening,background};
}
export function workflowContent(manifest,chart){
 const w=manifest.tabs.workflow,steps=w.steps,source=w.metrics?.html||'';
 const figures=[...source.matchAll(/<figure\b[\s\S]*?<\/figure>/gi)].map(x=>x[0]);
 const svgs=[...source.matchAll(/<svg\b[\s\S]*?<\/svg>/gi)].map(x=>'<figure>'+x[0]+'</figure>');
 const tables=[...source.matchAll(/<div\b[^>]*class=["'][^"']*table-scroll[^"']*["'][^>]*>\s*<table\b[\s\S]*?<\/table>\s*<\/div>/gi)].map(x=>x[0]);
 const illustrations=figures.length>=steps.length?figures:svgs.length>=steps.length?svgs:tables;
 const body=steps.map((s,i)=>'<article class="xl-method-step" id="xl-method-'+i+'" data-xl-panel="'+i+'"><div class="xl-step-heading"><span class="xl-kicker">'+String(i+1).padStart(2,'0')+' / '+steps.length+'</span><h3>'+esc(s.name)+'</h3></div><div class="xl-action-copy"><b>输入与动作</b><p>'+s.do+'</p></div>'+(illustrations[i]||'')+'<div class="xl-products"><div><b>得到什么</b><p>'+s.effect+'</p></div><div><b>理解这一步</b><p>'+s.trap+'</p></div></div></article>').join('');
 return '<div class="xl-method"><div class="xl-opening"><span class="xl-kicker">沿着资料走一遍</span><h2>'+esc(w.title||manifest.title)+'</h2><p>图中的分支对应方法和基线；下面每一步都说明输入、动作与产物，进入演示后可改变条件查看实际数值。</p></div>'+chart+'<div class="xl-step-nav" role="tablist" aria-label="方法步骤">'+steps.map((s,i)=>'<button type="button" role="tab" aria-selected="'+(i===0)+'" aria-controls="xl-method-'+i+'" data-xl-step="'+i+'">'+String(i+1).padStart(2,'0')+' '+esc(s.name)+'</button>').join('')+'</div>'+body+'<div class="xl-next"><button type="button" data-xl-tab="lab">用当前数据检验这条流程 →</button></div></div>';
}
export function knowledgeMarkdown(m,p){
 const chapters=m.tabs.background.sections;
 const links=[...new Set([...JSON.stringify(m).matchAll(/https?:[^\s"<>\\]+/g)].map(x=>x[0].replace(/[),.;]+$/,'')))];
 return '# '+m.title+'\n\n本轮只整理已有专业内容与图表，计算引擎、控制器和观测数据沿用原实现。\n\n## 核心认识\n\n'+p.insight+'\n\n## 阅读对象\n\n'+p.object+'。\n\n## 专业知识与图文对应\n\n'+chapters.map((s,i)=>'### '+(i+1)+' · '+s.title+'\n\n'+[...(s.html||s.body||'').matchAll(/<p\b[^>]*>([\s\S]*?)<\/p>/g)].map(x=>text(x[1])).join('\n\n')+(p.reading[i]?'\n\n**图支持的认识：** '+p.reading[i]:'')+'\n').join('\n')+'\n## 可操作的比较\n\n'+p.tasks.map(t=>'### '+t.label+'\n\n修改已有控件：`'+JSON.stringify(t.values)+'`。\n\n观察：'+t.look+'\n').join('\n')+'\n## 流程的输入与产物\n\n'+m.tabs.workflow.steps.map((s,i)=>`${i+1}. **${s.name}**：${text(s.do)} 得到：${text(s.effect)}\n`).join('\n')+'\n## 沿用的专业与方法来源\n\n'+links.map(u=>'- '+u).join('\n')+'\n\n来源沿用本例原有资料；本稿是本轮的内容组织记录，不冒称新增外部专业审稿。\n';
}
