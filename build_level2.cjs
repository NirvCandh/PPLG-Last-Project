// Adds/rebuilds Level 2 in both maintained projects, retaining current Level 1 edits.
const fs=require('fs'),crypto=require('crypto'),assert=require('assert'),png=require('./sprite_png.cjs');
const manifest=require('./prepare_level2.cjs');
const files=['Project TA PPLG.json','Circuit Quest - NPC Animasi.json'];
const clone=x=>JSON.parse(JSON.stringify(x)),uuid=()=>crypto.randomUUID();
const source=JSON.parse(fs.readFileSync(files[0],'utf8')),base=source.layouts.find(s=>s.name==='MainGame Scene');
const scene=clone(base);Object.assign(scene,{name:'Level2 Scene',mangledName:'Level2_32Scene',r:7,v:17,b:30,objects:[],instances:[],events:[],variables:[],objectsGroups:[],title:'Stage 02 - Pabrik Mikrokontroler'});
Object.assign(scene.uiSettings,{grid:true,gridWidth:64,gridHeight:64,zoomFactor:.45});
const resources=[];
function res(file){if(!resources.some(r=>r.name===file))resources.push({file,name:file,kind:'image',metadata:'',smoothed:false,userAdded:true});return file;}
function frame(file){const {width:w,height:h}=png.read(file);return {hasCustomCollisionMask:true,image:res(file),points:[],originPoint:{name:'origine',x:0,y:0},centerPoint:{automatic:true,name:'centre',x:0,y:0},customCollisionMask:[[{x:0,y:0},{x:w,y:0},{x:w,y:h},{x:0,y:h}]]};}
function sprite(name,frames,fps=5){
 const animations=[{name:'Idle',useMultipleDirections:false,directions:[{looping:true,timeBetweenFrames:1/fps,sprites:frames.map(frame)}]}];
 const obj={name,type:'Sprite',persistentUuid:uuid(),adaptCollisionMaskAutomatically:false,updateIfNotVisible:true,variables:[],effects:[],behaviors:[],animations};scene.objects.push(obj);return obj;
}
function art(name,...keys){return sprite(name,keys.map(k=>manifest.sprites[k].file));}
function inst(name,x,y,w,h,z=0,vars={},ratio=false){
 if(ratio){const obj=scene.objects.find(o=>o.name===name),f=obj.animations[0].directions[0].sprites[0],im=png.read(f.image),k=Math.min(w/im.width,h/im.height),nw=im.width*k,nh=im.height*k;x+=(w-nw)/2;y+=h-nh;w=nw;h=nh;}
 const i={name,x,y,width:w,height:h,angle:0,zOrder:z,layer:'',customSize:true,keepRatio:ratio,depth:1,persistentUuid:uuid(),numberProperties:[],stringProperties:[],initialVariables:Object.entries(vars).map(([name,v])=>({name,type:typeof v==='string'?'string':'number',value:String(v)}))};scene.instances.push(i);return i;
}
for(const name of ['Nova','Volt','Ohm','Warga','Solid','Ladder','LadderArt','Chest','Battery','Pulse'])scene.objects.push(clone(base.objects.find(o=>o.name===name)));
// Native transparent barrier can be disabled independently from decorative laser art.
const barrier=clone(scene.objects.find(o=>o.name==='Solid'));barrier.name='LaserBarrier';barrier.persistentUuid=uuid();scene.objects.push(barrier);
art('Bug','Armored0','Armored1','Armored2','Armored3');art('Glitch','Shooter0','Shooter1','Shooter2','Shooter3');art('EnemyPulse','EnemyPulse');
for(const n of ['ESP32','Relay','Pump','Servo','LED'])art(n,n);
art('Terminal','Research');art('Workbench','Workbench');art('SensorPost','Switch');art('Switch','Switch');art('Laser','Laser');art('Conveyor','Conveyor0','Conveyor1');art('Waste','Waste0','Waste1','Waste2','Waste3');art('Short','Electric0','Electric1','Electric2','Electric3');
const bg='assets/level2/Cyberpunk Circuit Factory Panorama.png';sprite('FactoryPanorama',[bg]);
// Background tiles retain source ratio. The lower tunnel has its own darkened panorama.
for(let x=0;x<6656;x+=1672)inst('FactoryPanorama',x,-120,1672,941,-15);
for(let x=3008;x<5600;x+=1672)inst('FactoryPanorama',x,700,1672,941,-16);
function terrain(x,y,w,h=192,collider=true){
 const image=png.blank(w,h,[12,29,43,255]);
 for(let yy=0;yy<h;yy+=64)for(let xx=0;xx<w;xx+=64){const key=yy===0?'MetalTop':(xx/64+yy/64)%4===0?'MetalCircuit':'MetalFill',tile=png.read(manifest.sprites[key].file);png.blit(image,tile,[0,0,64,64],xx,yy);}
 const name=`Metal_${x}_${y}`,file='assets/level2/generated/'+name+'.png';png.write(file,image);sprite(name,[file]);inst(name,x,y,w,h,1);if(collider)inst('Solid',x,y,w,h,-5);
}
terrain(0,608,1920,768);terrain(2304,608,768,768);terrain(3264,608,1568,96);terrain(3072,1056,1760,320);
for(const [x,y] of [[4832,960],[5024,864],[5216,768],[5408,672]])terrain(x,y,192,1376-y);
terrain(5600,608,1056,768);
// Raised relay shelf, waste catwalk and optional service shelf. Every shelf has a matching collider.
terrain(704,464,384,48);terrain(1856,480,512,48);terrain(2640,464,256,48);
for(let x=1920;x<2304;x+=64)inst('Waste',x,680,64,64,8);
for(const [x,dir] of [[1184,1],[1440,1],[2448,-1],[5744,-1]])inst('Conveyor',x,586,256,124,4,{dir});
inst('Ladder',3120,576,56,500,-4);for(let y=576;y<1056;y+=56)inst('LadderArt',3120,y,56,Math.min(56,1056-y),4);
// Stairs offer a jump route; the final ladder also supports climbing at their right edge.
inst('Ladder',5520,576,56,116,-4);inst('LadderArt',5520,576,56,96,4);
inst('Nova',160,518,96,96,20);inst('Volt',140,512,48,48,21);
inst('Terminal',300,494,112,114,8,{},true);inst('Ohm',440,518,96,96,10);
inst('Warga',2740,518,96,96,10);
inst('Chest',860,400,64,64,9,{sensor:'Relay'});inst('Relay',868,346,48,42,10,{},true);
inst('Chest',2076,416,64,64,9,{sensor:'Pump'});inst('Pump',2084,362,48,42,10,{},true);
inst('Chest',4640,992,64,64,9,{sensor:'Servo'});inst('Servo',4648,938,48,42,10,{},true);
// Decorative mission markers disappear when their components are collected.
inst('ESP32',357,440,48,42,10,{},true);inst('LED',2775,456,40,42,10,{},true);
for(const [id,x] of [['A',3440],['B',3776],['C',4112]])inst('Switch',x,976,80,80,9,{id},true);
inst('Laser',4410,704,96,352,13,{},true);inst('LaserBarrier',4445,704,32,352,-4);
inst('SensorPost',5680,520,88,88,9,{},true);inst('Workbench',6256,482,160,126,9,{},true);
for(const x of [1140,1712,2496,3510,4820,6032]){const floorY=x>3072&&x<4832?1056:608;inst('Bug',x,floorY-56,80,56,15,{home:x,dir:1});}
// Keep the last tunnel beetle off the staircase edge.
scene.instances.find(i=>i.name==='Bug'&&i.x===4820).x=4710;scene.instances.find(i=>i.name==='Bug'&&i.x===4710).initialVariables[0].value='4710';
for(const [x,y] of [[2580,529],[3970,977],[5840,529]])inst('Glitch',x,y,62,79,15);
for(const [x,y] of [[1630,560],[3630,1008],[3920,1008],[5950,560]])inst('Short',x,y,64,48,10);
for(const [x,y] of [[650,536],[1540,526],[2370,530],[3260,970],[4290,970],[5040,804],[5640,538],[6150,536]])inst('Battery',x,y,32,32,12);
function sign(name,text,x,y,w=350,size=22){
 scene.objects.push({name,type:'TextObject::Text',persistentUuid:uuid(),variables:[],effects:[],behaviors:[],string:text,font:'',characterSize:size,bold:true,italic:false,underlined:false,color:{r:158,g:242,b:224},textAlignment:'left',verticalTextAlignment:'top',useGradient:false,gradient:[],outline:true,outlineThickness:3,outlineColor:{r:5,g:17,b:28},shadow:false,shadowColor:{r:0,g:0,b:0},shadowOpacity:127,shadowBlurRadius:2,shadowAngle:90,shadowDistance:2,padding:0});inst(name,x,y,w,55,6);
}
sign('EntrySign','01 / RESEARCH STATION',210,380,430);sign('RelaySign','RELAY / TAHAN SPACE',715,290,430);sign('WasteSign','02 / CATWALK LIMBAH',1845,300,420);sign('ServiceSign','03 / TEROWONGAN MESIN ↓',2770,380,440);sign('SequenceSign','URUTAN: A → C → B',3370,782,620,27);
for(const [id,x] of [['A',3440],['B',3776],['C',4112]])sign('Sign'+id,id,x+26,932,60,28);
sign('LaserSign','LASER / 3 SAKELAR',4300,750,360,18);sign('EscapeSign','04 / EVAKUASI →',5620,410,400);sign('AssemblySign','05 / SMART CONTROLLER',6120,365,480,22);
scene.objectsFolderStructure={folderName:'__ROOT',children:scene.objects.map(o=>({objectName:o.name}))};

