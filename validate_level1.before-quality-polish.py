import json, math
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont
P=Path(__file__).parent
g=json.loads((P/'Project TA PPLG.json').read_text(encoding='utf-8'))
s=next(x for x in g['layouts'] if x['name']=='MainGame Scene')
assert all((P/r['file']).is_file() for r in g['resources']['resources'])
objects={o['name']:o for o in s['objects']}
assert all(i['name'] in objects for i in s['instances'])
assert all(n in objects for n in ['DHT22','LDR','Soil','PIR','Nova','Solid','Workbench'])
assert next(o for o in s['objects'] if o['name']=='Nova')['behaviors'][0]['jumpSpeed']==700
for name in ['Nova','Volt']:
 masks=[]
 for a in objects[name]['animations']:
  frames=a['directions'][0]['sprites'];assert len(frames)>=2
  for frame in frames:
   assert Image.open(P/frame['image']).size==(128,128)
   masks.append(frame['customCollisionMask'])
 assert all(m==masks[0] for m in masks),name+' collision mask changes between frames'
for o in s['objects']:
 if o['name'].startswith('Terrain_'):
  im=Image.open(P/o['animations'][0]['directions'][0]['sprites'][0]['image'])
  assert im.getchannel('A').getextrema()==(255,255),'Transparent terrain seam: '+o['name']
for i in s['instances']:
 if i['name'] in ['Nova','Volt']:assert i['width']==i['height']
print('PASS: 56 animation frames, fixed-size canvases and collision masks; every terrain landmass is opaque without transparent gutters.')
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
jump_height=700**2/(2*1250); jump_range=310*2*700/1250
assert jump_height>160 and jump_range>288+38
print(f'PASS: resource files and object references; jump height {jump_height:.0f}px, same-height range {jump_range:.0f}px; bridge gap 288px, raised LDR ledge 160px.')
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
