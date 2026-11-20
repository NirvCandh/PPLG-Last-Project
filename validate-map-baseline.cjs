const {outlinePath,layoutConfig,fixCaveLedge,styleSign}=require('./readability-art.cjs');
const extra=name=>['JourneyShop','JourneyPortal','JourneyShieldAura'].includes(name)||name?.startsWith('Readability_');
const existing=items=>items.filter(o=>!extra(o.name));
function mappedObjects(name,objects){
 const config=layoutConfig[name];
 return structuredClone(objects).map(o=>{
  const kind=config.hazards.includes(o.name)?'Hazard':config.enemies.includes(o.name)?'Enemy':null;
  if(kind)for(const a of o.animations)for(const d of a.directions)for(const f of d.sprites)f.image=outlinePath(f.image,kind);
  return o;
 });
}
// Editor migration omits default values and stores numeric instance variables as numbers.
const runtimeInstances=items=>items.map(i=>({...i,keepRatio:i.keepRatio??false,
 initialVariables:i.initialVariables.map(v=>v.type==='number'?{...v,value:Number(v.value)}:v)}));
const runtimeObjects=items=>items.map(o=>{
 if(o.type!=='TextObject::Text')return {...o,assetStoreId:o.assetStoreId??''};
 const {name,type,persistentUuid,variables,effects,behaviors,content}=o;
 return {name,type,persistentUuid,variables,effects,behaviors,content:content&&{
  text:content.text,font:content.font,characterSize:content.characterSize,bold:content.bold,color:content.color,
  isOutlineEnabled:content.isOutlineEnabled,outlineThickness:content.outlineThickness,outlineColor:content.outlineColor}};
});
module.exports={extra,existing,mappedObjects,mappedInstances:fixCaveLedge,runtimeInstances,runtimeObjects,styleSign};