let runtime=fs.readFileSync('level1-runtime.js','utf8');
// The shared source may already contain the Stage 1 transition hook after a prior build.
runtime=runtime.replace(/^if\(c\.nextScene\)\{[^\n]*\}\r?\n/m,'');
runtime=runtime.replace("const sensorNames=['DHT22','LDR','Soil','PIR'];","const sensorNames=['ESP32','Relay','Pump','Servo','LED'];");
runtime=runtime.replaceAll('NOVA · 01','NOVA · 02').replaceAll('aria-label="Sensor terkumpul"','aria-label="Komponen terkumpul"').replace('<span>SENSOR</span>','<span>KOMPONEN</span>').replace('`${sensorCount} / 4`','`${sensorCount} / 5`');
const collectStart=runtime.indexOf('  c.collect=n=>'),init=runtime.indexOf('  c.title();',collectStart);assert(collectStart>0&&init>collectStart);
runtime=runtime.slice(0,collectStart)+fs.readFileSync('level2-ui.js','utf8')+'\n'+runtime.slice(init);
const worldStart=runtime.indexOf('if(!c.modal){\n c.t+=dt;'),worldEnd=runtime.indexOf('// Supplied mentor and villager animations',worldStart);assert(worldStart>0&&worldEnd>worldStart);
runtime=runtime.slice(0,worldStart)+fs.readFileSync('level2-world.js','utf8')+'\n'+runtime.slice(worldEnd);
runtime=runtime.replace("const speakers = {Ohm:'Prof. Ohm', Warga:'Penjaga Kebun'};","const speakers = {Ohm:'Prof. Ohm', Warga:'Operator Pabrik'};");
runtime=runtime.replace("gdjs.evtTools.runtimeScene.replaceScene(s,'MainGame Scene',false);","c.root._cqDispose?.();c.root.remove();gdjs.evtTools.runtimeScene.replaceScene(s,'Level2 Scene',false);");
runtime=runtime.replace("if(c.quitRequested){", "if(c.nextScene){const game=s.getGame(),variables=game.getVariables();if(c.nextScene==='Stage3_Map')game._cqStageTransfer={hp:c.hp,energy:c.energy,preview:!variables.get('SensorHub').getAsNumber()};variables.get('CurrentStage').setNumber(c.nextScene==='MainGame Scene'?1:c.nextScene==='Stage3_Map'?3:2);c.root._cqDispose?.();c.root.remove();gdjs.evtTools.runtimeScene.replaceScene(s,c.nextScene,false);return;}\nif(c.quitRequested){");
runtime=runtime.replace("const sensorCount=Object.keys(c.inv).length;","const sensorCount=Object.keys(c.inv).length;");
const globalsStart=runtime.indexOf("for(const n of ['DHT22','LDR','Soil','PIR'])globals");assert(globalsStart>0);
runtime=runtime.slice(0,globalsStart)+`for(const n of ['ESP32','Relay','Pump','Servo','LED'])globals.get('Inventory').getChild(n).setNumber(c.inv[n]?1:0);
globals.get('QuestState').getChild('FactoryLED').setNumber(c.inv.LED?2:0);
globals.get('QuestState').getChild('FactorySwitches').setNumber(c.sequence.length);
globals.get('QuestState').getChild('FactoryEscape').setNumber(c.escapeDone?1:0);
for(const k of ['Escape','i','e','Space'])c.prev[k]=key(k);
`;
runtime=runtime.replace('Tunggu celah aman atau gunakan Pulse Wave.','Hindari laser dan pulsa. Bug Berbaju Besi butuh dua Pulse.');
// A long factory name needs a smaller title than the two-word Stage 1 logo.
runtime=runtime.replace('  #cq-ui .title-lockup h1 span', '  #cq-ui .title-lockup h1 span');
runtime=runtime.replace('  #cq-ui .title-lockup h1{font-size:clamp(46px,7.5cqw,92px)}','  #cq-ui .title-lockup h1{font-size:clamp(27px,4.7cqw,59px);overflow-wrap:anywhere}');
runtime=runtime.replace('  #cq-ui .title-lockup h1{font-size:47px}','  #cq-ui .title-lockup h1{font-size:32px}');
fs.writeFileSync('level2-runtime.js',runtime);
new Function('runtimeScene',runtime);

