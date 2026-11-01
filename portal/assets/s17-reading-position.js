(function(g){
 'use strict';
 if(g.S17ReadingPosition)return;
 const storageKey='s17-reading-positions-v1';let positions={};
 try{positions=JSON.parse(sessionStorage.getItem(storageKey)||'{}');}catch{}
 let active=null,pending=null,scheduled=false,persistTimer=0;
 function route(){
  const match=location.hash.match(/^#\/scene\/([^?&/]+)/);if(!match)return null;
  const q=new URLSearchParams(location.hash.split('?')[1]||''),scene=decodeURIComponent(match[1]);
  const caseId=q.get('case')||g.Cases?.bySceneAll(scene)?.[0]?.id||scene;
  const tab=q.get('tab')||'bg';return {key:caseId+':'+tab,caseId,tab,section:q.get('section')};
 }
 function persist(){clearTimeout(persistTimer);persistTimer=setTimeout(()=>{try{sessionStorage.setItem(storageKey,JSON.stringify(positions));}catch{}},150);}
 function save(){if(active&&!pending){positions[active.key]=Math.max(0,g.scrollY);persist();}}
 function apply(){
  scheduled=false;if(!pending)return;
  const current=route();if(!current||current.key!==pending.key||current.section){pending=null;return;}
  const main=document.querySelector('#view main');
  if(main?.dataset.s17CaseReady==='false'&&Date.now()<pending.until)return;
  const max=Math.max(0,document.documentElement.scrollHeight-innerHeight),y=Math.min(pending.y,max);
  g.scrollTo({top:y,behavior:'instant'});
  if(max>=pending.y-2||Date.now()>=pending.until){positions[pending.key]=y;pending=null;persist();}
 }
 function schedule(){if(!scheduled){scheduled=true;requestAnimationFrame(()=>requestAnimationFrame(apply));}}
 function restore(target,sameTab=false){
  active=target;
  if(!target||target.section){pending=null;return;}
  const stored=Number(positions[target.key]);
  pending={key:target.key,y:sameTab?0:Number.isFinite(stored)?Math.max(0,stored):0,until:Date.now()+2500};
  schedule();setTimeout(schedule,350);setTimeout(schedule,2550);
 }
 document.addEventListener('click',event=>{
  const button=event.target.closest?.('#tabs [data-tab]');if(!button)return;
  const current=route();if(!current)return;save();
  const target={...current,tab:button.dataset.tab,key:current.caseId+':'+button.dataset.tab,section:null};
  restore(target,current.tab===target.tab);
 },true);
 g.addEventListener('hashchange',()=>{save();restore(route());});
 g.addEventListener('scroll',save,{passive:true});
 g.addEventListener('s17caseready',()=>{if(!active)restore(route());else if(pending)schedule();});
 g.addEventListener('message',event=>{if(pending&&event.data?.type==='s17-demo-size')schedule();});
 // A deliberate scroll cancels a pending late-layout restoration.
 for(const name of ['wheel','touchstart'])g.addEventListener(name,()=>{if(pending){pending=null;save();}},{passive:true});
 g.addEventListener('keydown',event=>{if(['PageDown','PageUp','Home','End','ArrowDown','ArrowUp',' '].includes(event.key)&&!event.target.closest('input,textarea,[contenteditable=true]'))pending=null;});
 g.addEventListener('pagehide',()=>{save();try{sessionStorage.setItem(storageKey,JSON.stringify(positions));}catch{}});
 g.S17ReadingPosition={snapshot:()=>({active:active?.key||null,pending:pending&&{...pending},positions:{...positions}})};
 restore(route());
})(window);
