// Execute ALL installed events, with shared game state across scenes.
const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const fixture=fs.readFileSync('validate_level2.cjs','utf8');
const createDOM=vm.runInNewContext(fixture.slice(fixture.indexOf('class Element'),fixture.indexOf('class Vars'))+'\nmakeDOM');
const project=JSON.parse(fs.readFileSync('Project TA PPLG.json'));
class Vars{constructor(defs=[]){this.children=new Map(defs.map(v=>[v.name,new Variable(v.value,v.children)]));}get(n){if(!this.children.has(n))this.children.set(n,new Variable());return this.children.get(n);}getChild(n){return this.get(n);}}
class Variable extends Vars{constructor(value=0,children){super(children);this.value=value;}getAsNumber(){return Number(this.value);}setNumber(v){this.value=v;}getAsBoolean(){return Boolean(this.value);}setBoolean(v){this.value=!!v;}getAsString(){return String(this.value);}}
function game(){const vars=new Vars(project.variables),canvas={style:{transform:'scale(1)'},focus(){},getBoundingClientRect:()=>({left:0,top:0,width:1280,height:720})};return {getVariables:()=>vars,getRenderer:()=>({getCanvas:()=>canvas}),getInputManager:()=>({releaseAllPressedKeys(){}})};}
function harness(name,shared=game()){
 const current=project.layouts.find(s=>s.name===name),vars=new Vars(current.variables),objects=new Map(),input=new Set(),{dom,document}=createDOM();
 let replaced,timeStep=16;
 const behavior={activate(v){this.active=v;},isOnFloor(){return this.grounded??true;},isOnLadder(){return false;},getCurrentSpeed(){return this.speed||0;},setCurrentSpeed(v){this.speed=v;},setCurrentFallSpeed(){},simulateLeftKey(){},simulateRightKey(){},simulateJumpKey(){},simulateLadderKey(){},simulateUpKey(){},simulateDownKey(){}};
 const actor=i=>{const v=new Vars(i.initialVariables),b=Object.create(behavior);return {x:i.x,y:i.y,width:i.width,height:i.height,name:i.name,animation:'Idle',visible:true,frame:0,getX(){return this.x;},getY(){return this.y;},setX(x){this.x=x;},setY(y){this.y=y;},setPosition(x,y){this.x=x;this.y=y;},getWidth(){return this.width;},getHeight(){return this.height;},getName(){return this.name;},getVariables:()=>v,getBehavior:()=>b,setSize(w,h){this.width=w;this.height=h;},setZOrder(){},hide(v=true){this.visible=!v;},isVisible(){return this.visible;},setOpacity(v){this.opacity=v;},setColor(){},getAnimationName(){return this.animation;},setAnimationName(v){this.animation=v;},setAnimation(v){this.animation=v;},setAnimationFrame(v){this.frame=v;},getAnimationFrame(){return this.frame;},setAnimationSpeedScale(){},pauseAnimation(){},playAnimation(){},flipX(){},deleteFromScene(){objects.set(this.name,objects.get(this.name).filter(o=>o!==this));}};};
 const add=i=>{const list=objects.get(i.name)||[],o=actor(i);list.push(o);objects.set(i.name,list);return o;};current.instances.forEach(add);
 const scene={getName:()=>name,getVariables:()=>vars,getGame:()=>shared,getElapsedTime:()=>timeStep,getObjects:n=>objects.get(n)||[],createObject:n=>add({name:n,x:0,y:0,width:10,height:10}),getLayer:()=>({getCameraWidth:()=>1280,getCameraHeight:()=>720,setCameraX(){},setCameraY(){}})};
 const listeners=new Map();document.addEventListener=(n,fn)=>{const set=listeners.get(n)||new Set();set.add(fn);listeners.set(n,set);};document.removeEventListener=(n,fn)=>listeners.get(n)?.delete(fn);
 // Canvas bounds are intentionally absent: UI setup falls back to viewport sizing.
 const window={addEventListener(){},removeEventListener(){},matchMedia:()=>({matches:false})};
 const ctx=vm.createContext({runtimeScene:scene,document,ResizeObserver:class{observe(){}disconnect(){}},window,navigator:{},console,gdjs:{evtTools:{input:{isKeyPressed:(_,k)=>input.has(k)},runtimeScene:{replaceScene:(_,n)=>{replaced=n;},stopGame(){}}}}});
 const runs=current.events.filter(e=>e.inlineCode).map(e=>new vm.Script('(function(){'+e.inlineCode.join('\n')+'})()'));
 const frame=(ms=16)=>{timeStep=ms;for(const run of runs)run.runInContext(ctx);};
 frame();const c=scene._cq;
 return {scene,c,dom,input,vars,frame,game:shared,listeners,window,replaced:()=>replaced,begin(){dom.get('#begin').onclick();frame();},tick(seconds){for(let i=0;i<Math.ceil(seconds*20);i++)frame(50);},key(k){input.add(k);frame();input.delete(k);frame();}};
}
for(const file of ['Project TA PPLG.json','Circuit Quest - NPC Animasi.json']){
 const g=JSON.parse(fs.readFileSync(file));
 for(const r of g.resources.resources)assert(fs.existsSync(r.file),'Missing resource '+r.file);
 for(const s of g.layouts){for(const e of s.events.filter(e=>e.inlineCode))new Function('runtimeScene',e.inlineCode.join('\n'));if(['MainGame Scene','Level2 Scene','Stage3_Map'].includes(s.name))assert.equal(s.events.filter(e=>e.journeyFeature).length,1);}
 console.log('PASS resources and all event syntax: '+file);
}
const h=harness('MainGame Scene');h.begin();
const {c}=h,j=c.journey;
assert.equal(j.coins,0);assert.equal(c.buy('shield'),false);
c.shop();assert.match(h.dom.modalHtml,/VOLT \/ SUPPLY SHOP/);assert(c.modal);assert.equal(c.buy('shield'),false);assert.equal(j.coins,0);
c.close();
// Real pulse collision must grant exactly one reward, and keep original battery loot.
const bug=h.scene.getObjects('Bug')[0];c.player.setPosition(bug.getX()-88,bug.getY()-24);h.key('j');
assert(!h.scene.getObjects('Bug').includes(bug));assert.equal(j.coins,8);bug.deleteFromScene(h.scene);assert.equal(j.coins,8);
c.award('test',70);assert.equal(j.coins,78);c.hp=2;c.energy=15;c.shop();
const frozen=c.t;h.tick(.5);assert.equal(c.t,frozen,'shop did not pause gameplay');
assert(c.buy('heart'));assert.equal(c.hp,4);assert.equal(j.coins,66);
assert(c.buy('energy'));assert.equal(c.energy,100);assert.equal(j.coins,56);assert.equal(c.buy('energy'),false);
assert(c.buy('shield'));assert(c.buy('shield'));assert.equal(j.shields,2);assert.equal(j.coins,6);assert.equal(c.buy('shield'),false);assert.equal(c.buy('bogus'),false);
c.close();c.invuln=0;const hp=c.hp;c.damage();assert.equal(c.hp,hp);assert.equal(j.shields,1);c.damage();assert.equal(j.shields,1);c.invuln=0;c.damage();assert.equal(j.shields,0);c.invuln=0;c.damage();assert.equal(c.hp,hp-1);
c.dead=false;c.modal=false;c.hp=4;c.energy=63;c.power=true;c.inv.DHT22=true;
assert.equal(c.travel('Level2 Scene'),false,'locked portal allowed travel');
c.victory();assert.equal(c.quakeLeft,2.2);assert(c.modal);c.close();assert(c.modal);assert.equal(c.travel('Level2 Scene'),false);h.frame();assert(h.dom.get('#next-stage').disabled);h.tick(2.3);
assert.equal(c.quakeLeft,0);assert.equal(h.game.getRenderer().getCanvas().style.transform,'scale(1)');assert.equal(h.dom.get('#next-stage').disabled,false);
h.dom.get('#next-stage').onclick();assert(!c.modal);assert.equal(c.player.getX(),6350);assert.equal(h.replaced(),undefined);
h.key('e');assert.equal(h.replaced(),'Level2 Scene');assert.equal(h.game.getVariables().get('CurrentStage').getAsNumber(),2);
const l2=harness('Level2 Scene',h.game);l2.begin();assert.equal(l2.c.hp,4);assert.equal(l2.c.energy,63);assert.equal(l2.c.journey.coins,6);
l2.c.escapeStarted=true;l2.c.escapeLeft=37;l2.c.power=true;
assert(l2.c.travel('MainGame Scene','exit'));l2.frame();assert.equal(l2.replaced(),'MainGame Scene');
const back=harness('MainGame Scene',h.game);back.begin();assert(back.c.inv.DHT22&&back.c.power);assert.equal(back.c.hp,4);assert.equal(back.c.player.getX(),6350);assert.equal(back.scene.getObjects('Bug').length,h.scene.getObjects('Bug').length);assert.equal(back.c.journey.coins,6);
back.c.victory();assert(!back.c.quakeLeft,'earthquake replayed on revisit');
console.log('PASS pulse kill rewards, duplicate prevention, shop funds/items/caps, pause, shields, earthquake timing, physical portal and round-trip inventory/HP/coins.');
// Complete factory with the real puzzle before travelling through its physical portal.
const factory=harness('Level2 Scene',h.game);factory.begin();factory.c.close();
assert(factory.c.escapeStarted);assert(factory.c.escapeLeft<37&&factory.c.escapeLeft>36,'escape timer not restored across portals');
for(const n of ['ESP32','Relay','Pump','Servo','LED'])factory.c.collect(n);
factory.c.power=true;factory.c.escapeDone=true;factory.c.assembly();
for(const n of ['ESP32','Relay','Pump','Servo','LED']){factory.dom.all('[data-chip]').find(e=>e.dataset.chip===n).onclick();factory.dom.all('[data-slot]').find(e=>e.dataset.slot===n).onclick();}
const wires={'SensorHub.DATA':'GPIO34','Relay.VCC':'5V','Relay.GND':'GND','Relay.IN':'GPIO26','Pump.PLUS':'RELAY_NO','Pump.MINUS':'GND','Servo.VCC':'5V','Servo.GND':'GND','Servo.SIGNAL':'GPIO18','LED.ANODE':'GPIO2_R','LED.CATHODE':'GND'};
for(const [wire,port]of Object.entries(wires))factory.dom.get(`[data-wire="${wire}"]`).value=port;
factory.dom.get('#logic').value='dry';factory.dom.get('#test').onclick();assert(factory.c.assembled);assert(factory.c.quakeLeft>0);factory.tick(2.3);factory.dom.get('#continue-cloud').onclick();factory.key('e');assert.equal(factory.replaced(),'Stage3_Map');
const cloud=harness('Stage3_Map',h.game);cloud.begin();cloud.vars.get('BossStarted').setBoolean(true);assert.equal(cloud.c.travel('Level2 Scene','exit'),false);cloud.vars.get('BossStarted').setBoolean(false);
const g=cloud.scene.getObjects('Glitch')[0],beforeCoins=cloud.c.journey.coins;cloud.c.player.setPosition(g.getX()-88,g.getY()-24);cloud.key('j');assert(!cloud.scene.getObjects('Glitch').includes(g));assert.equal(cloud.c.journey.coins,beforeCoins+8);assert.equal(cloud.scene.getObjects('GlitchFragment').length,2);
cloud.game.getVariables().get('BossDefeated').setBoolean(true);cloud.frame();const bossCoins=cloud.c.journey.coins;cloud.frame();assert.equal(cloud.c.journey.coins,bossCoins);assert.equal(bossCoins,beforeCoins+58);
cloud.c.root._cqDispose();assert.equal(cloud.listeners.get('pointerdown').size,0);assert.equal(cloud.listeners.get('keydown').size,0);
cloud.game.getVariables().get('Stage3Completed').setBoolean(true);const ending=harness('WinScreen Scene',cloud.game);assert(ending.c.quakeLeft>0);ending.tick(2.3);assert.equal(ending.c.quakeLeft,0);assert.match(ending.dom.modalHtml,/Smart Greenhouse aktif/);
console.log('PASS factory puzzle, factory/cloud portal, boss portal lock, split enemy rewards, unique boss reward, audio listener cleanup, final earthquake.');
const armored=harness('Level2 Scene');armored.begin();
const beetle=armored.scene.getObjects('Bug')[0];armored.c.player.setPosition(beetle.getX()-88,beetle.getY()-24);armored.key('j');
assert(armored.scene.getObjects('Bug').includes(beetle));assert.equal(armored.c.journey.coins,0);
armored.c.cooldown=0;armored.c.player.setPosition(beetle.getX()-88,beetle.getY()-24);armored.key('j');assert(!armored.scene.getObjects('Bug').includes(beetle));assert.equal(armored.c.journey.coins,8);
const shieldCap=harness('MainGame Scene');shieldCap.begin();shieldCap.c.award('shield-cap',100);shieldCap.c.shop();for(let i=0;i<3;i++)assert(shieldCap.c.buy('shield'));assert(!shieldCap.c.buy('shield'));assert.equal(shieldCap.c.journey.coins,25);assert.equal(shieldCap.c.journey.shields,3);shieldCap.c.close();
const shielding=harness('Level2 Scene');shielding.begin();
shielding.c.shop();shielding.dom.get('#buy-shield').onclick();shielding.frame();
assert(shielding.dom.get('#cq-shields').hidden);
assert.equal(shielding.scene.getObjects('JourneyShieldAura').length,0);
shielding.c.award('visual-shield',25);
shielding.dom.get('#buy-shield').onclick();
assert.match(shielding.dom.modalHtml,/shield-receipt[^>]*>.*Perisai Volt aktif · 1\/3 muatan/s);
shielding.tick(1);
shielding.dom.get('#shop-close').onclick();shielding.frame();
const aura=shielding.scene.getObjects('JourneyShieldAura')[0];
assert(aura.isVisible()&&aura.opacity>156);
assert.equal(shielding.dom.get('#cq-shield-count').textContent,'1/3');
shielding.c.player.setPosition(245,501);shielding.tick(.8);
assert.equal(aura.getX(),241);assert.equal(aura.getY(),497);assert.equal(aura.opacity,156);
shielding.c.damage();shielding.frame();
assert(aura.isVisible()&&shielding.dom.get('#cq-shields').hidden);
shielding.tick(.35);assert(!aura.isVisible());
assert.equal(shielding.c.hp,5);
console.log('PASS shield purchase receipt, HUD charges, movement, hit flash and depleted shield visibility.');
// Check the Web Audio graph, unlock, mute, volume, and rate-limiting contract.
const sound=harness('MainGame Scene');sound.begin();let played=0,stopped=0,disconnected=0;
const param={setValueAtTime(){},exponentialRampToValueAtTime(){},linearRampToValueAtTime(){}};
sound.window.AudioContext=class{
 constructor(){this.state='suspended';this.currentTime=1;this.destination={};}
 resume(){this.state='running';return Promise.resolve();}
 createOscillator(){return {frequency:param,connect(){},start(){played++;},stop(){stopped++;this.onended?.();},disconnect(){disconnected++;}};}
 createGain(){return {gain:param,connect(){},disconnect(){disconnected++;}};}
};
for(const listener of sound.listeners.get('pointerdown'))listener();
for(const name of ['step','jump','land','climb','pulse','hurt','interact','npc','hover','enemy','coin','buy','shield','portal','quake'])sound.c.sfx(name);
assert.equal(played,15);assert.equal(stopped,15);sound.c.sfx('step');assert.equal(played,15);
sound.c.journey.volume=0;sound.game._cqAudio.context.currentTime+=2;sound.c.sfx('jump');assert.equal(played,15);
sound.c.shop();sound.dom.get('#shop-volume').oninput({target:{value:'65'}});assert.equal(sound.c.journey.volume,.65);
sound.c.sfx('jump');assert.equal(played,16);
const reduced=harness('MainGame Scene');reduced.begin();reduced.game._cqUiOptions.reduceMotion=true;reduced.c.victory();reduced.frame();assert.equal(reduced.game.getRenderer().getCanvas().style.transform,'scale(1) translate(0px,0px)');reduced.tick(2.3);assert.equal(reduced.game.getRenderer().getCanvas().style.transform,'scale(1)');
console.log('PASS two-hit armored enemy, 3-charge cap, all 15 audio cues/unlock/mute/volume/rate limits, reduced-motion earthquake.');

