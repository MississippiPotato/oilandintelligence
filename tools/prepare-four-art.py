import json, pathlib, shutil
from PIL import Image
root=pathlib.Path(__file__).resolve().parent.parent
for scene in ['m1','m3','m4','m5']:
    folder=root/'case-src'/scene/'assets'
    doc=json.loads((folder/'prompts.json').read_text(encoding='utf-8'))
    for item in doc['variants']:
        target=folder/('scroll-'+item['variant']+'.png')
        if not target.exists(): shutil.copyfile(item['sourcePath'],target)
        if item['selected']:
            im=Image.open(target).convert('RGB')
            im.save(folder/'scroll-selected.jpg',quality=86,optimize=True)
            print(scene, im.size, (folder/'scroll-selected.jpg').stat().st_size)
