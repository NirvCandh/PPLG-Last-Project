const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const png=require('./sprite_png.cjs');
const gameplay=require('./gameplay-audit.cjs');
const readability=require('./readability-art.cjs');
const dir='assets/journey';fs.mkdirSync(dir,{recursive:true});
const palette={ink:[12,19,33,255],wood:[108,67,49,255],edge:[200,154,85,255],gold:[247,201,76,255],shine:[255,239,168,255],teal:[100,219,196,255],dark:[30,68,78,255],cream:[240,224,184,255]};
function rect(im,x,y,w,h,color){for(let yy=y;yy<y+h;yy++)for(let xx=x;xx<x+w;xx++)if(xx>=0&&yy>=0&&xx<im.width&&yy<im.height)im.data.set(palette[color]||color,(yy*im.width+xx)*4);}
function art(name,w,h,draw){const im=png.blank(w,h);draw(im);png.write(`${dir}/${name}.png`,im);return `${dir}/${name}.png`;}
const images={};
images.Coin=art('Coin',16,16,im=>{rect(im,4,1,8,14,'ink');rect(im,2,3,12,10,'ink');rect(im,4,2,8,12,'gold');rect(im,3,4,10,8,'gold');rect(im,5,3,6,1,'shine');rect(im,5,4,2,7,'shine');rect(im,8,5,2,6,'wood');});
images.Shield=art('Shield',16,16,im=>{rect(im,2,1,12,9,'ink');rect(im,3,9,10,3,'ink');rect(im,5,12,6,2,'ink');rect(im,7,14,2,1,'ink');rect(im,3,2,10,7,'edge');rect(im,4,8,8,3,'edge');rect(im,6,11,4,2,'edge');rect(im,5,3,6,6,'teal');rect(im,6,8,4,2,'teal');rect(im,7,3,2,7,'shine');});
const shieldAura = art('ShieldAura',52,52,im=>{
 for(let y=0;y<52;y++)for(let x=0;x<52;x++){
  const dx=Math.abs(x-25.5),dy=Math.abs(y-25.5);
  const distance=Math.max(dx,dy,(dx+dy)*.72);
  if(distance<22.8||distance>25.4)continue;
  const accent=(dx<6&&dy>23)||(dy<4&&dx>23);
  const color=distance>=23.5&&distance<24.8?(accent?[224,255,247,255]:'teal'):'ink';
  rect(im,x,y,1,1,color);
 }
});
images.Shop=art('Shop',64,56,im=>{
 rect(im,3,49,58,5,'ink');rect(im,9,19,3,32,'wood');rect(im,52,19,3,32,'wood');rect(im,5,8,54,13,'ink');
 for(let x=7;x<57;x+=10){rect(im,x,10,10,9,(x%20===7)?'teal':'cream');rect(im,x,19,8,4,(x%20===7)?'dark':'edge');}
 rect(im,17,1,30,8,'ink');rect(im,19,3,26,4,'edge');for(let x=22;x<42;x+=5)rect(im,x,4,3,2,'shine');
 rect(im,7,35,50,15,'ink');rect(im,9,37,46,11,'wood');rect(im,9,36,46,2,'edge');rect(im,12,40,40,1,'edge');
 rect(im,24,24,16,13,'ink');rect(im,26,25,12,9,'teal');rect(im,28,27,3,3,'ink');rect(im,34,27,3,3,'ink');rect(im,29,32,7,1,'cream');
 rect(im,15,28,5,7,'gold');rect(im,44,28,5,7,'teal');rect(im,13,34,10,2,'edge');
});
images.Portal=art('Portal',32,48,im=>{
 rect(im,1,43,30,5,'ink');rect(im,3,42,26,3,'edge');rect(im,4,11,5,32,'ink');rect(im,23,11,5,32,'ink');rect(im,8,5,16,5,'ink');rect(im,6,9,5,7,'ink');rect(im,21,9,5,7,'ink');
 rect(im,6,14,2,27,'edge');rect(im,24,14,2,27,'edge');rect(im,11,7,10,2,'edge');rect(im,9,11,14,29,'dark');
 rect(im,11,14,2,23,'teal');rect(im,19,13,2,23,'teal');rect(im,13,11,6,2,'teal');rect(im,13,37,6,2,'teal');
 rect(im,14,19,4,14,'ink');rect(im,15,22,2,8,'shine');for(let y=16;y<39;y+=8){rect(im,5,y,4,2,'shine');rect(im,23,y+3,4,2,'teal');}
});
images.Heart='assets/art2d/Heart.png';images.Battery='assets/art2d/Battery.png';
for(const file of Object.values(images))assert(fs.existsSync(file),file);
const data=Object.fromEntries(Object.entries(images).map(([k,file])=>[k,'data:image/png;base64,'+fs.readFileSync(file).toString('base64')]));
const runtime=fs.readFileSync('journey-runtime.js','utf8');new Function(runtime);
const configs={
 'MainGame Scene':{stage:1,arrivalEntry:[160,518],arrivalExit:[6350,518],portals:[[6375,464,'Level2 Scene',1]],shop:[600,496]},
 'Level2 Scene':{stage:2,arrivalEntry:[200,518],arrivalExit:[6380,518],portals:[[34,464,'MainGame Scene',0],[6450,464,'Stage3_Map',1]],shop:[610,496]},
 'Stage3_Map':{stage:3,arrivalEntry:[200,518],arrivalExit:[7140,518],portals:[[24,464,'Level2 Scene',0]],shop:[1515,496]},
 'Stage3_Assembly':{stage:3},'GameOver Scene':{stage:3},'WinScreen Scene':{stage:3,ending:true}
};
function sprite(name,file){const {width,height}=png.read(file);return {name,type:'Sprite',adaptCollisionMaskAutomatically:false,updateIfNotVisible:true,variables:[],effects:[],behaviors:[],animations:[{name:'Idle',useMultipleDirections:false,directions:[{looping:false,timeBetweenFrames:1,sprites:[{hasCustomCollisionMask:true,image:file,points:[],originPoint:{name:'origine',x:0,y:0},centerPoint:{automatic:true,name:'centre',x:0,y:0},customCollisionMask:[[{x:0,y:0},{x:width,y:0},{x:width,y:height},{x:0,y:height}]]}]}]}]};}
function instance(name,x,y,w,h,vars=[]){return {name,x,y,width:w,height:h,zOrder:18,angle:0,layer:'',depth:1,customSize:true,keepRatio:false,numberProperties:[],stringProperties:[],initialVariables:vars};}
const files=['Project TA PPLG.json','Circuit Quest - NPC Animasi.json'];
const journeyObjects=['JourneyShop','JourneyPortal','JourneyShieldAura'];
fs.mkdirSync('tmp/before-journey',{recursive:true});
for(const file of files){
 const backup=path.join('tmp/before-journey',file);if(!fs.existsSync(backup))fs.copyFileSync(file,backup);
 const g=JSON.parse(fs.readFileSync(file));
 for(const [name,config]of Object.entries(configs)){
  const scene=g.layouts.find(s=>s.name===name);assert(scene,name);
  scene.events=scene.events.filter(e=>e.journeyFeature!==true&&!e.inlineCode?.join('\n').includes('function circuitJourney(s, config)'));
  // Capture stats and inventory before the existing scene transition returns.
  for(const event of scene.events.filter(e=>e.inlineCode)){
   let code=gameplay.update(name,event.inlineCode.join('\n').replace(/\r\n/g,'\n'));
   for(const enemy of ['target','enemy'])code=code.replaceAll(`c.awardEnemy?.(${enemy});`,'').replaceAll(`${enemy}.deleteFromScene(s);`,`c.awardEnemy?.(${enemy});${enemy}.deleteFromScene(s);`);
   code=code.replace(/(if\s*\(c\.nextScene\)\s*\{)(?!c\.snapshotJourney)/g,'$1c.snapshotJourney?.();');
   // CurrentStage follows the actual destination even when returning through a portal.
   if(config.stage===1)code=code.replace("get('CurrentStage').setNumber(2)","get('CurrentStage').setNumber(c.nextScene==='Stage3_Map'?3:c.nextScene==='Level2 Scene'?2:1)");
   event.inlineCode=code.split('\n');new Function('runtimeScene',code);
  }
  scene.objects=scene.objects.filter(o=>!journeyObjects.includes(o.name));scene.instances=scene.instances.filter(o=>!journeyObjects.includes(o.name));
  if(config.shop){
   scene.objects.push(sprite('JourneyShop',images.Shop),sprite('JourneyPortal',images.Portal),sprite('JourneyShieldAura',shieldAura));
   scene.instances.push(instance('JourneyShop',...config.shop,128,112));
   for(const [x,y,target,forward]of config.portals)scene.instances.push(instance('JourneyPortal',x,y,96,144,[{name:'target',type:'string',value:target},{name:'forward',type:'number',value:forward}]));
   scene.objectsFolderStructure.children=scene.objectsFolderStructure.children.filter(o=>!journeyObjects.includes(o.objectName));
   scene.objectsFolderStructure.children.push(...journeyObjects.map(objectName=>({objectName})));
  }
  scene.events.push({type:'BuiltinCommonInstructions::JsCode',inlineCode:(runtime+'\ncircuitJourney(runtimeScene,'+JSON.stringify({...config,art:data})+');').split('\n'),parameterObjects:'',useStrict:true,eventsSheetExpanded:false,journeyFeature:true});
 }
 readability.install(g,sprite,instance);
 for(const file of [...Object.values(images),shieldAura])if(!g.resources.resources.some(r=>r.name===file))g.resources.resources.push({file,name:file,kind:'image',metadata:'',smoothed:false,userAdded:true});
 for(const [name,value]of [['Coins',0],['ShieldCharges',0]])if(!g.variables.some(v=>v.name===name))g.variables.push({name,type:'number',value});
 fs.writeFileSync(file,JSON.stringify(g,null,2));console.log('Installed journey features: '+file);
}
