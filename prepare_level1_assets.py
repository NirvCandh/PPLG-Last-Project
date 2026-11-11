"""Deterministic sprite-sheet slicing and seamless terrain preparation."""
import json, subprocess
from pathlib import Path
import numpy as np
from PIL import Image, ImageOps, ImageDraw, ImageFont
P=Path(__file__).parent
OUT=P/'assets'/'level1'; OUT.mkdir(exist_ok=True)
ANIM=OUT/'characters'; ANIM.mkdir(exist_ok=True)

def regions(im,count):
    a=np.array(im)[:,:,3]
    cols=(a>140).sum(axis=0)>12
    starts=np.where(np.diff(np.r_[False,cols,False].astype(int))==1)[0]
    ends=np.where(np.diff(np.r_[False,cols,False].astype(int))==-1)[0]
    runs=[]
    for l,r in zip(starts,ends):
        if runs and l-runs[-1][1]<32:runs[-1][1]=int(r)
        else:runs.append([int(l),int(r)])
    runs=[r for r in runs if r[1]-r[0]>65]
    assert len(runs)==count,(len(runs),count,runs)
    edges=[0]+[(runs[i][1]+runs[i+1][0])//2 for i in range(count-1)]+[im.width]
    return [(edges[i],0,edges[i+1],im.height) for i in range(count)]

manifest={'Nova':{},'Volt':{}}
def sheet(who,name,pattern,count,fps=8,loop=True):
    who=who.title()
    f=next(f for f in (P/'source-assets'/who).rglob(pattern) if f.is_file())
    im=Image.open(f).convert('RGBA'); frames=[]
    # All Nova sheets share a drawing scale except the larger hurt sheet.
    scale=(104/899 if im.height==1024 else 104/696) if who=='Nova' else None
    boxes=regions(im,count)
    for i,box in enumerate(boxes):
        cell=im.crop(box); ar=np.array(cell);ar[:,:,3][ar[:,:,3]<100]=0
        cell=Image.fromarray(ar);bb=cell.getchannel('A').point(lambda x:255 if x>140 else 0).getbbox()
        cropped=cell.crop(bb)
        factor=scale if scale else 108/(715 if count==2 else 545)
        w,h=round(cropped.width*factor),round(cropped.height*factor)
        cropped=cropped.resize((w,h),Image.Resampling.NEAREST)
        canvas=Image.new('RGBA',(128,128))
        if who=='Nova':
            # Anchor the torso, not the weapon/hand, to keep a stable body center.
            a=np.array(cell)[:,:,3];ys,xs=np.where(a>140)
            body=(ys>bb[1]+(bb[3]-bb[1])*.24)&(ys<bb[1]+(bb[3]-bb[1])*.67)
            anchor=float(np.median(xs[body])) if body.any() else (bb[0]+bb[2])/2
            x=round(64-(anchor-bb[0])*factor);y=120-h
            # Defeat poses retain the same scale and floor anchor, including the seated frames.
        else:x=(128-w)//2;y=(128-h)//2
        canvas.alpha_composite(cropped,(x,y))
        dest=ANIM/f'{who}_{name}_{i:02}.png';canvas.save(dest)
        frames.append(dest.relative_to(P).as_posix())
    manifest[who][name]={'frames':frames,'fps':fps,'loop':loop,'source':f.relative_to(P).as_posix()}

# Nova now comes from the supplied complete sheet through the shared importer below.
sheet('VOLT','Hover','*hover cycle*',4,6)
sheet('VOLT','Speak','*Speaking*',4,8)
sheet('VOLT','Hint','Volt Pixel Robot Hint*',4,6)
sheet('VOLT','Happy','Happy*',4,7)
sheet('VOLT','Worried','Worried*',2,5)
(OUT/'animation-manifest.json').write_text(json.dumps(manifest,indent=2),encoding='utf-8')
subprocess.run(['node',str(P/'prepare_nova_assets.cjs'),'--prepare-only'],check=True)
manifest=json.loads((OUT/'animation-manifest.json').read_text(encoding='utf-8'))

def opaque(im):
    # Remove atlas gutters by extending actual painted pixels across transparent edges.
    a=np.array(im)
    for y in range(a.shape[0]):
        valid=np.where(a[y,:,3]>180)[0]
        if len(valid):
            nearest=valid[np.abs(np.arange(a.shape[1])[:,None]-valid).argmin(1)]
            bad=a[y,:,3]<255;a[y,bad]=a[y,nearest[bad]];a[y,:,3]=255
    return Image.fromarray(a).convert('RGB')

TILE=64
SOURCE_TILE=192
TERRAIN_SCALE=TILE/SOURCE_TILE
def seamless(im,vertical=True):
    """Join only a narrow edge band; keep the painted features at their original ratio."""
    a=np.array(im.convert('RGBA')).copy()
    band=3
    for i in range(band):
        # Identical outer edges; interior pixels retain their source size and orientation.
        average=((a[:,i,:3].astype(int)+a[:,-1-i,:3].astype(int))//2).astype('uint8')
        mix=(band-i)/band
        a[:,i,:3]=(a[:,i,:3]*(1-mix)+average*mix).astype('uint8')
        a[:,-1-i,:3]=(a[:,-1-i,:3]*(1-mix)+average*mix).astype('uint8')
    if vertical:
        for i in range(band):
            average=((a[i,:,:3].astype(int)+a[-1-i,:,:3].astype(int))//2).astype('uint8');mix=(band-i)/band
            a[i,:,:3]=(a[i,:,:3]*(1-mix)+average*mix).astype('uint8')
            a[-1-i,:,:3]=(a[-1-i,:,:3]*(1-mix)+average*mix).astype('uint8')
    a[:,:,3]=255
    return Image.fromarray(a)

def terrain_crop(source,box):
    im=opaque(source.crop(box))
    # One uniform factor for both axes, shared by grass, dirt and cave rock.
    return im.resize((round(im.width*TERRAIN_SCALE),round(im.height*TERRAIN_SCALE)),Image.Resampling.NEAREST).convert('RGBA')

forest=Image.open(P/'Forest Terrain Pixel Art Tileset (1).png').convert('RGBA')
cave=Image.open(P/'Pixel Art Cave and Lab Tileset (1).png').convert('RGBA')
soil=seamless(terrain_crop(forest,(903,21,1095,213)))
stone=seamless(terrain_crop(cave,(904,20,1096,212)))
soil.save(OUT/'ForestFill.png');stone.save(OUT/'CaveFill.png')
for prefix,source,box,base in [('Forest',forest,(240,53,432,212),soil),('Cave',cave,(240,484,432,644),stone)]:
    top=terrain_crop(source,box)
    cap=base.copy();cap.paste(top,(0,0))
    # The cropped surface is about 53 px tall, not stretched into a square tile.
    # Blend only its final six rows into the body texture underneath it.
    arr=np.array(cap).astype(float);body=np.array(base).astype(float)
    for y in range(top.height-6,top.height):
        q=(y-(top.height-6)+1)/6;arr[y]=arr[y]*(1-q)+body[y]*q
    arr[:,:,3]=255
    result=seamless(Image.fromarray(arr.astype('uint8')),vertical=False)
    for suffix in ['Top','TopLeft','TopRight']:result.save(OUT/(prefix+suffix+'.png'))

# Blend the supplied landscape views into one continuous panorama, then slice only for texture-size limits.
names=['Pixel Forest Tech Village Panorama.png','Pixel Forest IoT Village-4.png','Pixel-Art Forest Village Panorama-2.png','Enchanted Forest IoT Village-3.png']
views=[Image.open(P/'source-assets'/n).convert('RGB') for n in names];overlap=260
wide=views[0]
for im in views[1:]:
    joined=Image.new('RGB',(wide.width+im.width-overlap,724));joined.paste(wide,(0,0))
    a=np.array(wide.crop((wide.width-overlap,0,wide.width,724))).astype(float);b=np.array(im.crop((0,0,overlap,724))).astype(float)
    mix=np.linspace(0,1,overlap)[None,:,None];joined.paste(Image.fromarray((a*(1-mix)+b*mix).astype('uint8')),(wide.width-overlap,0));joined.paste(im.crop((overlap,0,im.width,724)),(wide.width,0));wide=joined
wide=wide.crop((0,0,6528,724))
for i in range(4):wide.crop((i*1632,0,(i+1)*1632,724)).save(OUT/f'Landscape{i}.png')

# Cave background uses repetition/cropping at its native ratio, not nonuniform scaling.
cave_bg=Image.open(P/'assets/CircuitQuest_Level1_Hutan_Sensor_All_Assets/CircuitQuest_Level1/Backgrounds/04_Cave_Wall_1536x384.png').convert('RGBA')
wall=Image.new('RGBA',(2400,624))
for x in range(0,2400,cave_bg.width):
    for y in range(0,624,cave_bg.height):wall.paste(cave_bg,(x,y))
wall.save(OUT/'CaveWallNative.png')
(OUT/'tile-scale.json').write_text(json.dumps({'worldTile':TILE,'sourceTile':SOURCE_TILE,'uniformScale':TERRAIN_SCALE,'novaCanvas':96,'novaVisibleHeight':73,'voltCanvas':48,'surfaceResizedWithoutStretch':True,'forestSource':'Forest Terrain Pixel Art Tileset (1).png','caveSource':'Pixel Art Cave and Lab Tileset (1).png'},indent=2))

# Contact sheet checks padding, anchors, source proportions and clipping.
contact=Image.new('RGB',(1080,14*154),(18,31,42));draw=ImageDraw.Draw(contact);font=ImageFont.truetype('C:/Windows/Fonts/consola.ttf',16)
row=0
for who,actions in manifest.items():
    for name,info in actions.items():
        draw.text((8,row*154+10),who+' / '+name,font=font,fill='#a1efd2')
        for i,f in enumerate(info['frames']):
            fr=Image.open(P/f);contact.paste(fr,(200+i*140,row*154+12),fr)
            draw.line((200+i*140,row*154+132,328+i*140,row*154+132),fill='#457675')
        row+=1
contact.save(P/'Animation-Review.png')
print('Prepared',sum(len(v['frames']) for a in manifest.values() for v in a.values()),'animation frames, seamless terrain and landscape.')
