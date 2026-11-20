const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');
const {randomUUID} = require('node:crypto');
const projectDir = path.resolve(process.argv[2] ?? path.join(__dirname,'..'));
const source = name => fs.readFileSync(path.join(__dirname,name),'utf8').replace(/\r\n/g,'\n');
process.chdir(projectDir);
const png = require(path.join(projectDir,'sprite_png.cjs'));
const files = ['Project TA PPLG.json','Circuit Quest - NPC Animasi.json'];
const asset = name => `assets/level2/generated/${name}.png`;
const artDir = 'assets/level3';
const additions = new Map();
const parts = ['HasPowerSupply','HasOLED','HasCloudDashboard','HasWiFi','HasMQTTKey'];
const flags = [...parts,'BossDefeated','BugZeroRestored','Stage3Completed'];
const objectVars = (values) => Object.entries(values).map(([name,value])=>({name,type:typeof value==='boolean'?'boolean':typeof value,value}));
const clone = structuredClone;
const original = files.map(file=>JSON.parse(fs.readFileSync(file,'utf8')));
const base = original[0].layouts.find(l=>l.name==='Level2 Scene');
const scene = emptyScene('Stage3_Map','Menara Cloud');

function emptyScene(name,title) {
  const layout=clone(base);
  Object.assign(layout,{name,mangledName:name.replaceAll(' ','_32'),title,r:6,v:16,b:31,objects:[],instances:[],events:[],variables:[],objectsGroups:[],objectsFolderStructure:{folderName:'__ROOT',children:[]}});
  Object.assign(layout.uiSettings,{grid:true,gridWidth:32,gridHeight:32,zoomFactor:.28});
  return layout;
}
function object(name) { return clone(base.objects.find(o=>o.name===name)); }
function addObject(layout,o) {
  o.persistentUuid=randomUUID();
  layout.objects.push(o);
  layout.objectsFolderStructure.children.push({objectName:o.name});
  return o;
}
function use(name,as=name) { const o=object(name); o.name=as; return addObject(scene,o); }
function instance(layout,name,x,y,width,height,zOrder=0,variables={}) {
  const i={name,x,y,width,height,zOrder,angle:0,layer:'',depth:1,customSize:true,keepRatio:false,persistentUuid:randomUUID(),numberProperties:[],stringProperties:[],initialVariables:objectVars(variables)};
  layout.instances.push(i);
  return i;
}
const put = (...args) => instance(scene,...args);
function sprite(name,file) {
  additions.set(file,{file,name:file,kind:'image',metadata:'',smoothed:false,userAdded:true});
  const {width,height}=png.read(file);
  const frame={hasCustomCollisionMask:true,image:file,points:[],originPoint:{name:'origine',x:0,y:0},centerPoint:{automatic:true,name:'centre',x:0,y:0},customCollisionMask:[[{x:0,y:0},{x:width,y:0},{x:width,y:height},{x:0,y:height}]]};
  return addObject(scene,{name,type:'Sprite',adaptCollisionMaskAutomatically:false,updateIfNotVisible:true,variables:[],effects:[],behaviors:[],animations:[{name:'Idle',useMultipleDirections:false,directions:[{looping:false,timeBetweenFrames:1,sprites:[frame]}]}]});
}

fs.mkdirSync(artDir,{recursive:true});
const metal=['MetalTop','MetalFill','MetalCircuit'].map(name=>png.read(asset(name)));
function terrain(x,y,w,h) {
  const name=`Deck_${x}_${y}`, file=`${artDir}/${name}.png`;
  const image=png.blank(w,h,[12,29,43,255]);
  for (let yy=0;yy<h;yy+=32) for (let xx=0;xx<w;xx+=32) {
    const tile=metal[yy===0?0:(xx/32+yy/32)%5===0?2:1];
    png.blit(image,tile,[0,0,64,64],xx,yy,32,32);
  }
  png.write(file,image);
  sprite(name,file); put(name,x,y,w,h,1); put('Solid',x,y,w,h,-3);
}
function nativePlatform(name,file,oneWay=false) {
  const o=sprite(name,file);
  o.behaviors=object('Solid').behaviors;
  if (oneWay) o.behaviors[0].platformType='Jumpthru';
}
function label(name,text,x,y,width=390,size=24) {
  const o=object('EntrySign');
  Object.assign(o,{name,string:text,characterSize:size,color:{r:159,g:238,b:255}});
  addObject(scene,o); put(name,x,y,width,40,10);
}
function ladder(x,start,end) {
  put('Ladder',x,start,64,end-start,-1);
  for (let y=start;y<end;y+=64) put('LadderArt',x,y,64,Math.min(64,end-y),4);
}