// A touch tap can be released before the next GDevelop frame.
const hub=harness('MainGame Scene');hub.begin();
for(const part of ['DHT22','LDR','Soil','PIR'])hub.c.collect(part);
hub.c.power=true;hub.c.assembly();hub.dom.get('#test').onclick();
assert.equal(hub.game.getVariables().get('SensorHub').getAsNumber(),0);
for(const [part,pin] of [['DHT22','D4'],['LDR','A0'],['Soil','A1'],['PIR','D5']]){
 hub.dom.all('[data-chip]').find(o=>o.dataset.chip===part).onclick();
 hub.dom.all('[data-slot]').find(o=>o.dataset.slot===part).onclick();
 for(const [wire,value] of [['VCC','3V3'],['GND','GND'],['DATA',pin]])hub.dom.get(`[data-wire="${part}.${wire}"]`).value=value;
}
hub.dom.get('#test').onclick();assert.equal(hub.game.getVariables().get('SensorHub').getAsNumber(),1);assert(hub.c.quakeLeft>0);
const touch=harness('Level2 Scene');touch.begin();
touch.c.player.setPosition(38,518);touch.c.touch.e=false;touch.c.touchInteraction=true;touch.frame();touch.frame();
assert.equal(touch.replaced(),'MainGame Scene');
const overlap=harness('MainGame Scene');overlap.begin();
const post=overlap.scene.getObjects('SensorPost')[0], workbench=overlap.scene.getObjects('Workbench')[0];
workbench.setPosition(post.getX()+84,post.getY());
overlap.c.player.setPosition(post.getX()-12,518);overlap.key('e');
assert(overlap.c.power);assert.match(overlap.c.message,/Daya stabil/);
assert.match(overlap.dom.get('#cq-prompt').textContent,/Daya pulih/);
const noDismiss=harness('MainGame Scene');noDismiss.begin();
noDismiss.c.player.setPosition(300,518);noDismiss.key('e');assert(noDismiss.c.dialogue);
noDismiss.key('i');assert(noDismiss.c.dialogue,'Inventory dismissed a different modal');

