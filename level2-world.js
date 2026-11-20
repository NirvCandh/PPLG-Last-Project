// World simulation is paused with every menu/dialogue; wall time only drives portraits and cues.
if(!c.modal){
 c.t+=dt;c.invuln-=dt;c.cooldown-=dt;
 if(key('a')||key('Left')){b.simulateLeftKey();c.face=-1;}
 if(key('d')||key('Right')){b.simulateRightKey();c.face=1;}
 if(jumpPressed)c.jumpQueuedUntil=c.wall+.09;
 const bufferedJump=c.wall<c.jumpQueuedUntil&&(b.isOnFloor()||b.isOnLadder());
 if(key('Space')||jumpPressed||bufferedJump)b.simulateJumpKey();
 if(bufferedJump){c.jumpQueuedUntil=0;c.jumpStartUntil=c.wall+.08;}
 if(key('w')||key('Up')){b.simulateLadderKey();b.simulateUpKey();}
 if(key('s')||key('Down')){b.simulateLadderKey();b.simulateDownKey();}
 p.setOpacity(c.invuln>0?(Math.floor(c.t*15)%2?90:255):255);
 p.setX(Math.max(0,Math.min(6600,p.getX())));
 const near=(o,dist=120)=>o&&Math.abs(o.getX()-p.getX())<dist&&Math.abs(o.getY()-p.getY())<125;
 const hit=(a,o)=>{const left=a.getX()+(a===p?33:4),right=a.getX()+(a===p?63:a.getWidth()-4),top=a.getY()+(a===p?17:4),bottom=a.getY()+(a===p?90:a.getHeight()-4);return right>o.getX()+5&&left<o.getX()+o.getWidth()-5&&bottom>o.getY()+5&&top<o.getY()+o.getHeight()-5;};
 const respawn=()=>{c.damage();p.setPosition(...c.checkpoint);b.setCurrentFallSpeed(0);b.setCurrentSpeed(0);c.cameraY=undefined;c.jumpQueuedUntil=0;};
 if(p.getY()>1370)respawn();
 if(p.getX()>2360&&p.getX()<2900&&p.getY()>480&&p.getY()<620)c.checkpoint=[2400,518];
 if(p.getX()>3280&&p.getX()<4180&&p.getY()>900)c.checkpoint=[3280,966];
 if(p.getX()>5670&&p.getY()>480&&p.getY()<620)c.checkpoint=[5680,518];
 if(key('j')&&c.cooldown<=0&&c.energy>=5){const pulse=s.createObject('Pulse');pulse.setPosition(p.getX()+(c.face>0?76:0),p.getY()+50);pulse.setSize(28,16);pulse.setZOrder(30);pulse._dir=c.face;pulse._life=.7;c.energy-=5;c.cooldown=.34;c.attackUntil=c.wall+pulseCue;if(p.getAnimationName()==='Pulse')p.setAnimationFrame(0);}
 for(const pulse of s.getObjects('Pulse')){
   pulse._life-=dt;if(pulse._life<=0){pulse.deleteFromScene(s);continue;}pulse.setX(pulse.getX()+pulse._dir*680*dt);
   const target=[...s.getObjects('Bug'),...s.getObjects('Glitch')].find(o=>hit(pulse,o));
   if(target){target._hp=(target._hp??(target.getName()==='Bug'?2:1))-1;target.setColor('255;150;150');target._flash=c.t+.12;if(target._hp<=0){const bat=s.createObject('Battery');bat.setPosition(target.getX(),target.getY());bat.setSize(36,36);bat.setZOrder(12);target.deleteFromScene(s);}pulse.deleteFromScene(s);}
 }
 for(const o of s.getObjects('Bug')){
   const v=o.getVariables(),home=v.get('home').getAsNumber(),dx=p.getX()-o.getX();let dir=v.get('dir').getAsNumber()||1;
   if(Math.abs(dx)<230&&Math.abs(p.getY()-o.getY())<100)dir=Math.sign(dx)||1;else if(o.getX()>=home+95)dir=-1;else if(o.getX()<=home-95)dir=1;
   v.get('dir').setNumber(dir);const next=o.getX()+dir*82*dt,floor=o._patrolFloor;o.setX(floor?Math.max(floor.getX(),Math.min(floor.getX()+floor.getWidth()-o.getWidth(),next)):next);
   o.flipX(dir<0);if(c.t>(o._flash??0))o.setColor('255;255;255');if(hit(p,o))c.damage();
 }
 for(const o of s.getObjects('Glitch')){
   const dx=p.getX()-o.getX();o.flipX(dx<0);if(c.t>(o._flash??0))o.setColor('255;255;255');
   if(Math.abs(dx)<580&&Math.abs(p.getY()-o.getY())<130&&c.t>(o._nextShot??0)){
     o._nextShot=c.t+2.2;const shot=s.createObject('EnemyPulse');shot.setPosition(o.getX()+o.getWidth()/2,o.getY()+25);shot.setSize(44,22);shot.setZOrder(25);shot._dir=Math.sign(dx)||1;shot._life=3;shot.flipX(shot._dir<0);
   }if(hit(p,o))c.damage();
 }
 for(const shot of s.getObjects('EnemyPulse')){shot._life-=dt;shot.setX(shot.getX()+shot._dir*255*dt);if(hit(p,shot)){c.damage();shot.deleteFromScene(s);}else if(shot._life<=0)shot.deleteFromScene(s);}
 for(const o of s.getObjects('Waste')){o.setAnimationFrame(Math.floor(c.t*5)%4);if(hit(p,o))respawn();}
 for(const o of s.getObjects('Short')){const phase=(c.t+o.getX()/640)%3.8,active=!c.power&&phase>1.7;o.setOpacity(active?255:95);if(active&&hit(p,o))c.damage();}
 for(const o of s.getObjects('Conveyor')){
   if(b.isOnFloor()&&p.getX()+63>o.getX()&&p.getX()+33<o.getX()+o.getWidth()&&Math.abs(p.getY()+90-(o.getY()+22))<9)p.setX(p.getX()+o.getVariables().get('dir').getAsNumber()*105*dt);
 }
 for(const o of s.getObjects('Battery'))if(hit(p,o)){c.energy=Math.min(100,c.energy+20);o.deleteFromScene(s);c.say('Baterai Mini: +20 energi.',2);}
 const ladder=s.getObjects('Ladder').find(o=>Math.abs(p.getX()+48-o.getX()-o.getWidth()/2)<82&&p.getY()+90>o.getY()-32&&p.getY()<o.getY()+o.getHeight());
 let prompt=ladder?'W / S · Tangga mesin (tahan D di ujung atas)':'';
 for(const o of s.getObjects('Chest')){
   const n=o.getVariables().get('sensor').getAsString();if(c.inv[n])continue;
   const dh=p.getY()+90-o.getY()-o.getHeight();
   if(near(o)&&b.isOnFloor()&&Math.abs(dh)<=22){prompt='E · Ambil '+({Relay:'Modul Relay',Pump:'Pompa Mini',Servo:'Servo'}[n]??n);if(interact){c.collect(n);o.setAnimation(1);}}
   else if(near(o,320)&&dh>45)prompt='Tahan Space · Lompat ke platform komponen';
 }
 if(near(s.getObjects('Terminal')[0])||near(s.getObjects('Ohm')[0])){
   prompt='E · Prof. Ohm / Research Station';if(interact){c.hp=Math.min(5,c.hp+1);c.energy=100;c.collect('ESP32');c.openDialogue('Ohm',[
    {text:'Sensor Hub memberi input. ESP32 mengolah data, lalu mengirim perintah ke aktuator. Ini ESP32 untukmu.'},
    {text:'Relay berada di platform produksi. Pompa Mini ada di catwalk di atas limbah. Servo tersimpan di terowongan mesin; Warga memberikan LED lewat kuis.'},
    {text:'Sakelar terowongan harus A, C, lalu B. Laser padam dan hitung mundur evakuasi dimulai. Capai panel hijau di kanan sebelum waktu habis.'},
    {text:'Di Workbench, sambungkan Sensor Hub ke GPIO34, relay ke GPIO26, servo ke GPIO18, dan LED melalui resistor ke GPIO2. Jika tanah di bawah 40%, pompa menyala.'}
   ]);}
 }
 if(near(s.getObjects('Warga')[0])){prompt='E · Warga / Kuis kontrol pompa';if(interact)c.quiz();}
 for(const o of s.getObjects('Switch'))if(near(o)){const id=o.getVariables().get('id').getAsString();prompt='E · Sakelar '+id+' / Urutan A → C → B';if(interact)c.pressSwitch(id);}
 for(const o of s.getObjects('Laser')){o.setOpacity(c.power?45:200+Math.sin(c.t*10)*55);if(!c.power&&hit(p,o))c.damage();}
 for(const o of s.getObjects('LaserBarrier')){o.getBehavior('Platform').activate(!c.power);o.hide();}
 if(c.escapeStarted&&!c.escapeDone){
   c.escapeLeft-=dt;if(c.escapeLeft<=0){c.escapeLeft=65;c.hp=Math.max(1,c.hp-1);c.invuln=2;p.setPosition(4280,966);b.setCurrentFallSpeed(0);b.setCurrentSpeed(0);c.cameraY=undefined;c.say('Evakuasi diulang. Ikuti tangga di kanan menuju panel hijau.',5);}
 }
 if(near(s.getObjects('SensorPost')[0])){prompt='E · Panel evakuasi';if(interact){if(!c.power)c.say('Panel terkunci. Tekan sakelar A → C → B di terowongan mesin.');else{c.escapeDone=true;c.energy=100;c.checkpoint=[5680,518];c.say('Evakuasi berhasil. Pabrik stabil. Workbench di kanan siap digunakan.',6);}}}
 if(near(s.getObjects('Workbench')[0])){prompt='E · Workbench / Smart Controller';if(interact){const missing=['ESP32','Relay','Pump','Servo','LED'].filter(n=>!c.inv[n]);if(missing.length)c.say('Komponen belum lengkap: '+missing.join(', ')+'.');else if(!c.escapeDone)c.say('Selesaikan urutan sakelar dan aktifkan panel evakuasi terlebih dahulu.');else c.assembly();}}
 const message=c.t<c.until?c.message:'';
 let hint=prompt||(message?'':'A / D · Bergerak   Space · Lompat   E · Interaksi   J · Pulse');
 if(c.escapeStarted&&!c.escapeDone)hint='EVAKUASI '+Math.ceil(c.escapeLeft)+' dtk · '+(prompt||'Naiki tangga kanan → panel hijau');
 else if(p.getX()>3000&&p.getX()<4800&&!c.power)hint=(prompt?prompt+' · ':'')+'Sakelar '+c.sequence.length+'/3';
 const promptText=c.$('#cq-prompt'),messageText=c.$('#cq-message');if(promptText.textContent!==hint)promptText.textContent=hint;if(messageText.textContent!==message)messageText.textContent=message;c.$('#cq-tip').hidden=!hint&&!message;
 const layer=s.getLayer(''),halfWidth=Math.min(3328,layer.getCameraWidth()/2),halfHeight=Math.min(650,layer.getCameraHeight()/2);
 const targetY=Math.max(halfHeight,Math.min(1300-halfHeight,p.getY()-10)),cameraY=c.cameraY??targetY,followY=Math.max(targetY-24,Math.min(targetY+24,cameraY));
 c.cameraY=Math.max(halfHeight,Math.min(1300-halfHeight,cameraY+(followY-cameraY)*Math.min(1,dt*9)));layer.setCameraX(Math.round(Math.max(halfWidth,Math.min(6656-halfWidth,p.getX()+180))));layer.setCameraY(Math.round(c.cameraY));
 const volt=s.getObjects('Volt')[0],vx=p.getX()+24-c.face*52,vy=p.getY()+4+Math.sin(c.t*3)*4,follow=Math.min(1,dt*8);volt.setPosition(volt.getX()+(vx-volt.getX())*follow,volt.getY()+(vy-volt.getY())*follow);volt.flipX(c.face<0);
 for(const o of s.getObjects('Switch'))o.setColor(c.sequence.includes(o.getVariables().get('id').getAsString())?'130;255;150':'255;255;255');
 s.getObjects('Workbench')[0].setColor(c.escapeDone?'160;255;210':'255;255;255');s.getObjects('SensorPost')[0].setColor(c.escapeDone?'130;255;150':'255;255;255');
}
