const fs=require('node:fs'), path=require('node:path'), vm=require('node:vm'), assert=require('node:assert/strict');
const {extra,existing,mappedObjects,mappedInstances,runtimeInstances,runtimeObjects,styleSign}=require('../validate-map-baseline.cjs');
const dir=path.resolve(process.argv[2]??path.join(__dirname,'..'));
const read=(file)=>JSON.parse(fs.readFileSync(path.join(dir,file)));
const layout=(project,name)=>project.layouts.find(l=>l.name===name);
const code=l=>l.events.filter(e=>e.inlineCode).map(e=>'(function(){'+e.inlineCode.join('\n')+'})();').join('\n');
const files=['Project TA PPLG.json','Circuit Quest - NPC Animasi.json'];
for (const file of files) {
  const project=read(file), before=read(path.join('tmp',file.replace('.json','.before-level3.json')));
  for(const name of ['MainGame Scene','Level2 Scene']){
    const current=layout(project,name),baseline=layout(before,name);
    assert.deepEqual(runtimeInstances(existing(current.instances)),runtimeInstances(mappedInstances(name,baseline.instances)));
    const expected=mappedObjects(name,baseline.objects).map(o=>o.type==='TextObject::Text'&&name==='Level2 Scene'?styleSign(o):o);
    assert.deepEqual(runtimeObjects(existing(current.objects)),runtimeObjects(expected));
    assert.deepEqual(current.objectsFolderStructure.children.filter(o=>!extra(o.objectName)),baseline.objectsFolderStructure.children);
  }
  assert.match(code(layout(project,'Level2 Scene')),/continue-cloud/);
  const map=layout(project,'Stage3_Map');
  assert.equal(map.uiSettings.gridWidth,32);
  assert.equal(map.instances.filter(i=>i.name==='EnergyPlatform').length,3);
  assert.equal(map.instances.filter(i=>i.name==='Checkpoint').length,3);
  const filesByName=new Map(project.resources.resources.map(r=>[r.name,r.file]));
  const names=new Set(map.objects.map(o=>o.name));
  for (const i of map.instances) assert(names.has(i.name));
  for (const object of map.objects) {
    if(object.type==='TextObject::Text')assert(object.content?.isOutlineEnabled&&object.content.text);
    for (const a of object.animations??[]) for (const d of a.directions) for (const frame of d.sprites) assert(fs.existsSync(path.join(dir,filesByName.get(frame.image))),frame.image);
  }
  for (const i of map.instances.filter(i=>i.name.startsWith('Deck_'))) assert(map.instances.some(o=>o.name==='Solid'&&o.x===i.x&&o.y===i.y&&o.width===i.width&&o.height===i.height));
  for (const name of ['Stage3_Map','Stage3_Assembly','WinScreen Scene','GameOver Scene','Level2 Scene']) new Function('runtimeScene',code(layout(project,name)));
}
console.log('PASS: project assets, platform collisions, scene event syntax, and Stage 1/2 regression checks in both files.');

