"""Optimize generated teaching illustrations for the original portal's offline import quota.
No drawing, compositing, or highlighting is baked into these pixels.
"""
import json, hashlib
from pathlib import Path
from PIL import Image

root=Path(__file__).resolve().parents[1]
spec=json.loads((root/'data/study/case-source-generated.json').read_text(encoding='utf-8'))
records=[]
for item in spec:
    source=Path(item['generatedPath'])
    im=Image.open(source).convert('RGB')
    out=root/('data/study/'+item['scene']+'-source.webp')
    best=None
    for width in [900,840,780]:
        resized=im.resize((width,round(width*im.height/im.width)),Image.Resampling.LANCZOS)
        for quality in [60,55,50,45,40,35,30]:
            resized.save(out,format='WEBP',quality=quality,method=6)
            if out.stat().st_size<=56000:
                best={'width':resized.width,'height':resized.height,'quality':quality}
                break
        if best: break
    if not best: raise RuntimeError('Unable to meet import asset budget for '+item['scene'])
    records.append({'scene':item['scene'],'path':str(out.relative_to(root)).replace('\\','/'),'bytes':out.stat().st_size,
                    'sha256':hashlib.sha256(out.read_bytes()).hexdigest(),'generatedSourceSha256':hashlib.sha256(source.read_bytes()).hexdigest(),**best,
                    'nature':'AI-generated teaching illustration; not a field photograph or measured data',
                    'promptFile':'data/study/case-source-prompts.json','generationTool':'built-in image_gen',
                    'overlay':'Thin translucent rectangles are rendered separately by HTML/SVG; no image labels or UI are baked in'})
(root/'data/study/case-source-assets.json').write_text(json.dumps(records,ensure_ascii=False,indent=2),encoding='utf-8')
print(json.dumps(records,ensure_ascii=False))