for (const name of ['Nova','Volt','Ohm','Warga','Solid','Ladder','LadderArt','Pulse','Battery','Glitch','EnemyPulse','Workbench']) use(name);
use('Glitch','GlitchFragment'); use('Bug','BugZero'); use('Bug','BugZeroClone');
const drone= sprite('DroneMalware',`${artDir}/qc/Drone-1.png`);
const droneAnimation=drone.animations[0].directions[0];
droneAnimation.looping=true; droneAnimation.timeBetweenFrames=.085;
for (const n of [2,3,4]) {
  const file=`${artDir}/qc/Drone-${n}.png`;
  const {width,height}=png.read(file);
  assert(width===55&&height===52,'Drone frame size differs');
  additions.set(file,{...additions.get(`${artDir}/qc/Drone-1.png`),name:file,file});
  droneAnimation.sprites.push({...droneAnimation.sprites[0],image:file});
}
use('Short','SignalHazard'); use('EnemyPulse','BossWave');
const redLaser=png.read(asset('Laser'));
for (let i=0;i<redLaser.data.length;i+=4) {
  const level=Math.max(redLaser.data[i],redLaser.data[i+1],redLaser.data[i+2]);
  redLaser.data[i]=level;
  redLaser.data[i+1]=Math.round(level*.28);
  redLaser.data[i+2]=Math.round(level*.24);
}
const redLaserFile=`${artDir}/RedFirewall.png`;
png.write(redLaserFile,redLaser);
sprite('Firewall',redLaserFile); sprite('BossZone',redLaserFile);
use('SensorPost','Checkpoint'); use('SensorPost','CableSwitch'); use('Terminal','DoorPanel'); use('Terminal','CommTerminal'); use('Terminal','ArenaPanel'); use('Terminal','RecoveryConsole');
nativePlatform('TunnelGate',asset('Laser')); nativePlatform('ArenaGate',asset('Laser')); nativePlatform('ArenaSeal',asset('Laser'));
nativePlatform('EnergyPlatform',asset('MetalTop'),true);
// Art from the factory kit serves as stand-in visuals for new electronics.
const art = {HasPowerSupply:'Battery',HasOLED:'ESP32',HasCloudDashboard:'Panel',HasWiFi:'Switch',HasMQTTKey:'Research'};
for (const [name,assetName] of Object.entries(art)) sprite(name,assetName==='Battery'?'assets/art2d/Battery.png':asset(assetName));
for (const [area,x,end,y] of [
  ['Exterior',0,768,-112],['Lobby',768,1664,-112],['Server',1664,3840,-112],
  ['Tunnel',2496,4032,704],['Distribution',3840,5152,-112],['Communication',5152,5664,-112],
  ['Arena',5664,6880,-112],['Recovery',6880,7360,-112],
]) {
  const name=`Backdrop_${area}`, tile=png.read(`${artDir}/qc/${area}.png`), scale=3;
  const width=Math.ceil((end-x)/scale), backdrop=png.blank(width,tile.height);
  for (let left=0;left<width;left+=tile.width) png.blit(backdrop,tile,[0,0,tile.width,tile.height],left,0);
  const file=`${artDir}/Scene_${area}.png`;
  png.write(file,backdrop); sprite(name,file);
  put(name,x,y,width*scale,tile.height*scale,-30);
}
// Eight areas share one map. The surface ends at the cable tunnel and resumes at distribution.
for (const rect of [[0,608,2656,160],[2848,608,864,96],[2848,-288,64,896],[2592,1056,1344,224],[3840,608,3520,160],[0,64,32,544],[7328,64,32,544],
  [320,480,160,32],[1792,480,192,32],[2016,352,224,32],[2272,256,256,32],[3072,928,192,32],[4032,480,160,32],[4896,320,256,32],
  [5216,448,192,32],[5712,448,160,32],[6000,352,192,32],[6496,384,192,32]]) terrain(...rect);