const safe=harness('Level2 Scene');safe.begin();
for(const id of ['A','C','B'])safe.c.pressSwitch(id);
safe.c.player.setPosition(3500,966);safe.frame();
assert.equal(safe.c.checkpoint[0],4280,'Evacuation checkpoint was replaced by tunnel checkpoint');
safe.c.player.setPosition(1950,640);safe.c.invuln=0;const safeHp=safe.c.hp;safe.frame();
assert.equal(safe.c.player.getX(),4280);assert.equal(safe.c.hp,safeHp-1);
const cell=safe.scene.getObjects('Battery').find(o=>o.getX()===650);
safe.c.player.setPosition(610,518);safe.c.energy=100;safe.frame();assert(safe.scene.getObjects('Battery').includes(cell));
safe.c.energy=70;safe.frame();assert.equal(safe.c.energy,90);assert(!safe.scene.getObjects('Battery').includes(cell));
const patrol=safe.scene.getObjects('Bug').find(o=>o.getX()>4700&&o.getX()<4800);
const floor=patrol._patrolFloor;patrol.setX(floor.getX()+floor.getWidth()-patrol.getWidth());const limit=patrol.getX();safe.frame();assert(patrol.getX()<limit);
const shot=safe.scene.createObject('Pulse');shot.setSize(28,16);shot.setPosition(4405,1000);shot._dir=1;
safe.c.power=false;assert.equal(safe.c.advanceJourneyShot(shot,34),false);
safe.c.power=true;assert(safe.c.advanceJourneyShot(shot,34));
safe.c.hp=1;safe.c.invuln=0;safe.c.damage();safe.tick(1.05);
safe.dom.get('#retry').onclick();safe.frame();
assert.equal(safe.replaced(),'Level2 Scene');
const retry=harness('Level2 Scene',safe.game);
assert(retry.c.started&&!retry.c.modal);assert.equal(retry.c.hp,5);assert.equal(retry.c.energy,100);
assert.equal(retry.c.player.getX(),4280);assert.equal(retry.c.escapeLeft,65);

const returnMap=harness('Stage3_Map');returnMap.begin();
returnMap.game.getVariables().get('BossDefeated').setBoolean(true);
returnMap.game.getVariables().get('BugZeroRestored').setBoolean(true);
for(const part of Object.keys(returnMap.c.componentNames))returnMap.c.collect(part);
returnMap.c.hp=2;returnMap.c.energy=23;returnMap.c.player.setPosition(7175,518);returnMap.key('e');
assert.equal(returnMap.replaced(),'Stage3_Assembly');
const returnAssembly=harness('Stage3_Assembly',returnMap.game);returnAssembly.dom.get('#return').onclick();returnAssembly.frame();
assert.equal(returnAssembly.replaced(),'Stage3_Map');
const afterAssembly=harness('Stage3_Map',returnMap.game);afterAssembly.begin();
assert.equal(afterAssembly.c.hp,2);assert.equal(afterAssembly.c.energy,23);assert.equal(afterAssembly.c.player.getX(),7175);
console.log('PASS Sensor Hub validation, released touch tap, nearest interaction, protected dialog, checkpoint retry/HP, battery, patrol edge, closed/open barrier and assembly round trip.');
module.exports={harness,game,project};