// Use the Stage 2 mock DOM and actor interfaces with the Stage 3 runtime events.
const fixture=fs.readFileSync(path.join(dir,'validate_level2.cjs'),'utf8');
const createDOM=vm.runInNewContext(fixture.slice(fixture.indexOf('class Element'),fixture.indexOf('class Vars'))+'\nmakeDOM');
const project=read(files[0]);
class Vars {
  constructor(definitions=[]) {
    this.children=new Map();
    for (const v of definitions) this.children.set(v.name,new Variable(v.value,v.children));
  }
  get(name) { if (!this.children.has(name)) this.children.set(name,new Variable()); return this.children.get(name); }
  getChild(name) { return this.get(name); }
}
class Variable extends Vars {
  constructor(value=0,children) { super(children); this.value=value; }
  setNumber(v) { this.value=v; }
  getAsNumber() { return Number(this.value); }
  setBoolean(v) { this.value=Boolean(v); }
  getAsBoolean() { return Boolean(this.value); }
  getAsString() { return String(this.value); }
}
const gameVars=new Vars(project.variables);
const game={getVariables:()=>gameVars,getRenderer:()=>({getCanvas:()=>null}),getInputManager:()=>({releaseAllPressedKeys(){}})};
function harness(name) {
  const current=layout(project,name), vars=new Vars(current.variables), objects=new Map(), input=new Set();
  const {dom,document}=createDOM();
  let replaced, timeStep=16;
  const behavior={activate(v){this.active=v;},isOnFloor:()=>true,isOnLadder:()=>false,getCurrentSpeed:()=>0,setCurrentSpeed(){},setCurrentFallSpeed(){},simulateLeftKey(){},simulateRightKey(){},simulateJumpKey(){},simulateLadderKey(){},simulateUpKey(){},simulateDownKey(){}};
  const actor=(i) => {
    const v=new Vars(i.initialVariables), platform=Object.create(behavior);
    return {x:i.x,y:i.y,width:i.width,height:i.height,name:i.name,animation:'Idle',visible:true,
      getX(){return this.x;},getY(){return this.y;},setX(x){this.x=x;},setPosition(x,y){this.x=x;this.y=y;},getWidth(){return this.width;},getHeight(){return this.height;},getName(){return this.name;},getVariables:()=>v,getBehavior:()=>platform,
      setSize(w,h){this.width=w;this.height=h;},setZOrder(){},hide(v=true){this.visible=!v;},isVisible(){return this.visible;},setOpacity(){},setColor(color){this.color=color;},getAnimationName(){return this.animation;},setAnimationName(n){this.animation=n;},setAnimationFrame(){},setAnimationSpeedScale(){},pauseAnimation(){},playAnimation(){},flipX(){},
      deleteFromScene(){objects.set(this.name,objects.get(this.name).filter(o=>o!==this));}};
  };
  const add=i=>{const group=objects.get(i.name)??[]; const o=actor(i); group.push(o); objects.set(i.name,group);return o;};
  current.instances.forEach(add);
  const scene={getName:()=>name,getVariables:()=>vars,getGame:()=>game,getElapsedTime:()=>timeStep,getObjects:n=>objects.get(n)??[],createObject:n=>add({name:n,x:0,y:0,width:0,height:0}),getLayer:()=>({getCameraWidth:()=>1280,getCameraHeight:()=>720,setCameraX(){},setCameraY(){}})};
  const context={runtimeScene:scene,document,window:{addEventListener(){},removeEventListener(){}},navigator:{},gdjs:{evtTools:{input:{isKeyPressed:(_,k)=>input.has(k)},runtimeScene:{replaceScene:(_,n)=>{replaced=n;}}}}};
  const run=new vm.Script('(function(){'+code(current)+'})()'), ctx=vm.createContext(context);
  const frame=(ms=16)=>{timeStep=ms; run.runInContext(ctx);};
  frame();
  const c=scene._cq;
  const move=(x,y)=>c.player.setPosition(x,y);
  const interact=(x,y)=>{move(x,y);input.add('e');frame();input.delete('e');frame();};
  return {scene,c,dom,vars,frame,move,interact,input,objects:scene.getObjects,replaced:()=>replaced};
}
const gv=(n)=>gameVars.get(n), bool=(n)=>gv(n).getAsBoolean();
gv('SensorHub').setNumber(1);
const factory=harness('Level2 Scene');
for (const n of ['ESP32','Relay','Pump','Servo','LED']) factory.c.collect(n);
factory.c.hp=4; factory.c.energy=28;
factory.frame();
factory.c.victory(); for(let i=0;i<46;i++)factory.frame(50);
factory.dom.get('#continue-cloud').onclick(); factory.input.add('e'); factory.frame();factory.input.delete('e');factory.frame();
assert.equal(factory.replaced(),'Stage3_Map');
assert.equal(gv('CurrentStage').getAsNumber(),3);
const map=harness('Stage3_Map');
const {c,vars,dom,frame,move,interact,objects}=map;
assert.equal(c.hp,4); assert.equal(c.energy,28); assert.equal(game._cqCloud.preview,false);
dom.get('#begin').onclick(); frame();
const glitch=objects('Glitch')[0];
move(glitch.getX()-88,glitch.getY()-24); map.input.add('j'); frame(); map.input.delete('j');
assert.equal(objects('GlitchFragment').length,2);
assert(!objects('Glitch').includes(glitch)); assert.equal(c.energy,23);
interact(5500,518); assert(!vars.get('BossStarted').getAsBoolean());
assert.equal(objects('TunnelGate')[0].getBehavior().active,true);
interact(2928,966); assert.equal(objects('TunnelGate')[0].getBehavior().active,true);
interact(3120,838); assert.equal(objects('TunnelGate')[0].getBehavior().active,false);
for (const [n,x,y] of [['HasPowerSupply',2348,166],['HasOLED',2508,518],['HasCloudDashboard',5000,230],['HasWiFi',5248,358]]) {
  move(x,y); frame(); assert(bool(n)); assert.equal(objects(n).length,0);
}
assert(!objects('HasMQTTKey')[0].visible);
interact(5380,518); move(5485,518); frame(); assert(bool('HasMQTTKey'));
assert.equal(c.partsMissing().length,0);
move(5212,518);frame();assert.equal(game._cqCloud.checkpoint,'Communication');
interact(5500,518); assert(vars.get('BossStarted').getAsBoolean()); assert(c.bossHud.hidden===false);
const tick=(seconds)=>{for(let i=0;i<seconds*20;i++)frame(50);};
const waitState=(state)=>{for(let i=0;i<240&&c.bossState!==state;i++)frame(50);assert.equal(c.bossState,state);};
assert.equal(vars.get('BossHP').getAsNumber(),120); c.useBossHit(); assert.equal(vars.get('BossHP').getAsNumber(),120);
waitState('attacking'); assert.equal(objects('BossWave').length,1); waitState('vulnerable'); assert.equal(objects('BossWave').length,0);
move(6175,518); map.input.add('j'); tick(.15); map.input.delete('j');
c.useBossHit(); assert.equal(vars.get('BossHP').getAsNumber(),110);
move(5780,358);
function dealTo(hp) {
  for(let i=0;i<24&&vars.get('BossHP').getAsNumber()>hp;i++) {
    waitState('vulnerable'); tick(.5); if(c.bossState==='vulnerable') c.useBossHit();
  }
  assert.equal(vars.get('BossHP').getAsNumber(),hp);
}
dealTo(80); assert.equal(vars.get('BossPhase').getAsNumber(),2);
waitState('attacking'); assert.equal(objects('BugZeroClone').length,2);
dealTo(40); assert.equal(vars.get('BossPhase').getAsNumber(),3);
frame(); assert.equal(objects('BossZone').length,1); assert(!objects('BossZone')[0]._active);
move(6460,518); waitState('attacking'); assert(objects('BossZone')[0]._active);
move(6460,294); waitState('follow-up'); assert.equal(objects('BossWave').length,1);
dealTo(0); frame(); assert(bool('BossDefeated')); assert(c.bossHud.hidden);
for (const attack of ['BossZone','BossWave','BugZeroClone']) assert.equal(objects(attack).length,0);
interact(7175,518); assert.equal(map.replaced(),undefined);
interact(6995,518); assert.match(dom.modalHtml,/Recovery Console/);
dom.get('#repair-2').onclick(); assert.equal(vars.get('RepairStep').getAsNumber(),0);
for (let i=0;i<3;i++) dom.get(`#repair-${i}`).onclick();
assert(bool('BugZeroRestored')); assert.equal(vars.get('RepairStep').getAsNumber(),3);
interact(7175,518); assert.equal(map.replaced(),'Stage3_Assembly');

