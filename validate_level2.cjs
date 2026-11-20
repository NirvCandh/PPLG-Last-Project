const fs=require('fs'),assert=require('assert'),vm=require('vm'),png=require('./sprite_png.cjs');
const {existing,mappedObjects,mappedInstances}=require('./validate-map-baseline.cjs');
const files=['Project TA PPLG.json','Circuit Quest - NPC Animasi.json'];
for(const file of files){
 const g=JSON.parse(fs.readFileSync(file)),before=JSON.parse(fs.readFileSync(file.replace('.json','.before-level2.json'))),s=g.layouts.find(s=>s.name==='Level2 Scene'),l1=g.layouts.find(s=>s.name==='MainGame Scene'),old=before.layouts.find(s=>s.name===l1.name);
 assert(s&&g.firstLayout==='MainGame Scene');assert(g.layoutsFolderStructure.children.some(x=>x.itemName===s.name));
 const editorBackup='Circuit Quest - Editor Backup Before Level 2.json';
 const mapBaseline=file===files[0]&&fs.existsSync(editorBackup)?JSON.parse(fs.readFileSync(editorBackup)).layouts.find(x=>x.name===l1.name):old;
 assert.deepStrictEqual(existing(l1.objects),mappedObjects(l1.name,old.objects),'Stage 1 object geometry changed');assert.deepStrictEqual(existing(l1.instances),mappedInstances(l1.name,mapBaseline.instances),'Stage 1 map changed');
 for(const n of ['Nova','Volt','Ohm','Warga'])assert.deepStrictEqual(s.objects.find(o=>o.name===n),l1.objects.find(o=>o.name===n));
 const resources=new Set(g.resources.resources.map(x=>x.name)),names=new Set(s.objects.map(x=>x.name));
 for(const r of g.resources.resources)assert(fs.existsSync(r.file),'Missing '+r.file);
 for(const o of s.objects)for(const a of o.animations??[])for(const d of a.directions)for(const f of d.sprites)assert(resources.has(f.image));
 for(const i of s.instances){assert(names.has(i.name));assert(i.width>0&&i.height>0);}
 for(const i of s.instances.filter(i=>i.name.startsWith('Metal_'))){const o=s.objects.find(o=>o.name===i.name),im=png.read(o.animations[0].directions[0].sprites[0].image);assert.equal(im.width,i.width);assert.equal(im.height,i.height);for(let p=3;p<im.data.length;p+=4)assert.equal(im.data[p],255);assert(s.instances.some(x=>x.name==='Solid'&&['x','y','width','height'].every(k=>x[k]===i[k])));}
 for(const x of [3120,5520])assert(s.instances.some(i=>i.name==='Ladder'&&i.x===x));
 for(const n of ['Relay','Pump','Servo']){const chest=s.instances.find(i=>i.name==='Chest'&&i.initialVariables.some(v=>v.name==='sensor'&&v.value===n));assert(chest);assert(s.instances.some(i=>i.name==='Solid'&&Math.abs(chest.y+chest.height-i.y)<1&&chest.x>=i.x&&chest.x+chest.width<=i.x+i.width));}
 const jump=s.objects.find(o=>o.name==='Nova').behaviors.find(b=>b.name==='Platformer');assert(jump.jumpSpeed**2/(2*jump.gravity)>160,'Shelves unreachable');
 const l1code=l1.events.find(e=>e.inlineCode).inlineCode.join('\n');assert(l1code.includes('id="next-stage"'));assert(l1code.includes('_cqStageTransfer'));
 for(const level of [l1,s]){const code=level.events.find(e=>e.inlineCode).inlineCode.join('\n');new Function('runtimeScene',code);assert.equal((code.match(/if\(c\.nextScene\)/g)??[]).length,1,'Duplicate transition hook');assert(!code.includes('/* COMPONENT_ART_DATA */ {}'));}
 console.log('PASS '+file+': resources, native terrain/colliders, mission placement, transitions and preserved Level 1/character animations.');
}
// Execute the complete installed JavaScript event with a small DOM/runtime double.
// This exercises real setup, menu callbacks, puzzle validation and frame logic together.
class Element{
 constructor(key,dom){this.key=key;this.dom=dom;this.style={};this.dataset={};this.value='';this.textContent='';this.hidden=false;this.attrs={};this.children=[];this.childElementCount=0;this._html='';}
 set innerHTML(v){this._html=v;if(this.key==='#cq-modal')this.dom.modalHtml=v;}
 get innerHTML(){return this._html;}
 get firstElementChild(){return this.dom.get(this.key+' / first');}
 querySelector(q){return this.dom.get(q);}
 querySelectorAll(q){return this.dom.all(q);}
 setAttribute(k,v){this.attrs[k]=v;}
 getAttribute(k){return this.attrs[k]??null;}
 toggleAttribute(k,v){if(v)this.attrs[k]='';else delete this.attrs[k];}
 removeAttribute(k){delete this.attrs[k];}
 appendChild(el){this.children.push(el);this.childElementCount=this.children.length;}
 replaceChildren(){this.children=[];this.childElementCount=0;}
 contains(){return false;}focus(){}blur(){}remove(){this.removed=true;}scrollIntoView(){}closest(){return null;}
}
function makeDOM(){
 const dom={nodes:new Map(),modalHtml:'',get(q){if(!this.nodes.has(q))this.nodes.set(q,new Element(q,this));return this.nodes.get(q);},all(q){
   const attrs={'[data-chip]':'chip','[data-slot]':'slot','[data-sensor]':'sensor','[data-hold]':'hold'};
   if(attrs[q]){const k=attrs[q],values=k==='sensor'?['ESP32','Relay','Pump','Servo','LED']:k==='hold'?['Left','Right','Up','Down','Space','j','e']:[...this.modalHtml.matchAll(new RegExp('data-'+k+'="([^"]+)"','g'))].map(m=>m[1]);return values.map(v=>{const el=this.get(q+v);el.dataset[k]=v;return el;});}
   if(q==='#cq-energy i')return Array.from({length:10},(_,i)=>this.get('bar'+i));return [];
 }};
 dom.get('#cq-stats').children=Array.from({length:5},(_,i)=>dom.get('heart'+i));
 const document={body:{appendChild(){}},getElementById(){return null;},createElement:q=>dom.get('created-'+q),activeElement:dom.get('active'),addEventListener(){},removeEventListener(){},fullscreenEnabled:false};
 return {dom,document};
}
class Vars{constructor(){this.map={};}get(n){return this.map[n]??=new Var();}getChild(n){return this.get(n);}}
class Var extends Vars{constructor(){super();this.v=0;}setNumber(v){this.v=v;}getAsNumber(){return Number(this.v);}getAsString(){return String(this.v);}}
function harness(){
 const g=JSON.parse(fs.readFileSync(files[0])),sc=g.layouts.find(s=>s.name==='Level2 Scene'),vars=new Vars(),objects={},input=new Set(),{dom,document}=makeDOM();let replaced;
 const behavior={activate(){},isOnFloor:()=>true,isOnLadder:()=>false,getCurrentSpeed:()=>0,setCurrentSpeed(){},setCurrentFallSpeed(){},simulateLeftKey(){},simulateRightKey(){},simulateJumpKey(){},simulateLadderKey(){},simulateUpKey(){},simulateDownKey(){}};
 function actor(i){const v=new Vars();for(const iv of i.initialVariables??[])v.get(iv.name).v=iv.value;return {x:i.x,y:i.y,width:i.width,height:i.height,name:i.name,animation:'Idle',frame:0,visible:true,getX(){return this.x;},getY(){return this.y;},setX(v){this.x=v;},setY(v){this.y=v;},setPosition(x,y){this.x=x;this.y=y;},getWidth(){return this.width;},getHeight(){return this.height;},getName(){return this.name;},getVariables:()=>v,getBehavior:()=>behavior,setSize(w,h){this.width=w;this.height=h;},setZOrder(){},hide(v=true){this.visible=!v;},isVisible(){return this.visible;},getAnimationName(){return this.animation;},setAnimationName(n){this.animation=n;},setAnimation(n){this.animation=n;},setAnimationFrame(n){this.frame=n;},getAnimationFrame(){return this.frame;},setAnimationSpeedScale(){},pauseAnimation(){},playAnimation(){},flipX(){},setOpacity(){},setColor(){},deleteFromScene(){objects[this.name]=objects[this.name].filter(o=>o!==this);}};}
 for(const i of sc.instances)(objects[i.name]??=[]).push(actor(i));
 const game={getVariables:()=>vars,getRenderer:()=>({getCanvas:()=>null}),getInputManager:()=>({releaseAllPressedKeys(){}})};
 const scene={getGame:()=>game,getElapsedTime:()=>16,getObjects:n=>objects[n]??[],createObject(n){const o=actor({name:n,x:0,y:0,width:10,height:10});(objects[n]??=[]).push(o);return o;},getLayer:()=>({getCameraWidth:()=>1280,getCameraHeight:()=>720,setCameraX(){},setCameraY(){}})};
 const context={runtimeScene:scene,document,window:{addEventListener(){},removeEventListener(){}},navigator:{},gdjs:{evtTools:{input:{isKeyPressed:(_,k)=>input.has(k)},runtimeScene:{replaceScene:(_,n)=>{replaced=n;},stopGame(){}}}},console};
 const code=sc.events.find(e=>e.inlineCode).inlineCode.join('\n'),run=new vm.Script('(function(){'+code+'})()'),ctx=vm.createContext(context);const frame=()=>run.runInContext(ctx);
 frame();return {scene,c:scene._cq,dom,vars,input,game,frame,replaced:()=>replaced};
}
const h=harness(),{c,dom,vars}=h;
assert(c.modal&&!c.started);dom.get('#begin').onclick();assert(!c.modal&&c.started);h.frame();
// Sequence resets on a wrong order and only activates with the complete solution.
c.pressSwitch('A');c.pressSwitch('B');assert.equal(c.sequence.length,0);assert(!c.power);
for(const id of ['A','C','B'])c.pressSwitch(id);assert(c.power&&c.escapeStarted);assert.equal(c.escapeLeft,65);
c.pause();const time=c.escapeLeft;h.frame();assert.equal(c.escapeLeft,time,'Timer ran while paused');c.close();
c.inventory();assert(dom.modalHtml.includes('Komponen Pabrik'));c.close();
for(const n of ['ESP32','Relay','Pump','Servo','LED'])c.collect(n);assert.equal(Object.keys(c.inv).length,5);
c.assembly();dom.get('#test').onclick();assert(!c.assembled);assert(dom.get('#assembly-feedback').innerHTML.includes('belum dipasang'));
for(const n of ['ESP32','Relay','Pump','Servo','LED']){dom.all('[data-chip]').find(e=>e.dataset.chip===n).onclick();dom.all('[data-slot]').find(e=>e.dataset.slot===n).onclick();}
const connections={'SensorHub.DATA':'GPIO34','Relay.VCC':'5V','Relay.GND':'GND','Relay.IN':'GPIO26','Pump.PLUS':'RELAY_NO','Pump.MINUS':'GND','Servo.VCC':'5V','Servo.GND':'GND','Servo.SIGNAL':'GPIO18','LED.ANODE':'GPIO2_R','LED.CATHODE':'GND'};
for(const [wire,port] of Object.entries(connections))dom.get(`[data-wire="${wire}"]`).value=port;
dom.get('#logic').value='wet';dom.get('#test').onclick();assert(!c.assembled);assert.equal(dom.get('#logic').dataset.result,'error');
dom.get('#logic').value='dry';dom.get('#test').onclick();assert(c.assembled);assert.equal(vars.get('SmartController').getAsNumber(),1);assert.equal(vars.get('StageUnlocked').getAsNumber(),3);
assert(dom.modalHtml.includes('Smart Controller Aktif'));dom.get('#explore').onclick();assert(!c.modal);
c.restart();h.frame();assert.equal(h.replaced(),'Level2 Scene');
const h2=harness();h2.dom.get('#begin').onclick();h2.c.nextScene='MainGame Scene';h2.frame();assert.equal(h2.replaced(),'MainGame Scene');
const h3=harness();h3.dom.get('#begin').onclick();h3.c.hp=1;h3.c.damage();assert(h3.c.dead);for(let i=0;i<65;i++)h3.frame();assert(h3.c.gameOverShown);assert(h3.dom.modalHtml.includes('Game Over'));
console.log('PASS: complete runtime initialization, play, sequence/reset, paused timer, inventory, missing components, wrong logic, successful assembly, stage unlock, restart, return and defeat.');
