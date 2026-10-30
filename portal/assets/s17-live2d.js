(async function(g){'use strict';
const root=document.getElementById('s17-assistant'),host=root?.querySelector('.s17-agent-avatar'),info=g.S17AvatarInfo??{name:'Diana',displayName:'嘉然 Diana',creator:'木果阿木果',source:'MoodDairy'};if(!host||root.hidden||g.S17Live2D?.state==='ready')return;
g.S17Live2D={state:'loading',model:info.name,error:null};
try{
 if(!g.PIXI?.live2d?.Live2DModel||!g.Live2DCubismCore||!g.S17AvatarData)throw Error('本地Live2D运行资源未就绪');
 const canvas=document.createElement('canvas');canvas.setAttribute('aria-label','Live2D Q版角色 '+info.displayName);
 const app=new PIXI.Application({view:canvas,width:220,height:230,resolution:Math.min(g.devicePixelRatio||1,1.5),autoDensity:true,backgroundAlpha:0,antialias:true,preserveDrawingBuffer:true});
 const model=await PIXI.live2d.Live2DModel.from(g.S17AvatarData,{autoInteract:false});app.stage.addChild(model);const bounds=model.getLocalBounds();model.scale.set(Math.min(214/bounds.width,225/bounds.height));model.anchor.set(.5,1);model.position.set(110,230);
 host.replaceChildren(canvas);root.dataset.avatar='live2d';root.dataset.avatarStyle='chibi';let speakingSince=0;
 app.ticker.add(()=>{if(root.dataset.speaking==='true'){if(!speakingSince)speakingSince=performance.now();model.internalModel.coreModel.setParameterValueById('ParamMouthOpenY',.25+.25*Math.sin((performance.now()-speakingSince)/90));}else speakingSince=0;});
 if(root.hidden){app.destroy(true,{children:true,texture:true,baseTexture:true});return;}
 const credit=document.createElement('p');credit.className='s17-agent-credit';credit.append(document.createTextNode('角色：嘉然 Diana · 原画/模型：木果阿木果 · '));const source=document.createElement('a');source.textContent='来源与使用说明';source.href=new URL('assets/live2d/ATTRIBUTION.txt',new URL(g.S17Page?.portalHref??location.href,document.baseURI)).href;source.target='_blank';source.rel='noopener';credit.append(source);root.querySelector('.s17-agent-options').append(credit);
  const avatarStatus=document.createElement('p');avatarStatus.className='s17-agent-credit';avatarStatus.textContent='嘉然已就绪，支持待机和打招呼；朗读时会配合嘴型。';credit.before(avatarStatus);
 const play=async group=>{try{const played=await model.motion(group,0,3);if(played){g.S17Live2D.lastMotion=group;g.S17Live2D.playedMotions++;}return !!played;}catch{return false;}};
 const visibility=()=>{if(document.hidden||root.hidden||root.dataset.compact==='true')app.stop();else app.start();};const observer=new MutationObserver(visibility);observer.observe(root,{attributes:true,attributeFilter:['hidden','data-compact']});document.addEventListener('visibilitychange',visibility);
 g.S17Live2D={state:'ready',model:info.name,displayName:info.displayName,source:info.source,creator:info.creator,canvas:()=>({width:canvas.width,height:canvas.height}),motionCount:3,lastMotion:'Idle',playedMotions:0,greet:()=>play('Greeting'),hug:()=>play('Hug'),dispose:()=>{observer.disconnect();document.removeEventListener('visibilitychange',visibility);app.destroy(true,{children:true,texture:true,baseTexture:true});g.S17Live2D.state='disposed';}};
 const hug=document.createElement('button');hug.type='button';hug.id='s17-agent-hug';hug.textContent='角色打招呼';hug.onclick=()=>play('Hug');credit.before(hug);play('Hug');
}catch(e){root.dataset.avatar='fallback';g.S17Live2D={state:'error',model:info.name,error:e.message};document.getElementById('s17-agent-model-status').textContent='Live2D本次未加载：'+e.message+'。当前显示二维备用图，导航仍可用。';}
})(window);
