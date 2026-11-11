import json, copy, uuid, shutil, runpy
from pathlib import Path
from PIL import Image, ImageDraw
P=Path(__file__).parent
out=P/'assets'/'level1'; out.mkdir(exist_ok=True)
project=P/'Project TA PPLG.json'
backup=P/'Project TA PPLG.before-level1.json'
if not backup.exists(): shutil.copy2(project,backup)
refinement_backup=P/'Project TA PPLG.before-map-animation-update.json'
if not refinement_backup.exists(): shutil.copy2(project,refinement_backup)
g=json.loads(project.read_text(encoding='utf-8-sig'))
def saveim(im,n): im.save(out/(n+'.png')); return 'assets/level1/'+n+'.png'
# Slice the supplied terrain artwork into reusable, editable sprites.
for source,prefix in [('Forest Terrain Pixel Art Tileset (1).png','Forest'),('Pixel Art Cave and Lab Tileset (1).png','Cave')]:
 im=Image.open(P/source).convert('RGBA'); w,h=im.size
 for n,c,r in [('TopLeft',0,0),('Top',1,0),('TopRight',2,0),('Fill',4,0),('Rock',1,2),('Bridge',5,2),('Lab',5,2)]:
  tile=im.crop((round(c*w/8),round(r*h/4),round((c+1)*w/8),round((r+1)*h/4)))
  if n in ['TopLeft','Top','TopRight','Fill']:
   tile=tile.crop((7,3,tile.width-5,tile.height-4))
  saveim(tile,prefix+n)
# Preserve Nova's supplied artwork; remove only the connected white backdrop.
for i in [1,2]:
 im=Image.open(P/f'Idle {i}.png').convert('RGBA'); pix=im.load(); stack=[(0,0),(im.width-1,0),(0,im.height-1),(im.width-1,im.height-1)]; seen=set()
 while stack:
  x,y=stack.pop()
  if (x,y) in seen or not(0<=x<im.width and 0<=y<im.height): continue
  seen.add((x,y)); r,gg,b,a=pix[x,y]
  if r>225 and gg>225 and b>225:
   pix[x,y]=(0,0,0,0); stack.extend([(x+1,y),(x-1,y),(x,y+1),(x,y-1)])
 saveim(im,f'Nova{i}')
saveim(Image.new('RGBA',(16,16),(255,255,255,255)),'Collision')
saveim(Image.new('RGBA',(16,16),(0,0,0,0)),'LadderCollision')
# Small code-native pixel sprites for characters absent from the supplied packs.
for name in ['Volt','Bug','Glitch','Battery','Pulse','Ohm','Warga']:
 im=Image.new('RGBA',(32,32)); d=ImageDraw.Draw(im)
 if name=='Volt':
  d.rectangle((5,8,26,24),fill='#123047',outline='#42f6ed',width=2); d.rectangle((9,12,22,18),fill='#46f9ec'); d.rectangle((14,3,17,7),fill='#e7ed92'); d.rectangle((1,12,4,20),fill='#7795ac'); d.rectangle((27,12,30,20),fill='#7795ac')
 elif name in ['Bug','Glitch']:
  col='#fa8572' if name=='Bug' else '#ca8bff'; d.rectangle((5,10,26,24),fill='#25324d',outline=col,width=2)
  for x in [2,12,24]: d.rectangle((x,24,x+4,28),fill=col)
  d.rectangle((9,14,12,17),fill=col); d.rectangle((20,14,23,17),fill=col); d.line((7,10,3,4),fill=col,width=2); d.line((25,10,29,4),fill=col,width=2)
 elif name=='Battery':
  d.rectangle((9,7,23,28),fill='#133a49',outline='#82ffba',width=2); d.rectangle((13,3,19,7),fill='#edecb4'); d.rectangle((12,13,20,24),fill='#82ffba')
 elif name=='Pulse':
  d.ellipse((2,9,29,23),fill='#39e8ef',outline='#ecffff',width=3)
 else:
  d.rectangle((9,3,23,15),fill='#efbc89'); d.rectangle((7,16,25,27),fill='#edf5e3' if name=='Ohm' else '#edac48'); d.rectangle((9,27,14,31),fill='#163047'); d.rectangle((20,27,25,31),fill='#163047'); d.rectangle((7,1,25,6),fill='#edf5e3' if name=='Ohm' else '#73523a'); d.rectangle((9,8,25,10),fill='#1b4051')
 saveim(im,name)
