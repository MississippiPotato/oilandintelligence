(function(g){'use strict';
g.S17ResponseStream={async read(response,onDelta=()=>{}){
 if(!(response.headers.get('Content-Type')||'').includes('text/event-stream')){const body=await response.json();return{body,deltas:0};}
 const reader=response.body.getReader(),decoder=new TextDecoder();let buffer='',text='',completed=null,done=false,deltas=0;const items=[];
 const event=block=>{const data=block.split('\n').filter(l=>l.startsWith('data:')).map(l=>l.slice(5).replace(/^ /,'')).join('\n');if(!data||data==='[DONE]')return;const value=JSON.parse(data);if(value.type==='response.output_text.delta'&&typeof value.delta==='string'){text+=value.delta;deltas++;onDelta(value.delta);}if(value.type==='response.output_item.done'&&value.item)items.push(value.item);if(value.type==='response.completed'||value.type==='response.incomplete'){completed=value.response;done=true;}if(value.type==='response.failed'||value.type==='error')throw Error(value.error?.message??value.response?.error?.message??'回答生成失败');};
 try{for(;;){const chunk=await reader.read();buffer+=decoder.decode(chunk.value??new Uint8Array(),{stream:!chunk.done});buffer=buffer.replace(/\r\n/g,'\n');let at;while((at=buffer.indexOf('\n\n'))>=0){event(buffer.slice(0,at));buffer=buffer.slice(at+2);}if(chunk.done){if(buffer.trim())event(buffer);break;}}if(!done)throw Error('连接提前结束，已收到的内容仍会保留');const body=completed??{output:items};if(!body.output?.length)body.output=items.length?items:[{type:'message',content:[{type:'output_text',text}]}];return{body,deltas};}finally{reader.releaseLock();}
}};
})(window);
