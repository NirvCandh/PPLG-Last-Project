import json
from pathlib import Path
from PIL import Image
P=Path(__file__).parent
g=json.loads((P/'Project TA PPLG.json').read_text(encoding='utf-8'))
old=json.loads((P/'Project TA PPLG.before-2d-art.json').read_text(encoding='utf-8'))
s=next(x for x in g['layouts'] if x['name']=='MainGame Scene')
before=next(x for x in old['layouts'] if x['name']=='MainGame Scene')
names=['Ohm','Warga','Bug','Glitch','Battery','Pulse','DHT22','LDR','Soil','PIR','Chest','Terminal','Workbench','SensorPost']
for name in names:
 obj=next(o for o in s['objects'] if o['name']==name)
 assert obj['type']=='Sprite'
 for a in obj['animations']:
  for f in a['directions'][0]['sprites']:
   assert f['image'].startswith('assets/npc/' if name in ['Ohm','Warga'] else 'assets/art2d/'),name
   im=Image.open(P/f['image']);assert im.mode=='RGBA'
   alpha=im.getchannel('A').getextrema();assert alpha[0]==0 and alpha[1]>240,name+' has no genuine transparent background'
 previous=[i for i in before['instances'] if i['name']==name]
 current=[i for i in s['instances'] if i['name']==name]
 assert len(previous)==len(current)
 for a,b in zip(previous,current):
  foot=b['y']+b['height']*(120/128 if name in ['Ohm','Warga'] else 1)
  assert abs(a['y']+a['height']-foot)<.00001,name+' floor anchor changed'
  assert abs(a['x']+a['width']/2-b['x']-b['width']/2)<.00001,name+' center changed'
  im=Image.open(P/obj['animations'][0]['directions'][0]['sprites'][0]['image'])
  assert abs(b['width']/im.width-b['height']/im.height)<.00001,name+' distorted'
art=json.loads((P/'assets/art2d/ui-art.json').read_text())
assert all(n in art for n in ['Ohm','Warga','DHT22','LDR','Soil','PIR','Heart','Battery','Jumper'])
code='\n'.join(next(e for e in s['events'] if e['type']=='BuiltinCommonInstructions::JsCode')['inlineCode'])
assert '/* COMPONENT_ART_DATA */' not in code
assert all(v in code for v in art.values())
assert len(list((P/'assets/art2d').glob('*.png')))==19
print('PASS: 18 transparent 2D sprites, 14 native game-object replacements, stable floor anchors/aspect ratios, and 9 embedded UI illustrations.')