ladder(2720,548,1056); ladder(3744,512,1056);
ladder(4832,232,608);
put('EnergyPlatform',560,421,160,32,5,{dx:64,dy:38});
put('EnergyPlatform',4260,427,160,32,5,{dx:48,dy:66});
put('EnergyPlatform',4528,356,224,32,5,{dx:48,dy:77});
put('Nova',128,518,96,96,20); put('Volt',138,516,48,48,21);
put('Warga',1060,518,96,96,10); put('Ohm',1312,518,96,96,10);
for (const [id,x] of [['Lobby',872],['Distribution',3936],['Communication',5212]]) put('Checkpoint',x,536,65,72,8,{id});
for (const [x,label,targetX] of [[752,'Pintu lobi →',832],[1664,'Ruang server →',1744]]) put('DoorPanel',x,522,64,86,9,{label,targetX,targetY:518});
put('HasPowerSupply',2370,199,48,55,11); put('HasOLED',2528,555,52,48,11);
put('HasCloudDashboard',5020,263,57,55,11); put('HasWiFi',5270,391,44,54,11); put('HasMQTTKey',5504,551,51,55,11);
put('CommTerminal',5400,517,80,91,9);
put('ArenaPanel',5516,520,80,88,9);
put('CableSwitch',2944,974,72,82,9,{id:'CableA'}); put('CableSwitch',3130,852,68,76,9,{id:'CableB'});
put('TunnelGate',3456,704,32,352,12); put('ArenaGate',5600,-288,64,896,12); put('ArenaSeal',6880,-288,32,896,12);
for (const [x,y] of [[598,535],[1920,535],[3340,983]]) put('Glitch',x,y,62,73,15);
for (const [x,y] of [[1470,533],[4544,532]]) put('DroneMalware',x,y,76,70,15);
for (const [x,y,w,h] of [[2260,472,48,136],[4672,470,48,138]]) put('Firewall',x,y,w,h,13);
for (const [x,y] of [[1856,564],[3330,1012]]) put('SignalHazard',x,y,64,44,12);
for (const [x,y] of [[292,546],[1568,547],[3216,994],[4136,540],[4864,544],[5568,551]]) put('Battery',x,y,32,32,12);
put('BugZero',6272,450,223,158,19);
put('RecoveryConsole',6980,498,105,110,10); put('Workbench',7148,482,160,126,9);
for (const [id,text,x,y,w] of [
  ['Exterior','MENARA CLOUD / EXTERIOR',104,330,420],['Lobby','LOBI',844,351,300],['Server','RUANG SERVER',1730,215,360],
  ['Tunnel','TEROWONGAN KABEL',2864,760,350],['Descent','JALUR KABEL ↓',2480,420,220],['CableA','SAKELAR A',2925,944,154],['CableB','SAKELAR B',3070,820,150],
  ['Distribution','DISTRIBUSI JARINGAN',3886,343,420],['Dashboard','DASHBOARD ↑',4880,195,300],['Communication','RUANG KOMUNIKASI',5168,298,368],
  ['Arena','ARENA BUG-ZERO',6020,220,440],['Recovery','RECOVERY / WORKBENCH',6900,345,410],
]) label('Sign_'+id,text,x,y,w);
scene.variables=objectVars({BossPhase:1,BossHP:120,BossStarted:false,BossInvulnerable:true,BossAttackCooldown:0,RepairStep:0});

