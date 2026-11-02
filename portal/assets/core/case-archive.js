// ZIP decoding is local. The existing importer remains responsible for case validation/storage.
import {unzipSync, strFromU8} from '../vendor/fflate-0.8.3.js';
const MiB=1024*1024, MAX_ARCHIVE=64*MiB, MAX_EXPANDED=192*MiB, MAX_ENTRIES=12000;
const ignore=name=>/(^|\/)(?:__MACOSX|\.git|node_modules)(?:\/|$)/i.test(name)||/(^|\/)(?:\.DS_Store|\._[^/]+)$/i.test(name);
const crcTable=Uint32Array.from({length:256},(_,n)=>{let c=n;for(let k=0;k<8;k++)c=c&1?0xedb88320^(c>>>1):c>>>1;return c>>>0;});
function crc32(bytes){let c=0xffffffff;for(const b of bytes)c=crcTable[(c^b)&255]^(c>>>8);return(c^0xffffffff)>>>0;}
function directory(bytes){
  const v=new DataView(bytes.buffer,bytes.byteOffset,bytes.byteLength);let end=-1;
  for(let p=bytes.length-22;p>=Math.max(0,bytes.length-65557);p--)if(v.getUint32(p,true)===0x06054b50&&p+22+v.getUint16(p+20,true)===bytes.length){end=p;break;}
  if(end<0)throw Error('ZIP目录不完整，请重新压缩后再试。');
  const count=v.getUint16(end+10,true),size=v.getUint32(end+12,true),start=v.getUint32(end+16,true);
  if(v.getUint16(end+4,true)||v.getUint16(end+6,true)||v.getUint16(end+8,true)!==count)throw Error('请合并为一个普通ZIP文件，暂不支持分卷。');
  if(count===65535||start===0xffffffff||size===0xffffffff)throw Error('请选择普通ZIP格式，暂不支持ZIP64。');
  if(count>MAX_ENTRIES||start+size>end)throw Error('ZIP目录超出可读取范围。');
  let pos=start,total=0;const entries=[],seen=new Set();
  for(let i=0;i<count;i++){
    if(pos+46>end||v.getUint32(pos,true)!==0x02014b50)throw Error('ZIP目录损坏。');
    const flags=v.getUint16(pos+8,true),method=v.getUint16(pos+10,true),length=v.getUint16(pos+28,true),extra=v.getUint16(pos+30,true),comment=v.getUint16(pos+32,true),raw=bytes.subarray(pos+46,pos+46+length);
    if(pos+46+length+extra+comment>start+size)throw Error('ZIP文件名或目录损坏。');
    // Legacy Chinese ZIP names are decoded as GB18030; UTF-8 archives use the standard flag.
    let name=(flags&2048?strFromU8(raw):new TextDecoder('gb18030').decode(raw)).replace(/\\/g,'/');
    if(/^\/|^[a-z]:|(^|\/)\.\.(\/|$)|\x00/i.test(name))throw Error('ZIP内含无效相对路径：'+name);
    if(flags&1)throw Error('请先取消ZIP密码，再添加案例。');
    if(method!==0&&method!==8)throw Error('ZIP采用不支持的压缩方式，请选择标准ZIP/Deflate。');
    const expanded=v.getUint32(pos+24,true),packed=v.getUint32(pos+20,true),offset=v.getUint32(pos+42,true),crc=v.getUint32(pos+16,true);
    if(expanded===0xffffffff||packed===0xffffffff||offset===0xffffffff)throw Error('暂不支持ZIP64。');
    if(!ignore(name)&&!name.endsWith('/')){
      if(seen.has(name))throw Error('ZIP内有重名文件：'+name);seen.add(name);
      total+=expanded;if(expanded>6*MiB||total>MAX_EXPANDED)throw Error('解压后文件过大；单例上限6 MiB，合集上限192 MiB。');
      entries.push({name,rawName:strFromU8(raw,!(flags&2048)),expanded,crc});
    }
    pos+=46+length+extra+comment;
  }
  if(pos!==start+size)throw Error('ZIP目录长度不一致。');
  return entries;
}
export async function readArchive(file){
  if(file.size>MAX_ARCHIVE)throw Error('压缩包上限64 MiB，请拆分合集后再添加。');
  const bytes=new Uint8Array(await file.arrayBuffer()),entries=directory(bytes),wanted=new Set(entries.map(e=>e.rawName));
  const decoded=unzipSync(bytes,{filter:entry=>wanted.has(entry.name)});
  const files=entries.map(e=>{const data=decoded[e.rawName];if(!data||data.length!==e.expanded||crc32(data)!==e.crc)throw Error('文件校验失败：'+e.name+'，请重新压缩。');return{name:e.name,data};});
  const manifests=files.filter(e=>/(^|\/)(?:case|[a-z0-9._-]+\.case)\.json$/i.test(e.name));
  if(!manifests.length)throw Error('ZIP中没有找到case.json，请选择包含案例清单的压缩包。');
  const packages=manifests.map(m=>{
    const root=m.name.slice(0,m.name.lastIndexOf('/')+1);
    const members=files.filter(e=>e.name.startsWith(root)&&!manifests.some(n=>n!==m&&n.name.startsWith(root)&&e.name.startsWith(n.name.slice(0,n.name.lastIndexOf('/')+1))));
    const total=members.reduce((s,e)=>s+e.data.length,0);
    let pkg,error='';try{pkg=JSON.parse(strFromU8(m.data));}catch{error='清单不是有效JSON';}
    if(total>6*MiB)error='单例解压后超过6 MiB';
    return{root,manifest:m.name,pkg,error,bytes:total,files:members.map(e=>{const f=new File([e.data],e.name.slice(root.length));Object.defineProperty(f,'webkitRelativePath',{value:e.name.slice(root.length)});return f;})};
  });
  return{filename:file.name,packages};
}
window.S17CaseArchive={read:readArchive};
