// Import Tactical Hero without rebuilding the level or replacing embedded UI art.
const fs=require('fs'),path=require('path'),assert=require('assert');
const png=require('./sprite_png.cjs'),root=__dirname;
const source='source-assets/Tactical Hero Animation Sprite Sheet.cleaned.png';
const sheet=png.read(path.join(root,source));
assert(sheet.width===1536&&sheet.height===1024);
// Discard near-transparent matte remaining after imagegen background removal.
for(let i=0;i<sheet.data.length;i+=4)if(sheet.data[i+3]<32)sheet.data.fill(0,i,i+4);
const legacySource='Nova_Complete_Sprite_Sheet.png',legacy=png.read(path.join(root,legacySource));
const rows=[[8,159,154],[162,290,286],[294,419,414],[423,545,540],[548,663,658],[666,788,783],[791,902,895],[905,1014,992]];
const actions=[['Idle',0,5,5,true],['Run',2,8,12,true],['Jump',3,6,9,false],['Climb',-1,4,7,true],
  ['Pulse',4,6,13,false],['Interact',5,6,9,false],['Hurt',6,4,10,false],['Defeat',7,6,7,false],['ClimbSide',-1,4,7,true],['Walk',1,8,9,true]];
const dir='assets/level1/nova-tactical';fs.mkdirSync(path.join(root,dir),{recursive:true});
const manifestFile=path.join(root,'assets/level1/animation-manifest.json');
const manifest=JSON.parse(fs.readFileSync(manifestFile,'utf8'));
const backupManifest=path.join(root,'source-assets/animation-manifest.before-tactical.json');
if(!fs.existsSync(backupManifest))fs.copyFileSync(manifestFile,backupManifest);
const nova={},review=png.blank(8*144,10*144,[18,31,42,255]);
for(let row=0;row<actions.length;row++){
  const [name,sourceRow,count,fps,loop]=actions[row];
  const info=nova[name]={frames:[],fps,loop,source:sourceRow<0?legacySource:source,sourceRow,sourceRects:[],placements:[],fallback:sourceRow<0};
  for(let i=0;i<count;i++){
    const frame=png.blank(128,128);let box,placement;
    if(sourceRow<0){
      const r=name==='Climb'?5:4;box=[i*48,r*64,(i+1)*48,(r+1)*64];placement=[22,12,83,111];
      png.blit(frame,legacy,box,...placement);
    }else{
      const [top,bottom,baseline]=rows[sourceRow],anchor=258+i*139;
      box=[194+i*139,top,326+i*139,bottom];
      if(name==='Pulse'&&i===2)box[2]=620;
      if(name==='Pulse'&&i===3){box[0]=628;box[2]=768;}
      if(name==='Pulse'&&i===4)box[0]=773;
      const scale=.68;
      placement=[Math.round(64+(box[0]-anchor)*scale),Math.round(120+(top-baseline)*scale),Math.round((box[2]-box[0])*scale),Math.round((bottom-top)*scale)];
      png.blit(frame,sheet,box,...placement);
    }
    const bounds=png.bounds(frame);assert(bounds&&bounds[0]>0&&bounds[1]>0&&bounds[2]<128&&bounds[3]<128,`${name} ${i}: clipping`);
    const file=`${dir}/Nova_${name}_${String(i).padStart(2,'0')}.png`;
    png.write(path.join(root,file),frame);info.frames.push(file);info.sourceRects.push(box);info.placements.push(placement);
    png.blit(review,frame,[0,0,128,128],i*144+8,row*144+8);
  }
}
manifest.Nova=nova;fs.writeFileSync(manifestFile,JSON.stringify(manifest,null,2)+'\n');
png.write(path.join(root,'Nova-Tactical-Animation-Review.png'),review);
fs.writeFileSync(path.join(root,dir,'README.md'),
  '# Nova Tactical Hero\n\nOriginal: `Tactical Hero Animation Sprite Sheet.png`. Cleaned atlas: `'+source+'`.\n\n'+
  'Built-in imagegen prompt: remove background, grid and labels; preserve every hero, pose, effect, position and the 1536x1024 canvas. Deterministic slicing follows.\n\n'+
  '| Review row | Action | Frames | FPS | Source row (zero based) |\n|---|---|---|---|---|\n'+
  actions.map(([name,r,n,fps],i)=>`| ${i+1} | ${name} | ${n} | ${fps} | ${r<0?'Legacy climb fallback':r} |`).join('\n')+
  '\n\nFive Idle poses are visible despite the six-frame label. Climb/ClimbSide use the previous complete sheet because Tactical Hero has no climbing poses. Attack maps to Pulse. Frames share a 128x128 canvas and 96x96 display size with existing masks. One scale preserves source proportions; per-row floor anchors preserve jump lift and defeat posture. Walk at speed 15–139; Run at 140+.\n');
if(!process.argv.includes('--prepare-only')){
  const runtime=fs.readFileSync(path.join(root,'level1-runtime.js'),'utf8'),start='// Fixed 128x128',end='c.lastY=p.getY();';
  const block=runtime.slice(runtime.indexOf(start),runtime.indexOf(end)+end.length);assert(block.includes("novaAction='Walk'"));
  for(const filename of ['Project TA PPLG.json','Circuit Quest - NPC Animasi.json']){
    const file=path.join(root,filename);if(!fs.existsSync(file))continue;
    const project=JSON.parse(fs.readFileSync(file,'utf8')),backup=file.replace(/\.json$/,'.before-nova-tactical.json');
    if(!fs.existsSync(backup))fs.copyFileSync(file,backup);
    const scene=project.layouts.find(s=>s.name==='MainGame Scene'),obj=scene.objects.find(o=>o.name==='Nova');
    const template=obj.animations[0].directions[0].sprites[0],oldImages=new Set(obj.animations.flatMap(a=>a.directions.flatMap(d=>d.sprites.map(s=>s.image))));
    obj.animations=actions.map(([name])=>({name,useMultipleDirections:false,directions:[{looping:nova[name].loop,timeBetweenFrames:1/nova[name].fps,sprites:nova[name].frames.map(image=>({...structuredClone(template),image}))}]}));
    const event=scene.events.find(e=>e.type==='BuiltinCommonInstructions::JsCode'),code=event.inlineCode.join('\n'),a=code.indexOf(start),b=code.indexOf(end)+end.length;
    assert(a>=0&&b>a);event.inlineCode=(code.slice(0,a)+block+code.slice(b)).split('\n');
    const body={...project};delete body.resources;const text=JSON.stringify(body);
    project.resources.resources=project.resources.resources.filter(r=>!oldImages.has(r.name)||text.includes(r.name));
    for(const image of Object.values(nova).flatMap(a=>a.frames))if(!project.resources.resources.some(r=>r.name===image))project.resources.resources.push({name:image,file:image,kind:'image',metadata:'',smoothed:false,userAdded:true});
    fs.writeFileSync(file,JSON.stringify(project,null,2)+'\n');console.log('Updated '+filename);
  }
}
console.log('Prepared 49 Tactical Hero frames + 8 legacy climb frames / 10 game actions.');
