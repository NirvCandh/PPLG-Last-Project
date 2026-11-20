// Apply runtime corrections to the embedded events without regenerating either map.
const assert = require('node:assert/strict');
const marker = '// Circuit Quest gameplay audit';
const bindCheckpointRetry = code => code.replaceAll(
  "c.button('retry',c.restart);",
  "c.button('retry',()=>{c.retryRequested=true;c.restart();});"
);

function update(name, code) {
  const forest = name === 'MainGame Scene', factory = name === 'Level2 Scene', cloud = name === 'Stage3_Map';
  if (code.startsWith(marker)) return forest || factory ? bindCheckpointRetry(code) : code;
  const replace = (from, to) => {
    assert(code.includes(from), `Missing gameplay anchor in ${name}: ${from}`);
    code = code.replace(from, () => to);
  };
  if (name === 'Stage3_Assembly') {
    replace('<button class="primary" id="test">Test Circuit', '<button id="return">Kembali ke menara</button><button class="primary" id="test">Test Circuit');
    replace("    c.button('test', () => {", "    c.button('return',()=>c.navigate('Stage3_Map'));\n    c.button('test', () => {");
    return marker+'\n'+code;
  }
  if (name === 'GameOver Scene' || name === 'WinScreen Scene') {
    replace('    delete game._cqCloud;', '    c.clearJourneyArrival?.();\n    delete game._cqCloud;');
    return marker+'\n'+code;
  }
  if (!(forest || factory || cloud)) return code;
  replace('b.onpointerup=b.onpointercancel=', 'b.onpointerup=b.onpointercancel=b.onlostpointercapture=');
  replace('    c.jumpQueuedUntil=0;', '    c.jumpQueuedUntil=0; c.touch={}; c.touchJump=false; c.touchInteraction=false;');
  replace('const interact=interactionPressed&&!c.dialogue;', 'const interact=interactionPressed&&!c.modal&&!c.dead&&!c.useJourneyPortal?.();');
  replace("if(pressed('i')&&c.started&&!c.dead){if(c.modal)c.close();else c.inventory();}", "if(pressed('i')&&c.started&&!c.dead){if(!c.modal)c.inventory();else if(c.root.dataset.modal==='inventory')c.close();}");
  replace('b.activate(!c.modal);', 'b.activate(!c.modal&&!c.nextScene);');
  replace(cloud ? 'if (!c.modal) {\n  c.t += dt;' : 'if(!c.modal){\n c.t+=dt;', cloud ? 'if (!c.modal && !c.nextScene) {\n  c.t += dt;' : 'if(!c.modal&&!c.nextScene){\n c.t+=dt;');
  if (forest || factory) {
    code = bindCheckpointRetry(code);
    replace('if(c.restartRequested){\n ', 'if(c.restartRequested){\n if(c.retryRequested&&c.retryJourney)c.retryJourney();else c.clearJourneyArrival?.();\n ');
    if (forest) replace(" gdjs.evtTools.runtimeScene.replaceScene(s,'MainGame Scene',false);\n return;", " c.root._cqDispose?.();c.root.remove();gdjs.evtTools.runtimeScene.replaceScene(s,'MainGame Scene',false);\n return;");
    replace("for(const o of s.getObjects('Battery'))if(hit(p,o))", "for(const o of s.getObjects('Battery'))if(!c.dead&&c.energy<100&&hit(p,o))");
    // A chase may run to the edge of the floor; idle patrol turns at the reachable endpoint.
    const range = forest ? 90 : 95;
    replace(`else if(o.getX()>=home+${range})dir=-1;`, `else if(o.getX()>=Math.min(home+${range},o._patrolFloor?o._patrolFloor.getX()+o._patrolFloor.getWidth()-o.getWidth():Infinity))dir=-1;`);
    replace(`else if(o.getX()<=home-${range})dir=1;`, `else if(o.getX()<=Math.max(home-${range},o._patrolFloor?.getX()??-Infinity))dir=1;`);
    replace("let prompt=ladder?", "const offer = (object,label,action) => {if(!object)return; const dx=object.getX()+object.getWidth()/2-p.getX()-48,dy=object.getY()+object.getHeight()/2-p.getY()-52; offers.push({label,action,distance:dx*dx+dy*dy});};\n const offers=[];\n let prompt=ladder?");
    if (forest) {
      replace("prompt='E · Buka peti '+label;\n   if(interact){c.collect(n);o.setAnimation(1);}", "offer(o,'Buka peti '+label,()=>{c.collect(n);o.setAnimation(1);});");
      replace("  prompt='E · Prof. Ohm / Research Station';\n  if(interact){", "  offer(near(s.getObjects('Ohm')[0])?s.getObjects('Ohm')[0]:s.getObjects('Terminal')[0],'Prof. Ohm / Research Station',()=>{");
      replace("  }\n }\n if(near(s.getObjects('Warga')[0]))", "  });\n }\n if(near(s.getObjects('Warga')[0]))");
      replace("prompt='E · Warga / Quest sensor gerak';if(interact)c.quiz();", "offer(s.getObjects('Warga')[0],'Warga / Quest sensor gerak',c.quiz);");
      replace("prompt='E · '+(c.power?'Daya pulih / isi energi':'Pulihkan gangguan listrik');if(interact){", "offer(s.getObjects('SensorPost')[0],c.power?'Daya pulih / isi energi':'Pulihkan gangguan listrik',()=>{");
      replace("Meja rakit siap digunakan.');}}", "Meja rakit siap digunakan.');});}");
      replace("prompt='E · Workbench / Sensor Hub';if(interact){", "offer(s.getObjects('Workbench')[0],'Workbench / Sensor Hub',()=>{");
      replace("else c.assembly();}}", "else c.assembly();});}");
      replace("if(p.getX()>3200&&p.getX()<4350&&p.getY()>900)", "if(b.isOnFloor()&&p.getX()>3200&&p.getX()<4350&&p.getY()>1000)");
    } else {
      replace("prompt='E · Ambil '+({Relay:'Modul Relay',Pump:'Pompa Mini',Servo:'Servo'}[n]??n);if(interact){c.collect(n);o.setAnimation(1);}", "offer(o,'Ambil '+({Relay:'Modul Relay',Pump:'Pompa Mini',Servo:'Servo'}[n]??n),()=>{c.collect(n);o.setAnimation(1);});");
      replace("   prompt='E · Prof. Ohm / Research Station';if(interact){", "   offer(near(s.getObjects('Ohm')[0])?s.getObjects('Ohm')[0]:s.getObjects('Terminal')[0],'Prof. Ohm / Research Station',()=>{");
      replace("   ]);}\n }", "   ]);});\n }");
      replace("prompt='E · Warga / Kuis kontrol pompa';if(interact)c.quiz();", "offer(s.getObjects('Warga')[0],'Warga / Kuis kontrol pompa',c.quiz);");
      replace("prompt='E · Sakelar '+id+' / Urutan A → C → B';if(interact)c.pressSwitch(id);", "offer(o,'Sakelar '+id+' / Urutan A → C → B',()=>c.pressSwitch(id));");
      replace("prompt='E · Panel evakuasi';if(interact){", "offer(s.getObjects('SensorPost')[0],'Panel evakuasi',()=>{");
      replace("Workbench di kanan siap digunakan.',6);}}}", "Workbench di kanan siap digunakan.',6);}});}");
      replace("prompt='E · Workbench / Smart Controller';if(interact){", "offer(s.getObjects('Workbench')[0],'Workbench / Smart Controller',()=>{");
      replace("else c.assembly();}}", "else c.assembly();});}");
      replace("if(p.getX()>3280&&p.getX()<4180&&p.getY()>900)", "if(!c.escapeStarted&&!c.escapeDone&&b.isOnFloor()&&p.getX()>3280&&p.getX()<4180&&p.getY()>950)");
      replace("if(p.getX()>2360&&p.getX()<2900", "if(!c.escapeStarted&&!c.escapeDone&&p.getX()>2360&&p.getX()<2900");
      replace('c.escapeLeft=65;c.hp=Math.max(1,c.hp-1);', 'c.escapeLeft=65;c.checkpoint=[4280,966];c.hp=Math.max(1,c.hp-1);');
      replace("o.setOpacity(c.power?45:200+Math.sin(c.t*10)*55)", "o.setOpacity(c.power?65:235)");
      replace('o.setOpacity(active?255:95)', 'o.setOpacity(active?255:c.power?70:150)');
    }
    replace(" const message=c.t<c.until?c.message:'';", " const selected=offers.sort((a,b)=>a.distance-b.distance)[0];\n if(selected){prompt='E · '+selected.label;if(interact&&!c.dead)selected.action();}\n const message=c.t<c.until?c.message:'';");
    if(factory) replace("if(hit(p,o))respawn();", "if(!c.dead&&hit(p,o))respawn();");
  }
  if (cloud) {
    replace("if (interact) selection?.action();", "if (interact && !c.dead) selection?.action();");
    replace("if (near(checkpoint,60) && progress.checkpoint !== id", "if (!c.dead && b.isOnFloor() && near(checkpoint,60) && progress.checkpoint !== id");
    replace("hazard.setOpacity(active?255:cycle>1.6?140:62);", "hazard.setOpacity(active?255:cycle>1.6?190:119);");
    replace('zone.setOpacity(105);','zone.setOpacity(160);');
    replace('zone.setOpacity(210);','zone.setOpacity(235);');
    replace("for (const dx of [-34,38]) spawn('GlitchFragment',enemy.getX()+dx,enemy.getY()+30,36,43,16);", "for (const dx of [-34,38]) {\n        const fragment=spawn('GlitchFragment',enemy.getX()+dx,enemy.getY()+30,36,43,16);\n        if(enemy._cqCoinToken)fragment._cqCoinToken=enemy._cqCoinToken+':fragment:'+dx;\n      }");
  }
  replace('pulse.setX(pulse.getX()+pulse._dir*680*dt);', 'if(c.advanceJourneyShot ? !c.advanceJourneyShot(pulse,680*dt) : (pulse.setX(pulse.getX()+pulse._dir*680*dt),false)){pulse.deleteFromScene(s);continue;}');
  if (factory || cloud) {
    const velocity=factory?255:270;
    replace(`shot.setX(shot.getX()+shot._dir*${velocity}*dt);`, `if(c.advanceJourneyShot ? !c.advanceJourneyShot(shot,${velocity}*dt) : (shot.setX(shot.getX()+shot._dir*${velocity}*dt),false)){shot.deleteFromScene(s);continue;}`);
  }
  return marker+'\n'+code;
}

module.exports={update};
