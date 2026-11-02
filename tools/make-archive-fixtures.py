from pathlib import Path
import json,zipfile,io
root=Path(__file__).resolve().parents[1]
out=root/'handoff/teacher-update-2026-11-02/fixtures';out.mkdir(parents=True,exist_ok=True)
def entries(scene,identity,prefix):
 folder=next(p.parent for p in (root/'dist/expansion-cases').glob('*/case.json') if json.loads(p.read_text(encoding='utf8'))['sceneId']==scene)
 result={}
 for p in sorted(folder.rglob('*')):
  if not p.is_file():continue
  data=p.read_bytes()
  if p.name=='case.json':
   m=json.loads(data);m['id']=identity;m['title']='ZIP验收 · '+m['title'];data=json.dumps(m,ensure_ascii=False).encode('utf8')
  result[prefix+p.relative_to(folder).as_posix()]=data
 return result
def write(name,items,compression=zipfile.ZIP_DEFLATED):
 with zipfile.ZipFile(out/name,'w',compression=compression) as z:
  for path,data in items.items():z.writestr(path,data)
single=entries('g1','zip-check-single','同学甲/遥感案例/')
write('single.zip',single)
write('collection.zip',dict(entries('g2','zip-check-batch-a','合并成果/第一例/'),**entries('r4','zip-check-batch-b','合并成果/第二例/')))
write('stored.zip',entries('t4','zip-check-stored',''),zipfile.ZIP_STORED)
write('traversal.zip',{'../case.json':b'{}'})
write('missing.zip',{'readme.txt':b'no manifest'})
write('malformed.zip',{'case.json':b'{bad json'})
# Valid ZIP structure with a deliberately wrong CRC, independent of the compressed-data decoder.
buf=bytearray((out/'single.zip').read_bytes());pos=buf.index(b'PK\x01\x02');buf[pos+16]^=1;(out/'corrupt.zip').write_bytes(buf)
print(str(out))
