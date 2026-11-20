// Pixel art cues derived from the existing collider coordinates and sprite frames.
const fs=require('node:fs'), path=require('node:path');
const png=require('./sprite_png.cjs');
const dir='assets/readability', prefix='Readability_';
const ink=[17,24,36,255], light=[255,229,157,255], amber=[244,166,67,255];
const resourceCache=new Set();
function write(file,im){if(!resourceCache.has(file)){png.write(file,im);resourceCache.add(file);}return file;}
function fill(im,x,y,w,h,color){
  for(let yy=y;yy<y+h;yy++)for(let xx=x;xx<x+w;xx++)if(xx>=0&&yy>=0&&xx<im.width&&yy<im.height)im.data.set(color,(yy*im.width+xx)*4);
}
function edge(width,stage){
  const name=`Edge_${stage}_${width}`, file=`${dir}/${name}.png`;
  if(!resourceCache.has(file)){
    const colors=[[155,198,113,255],[211,216,226,255],[123,221,224,255]];
    const im=png.blank(width,8);
    fill(im,0,0,width,6,ink);fill(im,2,1,width-4,2,colors[stage-1]);
    for(let x=24;x<width-16;x+=48)fill(im,x,3,12,2,colors[stage-1]);
    fill(im,1,1,4,5,light);fill(im,width-5,1,4,5,light);
    write(file,im);
  }
  return [name,file];
}
function gapIcon(kind){
  const file=`${dir}/${kind}.png`;
  if(!resourceCache.has(file)){
    const im=png.blank(24,20);
    const border=kind==='Drop'?[151,232,229,255]:light;
    fill(im,2,1,20,18,ink);fill(im,1,3,22,14,ink);
    fill(im,3,2,18,2,border);fill(im,3,16,18,2,border);
    if(kind==='Drop'){
      fill(im,10,5,4,5,border);fill(im,6,9,12,2,border);fill(im,8,11,8,2,border);fill(im,10,13,4,2,border);
    }else{
      fill(im,7,7,10,2,border);fill(im,5,8,3,2,border);fill(im,16,8,3,2,border);
      fill(im,3,10,17,2,border);fill(im,5,12,4,2,border);fill(im,15,12,4,2,border);
    }
    write(file,im);
  }
  return file;
}
function zoneArt(){
  const file=`${dir}/BossZone.png`;
  if(!resourceCache.has(file)){
    const im=png.blank(224,32);
    fill(im,0,2,224,30,[36,14,30,202]);
    fill(im,0,1,224,4,ink);fill(im,1,2,222,2,light);
    fill(im,0,25,224,7,ink);
    for(let x=-8;x<224;x+=15)for(let y=26;y<31;y++)fill(im,x+y-26,y,7,1,amber);
    for(let x=9;x<224;x+=28){
      fill(im,x,10,8,2,amber);fill(im,x+2,12,4,6,amber);fill(im,x+2,20,4,3,light);
    }
    write(file,im);
  }
  return file;
}
const outlinePath=(file,kind)=>`${dir}/${kind}_${file.replace(/\.[^.]+$/,'').replace(/[^a-z0-9_-]/gi,'_')}.png`;
function outlined(file,kind){
  // Keep the frame canvas, origin and collision mask exactly as authored.
  if(file.startsWith(dir+'/'))return file;
  const out=outlinePath(file,kind);
  if(!resourceCache.has(out)){
    const im=png.read(file),source=Buffer.from(im.data),radius=Math.max(1,Math.round(Math.min(im.width,im.height)/36));
    const cue=kind==='Enemy'?[250,137,143,255]:amber;
    for(let y=0;y<im.height;y++)for(let x=0;x<im.width;x++){
      const i=(y*im.width+x)*4;
      if(source[i+3]>=180)continue;
      let distance=Infinity;
      for(let oy=-radius-1;oy<=radius+1;oy++)for(let ox=-radius-1;ox<=radius+1;ox++){
        const nx=x+ox,ny=y+oy;
        if(nx>=0&&nx<im.width&&ny>=0&&ny<im.height&&source[(ny*im.width+nx)*4+3]>=180)
          distance=Math.min(distance,Math.abs(ox)+Math.abs(oy));
      }
      if(distance<=radius+1)im.data.set(distance<=radius?cue:ink,i);
    }
    write(out,im);
  }
  return out;
}
const layoutConfig={
  'MainGame Scene':{stage:1,gaps:[['Gap',1536,1632],['Drop',3072,3264]], hazards:['Thorn','Short'],enemies:['Bug','Glitch']},
  'Level2 Scene':{stage:2,gaps:[['Gap',1920,2304],['Drop',3072,3264]], hazards:['Waste','Short','Laser','EnemyPulse'],enemies:['Bug','Glitch']},
  'Stage3_Map':{stage:3,gaps:[['Drop',2656,2848],['Drop',3712,3840]], hazards:['Firewall','SignalHazard','EnemyPulse','BossWave'],enemies:['Glitch','GlitchFragment','DroneMalware','BugZero','BugZeroClone']},
};
function fixCaveLedge(name,instances) {
  if(name!=='MainGame Scene')return instances;
  return instances.map(i=>{
    const ledge=i.x===3648&&i.y===960&&['Solid','Terrain_Cave_3648_960'].includes(i.name);
    const decoration=i.name==='Mushroom'&&i.x===3815&&i.y===906;
    // 160 px exceeded the measured full jump; leave 10 px of clearance.
    return ledge||decoration?{...i,y:i.y+16}:i;
  });
}
function styleSign(o){
  const color=(value,fallback)=>typeof value==='string'?value:value?`${value.r};${value.g};${value.b}`:fallback;
  o.content={
    text:o.string??'',font:o.font??'',characterSize:o.characterSize??22,
    bold:o.bold??true,italic:o.italic??false,underlined:o.underlined??false,
    color:color(o.color,'159;238;255'),textAlignment:o.textAlignment??'left',
    verticalTextAlignment:'top',lineHeight:0,
    isShadowEnabled:false,shadowColor:'0;0;0',shadowOpacity:127,shadowDistance:2,shadowAngle:90,shadowBlurRadius:2,
    ...o.content,
    isOutlineEnabled:true,outlineThickness:3,outlineColor:'5;17;28',smoothed:false,
  };
  return o;
}
function install(project,sprite,instance){
  fs.mkdirSync(dir,{recursive:true});
  const known=new Set(project.resources.resources.map(r=>r.name));
  const resource=file=>{if(!known.has(file)){known.add(file);project.resources.resources.push({file,name:file,kind:'image',metadata:'',smoothed:false,userAdded:true});}return file;};
  for(const [name,{stage,gaps,hazards,enemies}] of Object.entries(layoutConfig)){
    const scene=project.layouts.find(s=>s.name===name);
    scene.instances=fixCaveLedge(name,scene.instances.filter(i=>!i.name.startsWith(prefix)));
    scene.objects=scene.objects.filter(i=>!i.name.startsWith(prefix));
    const children=scene.objectsFolderStructure.children;
    scene.objectsFolderStructure.children=children.filter(i=>!i.objectName?.startsWith(prefix));
    const defs=new Set();
    function place(name,file,x,y,w,h){
      name=prefix+name;
      if(!defs.has(name)){
        defs.add(name);
        scene.objects.push(sprite(name,resource(file)));
        scene.objectsFolderStructure.children.push({objectName:name});
      }
      scene.instances.push({...instance(name,x,y,w,h),zOrder:6});
    }
    const tops=scene.instances.filter(i=>i.name==='Solid'&&i.width>=96&&i.y>=0).sort((a,b)=>a.y-b.y||a.x-b.x);
    const runs=[];
    for(const t of tops){
      const last=runs.at(-1);
      if(last?.y===t.y&&t.x<=last.x+last.width)last.width=Math.max(last.width,t.x+t.width-last.x);
      else runs.push({x:t.x,y:t.y,width:t.width});
    }
    for(const {x,y,width} of runs){
      const [edgeName,file]=edge(Math.round(width),stage);
      place(edgeName,file,x,y,width,8);
    }
    for(const [kind,left,right] of gaps){
      const file=gapIcon(kind);
      if(kind==='Drop')place(kind,file,left-51,569,48,40);
      else for(const x of [left-50,right+2])place(kind,file,x,566,48,40);
    }
    for(const object of scene.objects){
      if((stage===2||stage===3)&&object.type==='TextObject::Text')styleSign(object);
      if(stage===3&&object.name==='BossZone'){
        const frame=object.animations[0].directions[0].sprites[0],file=zoneArt();
        if(frame.image!==file){
          const original=png.read(frame.image);
          for(const polygon of frame.customCollisionMask)for(const point of polygon){
            point.x*=224/original.width;point.y*=32/original.height;
          }
          frame.image=resource(file);
        }
      }
      const kind=hazards.includes(object.name)?'Hazard':enemies.includes(object.name)?'Enemy':null;
      if(!kind)continue;
      for(const animation of object.animations)for(const direction of animation.directions)for(const frame of direction.sprites)
        frame.image=resource(outlined(frame.image,kind));
    }
  }
}
module.exports={install,outlinePath,layoutConfig,fixCaveLedge,styleSign};