function splice(content,from,to,replacement='') {
  const start=content.indexOf(from), end=content.indexOf(to,start+from.length);
  assert(start>=0&&end>start, `Missing source range ${from}`);
  return content.slice(0,start)+replacement+content.slice(end);
}
function replace(content,search,replacement) {
  assert(content.includes(search),`Missing source anchor ${search}`);
  return content.replace(search,replacement);
}
const css=`
    #cq-ui #cq-boss{position:absolute;left:50%;top:103px;transform:translateX(-50%);min-width:240px;width:36%;padding:8px 12px;background:#0d1f34;color:#d2ffff;box-shadow:inset 0 0 0 2px #49bec3;text-align:center}
    #cq-ui #cq-boss[hidden],#cq-ui[data-modal] #cq-boss{display:none}
    #cq-ui #cq-boss-hp{display:block;width:100%;accent-color:#fb7b87}
    #cq-ui .cloud-parts,#cq-ui .cloud-slots{display:grid;grid-template-columns:repeat(auto-fit,minmax(118px,1fr));gap:6px}
    #cq-ui :is(.cloud-parts,.cloud-slots) button{min-height:43px;padding:5px 7px;font-size:12px;line-height:1.25}
    #cq-ui .cloud-parts button:disabled{opacity:.42}
    #cq-ui .cloud-slots small{display:block;color:#90e4d9}
    #cq-ui #assembly-clock{font-size:22px;font-variant-numeric:tabular-nums;color:#9dffce}
    #cq-ui .greenhouse{position:relative;width:min(100%,310px);height:145px;margin:0 auto;overflow:hidden;background:#132a43;border:3px solid #74ccce}
    #cq-ui .greenhouse-roof{position:absolute;top:35px;left:19%;width:62%;height:7px;background:#b2f9fc;transform-origin:left;transform:rotate(-8deg);animation:roof-open 1.2s both}
    #cq-ui .greenhouse-wall{position:absolute;top:42px;left:19%;width:62%;height:85px;border:5px solid #73bdce;background:#13484f;display:flex;justify-content:space-evenly;align-items:end}
    #cq-ui .greenhouse-wall i{width:16px;height:30px;background:#64cc7a;box-shadow:8px -8px #6ae68d,-8px -3px #88e59a,0 5px #886148}
    #cq-ui .greenhouse b{position:absolute;top:57px;left:28%;width:8px;height:8px;background:#93ffa6;box-shadow:40px 25px #79dfff,67px 36px #79dfff,94px 23px #79dfff;animation:greenhouse-water .9s infinite alternate}
    @keyframes roof-open{from{transform:rotate(0)}to{transform:rotate(-8deg)}}
    @keyframes greenhouse-water{from{opacity:.45}to{opacity:1}}
    #cq-ui[data-reduce-motion] :is(.greenhouse-roof,.greenhouse b){animation:none}
`;
let shared=sourceFromProject('level2-runtime.js');
shared=replace(shared,'const sensorNames=[\'ESP32\',\'Relay\',\'Pump\',\'Servo\',\'LED\'];',`const sensorNames=${JSON.stringify(parts)};`);
shared=replace(shared,'  </style>',`${css}\n  </style>`);
shared=replace(shared,'  <div id="cq-tip"','  <div id="cq-boss" class="cq-frame" hidden><div id="cq-boss-phase"></div><progress id="cq-boss-hp" aria-label="HP Bug-Zero" max="120" value="120"></progress></div>\n  <div id="cq-tip"');
shared=replace(shared,'NOVA · 02','NOVA · 03').replace('Operator Pabrik','Teknisi Menara');
shared=splice(shared,'  c.about =','  const hearts=');
shared=shared.replace("  c.button('cq-inventory',c.inventory);c.button('cq-pause',c.pause);\n",'');
shared=shared.replace('Volt: Hati-hati! Hindari laser dan pulsa. Bug Berbaju Besi butuh dua Pulse.','Volt: Cari celah aman dan perhatikan indikator serangan.');
const header=shared.slice(0,shared.indexOf('  // Stage-specific UI'));
assert(header.includes('c.damage='));
const input=splice(shared.slice(shared.indexOf('const c=s._cq,p=c.player')), 'if(c.nextScene)', 'c.wall+=dt;', `if (c.nextScene) {\n  c.root._cqDispose?.(); c.root.remove();\n  gdjs.evtTools.runtimeScene.replaceScene(s,c.nextScene,false); return;\n}\n`).split('// World simulation')[0];
const animation=shared.slice(shared.indexOf('// Supplied mentor and villager'),shared.indexOf("for(const n of ['ESP32','Relay','Pump','Servo','LED'])globals"));
assert(animation.includes('c.updateHud'));
const mapCode=header+source('stage3-map-ui.js')+source('stage3-world.js')+`  c.button('cq-inventory',c.inventory); c.button('cq-pause',c.pause);\n  s.getObjects('Solid').concat(s.getObjects('Ladder')).forEach(o=>o.hide());\n  if (!gameVars.get('QuestState').getChild('CloudTerminal').getAsNumber()) at('HasMQTTKey')?.hide();\n  at('ArenaSeal').getBehavior('Platform').activate(false); at('ArenaSeal').hide();\n}\n`+input+source('stage3-map-frame.js')+animation+"for(const keyName of ['Escape','i','e','Space'])c.prev[keyName]=key(keyName);\n";
const panelHeader=header.replace("  c.player = s.getObjects('Nova')[0]; c.beh = c.player.getBehavior('Platformer');\n",'');
const assemblyCode=panelHeader+source('stage3-assembly.js');
const resultCode=panelHeader+source('stage3-result.js');
for (const code of [mapCode,assemblyCode,resultCode]) new Function('runtimeScene',code);

