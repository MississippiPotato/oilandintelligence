(function(){'use strict';
const C=window.S17Course,A=window.ATLAS,esc=window.K.esc;let signature='';
const directions=[
 {id:'geology',title:'地质勘探',stages:['geology','seismic'],image:'geology',alt:'露头地层与远山',intro:'认识地下有什么，寻找油气藏。'},
 {id:'well',title:'建井与测量',stages:['drilling','mudlogging','welllog','cementing','completion','perforation'],image:'well',alt:'陆地钻井井场',intro:'怎样建好一口井，并了解井下情况。'},
 {id:'production',title:'生产与增采',stages:['production','workover','eor'],image:'production',alt:'沿道路排列的抽油机',intro:'了解油井怎样生产，怎样改善产量。'},
 {id:'refining',title:'储运与加工',stages:['transport','refining'],image:'refining',alt:'炼厂塔器、储罐与管线',intro:'把原油安全送达，制成合格产品。'}
];
const lessons=[
 ['岩屑识别','观察一盘岩屑，比较颗粒的颜色、纹理和形状。'],
 ['气测解释','追踪一个气峰，判断它与井下作业有什么关系。'],
 ['荧光判读','对照白光和紫外照片，分清发光区域与含义。'],
 ['钻时分段','对照钻进速度和操作条件，寻找变化的井段。'],
 ['报告生成','把原始记录整理成报告，逐句检查依据。']
];
function render(){
 const route=location.hash.split('?')[0],isHome=!route||route==='#/';
 document.body.classList.toggle('s17-overview-active',isHome);
 document.body.classList.toggle('s17-lesson-reading',/^#\/scene\/m[1-5]$/.test(route));
 const main=document.querySelector('#view main');if(!main)return;
 const scene=route.match(/^#\/scene\/(m[1-5])$/)?.[1];
 if(scene){const c=C.byScene(scene);if(c&&!document.getElementById('s17-scope')){const note=document.createElement('aside');note.id='s17-scope';note.className='s17-scope';note.innerHTML='<b>这次要解决的问题 · '+esc(c.name)+'</b><span>'+esc(c.scope)+'。</span>'+((window.Cases?.get(c.id)&&window.Cases.get(c.id).version!==C.expectedVersion(c))?'<p>当前浏览器仍是旧版 '+esc(window.Cases.get(c.id).version)+'。<a href="'+C.href(c)+'">打开新版'+C.expectedVersion(c)+'成品 →</a>；更新门户请在案例库移除自己的旧包后重导。</p>':'');main.prepend(note);}return;}
 if(!isHome)return;
 document.title='井见 · 石油智能化可视实验室';
 const sig=C.cases.map(c=>c.id+'@'+(window.Cases?.get(c.id)?.version||'')).join('|');
 let block=document.getElementById('s17-personal');if(block&&signature===sig)return;
 if(!block){block=document.createElement('section');block.id='s17-personal';block.className='s17-overview';main.classList.add('s17-home-main');main.replaceChildren(block);}signature=sig;
 block.innerHTML=`
 <section class="ov-hero" aria-labelledby="ov-title">
  <div class="ov-hero-copy"><p class="ov-eyebrow">井见 · 石油智能化可视实验室</p>
   <h1 id="ov-title">看懂石油场景，<br>动手体验智能方法。</h1>
   <p class="ov-intro">每个案例都有专业背景、案例流程和可运行示范。选一个问题，读懂知识，再改变条件看结果。</p>
   <div class="ov-actions"><button type="button" class="ov-primary" data-ov-directory>浏览全部 ${A.allScenes.length} 个案例 <span aria-hidden="true">↗</span></button><a class="ov-start" href="${C.href(C.cases[1])}">从气测案例开始 <span aria-hidden="true">→</span></a></div>
   <p class="ov-facts">${A.stages.length} 个石油作业阶段<span aria-hidden="true">·</span>${A.allScenes.length} 个交互案例<span aria-hidden="true">·</span>可离线运行</p>
  </div>
  <figure class="ov-cover"><img src="assets/themes/theme-well-v1.webp" width="1280" height="640" alt="清晨的陆地钻井井场，钻机、道路与地层相连"><figcaption>从一个井场，走进石油的世界</figcaption></figure>
 </section>
 <section class="ov-section" id="s17-expansion" aria-labelledby="ov-directions-title">
  <header class="ov-section-head"><div><h2 id="ov-directions-title">按方向，找到感兴趣的案例</h2><p>从寻找油气，到生产、运输与加工。</p></div></header>
  <div class="ov-directions">${directions.map((d,i)=>{const stages=A.stages.filter(s=>d.stages.includes(s.id)),count=stages.reduce((n,s)=>n+s.scenes.length,0);return `<button type="button" class="ov-direction" data-ov-direction="${d.id}" aria-label="${d.title}，${count}个案例，展开目录"><div class="ov-direction-image"><img src="assets/themes/theme-${d.image}-v1.webp" alt="${d.alt}" width="640" height="266" loading="lazy"><span class="ov-number" aria-hidden="true">0${i+1}</span></div><div class="ov-direction-body"><div class="ov-direction-title"><h3>${d.title}</h3><span aria-hidden="true">↗</span></div><p>${d.intro}</p><span class="ov-direction-meta">${stages.length} 个阶段 · ${count} 个案例</span></div></button>`;}).join('')}</div>
 </section>
 <section class="ov-section ov-mudlogging" id="s17-five" aria-labelledby="ov-five-title">
  <header class="ov-section-head"><div><h2 id="ov-five-title">录井专题 · 五个入门案例</h2><p>录井，就是在钻井过程中记录岩屑、气体和钻进情况，了解地下地层。</p></div><span class="ov-section-note">先认识对象，再动手比较</span></header>
  <div class="ov-lessons">${C.cases.map((c,i)=>`<a class="ov-lesson" href="${C.href(c)}"><span class="ov-lesson-id">M${i+1}</span><h3>${lessons[i][0]}</h3><p>${lessons[i][1]}</p><span class="ov-lesson-open">进入案例 <span aria-hidden="true">→</span></span></a>`).join('')}</div>
 </section>
 <details class="ov-directory" id="s17-directory"><summary><span><b>全部 ${A.allScenes.length} 个案例</b><span>按作业阶段或关键词查找</span></span><span class="ov-directory-toggle" aria-hidden="true"></span></summary>${window.S17Catalog.markup()}</details>
 <div class="ov-utilities"><span>想加入自己的案例？</span><button type="button" data-import>＋ 添加案例</button><a href="#/guide">接入说明</a><a href="../portal-original/index.html">老师原门户</a><a href="#/scene/w1?case=welllog-layer&tab=bg">老师原样例</a></div>`;
 window.S17Catalog.init();
 const footerCases=document.querySelector('.s17-footer a[href="#/cases"]');if(footerCases)footerCases.textContent='案例库';
}
function openDirectory(direction){
 const directory=document.getElementById('s17-directory');if(!directory)return;
 directory.open=true;
 if(direction)window.S17Catalog.selectGroup(direction.stages,direction.title);else window.S17Catalog.reset();
 directory.scrollIntoView({behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'auto':'smooth',block:'start'});
 // Continue keyboard navigation at the destination after opening the directory.
 directory.querySelector('summary').focus({preventScroll:true});
}
document.addEventListener('click',e=>{const button=e.target.closest('[data-ov-directory],[data-ov-direction]');if(button)openDirectory(directions.find(d=>d.id===button.dataset.ovDirection));});
new MutationObserver(render).observe(document.getElementById('view'),{childList:true,subtree:true});addEventListener('hashchange',render);render();
})();
