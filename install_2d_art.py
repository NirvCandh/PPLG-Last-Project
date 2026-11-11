"""Import the generated 2D atlas into native scene objects and the component UI."""
import base64, copy, json, shutil, runpy
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont
P=Path(__file__).parent
OUT=P/'assets'/'art2d';OUT.mkdir(exist_ok=True)
atlas_path=OUT/'CircuitQuest-2D-Atlas.png'
if not atlas_path.exists():raise FileNotFoundError(atlas_path)
atlas=Image.open(atlas_path).convert('RGBA')
entries=['Ohm','Warga','Bug','Glitch','Battery','Pulse','DHT22','LDR','Soil','PIR','Heart','Jumper','ChestClosed','ChestOpen','TerminalOff','TerminalOn','Workbench','SensorPost']
# Fixed world-sized canvases preserve pixel density, bottom anchors and all object identities.
boxes={'Ohm':(56,80),'Warga':(56,80),'Bug':(48,38),'Glitch':(48,48),'Battery':(36,36),'Pulse':(28,16),'DHT22':(48,48),'LDR':(48,48),'Soil':(48,48),'PIR':(48,48),'Heart':(24,24),'Jumper':(40,32),'ChestClosed':(64,48),'ChestOpen':(64,48),'TerminalOff':(80,80),'TerminalOn':(80,80),'Workbench':(104,80),'SensorPost':(72,88)}
sprites={};cells={}
for i,name in enumerate(entries):
 c,r=i%6,i//6
 im=atlas.crop((round(c*atlas.width/6),round(r*atlas.height/3),round((c+1)*atlas.width/6),round((r+1)*atlas.height/3)))
 box=im.getchannel('A').point(lambda a:255 if a>100 else 0).getbbox()
 assert box is not None,name+' missing from atlas'
 cells[name]=im.crop(box)
for name in entries:
 im=cells[name]
 w,h=boxes[name];scale=min((w-4)/im.width,(h-4)/im.height)
 pair=['ChestClosed','ChestOpen'] if name.startswith('Chest') else ['TerminalOff','TerminalOn'] if name.startswith('Terminal') else [name]
 scale=min((w-4)/max(cells[k].width for k in pair),(h-4)/max(cells[k].height for k in pair))
 # Rasterize at display resolution then nearest-neighbor 2x; no blurry resampling at runtime.
 im=im.resize((max(1,round(im.width*scale)),max(1,round(im.height*scale))),Image.Resampling.NEAREST)
 canvas=Image.new('RGBA',(w,h));canvas.alpha_composite(im,((w-im.width)//2,h-im.height))
 dest=OUT/(name+'.png');canvas.resize((w*2,h*2),Image.Resampling.NEAREST).save(dest)
 sprites[name]=dest.relative_to(P).as_posix()

project=P/'Project TA PPLG.json'
backup=P/'Project TA PPLG.before-2d-art.json'
if not backup.exists():shutil.copy2(project,backup)
g=json.loads(project.read_text(encoding='utf-8'))
scene=next(s for s in g['layouts'] if s['name']=='MainGame Scene')
objects={o['name']:o for o in scene['objects']}
mapping={'Ohm':['Ohm'],'Warga':['Warga'],'Bug':['Bug'],'Glitch':['Glitch'],'Battery':['Battery'],'Pulse':['Pulse'],'DHT22':['DHT22'],'LDR':['LDR'],'Soil':['Soil'],'PIR':['PIR'],'Chest':['ChestClosed','ChestOpen'],'Terminal':['TerminalOff','TerminalOn'],'Workbench':['Workbench','Workbench'],'SensorPost':['SensorPost']}
for name,keys in mapping.items():
 obj=objects[name]
 template=copy.deepcopy(obj['animations'][0]['directions'][0]['sprites'][0])
 animations=[]
 w,h=boxes[keys[0]]
 for key in keys:
  frame=copy.deepcopy(template);frame['image']=sprites[key]
  frame.update(hasCustomCollisionMask=True,customCollisionMask=[[{'x':0,'y':0},{'x':w*2,'y':0},{'x':w*2,'y':h*2},{'x':0,'y':h*2}]],points=[],originPoint={'name':'origine','x':0,'y':0},centerPoint={'name':'centre','automatic':True,'x':0,'y':0})
  animations.append({'name':str(len(animations)),'useMultipleDirections':False,'directions':[{'looping':True,'timeBetweenFrames':.2,'sprites':[frame]}]})
 obj['animations']=animations
 for inst in scene['instances']:
  if inst['name']!=name:continue
  center=inst['x']+inst['width']/2;bottom=inst['y']+inst['height']
  inst.update(x=center-w/2,y=bottom-h,width=w,height=h,keepRatio=True)
for file in sprites.values():
 if not any(r['name']==file for r in g['resources']['resources']):g['resources']['resources'].append({'name':file,'file':file,'kind':'image','metadata':'','smoothed':False,'userAdded':True})
art={k:'data:image/png;base64,'+base64.b64encode((P/v).read_bytes()).decode('ascii') for k,v in sprites.items() if k in ['Ohm','Warga','DHT22','LDR','Soil','PIR','Heart','Battery','Jumper','Pulse']}
(OUT/'ui-art.json').write_text(json.dumps(art),encoding='utf-8')
code=(P/'level1-runtime.js').read_text(encoding='utf-8')
code=code.replace('/* COMPONENT_ART_DATA */ {}',json.dumps(art))
event=next(e for e in scene['events'] if e['type']=='BuiltinCommonInstructions::JsCode')
event['inlineCode']=code.splitlines()
project.write_text(json.dumps(g,indent=2),encoding='utf-8')

# One review sheet with explicit names, checker-free dark backing and display-scale previews.
review=Image.new('RGB',(1080,660),(13,31,43));d=ImageDraw.Draw(review)
font=ImageFont.truetype('C:/Windows/Fonts/consola.ttf',15)
for i,name in enumerate(entries):
 x=(i%6)*180;y=(i//6)*220
 d.rounded_rectangle((x+8,y+8,x+172,y+208),radius=8,outline='#345c66',width=1)
 im=Image.open(P/sprites[name]);im.thumbnail((142,150),Image.Resampling.NEAREST)
 review.paste(im,(x+(180-im.width)//2,y+18+150-im.height),im)
 d.text((x+12,y+180),name,font=font,fill='#a3e7d4')
review.save(P/'2D-Art-Review.png')
print('Installed 18 illustrated sprites into 14 native game objects and component UI. Object names, behaviors and floor anchors retained.')
if (P/'source-assets/PROF OHM').exists() and (P/'source-assets/NPC').exists():runpy.run_path(str(P/'prepare_npc_assets.py'))
