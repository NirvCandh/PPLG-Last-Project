"""Import the user's Prof. Ohm and NPC sheets without changing their identities."""
import base64,copy,json
from pathlib import Path
import numpy as np
from PIL import Image,ImageDraw,ImageFont,ImageFilter
P=Path(__file__).parent;OUT=P/'assets/npc';OUT.mkdir(exist_ok=True)

def clean(im,white=False):
 a=np.array(im.convert('RGBA')).copy()
 if white:
  rgb=a[:,:,:3].astype(int);lo=rgb.min(2);hi=rgb.max(2)
  candidate=(lo>80)&(hi-lo<50)
  mask=Image.fromarray(candidate.astype('uint8')*255)
  for point in [(0,0),(im.width-1,0),(0,im.height-1),(im.width-1,im.height-1)]:
   if mask.getpixel(point)==255:ImageDraw.floodfill(mask,point,128)
  background=(np.array(mask)==128)|((lo>225)&(hi-lo<25))
  a[:,:,3][background]=0
  a[:,:,3]=np.minimum(a[:,:,3].astype(float)*255/252,255).astype('uint8')
 a[:,:,3][a[:,:,3]<100]=0
 return Image.fromarray(a)

def split(im,count):
 if count==1:return [im]
 cols=(np.array(im)[:,:,3]>145).sum(0)>15
 starts=np.where(np.diff(np.r_[False,cols,False].astype(int))==1)[0];ends=np.where(np.diff(np.r_[False,cols,False].astype(int))==-1)[0]
 runs=[]
 for l,r in zip(starts,ends):
  if runs and l-runs[-1][1]<35:runs[-1][1]=int(r)
  else:runs.append([int(l),int(r)])
 runs=[r for r in runs if r[1]-r[0]>60]
 assert len(runs)==count,(count,runs)
 cuts=[0]+[(runs[i][1]+runs[i+1][0])//2 for i in range(count-1)]+[im.width]
 return [im.crop((cuts[i],0,cuts[i+1],im.height)) for i in range(count)]

sources=[('Ohm','Idle','PROF OHM','*idle*',4,5,True),('Ohm','Talk','PROF OHM','*Talking*',4,7,True),('Ohm','Explain','PROF OHM','*points*',4,6,True),('Ohm','Diagnostic','PROF OHM','*diagnostic*',1,1,False),('Warga','Idle','NPC','Friendly*',4,5,True),('Warga','Talk','NPC','Four*',4,7,True)]
raw={};manifest={'Ohm':{},'Warga':{}}
for who,action,folder,pattern,count,fps,loop in sources:
 f=next((P/'source-assets'/folder).glob(pattern));im=clean(Image.open(f),white=who=='Warga' and action=='Talk')
 frames=split(im,count);raw[(who,action)]=frames
 manifest[who][action]={'frames':[],'fps':fps,'loop':loop,'source':f.relative_to(P).as_posix()}

# Source drawing sizes vary between sheets. Normalize the whole action once, not each frame.
# All actions share the same 128x128 canvas, feet at y=120 and torso centered at x=64.
for (who,action),frames in raw.items():
 bounds=[fr.getchannel('A').point(lambda x:255 if x>145 else 0).getbbox() for fr in frames]
 scale=104/max(b[3]-b[1] for b in bounds)
 for i,(fr,bbox) in enumerate(zip(frames,bounds)):
  a=np.array(fr)[:,:,3];ys,xs=np.where(a>145)
  torso=(ys>bbox[1]+(bbox[3]-bbox[1])*.32)&(ys<bbox[1]+(bbox[3]-bbox[1])*.68)
  anchor=float(np.median(xs[torso]))
  crop=fr.crop(bbox);crop=crop.resize((round(crop.width*scale),round(crop.height*scale)),Image.Resampling.NEAREST)
  canvas=Image.new('RGBA',(128,128));x=round(64-(anchor-bbox[0])*scale);y=120-crop.height
  assert x>=0 and x+crop.width<=128,(who,action,i,'clipped gesture')
  canvas.alpha_composite(crop,(x,y))
  if who=='Warga' and action=='Talk':
   # Replace the white matte fringe with a one-pixel dark outline at game resolution.
   mask=canvas.getchannel('A').point(lambda a:255 if a>100 else 0)
   border=np.array(mask)>np.array(mask.filter(ImageFilter.MinFilter(3)))
   ar=np.array(canvas);ar[:,:,:3][border]=[20,28,40];ar[:,:,3]=np.array(mask);canvas=Image.fromarray(ar)
  file=OUT/f'{who}_{action}_{i:02}.png';canvas.save(file)
  manifest[who][action]['frames'].append(file.relative_to(P).as_posix())
(OUT/'animation-manifest.json').write_text(json.dumps(manifest,indent=2),encoding='utf-8')

project=P/'Project TA PPLG.json';g=json.loads(project.read_text(encoding='utf-8'));scene=next(s for s in g['layouts'] if s['name']=='MainGame Scene')
for who,actions in manifest.items():
 obj=next(o for o in scene['objects'] if o['name']==who);animations=[]
 already_normalized=obj['animations'][0]['directions'][0]['sprites'][0]['image'].startswith('assets/npc/')
 for action,info in actions.items():
  frames=[]
  for file in info['frames']:
   frames.append({'hasCustomCollisionMask':True,'image':file,'points':[],'originPoint':{'name':'origine','x':0,'y':0},'centerPoint':{'name':'centre','automatic':False,'x':64,'y':64},'customCollisionMask':[[{'x':42,'y':18},{'x':86,'y':18},{'x':86,'y':120},{'x':42,'y':120}]]})
   if not any(r['name']==file for r in g['resources']['resources']):g['resources']['resources'].append({'name':file,'file':file,'kind':'image','metadata':'','smoothed':False,'userAdded':True})
  animations.append({'name':action,'useMultipleDirections':False,'directions':[{'looping':info['loop'],'timeBetweenFrames':1/info['fps'],'sprites':frames}]})
 obj['animations']=animations
 for inst in scene['instances']:
  if inst['name']!=who:continue
  cx=inst['x']+inst['width']/2;ground=inst['y']+inst['height']*(120/128 if already_normalized else 1)
  # A 96px display canvas gives the same ~78px visible height as Nova.
  inst.update(x=cx-48,y=ground-90,width=96,height=96,keepRatio=True)

# Use the same supplied character portraits in dialogue, not the superseded coded portraits.
ui=P/'assets/art2d/ui-art.json';art=json.loads(ui.read_text())
for who in manifest:
 file=P/manifest[who]['Idle']['frames'][0]
 art[who]='data:image/png;base64,'+base64.b64encode(file.read_bytes()).decode('ascii')
ui.write_text(json.dumps(art),encoding='utf-8')
portraits={who:{action:['data:image/png;base64,'+base64.b64encode((P/f).read_bytes()).decode('ascii') for f in info['frames']] for action,info in actions.items()} for who,actions in manifest.items()}
code=(P/'level1-runtime.js').read_text(encoding='utf-8').replace('/* COMPONENT_ART_DATA */ {}',json.dumps(art)).replace('/* NPC_PORTRAIT_DATA */ {}',json.dumps(portraits))
next(e for e in scene['events'] if e['type']=='BuiltinCommonInstructions::JsCode')['inlineCode']=code.splitlines()
project.write_text(json.dumps(g,indent=2),encoding='utf-8')

review=Image.new('RGB',(880,6*160),(14,30,42));d=ImageDraw.Draw(review);font=ImageFont.truetype('C:/Windows/Fonts/consola.ttf',16)
for row,(who,action,*_) in enumerate(sources):
 d.text((10,row*160+18),who+' / '+action,font=font,fill='#b2f2d9')
 for i,file in enumerate(manifest[who][action]['frames']):
  im=Image.open(P/file);review.paste(im,(220+i*150,row*160+12),im);d.line((220+i*150,row*160+132,348+i*150,row*160+132),fill='#426f76')
review.save(P/'NPC-Animation-Review.png')
print('Installed 21 supplied NPC frames: Ohm Idle/Talk/Explain/Diagnostic and villager Idle/Talk; stable feet, portrait replacement and transparent talking sheet.')