function sourceFromProject(name) { return fs.readFileSync(name,'utf8').replace(/\r\n/g,'\n'); }
function connectStage2Ui(code) {
  if (code.includes('id="continue-cloud"')) return code;
  code=replace(code,'<p class="muted">Progres Level 3 terbuka. Menara Cloud belum tersedia dalam proyek ini.</p><div class="row"><button class="primary" id="explore">Jelajahi Pabrik</button>','<div class="row"><button class="primary" id="continue-cloud">Lanjut ke Menara Cloud →</button><button id="explore">Jelajahi Pabrik</button>');
  return replace(code,"    c.button('explore',c.close);c.button('restart',c.restart);c.button('stage-one'", "    c.button('continue-cloud',()=>{c.nextScene='Stage3_Map';});\n    c.button('explore',c.close);c.button('restart',c.restart);c.button('stage-one'");
}
function connectStage2(code) {
  code=connectStage2Ui(code);
  const transition="if(c.nextScene){const game=s.getGame(),variables=game.getVariables();if(c.nextScene==='Stage3_Map')game._cqStageTransfer={hp:c.hp,energy:c.energy,preview:!variables.get('SensorHub').getAsNumber()};variables.get('CurrentStage').setNumber(c.nextScene==='MainGame Scene'?1:c.nextScene==='Stage3_Map'?3:2);";
  const hook=code.match(/^if\(c\.nextScene\)\{.*?(?=c\.root\._cqDispose)/m);
  assert(hook,'Stage 2 transition hook missing');
  return code.replace(hook[0],transition);
}
const comment = text => ({type:'BuiltinCommonInstructions::Comment',color:{r:35,g:190,b:170},comment:text});
const event = code => ({type:'BuiltinCommonInstructions::JsCode',inlineCode:code.split('\n'),parameterObjects:'',useStrict:true,eventsSheetExpanded:false});
const generated = [];
for (const g of original) {
  const stage2=g.layouts.find(l=>l.name==='Level2 Scene');
  const sourceEvent=stage2.events.find(e=>e.inlineCode), existing=sourceEvent.inlineCode.join('\n');
  const images=JSON.parse(existing.match(/const componentArt = (\{[^\n]*\});/)[1]);
  const portraits=existing.match(/const npcPortraits = (\{[^\n]*\});/)[1];
  const dataUrl = file => 'data:image/png;base64,'+fs.readFileSync(file).toString('base64');
  for (const [name,assetName] of Object.entries(art)) images[name]=dataUrl(assetName==='Battery'?'assets/art2d/Battery.png':asset(assetName));
  images.SensorHub=images.DHT22;
  const embed = code => code.replace('/* COMPONENT_ART_DATA */ {}',JSON.stringify(images)).replace('/* NPC_PORTRAIT_DATA */ {}',portraits);
  sourceEvent.inlineCode=connectStage2(existing).split('\n');
  const map=clone(scene);
  for (const name of ['Nova','Volt','Ohm','Warga']) {
    const target=map.objects.findIndex(o=>o.name===name);
    map.objects[target]={...clone(stage2.objects.find(o=>o.name===name)),persistentUuid:map.objects[target].persistentUuid};
  }
  map.events=[comment('STAGE 03 / MAP — HUD, movement, exploration, Pulse Wave, Bug-Zero, Recovery and Workbench.'),event(embed(mapCode))];
  const assembly=emptyScene('Stage3_Assembly','Smart Greenhouse');
  assembly.variables=objectVars({AssemblyTimer:180,AssemblyStarted:false,AssemblyCompleted:false});
  assembly.events=[comment('FINAL ASSEMBLY — inventory, drag-and-drop, timer and result.'),event(embed(assemblyCode))];
  for (const next of [map,assembly]) {
    const index=g.layouts.findIndex(l=>l.name===next.name);
    if(index>=0) g.layouts[index]=next; else g.layouts.push(next);
    if(!g.layoutsFolderStructure.children.some(node=>node.itemName===next.name)) g.layoutsFolderStructure.children.push({itemName:next.name});
  }
  for (const name of ['GameOver Scene','WinScreen Scene']) {
    const result=g.layouts.find(l=>l.name===name);
    assert(!result.events.length||result.events[0].comment?.startsWith('STAGE 03 /'),`${name} has existing events`);
    result.events=[comment('STAGE 03 / Result and retry.'),event(embed(resultCode))];
  }
  const staleDecks = new Set(g.resources.resources.filter(r=>r.name.startsWith(`${artDir}/Deck_`) && !additions.has(r.name)).map(r=>r.name));
  g.resources.resources=g.resources.resources.filter(r=>!staleDecks.has(r.name));
  for (const item of additions.values()) if(!g.resources.resources.some(r=>r.name===item.name)) g.resources.resources.push(item);
  g.properties.name='Circuit Quest';
  g.properties.description='Pulihkan Desa Sensorika melalui Hutan Sensor, Pabrik Mikrokontroler, dan Menara Cloud.';
  const addVars = (list,values) => { for (const v of objectVars(values)) if(!list.some(o=>o.name===v.name)) list.push(v); };
  const children = name => g.variables.find(v=>v.name===name).children;
  addVars(g.variables,Object.fromEntries(flags.map(name=>[name,false])));
  addVars(children('Inventory'),Object.fromEntries(parts.map(name=>[name.slice(3),0])));
  addVars(children('QuestState'),{CloudTerminal:0,CableA:0,CableB:0});
  addVars(children('AssemblyResult'),{SmartGreenhouse:0});
  generated.push(JSON.stringify(g,null,2));
}
const stage2Runtime=connectStage2(sourceFromProject('level2-runtime.js'));
const stage2Ui=sourceFromProject('level2-ui.js');
const nextUi=connectStage2Ui(stage2Ui);
const stage2Build=sourceFromProject('build_level2.cjs')
  .replace("if(c.nextScene){s.getGame().getVariables().get('CurrentStage').setNumber(c.nextScene==='MainGame Scene'?1:2);", "if(c.nextScene){const game=s.getGame(),variables=game.getVariables();if(c.nextScene==='Stage3_Map')game._cqStageTransfer={hp:c.hp,energy:c.energy,preview:!variables.get('SensorHub').getAsNumber()};variables.get('CurrentStage').setNumber(c.nextScene==='MainGame Scene'?1:c.nextScene==='Stage3_Map'?3:2);")
  .replace(" g.properties.name='Circuit Quest - Hutan Sensor & Pabrik Mikrokontroler';", " if(!g.layouts.some(l=>l.name==='Stage3_Map')) { g.properties.name='Circuit Quest - Hutan Sensor & Pabrik Mikrokontroler';")
  .replace("explore the microcontroller factory, escape, and assemble a Smart Controller.';", "explore the microcontroller factory, escape, and assemble a Smart Controller.'; }");
for (const [i,file] of files.entries()) {
  const backup=path.join('tmp',file.replace('.json','.before-level3.json'));
  if(!fs.existsSync(backup)) fs.copyFileSync(file,backup);
  fs.writeFileSync(file+'.stage3.tmp',generated[i]);
  fs.renameSync(file+'.stage3.tmp',file);
}
fs.writeFileSync('level2-runtime.js',stage2Runtime);
fs.writeFileSync('level2-ui.js',nextUi);
fs.writeFileSync('build_level2.cjs',stage2Build);
console.log(`Stage 3 installed in ${files.join(' and ')} (${scene.instances.length} map instances).`);