scene=copy.deepcopy(g['layouts'][1]); scene.update(name='MainGame Scene',mangledName='MainGame_32Scene',r=9,v=22,b=35,objects=[],instances=[],events=[],variables=[])
scene['layers'][0]['effects']=[]
TILE_SIZE=64
scene['uiSettings'].update(zoomFactor=0.55,grid=True,gridWidth=TILE_SIZE,gridHeight=TILE_SIZE)
scene['behaviorsSharedData']=[{'name':'Platform','type':'PlatformBehavior::PlatformBehavior'},{'name':'Platformer','type':'PlatformBehavior::PlatformerObjectBehavior'}]
resources=g['resources']['resources']
prop_sizes={}
def res(file):
 file=str(file).replace('\\','/')
 if not any(r['name']==file for r in resources): resources.append(dict(file=file,kind='image',metadata='',name=file,smoothed=False,userAdded=True))
 return file
def sprite(name,files,behaviors=[]):
 if isinstance(files,str): files=[files]
 animations=[]
 for file in files:
  f=res(file); im=Image.open(P/f); w,h=im.size
  frame=dict(hasCustomCollisionMask=True,image=f,points=[],originPoint=dict(name='origine',x=0,y=0),centerPoint=dict(automatic=True,name='centre',x=0,y=0),customCollisionMask=[[dict(x=0,y=0),dict(x=w,y=0),dict(x=w,y=h),dict(x=0,y=h)]])
  animations.append(dict(name=str(len(animations)),useMultipleDirections=False,directions=[dict(looping=True,timeBetweenFrames=0.2,sprites=[frame])]))
 obj=dict(name=name,type='Sprite',persistentUuid=str(uuid.uuid4()),adaptCollisionMaskAutomatically=False,updateIfNotVisible=True,variables=[],effects=[],behaviors=behaviors,animations=animations)
 scene['objects'].append(obj)

def animated(name):
 obj=next(o for o in scene['objects'] if o['name']==name)
 obj['animations']=[]
 for action,info in animation_manifest[name].items():
  frames=[]
  for file in info['frames']:
   f=res(file)
   bounds=(44,22,84,120) if name=='Nova' else (20,12,108,116)
   l,t,r,b=bounds
   frames.append(dict(hasCustomCollisionMask=True,image=f,points=[dict(name='Muzzle',x=101,y=60)],originPoint=dict(name='origine',x=0,y=0),centerPoint=dict(automatic=False,name='centre',x=64,y=64),customCollisionMask=[[dict(x=l,y=t),dict(x=r,y=t),dict(x=r,y=b),dict(x=l,y=b)]]))
  obj['animations'].append(dict(name=action,useMultipleDirections=False,directions=[dict(looping=info['loop'],timeBetweenFrames=1/info['fps'],sprites=frames)]))
def inst(name,x,y,w,h,z=0,vars={}):
 if name in prop_sizes:
  pw,ph=prop_sizes[name];scale=min(w/pw,h/ph);nw,nh=pw*scale,ph*scale;x+=(w-nw)/2;y+=h-nh;w,h=nw,nh
 scene['instances'].append(dict(name=name,x=x,y=y,width=w,height=h,angle=0,zOrder=z,layer='',customSize=True,keepRatio=name not in ['Solid','Ladder'],depth=1,persistentUuid=str(uuid.uuid4()),numberProperties=[],stringProperties=[],initialVariables=[dict(name=k,type='string' if isinstance(v,str) else 'number',value=str(v)) for k,v in vars.items()]))
