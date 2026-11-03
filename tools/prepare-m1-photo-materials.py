"""Embed CC BY rock textures. Originals remain unchanged; compositions are identified as such."""
from pathlib import Path
from PIL import Image
import json, hashlib
root=Path(__file__).resolve().parents[1]
meta=json.loads((root/'data/real/core-six-metadata.json').read_text(encoding='utf8'))
rows=[]
for label in ['sandstone','shale','limestone']:
 for i,item in enumerate([x for x in meta['images'] if x['label']==label]):
  im=Image.open(root/item['path']).convert('RGB').resize((128,128),Image.Resampling.LANCZOS)
  rows.append({'key':label+'-'+str(i+1),'label':['sandstone','shale','limestone'].index(label),'partition':'reference' if i==0 else 'observation','sourceFilename':item['sourceFilename'],'originalSHA256':item['sha256'],'width':128,'height':128,'rgbHex':im.tobytes().hex()})
payload={'source':meta['source'],'doi':meta['doi'],'license':meta['license'],'authors':meta['authors'],'description':'Real core photographs resized to128px for photo-texture compositions. Reference uses photo1, observation photo2 per class. Local partition only; publisher test partition is not a reproduced benchmark.','images':rows}
(root/'case-src/m1/photo-textures.js').write_text('globalThis.M1PhotoTextures='+json.dumps(payload,ensure_ascii=False,separators=(',',':'))+';\n',encoding='utf8')
(root/'handoff/m4-algorithm-m1-materials-2026-11-03/material-sources.json').write_text(json.dumps({**payload,'images':[{k:v for k,v in x.items() if k!='rgbHex'} for x in rows]},ensure_ascii=False,indent=2),encoding='utf8')
print('Prepared 6 textures; originals retained; no generated rock photography.')
