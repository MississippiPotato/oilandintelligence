// A folded porous bed below a continuous seal. Contacts are horizontal within pores.
export const layerBoundary=(x,i)=>[0,-.85,-2.45,-4.35,-5.9,-8.3][i]+(i?Math.exp(-(((x-4)/10)**2))*(i<2?.25:1.35)+Math.sin(x*.12)*.08:0);
export const reservoirY=x=>(layerBoundary(x,3)+layerBoundary(x,4))/2;
export const perforationLevels=x=>[-.24,0,.24].map(d=>reservoirY(x)+d);
export const wellRadii={cementOuter:.37,casingOuter:.265,tubing:.085};
export function carriesFlow(selected,pathStage){if(!selected)return true;if(['drilling','mudlogging'].includes(selected))return ['drilling','mudlogging'].includes(pathStage);if(selected==='eor')return ['eor','production'].includes(pathStage);if(selected==='transport')return ['transport','production'].includes(pathStage);if(selected==='completion')return ['completion','perforation'].includes(pathStage);return selected===pathStage;}