def local(name):return 'assets/level1/'+name+'.png'
runpy.run_path(str(P/'prepare_level1_assets.py'))
animation_manifest=json.loads((out/'animation-manifest.json').read_text())
for name in ['ForestTopLeft','ForestTop','ForestTopRight','ForestFill','ForestRock','ForestBridge','CaveTop','CaveRock','CaveFill','CaveLab','Volt','Bug','Glitch','Battery','Pulse','Ohm','Warga']: sprite(name,local(name))
# Bridge end pieces retain their painted aspect ratio and sit flush with the ledge.
bridge=Image.open(out/'ForestBridge.png').convert('RGBA');bridge=bridge.crop(bridge.getchannel('A').point(lambda a:255 if a>100 else 0).getbbox());saveim(bridge,'ForestBridge')
prop_sizes['ForestBridge']=bridge.size
sprite('Nova',[local('Nova1'),local('Nova2')],[dict(name='Platformer',type='PlatformBehavior::PlatformerObjectBehavior',acceleration=1800,deceleration=2200,maxSpeed=310,gravity=1250,maxFallingSpeed=850,jumpSpeed=700,jumpSustainTime=0.12,ignoreDefaultControls=True,canGrabPlatforms=False,canGrabWithoutMoving=False,slopeMaxAngle=60,useLegacyTrajectory=False,useRepeatedJump=False,ladderClimbingSpeed=220)])
animated('Nova');animated('Volt')
sprite('Solid',local('Collision'),[dict(name='Platform',type='PlatformBehavior::PlatformBehavior',platformType='Normal',canBeGrabbed=False)])
sprite('Ladder',local('LadderCollision'),[dict(name='Platform',type='PlatformBehavior::PlatformBehavior',platformType='Ladder',canBeGrabbed=False)])
props=P/'assets/CircuitQuest_Level1_Props_Tileset/individual'
for name,nums in [('Thorn',[1,2,3]),('Short',[4,5,6]),('Chest',[15,16]),('Terminal',[17,18]),('Workbench',[19,20]),('SensorPost',[11]),('Leaves',[26]),('Fern',[29]),('Bush',[27]),('Mushroom',[23]),('Crystal',[21]),('LadderArt',[8])]:
 images=[Image.open(next(props.glob(f'{n:02}_*'))).convert('RGBA') for n in nums]
 bounds=[im.getchannel('A').point(lambda a:255 if a>100 else 0).getbbox() for im in images]
 box=(min(b[0] for b in bounds),min(b[1] for b in bounds),max(b[2] for b in bounds),max(b[3] for b in bounds))
 prop_sizes[name]=(box[2]-box[0],box[3]-box[1])
 sprite(name,[saveim(im.crop(box),f'Prop_{name}_{i}') for i,im in enumerate(images)])
base=P/'assets/CircuitQuest_Level1_Hutan_Sensor_All_Assets/CircuitQuest_Level1/Props'
for name,file in [('DHT22','Sensor_Item_DHT22.png'),('LDR','Sensor_Item_LDR.png'),('Soil','Sensor_Item_Soil_Moisture.png'),('PIR','Sensor_Item_PIR.png')]: sprite(name,(base/file).relative_to(P).as_posix())
panos=['Pixel Forest Tech Village Panorama.png','Pixel Forest IoT Village-4.png','Pixel-Art Forest Village Panorama-2.png','Enchanted Forest IoT Village-3.png']
for i,file in enumerate(panos):
 sprite('Panorama'+str(i),local('Landscape'+str(i)))
 inst('Panorama'+str(i),i*1632,0,1632,724,-100)
sprite('CaveBackdrop',local('CaveWallNative'))
inst('CaveBackdrop',2880,724,2400,624,-90)
def platform(x,y,w,kind='Forest',deep=1):
 inst('Solid',x,y,w,32,-5)
 h=deep*96
 art=Image.new('RGBA',(w,h));fill=Image.open(out/(kind+'Fill.png')).convert('RGBA');top=Image.open(out/(kind+'Top.png')).convert('RGBA')
 for xx in range(0,w,TILE_SIZE):
  for yy in range(0,h,TILE_SIZE):art.paste(fill,(xx,yy))
  art.paste(top,(xx,0))
 # One opaque sprite per landmass: terrain seams cannot expose the background.
 assert art.getchannel('A').getextrema()==(255,255)
 name=f'Terrain_{kind}_{x}_{y}';sprite(name,saveim(art,name));inst(name,x,y,w,h,1)