const puzzle=harness('Stage3_Assembly');
assert(puzzle.vars.get('AssemblyStarted').getAsBoolean());
assert(puzzle.vars.get('AssemblyTimer').getAsNumber()<180);
const slot=(n)=>puzzle.dom.all('[data-slot]').find(s=>s.dataset.slot===n);
const chip=(n)=>puzzle.dom.all('[data-chip]').find(o=>o.dataset.chip===n);
puzzle.dom.get('#test').onclick(); assert.match(puzzle.dom.get('#assembly-feedback').textContent,/Lengkapi 11 slot/);
chip('ESP32').onclick(); slot('SensorHub').onclick(); assert.match(puzzle.dom.get('#assembly-feedback').textContent,/kembali ke baki/);
for (const element of puzzle.dom.all('[data-chip]')) {
  const id=element.dataset.chip;
  assert.equal(Boolean(element.disabled),false);
  slot(id).ondrop({preventDefault(){},dataTransfer:{getData:()=>id}});
  assert.equal(slot(id).dataset.placed,'');
}
puzzle.dom.get('#test').onclick(); const finish=puzzle.vars.get('AssemblyTimer').getAsNumber();
puzzle.frame(); assert.equal(puzzle.replaced(),'WinScreen Scene'); assert(bool('Stage3Completed'));
assert.equal(puzzle.vars.get('AssemblyTimer').getAsNumber(),finish);
assert.match(harness('WinScreen Scene').dom.modalHtml,/Smart Greenhouse aktif/);
const timeout=harness('Stage3_Assembly'); timeout.frame(180000); assert.equal(timeout.replaced(),'GameOver Scene');
const over=harness('GameOver Scene'); over.dom.get('#retry').onclick(); over.frame(); assert.equal(over.replaced(),'Stage3_Assembly');
const replay=harness('Stage3_Map'); replay.dom.get('#begin').onclick(); replay.frame();
assert.equal(replay.c.partsMissing().length,0); assert.equal(replay.objects('HasWiFi').length,0);
replay.c.hp=1; replay.c.damage(); for(let i=0;i<25;i++)replay.frame(50);
assert.equal(replay.replaced(),'GameOver Scene');
const hpOver=harness('GameOver Scene'); hpOver.dom.get('#retry').onclick(); hpOver.frame(); assert.equal(hpOver.replaced(),'Stage3_Map');
console.log('PASS: campaign data transfer, collectibles, tunnel, checkpoint, boss phase timing and damage, recovery, workbench, all 11 slots, winning, timeout, and HP retry.');
