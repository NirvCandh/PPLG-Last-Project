// Slice the supplied Level 2 sheets; original files are never modified.
const fs=require('fs'),path=require('path');
const png=require('./sprite_png.cjs');
const dir='assets/level2/generated';fs.mkdirSync(dir,{recursive:true});
const cache={},manifest={sources:['Cyberpunk Circuit Factory Panorama.png','rmbg_enemy.png','rmbg_komponen.png','rmbg_rintangan.png','rmbg_tilesheet.png'],sprites:{}};
function source(name){return cache[name]??=png.read('assets/level2/'+name+'.png');}
function slice(name,sheet,box,canvas){
 const src=source(sheet),crop=png.blank(box[2]-box[0],box[3]-box[1]);png.blit(crop,src,box,0,0);
 // Discard faint background-removal speckles, preserving the supplied illustration.
 for(let i=3;i<crop.data.length;i+=4)if(crop.data[i]<95)crop.data[i]=0;
 const bounds=png.bounds(crop);if(!bounds)throw Error('Empty slice '+name);
 let art;
 if(canvas){art=png.blank(...canvas);const k=Math.min((canvas[0]-8)/(bounds[2]-bounds[0]),(canvas[1]-8)/(bounds[3]-bounds[1]));const w=Math.round((bounds[2]-bounds[0])*k),h=Math.round((bounds[3]-bounds[1])*k);png.blit(art,crop,bounds,Math.floor((canvas[0]-w)/2),canvas[1]-4-h,w,h);}
 else{art=png.blank(bounds[2]-bounds[0],bounds[3]-bounds[1]);png.blit(art,crop,bounds,0,0);}
 const file=dir+'/'+name+'.png';png.write(file,art);manifest.sprites[name]={file,width:art.width,height:art.height,source:sheet+'.png',box};return file;
}
slice('ESP32','rmbg_komponen',[23,492,324,751],[128,112]);
slice('Relay','rmbg_komponen',[307,501,566,751],[128,112]);
slice('Pump','rmbg_komponen',[565,516,802,739],[128,112]);
slice('Servo','rmbg_komponen',[805,492,1057,760],[128,112]);
slice('LED','rmbg_komponen',[1064,516,1199,748],[128,112]);
slice('Panel','rmbg_rintangan',[22,21,514,294]);
slice('Shelf','rmbg_rintangan',[22,701,514,883]);
slice('Conveyor0','rmbg_rintangan',[530,75,1042,309],[512,248]);
slice('Conveyor1','rmbg_rintangan',[530,365,1042,610],[512,248]);
slice('Laser','rmbg_rintangan',[1110,17,1283,634]);
slice('Switch','rmbg_rintangan',[1352,56,1607,297]);
slice('Research','rmbg_rintangan',[1322,325,1630,628]);
slice('Workbench','rmbg_rintangan',[1296,631,1651,908]);
for(let i=0;i<4;i++)slice('Armored'+i,'rmbg_enemy',[[25,100,404,326],[428,100,806,326],[25,354,404,579],[428,354,806,579]][i],[160,112]);
for(let i=0;i<4;i++)slice('Shooter'+i,'rmbg_enemy',[[20,639,247,917],[248,639,465,917],[467,639,691,917],[703,639,951,917]][i],[112,144]);
slice('EnemyPulse','rmbg_enemy',[990,1004,1239,1129],[96,48]);
// Opaque 64px metal tiles are composed on an opaque backing to avoid seams.
for(const [name,box] of [['MetalTop',[170,68,305,208]],['MetalFill',[170,231,305,369]],['MetalCircuit',[320,393,452,533]]]){
 const im=png.blank(64,64,[13,29,43,255]);png.blit(im,source('rmbg_tilesheet'),box,0,0,64,64);const file=dir+'/'+name+'.png';png.write(file,im);manifest.sprites[name]={file,width:64,height:64,source:'rmbg_tilesheet.png',box};
}
for(let i=0;i<4;i++){
 slice('Waste'+i,'rmbg_tilesheet',[1070+i*150,65,1207+i*150,211],[64,64]);
 slice('Electric'+i,'rmbg_tilesheet',[1070+i*150,725,1207+i*150,877],[64,64]);
}
fs.writeFileSync(dir+'/manifest.json',JSON.stringify(manifest,null,2));
console.log('Prepared '+Object.keys(manifest.sprites).length+' Level 2 sprites.');
module.exports=manifest;