platform(0,608,1440,deep=8); platform(1728,608,1344,deep=8)
platform(3264,608,1728,deep=2)
platform(3072,1120,1344,'Cave',2)
for x,y,w in [(4416,1024,192),(4608,928,192),(4800,832,192),(4992,736,192)]: platform(x,y,w,'Cave',2)
platform(5184,608,1344,deep=8)
for x,y,w in [(480,480,288),(2112,448,384),(3648,960,288)]: platform(x,y,w,'Forest' if y<700 else 'Cave')
# A safe but visibly broken bridge; gap is within the configured jump range.
for x in [1344,1728]: inst('ForestBridge',x,608,96,78,3)
for x,top,bottom in [(3120,576,1120),(5072,576,736)]:
 inst('Ladder',x,top,56,bottom-top+20,-4)
 for y in range(top,bottom,56): inst('LadderArt',x,y,56,min(56,bottom-y),4)
for x in range(100,6500,180):
 if 1440<x<1728 or 3072<x<3264 or 4992<x<5184: continue
 inst('Fern' if x%3 else 'Bush',x,568,48,40,5)
for x in range(2880,4350,220): inst('Crystal' if x%3 else 'Mushroom',x,1056,64,64,3)
for x in [580,2200,5360,5750]: inst('Leaves',x,175,96,128,2)
inst('Nova',160,518,96,96,20); inst('Volt',140,512,48,48,21)
inst('Terminal',320,528,80,80,8); inst('Ohm',420,528,56,80,10)
inst('Warga',4000,1040,56,80,10)
inst('Chest',840,544,64,64,9,{'sensor':'DHT22'}); inst('DHT22',850,490,48,48,10)
inst('Chest',2310,384,64,64,9,{'sensor':'LDR'}); inst('LDR',2320,330,48,48,10)
inst('Chest',3450,1056,64,64,9,{'sensor':'Soil'}); inst('Soil',3460,1002,48,48,10)
inst('PIR',4005,988,48,48,10)
inst('Workbench',6110,528,104,80,8); inst('SensorPost',5520,520,72,88,8)
for x,y in [(1100,560),(1930,560),(3330,1072),(5470,560),(5680,560)]: inst('Thorn',x,y,64,48,10)
for x,y in [(3680,1080),(3780,1080),(5880,568)]: inst('Short',x,y,80,40,10)
for x,y in [(1200,570),(2600,570),(3550,1082),(5320,570)]: inst('Bug',x,y,48,38,15,{'home':x,'dir':1})
for x,y in [(2880,548),(3880,1060)]: inst('Glitch',x,y,48,48,15)
for x,y in [(1020,480),(2510,520),(3240,1020),(4580,960),(5390,520)]: inst('Battery',x,y,36,36,12)
scene['objectsFolderStructure']={'folderName':'__ROOT','children':[{'objectName':o['name']} for o in scene['objects']]}
def js_event(code): return dict(type='BuiltinCommonInstructions::JsCode',inlineCode=code.splitlines(),parameterObjects='',useStrict=True,eventsSheetExpanded=False)
scene['events']=[dict(type='BuiltinCommonInstructions::Comment',color={'r':42,'g':180,'b':180},comment='LEVEL 1 / HUTAN SENSOR â€” native platformer terrain and objects; runtime, quests and assembly below.'),js_event((P/'level1-runtime.js').read_text(encoding='utf-8'))]
g['layouts'][1]=scene
g['firstLayout']='MainGame Scene'
g['properties'].update(name='Circuit Quest - Hutan Sensor',description='Stage 1: collect four input sensors, explore the underground research cave, restore power, and assemble the Sensor Hub.',adaptGameResolutionAtRuntime=False,sizeOnStartupMode='adaptWidth',pixelsRounding=True,scaleMode='nearest')
g['variables']=[dict(name=n,type='number',value=str(v)) for n,v in [('CurrentStage',1),('StageUnlocked',1),('PlayerHP',5),('PlayerEnergy',100),('SensorHub',0)]]+[dict(name='Inventory',type='structure',children=[dict(name=n,type='number',value='0') for n in ['DHT22','LDR','Soil','PIR','KabelJumper']]),dict(name='QuestState',type='structure',children=[dict(name='Rani',type='number',value='0')])]
project.write_text(json.dumps(g,indent=2),encoding='utf-8')
print(f'Built {len(scene["instances"])} instances, {len(scene["objects"])} objects, {len(resources)} resources. Backup: {backup.name}')
if (P/'assets/art2d/CircuitQuest-2D-Atlas.png').exists():runpy.run_path(str(P/'install_2d_art.py'))
