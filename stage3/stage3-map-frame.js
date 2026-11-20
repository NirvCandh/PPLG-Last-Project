if (!c.modal) {
  c.t += dt;
  c.invuln -= dt;
  c.cooldown -= dt;
  const globals = s.getGame().getVariables(), vars = s.getVariables();
  const flag = name => globals.get(name).getAsBoolean();
  const quest = globals.get('QuestState');
  const objects = name => s.getObjects(name);
  const at = name => objects(name)[0];
  const prop = (object,name) => object.getVariables().get(name);
  const boss = at('BugZero');
  const started = vars.get('BossStarted'), phase = vars.get('BossPhase');
  const alive = !flag('BossDefeated');
  const progress = s.getGame()._cqCloud;
  const hit = (a,o) => a.getX()+(a===p?63:a.getWidth()) > o.getX()+3 && a.getX()+(a===p?33:0) < o.getX()+o.getWidth()-3 && a.getY()+(a===p?90:a.getHeight()) > o.getY()+3 && a.getY()+(a===p?17:0) < o.getY()+o.getHeight()-3;
  const near = (o, distance=105) => o && Math.abs(o.getX()+o.getWidth()/2-p.getX()-48)<distance && Math.abs(o.getY()+o.getHeight()/2-p.getY()-54)<98;
  const spawn = (name,x,y,w,h,z) => {
    const o = s.createObject(name);
    o.setPosition(x,y); o.setSize(w,h); o.setZOrder(z);
    return o;
  };
  const teleport = (x,y) => {
    p.setPosition(x,y); b.setCurrentSpeed(0); b.setCurrentFallSpeed(0);
    c.cameraY=undefined; c.jumpQueuedUntil=0;
  };
  if (key('a')||key('Left')) { b.simulateLeftKey(); c.face=-1; }
  if (key('d')||key('Right')) { b.simulateRightKey(); c.face=1; }
  if (jumpPressed) c.jumpQueuedUntil=c.wall+.09;
  const bufferedJump=c.wall<c.jumpQueuedUntil&&(b.isOnFloor()||b.isOnLadder());
  if (key('Space')||jumpPressed||bufferedJump) b.simulateJumpKey();
  if (bufferedJump) { c.jumpQueuedUntil=0; c.jumpStartUntil=c.wall+.08; }
  if (key('w')||key('Up')) { b.simulateLadderKey(); b.simulateUpKey(); }
  if (key('s')||key('Down')) { b.simulateLadderKey(); b.simulateDownKey(); }
  p.setOpacity(c.invuln>0 && Math.floor(c.t*15)%2 ? 95 : 255);
  p.setX(Math.max(0,Math.min(7310,p.getX())));
  if (p.getY()>1330) {
    c.damage();
    teleport(...(started.getAsBoolean()&&alive?[5712,518]:c.checkpoint));
  }

  for (const platform of objects('EnergyPlatform')) {
    const x = platform.getX(), y = platform.getY();
    platform._homeX ??= x;
    platform._homeY ??= y;
    const distance = Math.sin(c.t*1.35+platform._homeX/400);
    // GDevelop's Platformer behavior carries characters by the platform's movement delta.
    platform.setPosition(platform._homeX+distance*prop(platform,'dx').getAsNumber(),platform._homeY+distance*prop(platform,'dy').getAsNumber());
  }
  for (const checkpoint of objects('Checkpoint')) {
    const id = prop(checkpoint,'id').getAsString();
    if (near(checkpoint,60) && progress.checkpoint !== id && !started.getAsBoolean()) {
      progress.checkpoint=id;
      c.checkpoint=[checkpoint.getX(),checkpoint.getY()+checkpoint.getHeight()-90];
      c.hp=Math.min(5,c.hp+1); c.energy=Math.max(60,c.energy);
      c.say('Checkpoint aktif. Energi dipulihkan.',3);
    }
    checkpoint.setColor(progress.checkpoint===id ? '130;255;170' : '180;180;255');
  }

  // A single E press goes to the nearest visible interactable.
  const interactions = [];
  const offer = (o,label,action,dist) => {
    if (near(o,dist)) interactions.push({o,label,action});
  };
  for (const [name,label] of Object.entries(c.componentNames)) {
    const item = at(name);
    if (name==='HasMQTTKey' && !quest.getChild('CloudTerminal').getAsNumber()) { item?.hide(); continue; }
    if (item) { item.hide(false); if (hit(p,item)) c.collect(name); else offer(item,label,()=>c.collect(name),65); }
  }
  offer(at('Warga'),'Teknisi menara',()=>c.openDialogue('Warga',[{text:'Jaringan menara putus. Masuk ruang server, lalu ikuti kabel ke bawah. Nyalakan kedua sakelar agar pintu terowongan terbuka.'}]));
  offer(at('Ohm'),'Prof. Ohm',()=>c.openDialogue('Ohm',[
    {text:'WiFi menyambungkan ESP32 ke jaringan. MQTT membawa pesan sensor ke cloud. Dashboard menunjukkan hasilnya.'},
    {text:'Ambil catu daya dan OLED di ruang server. Dashboard ada di platform atas distribusi. Setelah mendapat WiFi, aktifkan terminal untuk membuka akses ke MQTT Access Key.'},
  ]));
  for (const gate of objects('DoorPanel')) {
    const label=prop(gate,'label').getAsString();
    offer(gate,label,()=>teleport(prop(gate,'targetX').getAsNumber(),prop(gate,'targetY').getAsNumber()));
  }
  const tunnelOpen = () => ['CableA','CableB'].every(id=>quest.getChild(id).getAsNumber());
  for (const panel of objects('CableSwitch')) {
    const id=prop(panel,'id').getAsString(), active=quest.getChild(id);
    panel.setColor(active.getAsNumber()?'135;255;155':'255;255;255');
    offer(panel,'Sakelar kabel '+id.slice(-1),()=>{
      active.setNumber(1);
      c.say(tunnelOpen()?'Kedua sakelar aktif. Pintu terowongan terbuka.':'Satu sakelar aktif. Ikuti kabel ke sakelar berikutnya.');
    });
  }
  const setBarrier = (name, locked) => {
    const block=at(name);
    block.getBehavior('Platform').activate(locked);
    block.hide(!locked);
  };
  setBarrier('TunnelGate',!tunnelOpen());
  offer(at('CommTerminal'),'Terminal komunikasi',()=>{
    if (!flag('HasWiFi')) { c.say('Pasang Modul WiFi terlebih dahulu.'); return; }
    quest.getChild('CloudTerminal').setNumber(1);
    c.say('Jaringan terhubung. MQTT Access Key muncul di konsol kanan.');
  });
  setBarrier('ArenaGate',alive);
  const battleBarrier=at('ArenaSeal');
  battleBarrier.getBehavior('Platform').activate(started.getAsBoolean() && alive);
  battleBarrier.hide(!(started.getAsBoolean() && alive));
  if (alive && !started.getAsBoolean()) offer(at('ArenaPanel'),'Pintu arena Bug-Zero',()=>{
    const missing=c.partsMissing();
    if (missing.length) { c.say('Lengkapi kit komunikasi. Masih kurang '+missing.length+' komponen.'); return; }
    teleport(5712,518);
    started.setBoolean(true);
    phase.setNumber(1);
    c.beginBossState('warning',1.6);
    c.hp=Math.max(3,c.hp);
    c.energy=Math.max(65,c.energy);
    c.say('Cadangan arena siap. Lompati gelombang dan gunakan Pulse saat inti terbuka.',6);
  },120);
  const recovery=at('RecoveryConsole'), workbench=at('Workbench');
  recovery.setColor(alive?'120;130;155':'150;255;215');
  workbench.setColor(flag('BugZeroRestored')?'150;255;215':'110;125;150');
  offer(recovery,'Recovery Console',()=>alive?c.say('Selesaikan pertarungan terlebih dahulu.'):c.recovery());
  offer(workbench,'Workbench Smart Greenhouse',()=>{
    if (!flag('BugZeroRestored')) { c.say('Pulihkan Bug-Zero di Recovery Console.'); return; }
    c.nextScene='Stage3_Assembly';
  });
  const selection=interactions.sort((a,b)=>Math.abs(a.o.getX()+a.o.getWidth()/2-p.getX()-48)-Math.abs(b.o.getX()+b.o.getWidth()/2-p.getX()-48))[0];
  if (interact) selection?.action();
  if (!c.modal && !c.nextScene) {

  // Regular enemies and the shared Pulse Wave weapon.
  const battery = (enemy) => spawn('Battery',enemy.getX()+14,enemy.getY()+13,36,36,12);
  for (const glitch of [...objects('Glitch'),...objects('GlitchFragment')]) {
    glitch._home ??= glitch.getX();
    glitch.setX(glitch._home+Math.sin(c.t*1.8+glitch._home)* (glitch.getName()==='Glitch'?42:26));
    if (hit(p,glitch)) c.damage();
  }
  for (const drone of objects('DroneMalware')) {
    drone._homeX ??= drone.getX(); drone._homeY ??= drone.getY();
    drone.setPosition(drone._homeX+Math.sin(c.t*1.3)*96,drone._homeY+Math.sin(c.t*2.8)*21);
    drone.flipX(p.getX()<drone.getX());
    if (!started.getAsBoolean() && near(drone,390) && c.t>(drone._nextShot??0)) {
      const shot=spawn('EnemyPulse',drone.getX()+18,drone.getY()+30,32,22,19);
      shot._dir=Math.sign(p.getX()-drone.getX())||1; shot._life=1.5;
      drone._nextShot=c.t+2.4;
    }
    if (hit(p,drone)) c.damage();
  }
  for (const shot of objects('EnemyPulse')) {
    shot._life-=dt; shot.setX(shot.getX()+shot._dir*270*dt);
    if (shot._life<=0 || started.getAsBoolean()) shot.deleteFromScene(s);
    else if (hit(p,shot)) { c.damage(); shot.deleteFromScene(s); }
  }
  for (const name of ['Firewall','SignalHazard']) for (const hazard of objects(name)) {
    const cycle=(c.t+hazard.getX()/512)%3.8;
    const active=cycle>2.1;
    hazard.setOpacity(active?255:cycle>1.6?140:62);
    if (active && hit(p,hazard)) c.damage();
  }
  for (const item of objects('Battery')) if (hit(p,item) && c.energy<100) {
    c.energy=Math.min(100,c.energy+20); item.deleteFromScene(s);
  }
  if (key('j') && c.cooldown<=0 && c.energy>=5 && !c.modal) {
    const pulse=spawn('Pulse',p.getX()+(c.face>0?76:0),p.getY()+50,28,16,30);
    pulse._dir=c.face; pulse._life=.78;
    c.energy-=5; c.cooldown=.34; c.attackUntil=c.wall+pulseCue;
    if (p.getAnimationName()==='Pulse') p.setAnimationFrame(0);
  }
  for (const pulse of objects('Pulse')) {
    pulse._life-=dt;
    if (pulse._life<=0) { pulse.deleteFromScene(s); continue; }
    pulse.setX(pulse.getX()+pulse._dir*680*dt);
    if (alive && started.getAsBoolean() && hit(pulse,boss)) {
      c.useBossHit(); pulse.deleteFromScene(s); continue;
    }
    const enemy=['Glitch','GlitchFragment','DroneMalware'].flatMap(objects).find(o=>hit(pulse,o));
    if (!enemy) continue;
    if (enemy.getName()==='Glitch') {
      for (const dx of [-34,38]) spawn('GlitchFragment',enemy.getX()+dx,enemy.getY()+30,36,43,16);
    } else battery(enemy);
    enemy.deleteFromScene(s); pulse.deleteFromScene(s);
  }

  c.updateBoss(dt,hit,spawn);
  const fighting=started.getAsBoolean() && !flag('BossDefeated');
  if (fighting && c.bossState!=='vulnerable' && hit(p,boss)) c.damage();
  boss.setColor(flag('BugZeroRestored')?'126;255;190':flag('BossDefeated')?'150;160;190':c.t<(c.bossFlashUntil||0)?'255;110;120':c.bossState==='vulnerable'?'158;255;218':c.bossState==='warning'?'255;146;100':'130;201;255');
  c.bossHud.hidden=!fighting;
  if (fighting) {
    c.bossMeter.value=vars.get('BossHP').getAsNumber();
    const warning=c.bossState.endsWith('warning');
    const label=`Fase ${phase.getAsNumber()} · ${['Network Corruption','Data Replication','Core Overload'][phase.getAsNumber()-1]} · ${c.bossState==='vulnerable'?'INTI TERBUKA — PULSE!':warning?'SIAGA':'HINDARI SERANGAN'}`;
    if (c.bossLabel.textContent!==label) c.bossLabel.textContent=label;
  }
  }
  const onLadder=objects('Ladder').some(l=>Math.abs(p.getX()+48-l.getX()-l.getWidth()/2)<54&&p.getY()+90>l.getY()-34&&p.getY()<l.getY()+l.getHeight());
  const prompt=selection?'E · '+selection.label:onLadder?'W / S · Tangga   A / D · Keluar di ujung atas':'A / D · Bergerak   Space · Lompat   E · Interaksi   J · Pulse';
  const tip=c.$('#cq-prompt'), message=c.$('#cq-message');
  if (tip.textContent!==prompt) tip.textContent=prompt;
  const feedback=c.t<c.until?c.message:'';
  if (message.textContent!==feedback) message.textContent=feedback;
  c.$('#cq-tip').hidden=false;
  const layer=s.getLayer(''), hw=Math.min(3680,layer.getCameraWidth()/2), hh=Math.min(650,layer.getCameraHeight()/2);
  const targetY=Math.max(hh,Math.min(1270-hh,p.getY()-5));
  c.cameraY=(c.cameraY??targetY)+(targetY-(c.cameraY??targetY))*Math.min(1,dt*8);
  const fighting=started.getAsBoolean()&&!flag('BossDefeated');
  const center=p.getX()+48;
  const targetX=fighting?Math.max(center-hw+120,Math.min(center+hw-120,6272)):center+132;
  layer.setCameraX(Math.round(Math.max(hw,Math.min(7360-hw,targetX))));
  layer.setCameraY(Math.round(c.cameraY));
  const volt=at('Volt'), follow=Math.min(1,dt*8);
  volt.setPosition(volt.getX()+(p.getX()+24-c.face*52-volt.getX())*follow,volt.getY()+(p.getY()+4+Math.sin(c.t*3)*4-volt.getY())*follow);
  volt.flipX(c.face<0);
}
