import json
from pathlib import Path
from PIL import Image
P=Path(__file__).parent
g=json.loads((P/'Project TA PPLG.json').read_text(encoding='utf-8'))
scene=next(s for s in g['layouts'] if s['name']=='MainGame Scene')
old=json.loads((P/'Project TA PPLG.before-npc-animation.json').read_text(encoding='utf-8'))
old=next(s for s in old['layouts'] if s['name']=='MainGame Scene')
expected={'Ohm':{'Idle':4,'Talk':4,'Explain':4,'Diagnostic':1},'Warga':{'Idle':4,'Talk':4}}
for name,actions in expected.items():
 obj=next(o for o in scene['objects'] if o['name']==name)
 assert {a['name']:len(a['directions'][0]['sprites']) for a in obj['animations']}==actions
 masks=[]
 for a in obj['animations']:
  for frame in a['directions'][0]['sprites']:
   assert frame['image'].startswith('assets/npc/')
   im=Image.open(P/frame['image']);assert im.size==(128,128)
   assert im.getchannel('A').getextrema()[0]==0
   assert all(im.getpixel(pt)[3]==0 for pt in [(0,0),(127,0),(0,127),(127,127)])
   masks.append(frame['customCollisionMask'])
 assert all(m==masks[0] for m in masks)
 before=next(i for i in old['instances'] if i['name']==name)
 after=next(i for i in scene['instances'] if i['name']==name)
 assert after['width']==after['height']==96
 assert abs(after['y']+90-(before['y']+before['height']))<.000001
 assert abs(after['x']+48-(before['x']+before['width']/2))<.000001
code='\n'.join(next(e for e in scene['events'] if e['type']=='BuiltinCommonInstructions::JsCode')['inlineCode'])
assert '/* NPC_PORTRAIT_DATA */' not in code
assert 'data-npc-portrait' in code
assert "c.npcSpeaker===name" in code
print('PASS: 21 supplied frames, six animation states, transparent sheets, consistent 128px canvases/masks, stable 96px world scale and animated dialogue portraits.')