function connectLevel1(code){
 if(!code.includes('id="next-stage"')){
  code=code.replace('<button class="primary" id="explore" type="button">Kembali menjelajah</button>','<button class="primary" id="next-stage" type="button">Lanjut Level 2 →</button><button id="explore" type="button">Kembali menjelajah</button>');
  code=code.replace("    c.button('explore',c.close);", "    c.button('next-stage',()=>{c.nextScene='Level2 Scene';});c.button('explore',c.close);");
 }
 if(!code.includes('if(c.nextScene)'))code=code.replace('if(c.quitRequested){',"if(c.nextScene){s.getGame()._cqStageTransfer={hp:c.hp,energy:c.energy};s.getGame().getVariables().get('CurrentStage').setNumber(2);c.root._cqDispose?.();c.root.remove();gdjs.evtTools.runtimeScene.replaceScene(s,c.nextScene,false);return;}\nif(c.quitRequested){");
 // Do not relock higher stages if Stage 1 is assembled again later in the session.
 code=code.replace("s.getGame().getVariables().get('StageUnlocked').setNumber(2);","s.getGame().getVariables().get('StageUnlocked').setNumber(Math.max(2,s.getGame().getVariables().get('StageUnlocked').getAsNumber()));");
 if(!code.includes("get('AssemblyResult').getChild('SensorHub')"))code=code.replace("s.getGame().getVariables().get('SensorHub').setNumber(1);","s.getGame().getVariables().get('SensorHub').setNumber(1);s.getGame().getVariables().get('AssemblyResult').getChild('SensorHub').setNumber(1);");
 return code;
}
fs.writeFileSync('level1-runtime.js',connectLevel1(fs.readFileSync('level1-runtime.js','utf8')));
const jsEvent=code=>({type:'BuiltinCommonInstructions::JsCode',inlineCode:code.split('\n'),parameterObjects:'',useStrict:true,eventsSheetExpanded:false});
for(const file of files){
 const backup=file.replace('.json','.before-level2.json');if(!fs.existsSync(backup))fs.copyFileSync(file,backup);
 const g=JSON.parse(fs.readFileSync(file,'utf8')),stage1=g.layouts.find(s=>s.name==='MainGame Scene'),event=stage1.events.find(e=>e.inlineCode);
 const old=event.inlineCode.join('\n');event.inlineCode=connectLevel1(old).split('\n');
 const artMatch=old.match(/const componentArt = (\{[^\n]*\});/),portraitMatch=old.match(/const npcPortraits = (\{[^\n]*\});/);assert(artMatch&&portraitMatch,'Missing embedded art');
 const artData=JSON.parse(artMatch[1]);for(const n of ['ESP32','Relay','Pump','Servo','LED'])artData[n]='data:image/png;base64,'+fs.readFileSync(manifest.sprites[n].file).toString('base64');
 const embedded=runtime.replace('/* COMPONENT_ART_DATA */ {}',JSON.stringify(artData)).replace('/* NPC_PORTRAIT_DATA */ {}',portraitMatch[1]);
 const next=clone(scene);
 for(const name of ['Nova','Volt','Ohm','Warga'])next.objects[next.objects.findIndex(o=>o.name===name)]=clone(stage1.objects.find(o=>o.name===name));
 next.events=[{type:'BuiltinCommonInstructions::Comment',color:{r:35,g:190,b:170},comment:'STAGE 02 / PABRIK MIKROKONTROLER - assets/level2. Editable native platforms, conveyors, laser, switches, mission objects.'},jsEvent(embedded)];
 const idx=g.layouts.findIndex(s=>s.name===next.name);if(idx<0)g.layouts.push(next);else g.layouts[idx]=next;
 for(const r of resources)if(!g.resources.resources.some(x=>x.name===r.name))g.resources.resources.push(r);
 function global(name,type='number',value=0){let v=g.variables.find(x=>x.name===name);if(!v){v={name,type,...(type==='structure'?{children:[]}:{value})};g.variables.push(v);}return v;}
 global('SmartController');global('AssemblyResult','structure');
 for(const n of ['SensorHub','SmartController']){const a=global('AssemblyResult','structure');if(!a.children.some(v=>v.name===n))a.children.push({name:n,type:'number',value:0});}
 for(const n of ['ESP32','Relay','Pump','Servo','LED']){const a=global('Inventory','structure');if(!a.children.some(v=>v.name===n))a.children.push({name:n,type:'number',value:0});}
 for(const n of ['FactoryLED','FactorySwitches','FactoryEscape']){const a=global('QuestState','structure');if(!a.children.some(v=>v.name===n))a.children.push({name:n,type:'number',value:0});}
 g.layoutsFolderStructure??={folderName:'__ROOT',children:g.layouts.map(x=>({itemName:x.name}))};
 g.layoutsFolderStructure.children=g.layoutsFolderStructure.children.filter(x=>x.layoutName!=='Level2 Scene');if(!g.layoutsFolderStructure.children.some(x=>x.itemName==='Level2 Scene'))g.layoutsFolderStructure.children.push({itemName:'Level2 Scene'});
 if(!g.layouts.some(l=>l.name==='Stage3_Map')) { if(!g.layouts.some(l=>l.name==='Stage3_Map')) { if(!g.layouts.some(l=>l.name==='Stage3_Map')) { if(!g.layouts.some(l=>l.name==='Stage3_Map')) { if(!g.layouts.some(l=>l.name==='Stage3_Map')) { if(!g.layouts.some(l=>l.name==='Stage3_Map')) { if(!g.layouts.some(l=>l.name==='Stage3_Map')) { if(!g.layouts.some(l=>l.name==='Stage3_Map')) { if(!g.layouts.some(l=>l.name==='Stage3_Map')) { if(!g.layouts.some(l=>l.name==='Stage3_Map')) { if(!g.layouts.some(l=>l.name==='Stage3_Map')) { if(!g.layouts.some(l=>l.name==='Stage3_Map')) { if(!g.layouts.some(l=>l.name==='Stage3_Map')) { g.properties.name='Circuit Quest - Hutan Sensor & Pabrik Mikrokontroler';g.properties.description='Two playable stages: collect sensors and build a Sensor Hub; explore the microcontroller factory, escape, and assemble a Smart Controller.'; } } } } } } } } } } } } }
 fs.writeFileSync(file,JSON.stringify(g,null,2));console.log(file+': '+next.objects.length+' objects, '+next.instances.length+' instances.');
}
// Compose a real scene image for reviewing the route and sprite proportions.
const overview=png.blank(1664,366,[7,17,30,255]),detail=png.blank(1280,720,[7,17,30,255]);
const imageCache={};
for(const i of [...scene.instances].sort((a,b)=>a.zOrder-b.zOrder)){
 if(['Solid','Ladder','LaserBarrier'].includes(i.name))continue;
 const o=scene.objects.find(o=>o.name===i.name);if(o.type!=='Sprite')continue;const f=o.animations[0].directions[0].sprites[0].image,im=imageCache[f]??=png.read(f);
 png.blit(overview,im,[0,0,im.width,im.height],Math.round(i.x/4),Math.round((i.y+120)/4),Math.max(1,Math.round(i.width/4)),Math.max(1,Math.round(i.height/4)));
 if(i.x<1280&&i.y<720)png.blit(detail,im,[0,0,im.width,im.height],Math.round(i.x),Math.round(i.y),Math.max(1,Math.round(i.width)),Math.max(1,Math.round(i.height)));
}
png.write('Level2-Overview.png',overview);png.write('Level2-Entrance.png',detail);
console.log('Runtime syntax checked; generated Level2-Overview.png and Level2-Entrance.png.');
