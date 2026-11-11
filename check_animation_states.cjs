const fs=require('fs'),vm=require('vm'),assert=require('assert');
const code=fs.readFileSync(__dirname+'/level1-runtime.js','utf8');
const animation=code.slice(code.indexOf('// Fixed 128x128'),code.indexOf('// Sync HUD'));
function test(options){
 const c={wall:10,modal:false,hp:5,dead:false,attackUntil:0,interactUntil:0,voltUntil:0,...options};
 const p={name:'Idle',frame:0,getAnimationName(){return this.name},setAnimationName(n){this.name=n},setAnimationFrame(n){this.frame=n},setAnimationSpeedScale(){},flipX(){},pauseAnimation(){},playAnimation(){},getY(){return options.y??518}};
 const b={isOnFloor:()=>options.floor!==false,isOnLadder:()=>!!options.ladder,getCurrentSpeed:()=>options.speed||0};
 const volt={name:'Hover',getAnimationName(){return this.name},setAnimationName(n){this.name=n}};
 const s={getObjects:()=>[volt]};
 vm.runInNewContext(animation,{c,p,b,s,key:k=>(options.keys||[]).includes(k)});
 return [p.name,volt.name,p.frame];
}
const cases=[
 [{},'Idle','Hover'],[{speed:80},'Walk','Hover'],[{speed:139},'Walk','Hover'],[{speed:140},'Run','Hover'],[{speed:200},'Run','Hover'],
 [{floor:false,lastY:530},'Jump','Hover'],[{floor:false,lastY:500},'Jump','Hover'],
 [{ladder:true,floor:false,keys:['w']},'Climb','Hover'],
 [{ladder:true,floor:false,keys:['s']},'ClimbSide','Hover'],
 [{speed:220,attackUntil:11},'Pulse','Hover'],
 [{attackUntil:11,hurtUntil:11},'Hurt','Hover'],
 [{interactUntil:11,modal:true,voltUntil:11,voltMood:'Speak'},'Interact','Speak'],
 [{voltUntil:11,voltMood:'Happy'},'Idle','Happy'],
 [{dead:true,deathAt:20},'Defeat','Worried']
];
for(const [options,nova,volt] of cases){const result=test(options);assert.equal(result[0],nova);assert.equal(result[1],volt);}
assert.equal(test({floor:false,lastY:530})[2],1);
assert.equal(test({floor:false,lastY:500})[2],4);
assert.equal(test({floor:false,jumpStartUntil:11})[2],0);
assert.equal(test({floor:false,lastY:518})[2],2);
assert.equal(test({floor:false,lastY:516})[2],3);
assert.equal(test({landUntil:11})[2],5);
console.log('PASS: 14 animation-state scenarios, walk/run threshold, attack/hurt priority, ladder directions, six-pose jump selection and Volt expressions.');
const npcCode=code.slice(code.indexOf('// Supplied mentor'),code.indexOf('// Fixed 128x128'));
function npcTest(options){
 const c={wall:3,modal:false,npcSpeaker:'',dialogueOpenedAt:0,npcFrames:{},$:()=>null,...options};
 const p={getX:()=>options.x??360,getY:()=>518};
 const actors=Object.fromEntries([['Ohm',420,518],['Warga',4000,1030]].map(([name,x,y])=>[name,{name:'Idle',getX:()=>x,getY:()=>y,flipX(){},getAnimationName(){return this.name},setAnimationName(n){this.name=n},setAnimationFrame(){},getAnimationFrame:()=>2}]));
 vm.runInNewContext(npcCode,{c,p,s:{getObjects:n=>[actors[n]]}});
 return [actors.Ohm.name,actors.Warga.name];
}
assert.deepEqual(npcTest({}),['Idle','Idle']);
assert.deepEqual(npcTest({modal:true,npcSpeaker:'Ohm',dialogueOpenedAt:2}),['Talk','Idle']);
assert.deepEqual(npcTest({modal:true,npcSpeaker:'Ohm'}),['Explain','Idle']);
assert.deepEqual(npcTest({modal:true,npcSpeaker:'Warga'}),['Idle','Talk']);
assert.deepEqual(npcTest({wall:.5}),['Diagnostic','Idle']);
assert.deepEqual(npcTest({wall:.5,x:20}),['Idle','Idle']);
console.log('PASS: 6 NPC animation scenarios: idle, dialogue, explanation, diagnostic, distance and close-dialogue recovery.');
const portrait={src:'idle',getAttribute(){return this.src},setAttribute(k,v){this.src=v}};
npcTest({modal:true,npcSpeaker:'Ohm',dialogueOpenedAt:2,npcFrames:{Ohm:{Talk:['frame0','frame1','frame2','frame3']}},$:()=>portrait});
assert.equal(portrait.src,'frame2');
console.log('PASS: dialogue portrait follows the native NPC animation frame.');
