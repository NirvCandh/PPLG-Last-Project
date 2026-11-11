import json
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont
P=Path(__file__).parent
g=json.loads((P/'Project TA PPLG.json').read_text(encoding='utf-8'))
s=next(x for x in g['layouts'] if x['name']=='MainGame Scene')
assert all((P/r['file']).is_file() for r in g['resources']['resources'])
objects={o['name']:o for o in s['objects']}
assert all(i['name'] in objects for i in s['instances'])
assert all(n in objects for n in ['DHT22','LDR','Soil','PIR','Nova','Solid','Workbench'])
assert objects['Nova']['behaviors'][0]['jumpSpeed']==760
for name in ['Nova','Volt']:
 masks=[]
 for a in objects[name]['animations']:
  frames=a['directions'][0]['sprites'];assert len(frames)>=2
  for frame in frames:
   assert Image.open(P/frame['image']).size==(128,128)
   masks.append(frame['customCollisionMask'])
 assert all(m==masks[0] for m in masks),name+' collision mask changes between frames'
roof_sections=[(1344,192),(192,128),(192,32)]
for o in s['objects']:
 if o['name'].startswith('Terrain_'):
  im=Image.open(P/o['animations'][0]['directions'][0]['sprites'][0]['image'])
  alpha=im.getchannel('A')
  if o['name']=='Terrain_Forest_3264_608':
   left=0
   for width,depth in roof_sections:
    assert alpha.crop((left,0,left+width,depth)).getextrema()==(255,255)
    if depth<im.height:assert alpha.crop((left,depth,left+width,im.height)).getextrema()==(0,0)
    left+=width
   assert left==im.width
  else:
   assert alpha.getextrema()==(255,255),'Transparent terrain seam: '+o['name']
for i in s['instances']:
 if i['name'] in ['Nova','Volt']:assert i['width']==i['height']
print('PASS: Stable animation masks and opaque terrain with intentional cave-roof cutouts.')
assert s['uiSettings']['gridWidth']==64 and s['uiSettings']['gridHeight']==64
for name in ['ForestTop','ForestFill','CaveTop','CaveFill']:
 tile=Image.open(P/'assets/level1'/f'{name}.png')
 assert tile.size==(64,64)
 assert tile.crop((0,0,1,64)).tobytes()==tile.crop((63,0,64,64)).tobytes(),name+' horizontal seam'
for i in s['instances']:
 if i['name'].startswith(('Terrain_','Panorama')) or i['name'] in ['CaveBackdrop','ForestBridge']:
  source=Image.open(P/objects[i['name']]['animations'][0]['directions'][0]['sprites'][0]['image'])
  assert abs(i['width']/source.width-i['height']/source.height)<.00001,'Nonuniform scale: '+i['name']
print('PASS: 64x64 texture/grid size, matching tile edges and uniform X/Y scale on every terrain, bridge and background sprite.')
solids=[i for i in s['instances'] if i['name']=='Solid']
bridge=sorted((i for i in s['instances'] if i['name']=='ForestBridge'),key=lambda i:i['x'])
assert len(bridge)==2
left,right=bridge
assert right['x']-left['x']-left['width']==96
assert any(i['y']==left['y'] and i['x']+i['width']==left['x']+left['width'] for i in solids)
assert any(i['y']==right['y'] and i['x']==right['x'] for i in solids)
for name in ['Terrain_Forest_480_480','Terrain_Forest_2112_448','Terrain_Cave_3648_960']:
 shelf=next(i for i in s['instances'] if i['name']==name)
 assert any(all(i[k]==shelf[k] for k in ['x','y','width','height']) for i in solids),name+' collider mismatch'
roof_x=3264
for width,depth in roof_sections:
 assert any((i['x'],i['y'],i['width'],i['height'])==(roof_x,608,width,depth) for i in solids)
 roof_x+=width
print('PASS: Resource references, 96px bridge gap, and aligned forest and cave shelf colliders.')
im=Image.new('RGBA',(1632,410),(9,22,35)); cache={}
for i in sorted(s['instances'],key=lambda i:i['zOrder']):
 if i['name'] in ['Solid','Ladder']:continue
 obj=objects[i['name']];f=obj['animations'][0]['directions'][0]['sprites'][0]['image']
 if f not in cache:cache[f]=Image.open(P/f).convert('RGBA')
 tile=cache[f].resize((max(1,round(i['width']/4)),max(1,round(i['height']/4))),Image.Resampling.NEAREST)
 im.alpha_composite(tile,(round(i['x']/4),round(i['y']/4)+55))
d=ImageDraw.Draw(im)
font=ImageFont.truetype('C:/Windows/Fonts/consola.ttf',18)
small=ImageFont.truetype('C:/Windows/Fonts/consola.ttf',13)
d.text((20,10),'CIRCUIT QUEST  /  STAGE 01: HUTAN SENSOR',font=font,fill='#9affce')
for x,y,text in [(80,75,'01 OHM'),(210,160,'DHT22'),(350,178,'BROKEN BRIDGE'),(550,143,'LDR'),(800,220,'LADDER'),(860,355,'SOIL'),(1000,355,'RANI / PIR'),(1380,175,'POWER'),(1500,150,'WORKBENCH')]:
 d.rounded_rectangle((x-4,y-2,x+len(text)*8+6,y+18),radius=3,fill='#09252f');d.text((x,y),text,font=small,fill='#b8ffe3')
d.text((20,385),'A/D: move  |  Space: jump  |  W/S: ladder  |  J: Pulse  |  E: interact  |  I: inventory  |  Esc: pause',font=small,fill='#c4e7e0')
im.convert('RGB').save(P/'Level1-Overview.png')
print('PASS: Level1-Overview.png created.')

# Full-size composition using actual scene instance dimensions, not a thumbnail stretched to fit.
review=Image.new('RGBA',(1280,780),(9,22,35))
for i in sorted(s['instances'],key=lambda i:i['zOrder']):
 if i['name'] in ['Solid','Ladder']:continue
 if i['x']>=1280 or i['y']+i['height']<200 or i['y']>920:continue
 f=objects[i['name']]['animations'][0]['directions'][0]['sprites'][0]['image']
 if f not in cache:cache[f]=Image.open(P/f).convert('RGBA')
 tile=cache[f].resize((max(1,round(i['width'])),max(1,round(i['height']))),Image.Resampling.NEAREST)
 review.alpha_composite(tile,(round(i['x']),round(i['y'])-200+60))
dr=ImageDraw.Draw(review);dr.rectangle((0,0,1280,59),fill='#091f2b')
dr.text((20,12),'TILE 64x64  |  NOVA ~78px  |  VOLT ~40px  |  TERRAIN SCALE X = Y',font=font,fill='#a6f5d2')
dr.text((20,36),'Actual scene pixels at 1280x720. Texture is repeated, never stretched across the map.',font=small,fill='#bcdbd1')
# A tile-sized reference square beside the player, with feet aligned to the walk surface.
dr.rectangle((92,608-200+60-64,156,608-200+60),outline='#a6f5d2',width=1)
dr.text((92,608-200+60-84),'64 px',font=small,fill='#e0fff0')
review.convert('RGB').save(P/'Tile-Scale-Review.png')
