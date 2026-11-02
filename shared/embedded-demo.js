(function(g){
 'use strict';
 if(g===g.parent||g.S17EmbeddedDemo)return;
 const requested=new URLSearchParams(g.location.search).get('embed')==='demo'||g.location.href.startsWith('about:srcdoc');
 let enabled=false,lab=null,lastHeight=0,scheduled=false,resize=null,mutations=null,initialTab='',importedId='';
 const caseId=()=>importedId||g.S17Page?.caseId||g.CaseInspect?.snapshot?.()?.caseId||'';
 function sendHeight(){
  scheduled=false;if(!enabled||!lab)return;
  const rect=lab.getBoundingClientRect(),height=Math.ceil(Math.max(rect.height,lab.scrollHeight)+Math.max(0,rect.top+g.scrollY)+8);
  if(Math.abs(height-lastHeight)<3)return;lastHeight=height;
  g.parent.postMessage({type:'s17-demo-size',caseId:caseId(),height},'*');
 }
 function schedule(){if(!scheduled){scheduled=true;requestAnimationFrame(sendHeight);}}
 function enter(){
  if(enabled)return;
  const tabs=[...document.querySelectorAll('nav [data-tab], [data-fx-part], [data-part]')];
  const button=tabs.find(b=>['lab','demo'].includes(b.dataset.tab||b.dataset.fxPart||b.dataset.part));
  lab=document.getElementById('lab')||document.querySelector('[data-panel="demo"]');
  if(!lab)return;
  initialTab=button?.dataset.tab||button?.dataset.fxPart||button?.dataset.part||'lab';
  button?.click();lab.hidden=false;
  enabled=true;document.documentElement.dataset.s17Embedded='demo';
  const style=document.createElement('style');style.dataset.s17EmbedStyle='true';
  style.textContent='html[data-s17-embedded="demo"],html[data-s17-embedded="demo"] body{margin:0;min-height:0;height:auto;overflow-x:hidden;overflow-y:hidden;background:#f7f4ef}html[data-s17-embedded="demo"] [data-s17-embed-hide]{display:none!important}html[data-s17-embedded="demo"] [data-s17-embed-chain]{margin:0!important;padding:0!important;width:100%!important;max-width:none!important;min-height:0!important;border:0!important;box-shadow:none!important;border-radius:0!important}html[data-s17-embedded="demo"] [data-s17-embedded-lab]{margin:0!important;padding:16px!important;scroll-margin:0;min-height:0!important}html[data-s17-embedded="demo"] #s17-assistant{display:none!important}@media(max-width:600px){html[data-s17-embedded="demo"] [data-s17-embedded-lab]{padding:10px!important}}';
  document.head.append(style);lab.setAttribute('data-s17-embedded-lab','');
  let child=lab;
  for(let parent=child.parentElement;parent&&parent!==document.documentElement;parent=child.parentElement){
   parent.setAttribute('data-s17-embed-chain','');
   for(const sibling of parent.children)if(sibling!==child&&!['SCRIPT','STYLE','LINK'].includes(sibling.tagName)){
    sibling.setAttribute('data-s17-embed-hide','');
    // Continuous standalone lessons explicitly display their chapters with
    // !important. A local inline override keeps those rules out of the iframe.
    sibling.style.setProperty('display','none','important');
   }
   child=parent;
  }
  const settle=()=>{g.scrollTo({top:0,behavior:'instant'});schedule();};
  settle();requestAnimationFrame(settle);
  if(g.ResizeObserver){resize=new ResizeObserver(schedule);resize.observe(lab);}
  mutations=new MutationObserver(schedule);mutations.observe(lab,{childList:true,subtree:true,attributes:true,attributeFilter:['hidden','class','open']});
  document.addEventListener('load',schedule,true);g.addEventListener('resize',schedule);
  document.addEventListener('click',event=>{
   const button=event.target.closest('[data-part],[data-fx-part],[data-tab]');
   const part=button&&(button.dataset.part||button.dataset.fxPart||button.dataset.tab),tab={background:'bg',workflow:'flow'}[part];
   if(tab){event.preventDefault();event.stopImmediatePropagation();g.parent.postMessage({type:'s17-demo-tab',caseId:caseId(),tab},'*');}
  },true);
  // Keyboard events do not cross a sandbox boundary on their own.
  document.addEventListener('keydown',e=>{if((e.ctrlKey||e.metaKey)&&e.key.toLowerCase()==='k'){e.preventDefault();g.parent.postMessage({type:'s17-open-search'},'*');}});
  g.parent.postMessage({type:'s17-demo-ready',caseId:caseId(),mode:'lab-only'},'*');
 }
 function ready(){if(requested)enter();}
 g.addEventListener('message',e=>{if(e.source===g.parent&&e.data?.type==='s17-embed-demo'){if(typeof e.data.caseId==='string')importedId=e.data.caseId;enter();lastHeight=0;schedule();}});
 g.S17EmbeddedDemo={snapshot:()=>({enabled,caseId:caseId(),tab:initialTab,height:lastHeight})};
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',ready,{once:true});else ready();
})(window);
