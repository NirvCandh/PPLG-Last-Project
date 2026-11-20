const fs=require('fs'),assert=require('assert');
const editor=JSON.parse(fs.readFileSync('Circuit Quest - Editor Backup Before Level 2.json'));
const before=JSON.parse(fs.readFileSync('Project TA PPLG.before-level2.json'));
const filename='Project TA PPLG.json',project=JSON.parse(fs.readFileSync(filename));
const a=editor.layouts.find(s=>s.name==='MainGame Scene'),b=before.layouts.find(s=>s.name===a.name),dest=project.layouts.find(s=>s.name===a.name);
assert.deepStrictEqual(a.objects,b.objects);assert.deepStrictEqual(a.events,b.events);
const old=new Map(b.instances.map(i=>[i.persistentUuid,i]));let count=0;
for(const i of a.instances)if(JSON.stringify(i)!==JSON.stringify(old.get(i.persistentUuid))){const j=dest.instances.findIndex(x=>x.persistentUuid===i.persistentUuid);assert(j>=0);dest.instances[j]=i;count++;}
dest.uiSettings=a.uiSettings;
fs.writeFileSync(filename,JSON.stringify(project,null,2));console.log('Preserved '+count+' unsaved Level 1 instance edits and editor viewport.');
