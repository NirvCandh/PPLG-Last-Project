const fs=require('fs'),path=require('path'),assert=require('assert'),vm=require('vm');
const png=require('./sprite_png.cjs'),root=__dirname;
const load=f=>JSON.parse(fs.readFileSync(path.join(root,f),'utf8'));
const manifest=load('assets/level1/animation-manifest.json').Nova,cache={};let count=0;
for(const [action,info] of Object.entries(manifest)){
 if(!cache[info.source]){const im=png.read(path.join(root,info.source));if(!info.fallback)for(let i=0;i<im.data.length;i+=4)if(im.data[i+3]<32)im.data.fill(0,i,i+4);cache[info.source]=im;}
 for(let i=0;i<info.frames.length;i++){
  const im=png.read(path.join(root,info.frames[i]));assert.equal(im.width,128);assert.equal(im.height,128);
  const b=png.bounds(im);assert(b&&b[0]>0&&b[1]>0&&b[2]<128&&b[3]<128,action+' clipped');
  const expected=png.blank(128,128);png.blit(expected,cache[info.source],info.sourceRects[i],...info.placements[i]);
  assert(im.data.equals(expected.data),action+' extraction differs from source');
  for(const [x,y] of [[0,0],[127,0],[0,127],[127,127]])assert.equal(im.data[(y*128+x)*4+3],0);
  count++;
 }
}
assert.equal(count,57);assert.equal(manifest.Idle.frames.length,5);assert.equal(manifest.Walk.frames.length,8);
assert(manifest.Climb.fallback&&manifest.ClimbSide.fallback);
const start='// Fixed 128x128',end='c.lastY=p.getY();';
const block=code=>code.slice(code.indexOf(start),code.indexOf(end)+end.length);
for(const filename of ['Project TA PPLG.json','Circuit Quest - NPC Animasi.json']){
 const project=load(filename),before=load(filename.replace(/\.json$/,'.before-nova-tactical.json'));
 const scene=project.layouts.find(s=>s.name==='MainGame Scene'),oldScene=before.layouts.find(s=>s.name===scene.name);
 const nova=scene.objects.find(o=>o.name==='Nova'),oldNova=oldScene.objects.find(o=>o.name==='Nova');
 assert.deepEqual(nova.animations.map(a=>a.name),Object.keys(manifest));
 const template=oldNova.animations[0].directions[0].sprites[0];
 for(const a of nova.animations){const d=a.directions[0],info=manifest[a.name];
  assert.deepEqual(d.sprites.map(f=>f.image),info.frames);assert.equal(d.looping,info.loop);assert.equal(d.timeBetweenFrames,1/info.fps);
  for(const frame of d.sprites)assert.deepEqual({...frame,image:template.image},template);
 }
 for(const r of project.resources.resources)assert(fs.existsSync(path.resolve(root,r.file)),'Missing '+r.file);
 const event=scene.events.find(e=>e.type==='BuiltinCommonInstructions::JsCode'),oldEvent=oldScene.events.find(e=>e.type==='BuiltinCommonInstructions::JsCode');
 const code=event.inlineCode.join('\n'),oldCode=oldEvent.inlineCode.join('\n');new Function('runtimeScene',code);
 assert.equal(block(code),block(fs.readFileSync(path.join(root,'level1-runtime.js'),'utf8')));
 // Later stages legitimately add scenes/resources and scene-transition code. Compare
 // character data and the Stage 1 map against the snapshot immediately before Level 2.
 const level2Backup=filename.replace(/\.json$/,'.before-level2.json');
 if(fs.existsSync(path.join(root,level2Backup))){
  const baseline=load(level2Backup).layouts.find(s=>s.name===scene.name);
  const {existing,mappedObjects,mappedInstances}=require('./validate-map-baseline.cjs');
  assert.deepEqual(existing(scene.objects),mappedObjects(scene.name,baseline.objects),'Stage 1 character/object geometry changed');
  const editorBackup='Circuit Quest - Editor Backup Before Level 2.json';
  const map=filename==='Project TA PPLG.json'&&fs.existsSync(path.join(root,editorBackup))?load(editorBackup).layouts.find(s=>s.name===scene.name):baseline;
  assert.deepEqual(existing(scene.instances),mappedInstances(scene.name,map.instances),'Stage 1 map changed');
  const stage2=project.layouts.find(s=>s.name==='Level2 Scene');
  if(stage2)assert.deepEqual(stage2.objects.find(o=>o.name==='Nova'),nova,'Level 2 Nova differs');
 }else{
  event.inlineCode=code.replace(block(code),block(oldCode)).split('\n');nova.animations=oldNova.animations;
  for(const p of [project,before])p.resources.resources=p.resources.resources.filter(r=>!/^assets\/level1\/nova-(complete|tactical)\//.test(r.file));
  assert.deepEqual(project,before,'Changes outside Nova animations, resource registration, and animation selection');
 }
}
console.log('PASS: 57 transparent frames (49 tactical + 8 climbing), 10 actions, exact source extraction, unchanged masks, 96px instances, valid resources/runtime, and preserved map/NPC/gameplay data in both projects.');
