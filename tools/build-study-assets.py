"""Prepare local teaching previews; original photographs remain unchanged in data/real/."""
from pathlib import Path
from PIL import Image
import json, hashlib

root = Path(__file__).resolve().parents[1]
out = root / 'data' / 'study'
out.mkdir(exist_ok=True)
generated = Path(r'C:\Users\123\.codex\generated_images\01a16776-db87-7843-b1df-a6b9663b9c04\exec-5f298940-1ee1-4c39-b30b-e3ec73946d66.png')
if generated.exists():
    im = Image.open(generated).convert('RGB')
    im.thumbnail((900, 600))
    im.save(out / 'mudlogging-circulation.webp', quality=60, method=6)
stats = []
meta = json.loads((root / 'data/real/core-six-metadata.json').read_text(encoding='utf-8'))
for item in meta['images']:
    im = Image.open(root / item['path']).convert('RGB')
    w, h = im.size
    pixels = list(im.getdata())
    lum = [(.2126*r + .7152*g + .0722*b) for r, g, b in pixels]
    histogram = [sum(1 for v in lum if min(15, int(v/16)) == b) for b in range(16)]
    # Mean absolute horizontal luminance difference, using every valid adjacent pair.
    contrast = sum(abs(lum[y*w+x+1] - lum[y*w+x]) for y in range(h) for x in range(w-1)) / (h*(w-1))
    stats.append({**item, 'width':w, 'height':h, 'brightness':sum(lum)/len(lum), 'contrast':contrast, 'histogram':histogram})
(out / 'core-features.json').write_text(json.dumps(stats, ensure_ascii=False, indent=2), encoding='utf-8')
calcite = json.loads((root / 'data/real/calcite-visible-uv.json').read_text(encoding='utf-8'))
for item in calcite['images']:
    im = Image.open(root/item['path']).convert('RGB')
    im.thumbnail((720, 480))
    im.save(out / ('calcite-' + item['key'] + '.jpg'), quality=78, optimize=True)
print(json.dumps({p.name:p.stat().st_size for p in out.iterdir()}, ensure_ascii=False))
