// Headless smoke checks against the installed GDevelop platform behavior.
// Usage: node validate_platform_physics.cjs "path/to/GDJS/Runtime"
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const root=process.argv[2];
assert(root,'Provide the installed GDJS Runtime directory');
const ctx=vm.createContext({console,performance,crypto});
for(const name of ['libs/jshashtable','libs/rbush','logger','gd','polygon','variable','variablescontainer',
 'force','runtimebehavior','runtimeobject','Extensions/PlatformBehavior/platformruntimebehavior','Extensions/PlatformBehavior/platformerobjectruntimebehavior']){
 const file=path.join(root,name+'.js');
 vm.runInContext(fs.readFileSync(file,'utf8'),ctx,{filename:file});
}
const gd=ctx.gdjs;
const project=JSON.parse(fs.readFileSync('Project TA PPLG.json'));
function load(name,x,y) {
 const layout=project.layouts.find(s=>s.name===name),defs=new Map(layout.objects.map(o=>[o.name,o]));
 let id=0,elapsed=1000/60;
 const container={getScene(){return this;},getGame:()=>({isInGameEdition:()=>false,getInputManager:()=>({isKeyPressed:()=>false})}),
  getLayer:()=>({getElapsedTime:()=>elapsed}),getProfiler:()=>null,onChildrenLocationChanged(){},createNewUniqueId:()=>++id};
 function make(i) {
  const def=defs.get(i.name),obj=new gd.RuntimeObject(container,def,i);
  const frame=def.animations[0].directions[0].sprites[0];
  const data=fs.readFileSync(frame.image),sw=data.readUInt32BE(16),sh=data.readUInt32BE(20);
  obj.getWidth=()=>i.width;obj.getHeight=()=>i.height;
  if(frame.hasCustomCollisionMask&&frame.customCollisionMask.length) {
   obj.updateHitBoxes=()=>{
    obj.hitBoxes=frame.customCollisionMask.map(vertices=>{
     const box=new gd.Polygon();
     box.vertices=vertices.map(v=>[obj.getX()+(v.x-frame.originPoint.x)*i.width/sw,obj.getY()+(v.y-frame.originPoint.y)*i.height/sh]);
     return box;
    });
   };
  }
  obj.setPosition(i.x,i.y);obj.onCreated();
  return obj;
 }
 const platforms=layout.instances.filter(i=>defs.get(i.name).behaviors.some(b=>b.name==='Platform')).map(make);
 const player=make({...layout.instances.find(i=>i.name==='Nova'),x,y});
 const behavior=player.getBehavior('Platformer');
 function run(frames,keys=[],afterStep=()=>{}){
  let min=player.getY();
  for(let i=0;i<frames;i++){
   for(const p of platforms)p.getBehavior('Platform').stepPreEvents(container);
   for(const key of keys)behavior['simulate'+key+'Key']();
   behavior.stepPreEvents(container);
   min=Math.min(min,player.getY());
   afterStep(i);
  }
  return min;
 }
 return {player,behavior,run,platforms};
}
const land=(h,y,label)=>{
 assert(h.behavior.isOnFloor(),label+' did not land');
 assert(Math.abs(h.player.getY()-y)<3,label+' landed at '+h.player.getY());
};
const forest=load('MainGame Scene',1400,518);
forest.run(12);land(forest,518,'Forest start');
const jumpTop=forest.run(58,['Right','Jump']);forest.run(40);
assert(518-jumpTop>145,'Full jump cannot reach the highest required shelf: '+jumpTop);
assert(forest.player.getX()+33>=1632,'Did not cross the bridge gap');
land(forest,518,'Forest bridge');
const forestTap=load('MainGame Scene',1000,518);
forestTap.run(12);let short=forestTap.run(1,['Jump']);short=Math.min(short,forestTap.run(70));
assert(short>jumpTop,'Tap jump did not differ from held jump');
const factory=load('Level2 Scene',1680,518);
factory.run(12);land(factory,518,'Factory start');
factory.run(63,['Right','Jump']);factory.run(48);
land(factory,390,'Factory catwalk');
function climbStep(scene,x,lowerY,higherY,label){
 const attempts=[];
 for(const distance of [138,122,108,94,82,70]){
  const h=load(scene,x-distance,lowerY-90);
  h.run(12);land(h,lowerY-90,label+' approach');
  h.run(43,['Right','Jump']);h.run(45);
  if(h.behavior.isOnFloor()&&Math.abs(h.player.getY()-(higherY-90))<3)return;
  attempts.push([distance,Math.round(h.player.getX()),Math.round(h.player.getY())]);
 }
 assert.fail(label+' unavailable: '+JSON.stringify(attempts));
}
climbStep('MainGame Scene',652,608,467,'DHT22 platform');
climbStep('MainGame Scene',3648,1120,976,'Cave ledge');
for(const [x,from,to] of [[4416,1120,1024],[4608,1024,928],[4800,928,832],[4992,832,736],[5184,736,608]])
 climbStep('MainGame Scene',x,from,to,'Cave exit x='+x);
climbStep('Level2 Scene',704,608,464,'Relay platform');
for(const [x,from,to] of [[4832,1056,960],[5024,960,864],[5216,864,768],[5408,768,672],[5600,672,608]])
 climbStep('Level2 Scene',x,from,to,'Evacuation stairs x='+x);
const cloud=load('Stage3_Map',3728,966);
cloud.run(12);land(cloud,966,'Tower tunnel start');
cloud.run(160,['Ladder','Up']);
assert(cloud.player.getY()<510,'Tunnel exit ladder did not ascend: '+cloud.player.getY());
cloud.run(47,['Right']);cloud.run(35);
land(cloud,518,'Tower tunnel ladder exit');
for(const [x,from,to] of [[1792,608,480],[2016,480,352],[2272,352,256]])
 climbStep('Stage3_Map',x,from,to,'Power Supply approach x='+x);
const dashboard=load('Stage3_Map',4816,518);
dashboard.run(12);land(dashboard,518,'Dashboard ladder approach');
dashboard.run(145,['Ladder','Up']);dashboard.run(45,['Right']);dashboard.run(45);
land(dashboard,230,'Dashboard');
dashboard.run(43,['Right']);dashboard.run(50);
land(dashboard,358,'WiFi shelf');
const moving=load('Stage3_Map',591,331);
moving.run(12);land(moving,331,'Moving platform approach');
const lift=moving.platforms.find(x=>x.getName()==='EnergyPlatform');
moving.run(37,[],i=>lift.setPosition(560+i,421-i/3));
assert(moving.behavior.isOnFloor()&&moving.player.getX()>620&&moving.player.getY()<322,'Moving platform did not carry Nova');
console.log('PASS native platform behavior: grounded movement, short/held jump, bridge, mission shelves, cave stairs, factory catwalk and evacuation stairs, tower ladders and moving platform.');
