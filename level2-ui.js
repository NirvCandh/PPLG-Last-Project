  // Stage-specific UI uses the same responsive frame, dialogue and input system as Stage 1.
  const partNames={ESP32:'ESP32',Relay:'Modul Relay',Pump:'Pompa Mini',Servo:'Servo',LED:'LED indikator'};
  const partInfo={ESP32:'otak pengolah data Sensor Hub',Relay:'sakelar untuk daya pompa',Pump:'motor penggerak pompa air mini',Servo:'pengatur sudut atap rumah kaca',LED:'indikator status sistem'};
  const transfer=game._cqStageTransfer;
  if(transfer){c.hp=Math.max(1,Math.min(5,transfer.hp));c.energy=Math.max(0,Math.min(100,transfer.energy));delete game._cqStageTransfer;}
  game.getVariables().get('CurrentStage').setNumber(2);
  c.sequence=[];c.escapeStarted=false;c.escapeDone=false;c.assembled=false;c.checkpoint=[160,518];
  c.collect=n=>{
    if(c.inv[n])return;
    c.inv[n]=true;s.getObjects(n).forEach(o=>o.hide());c.interactUntil=c.wall+interactCue;
    c.say(partNames[n]+' ditemukan: '+partInfo[n]+'.');c.voltMood='Happy';c.voltUntil=c.wall+2;
  };
  c.title=()=>{
    c.open(`<div class="title-grid"><header class="title-lockup stack"><div class="title-emblem">${icon('ESP32',55)}<i></i></div><div class="title-rule"><span class="rune"></span><span class="tag">CIRCUIT QUEST / STAGE 02</span></div><h1>Pabrik<br><span>Mikrokontroler</span></h1><p>Jaringan sensor siap. Temukan otak dan aktuator untuk menghidupkan sistem kontrol desa.</p><span class="tag">PROSES DATA / GERAKKAN AKTUATOR</span></header><nav class="title-nav stack"><span class="tag">MISI PABRIK</span><p>5 komponen · urutan sakelar · evakuasi · Smart Controller</p><div class="menu-actions"><button class="primary" id="begin">Masuk Pabrik</button><button id="title-settings">Pengaturan</button><button id="stage-one">Kembali ke Level 1</button></div></nav></div>`,{screen:'title',back:null});
    c.button('begin',()=>{c.started=true;root.dataset.playing='';c.close();c.say('Volt: Temui Prof. Ohm untuk ESP32. Tahan Space untuk mencapai peti relay di platform.',8);});
    c.button('title-settings',()=>c.settings(c.title));c.button('stage-one',()=>{c.nextScene='MainGame Scene';});
  };
  c.inventory=()=>{
    if(!c.started||c.dead)return;
    c.open(`<div class="stack"><header><span class="tag">NOVA / KIT KONTROL</span><h2>Komponen Pabrik</h2></header><div class="kit-grid" style="grid-template-columns:repeat(auto-fit,minmax(95px,1fr))">${sensorNames.map(n=>`<div class="kit-item ${c.inv[n]?'':'missing'}">${icon(n,59)}<b>${partNames[n]}</b><small>${c.inv[n]?'TERKUMPUL':'DICARI'}</small></div>`).join('')}</div><p class="muted">${Object.keys(c.inv).length}/5 komponen · ${c.power?'Laser dinonaktifkan':'Sakelar: '+c.sequence.length+'/3'} · ${c.escapeDone?'Evakuasi selesai':'Evakuasi belum selesai'}</p><p>Sensor Hub: ${game.getVariables().get('SensorHub').getAsNumber()?'terhubung dari Level 1':'mode preview mandiri'}</p><div class="row"><button id="resume">Kembali</button></div></div>`,{screen:'inventory'});c.button('resume',c.close);
  };
  c.pause=()=>{
    if(!c.started||c.dead)return;
    c.open('<div class="stack"><span class="tag">STAGE 02 / PABRIK MIKROKONTROLER</span><h2>Dijeda</h2><div class="menu-actions"><button class="primary" id="resume">Lanjutkan</button><button id="restart">Ulang Level 2</button><button id="inventory">Inventory</button><button id="pause-settings">Pengaturan</button><button id="pause-title">Menu Pabrik</button></div></div>',{screen:'pause'});
    c.button('resume',c.close);c.button('restart',c.restart);c.button('inventory',c.inventory);c.button('pause-settings',()=>c.settings(c.pause));c.button('pause-title',c.restart);
  };
  c.quiz=()=>{
    if(c.inv.LED){c.openDialogue('Warga',[{text:'LED indikator menunjukkan status kontrol. Sakelar di bawah harus ditekan A, lalu C, lalu B.'}]);return;}
    c.openDialogue('Warga',[{text:'Pompa kebun harus menyala ketika tanah kering. Pilih logika yang benar untuk mendapatkan LED indikator.',choices:[
      ['Tanah < 40% → pompa ON',()=>{c.collect('LED');c.close();}],
      ['Tanah > 80% → pompa ON',()=>{dialogueFeedback.hidden=false;dialogueFeedback.textContent='Tanah sudah basah. Pompa justru harus berhenti. Coba lagi.';}],
      ['Nanti dulu',c.close]
    ]}]);
  };
  c.pressSwitch=id=>{
    if(c.power){c.say('Laser sudah padam. Keluar melalui tangga mesin.',3);return;}
    if(id===['A','C','B'][c.sequence.length])c.sequence.push(id);
    else{c.sequence=[];c.say('Urutan salah, panel direset. Petunjuk: A → C → B.',5);}
    if(c.sequence.length===3){
      c.power=true;c.escapeStarted=true;c.escapeLeft=65;c.checkpoint=[4280,966];
      c.say('Laser PADAM! Pabrik tidak stabil. Naiki tangga di kanan dan capai panel evakuasi dalam 65 detik!',8);
    }else if(c.sequence.length)c.say('Sakelar '+id+' benar ('+c.sequence.length+'/3). Urutan A → C → B.',3);
  };
  c.victory=()=>{
    c.open(`<div class="stack"><div class="result-crest">${sensorNames.map(n=>icon(n,37)).join('')}</div><header><span class="tag">STAGE 02 / SELESAI</span><h2>Smart Controller Aktif</h2></header><p>Data Sensor Hub diproses ESP32. Relay mengaktifkan pompa saat tanah kering, servo membuka atap, dan LED menandakan sistem siap.</p><div class="reading-grid"><div class="reading"><span class="tag">TANAH</span><b>25%</b></div><div class="reading"><span class="tag">POMPA</span><b>ON</b></div><div class="reading"><span class="tag">ATAP</span><b>90°</b></div><div class="reading"><span class="tag">LED</span><b>ON</b></div><div class="reading"><span class="tag">HASIL</span><b>SIAP</b></div></div><div class="row"><button class="primary" id="continue-cloud">Lanjut ke Menara Cloud →</button><button id="explore">Jelajahi Pabrik</button><button id="restart">Ulang Level 2</button><button id="stage-one">Level 1</button></div></div>`,{screen:'victory'});
    c.button('continue-cloud',()=>{c.nextScene='Stage3_Map';});
    c.button('explore',c.close);c.button('restart',c.restart);c.button('stage-one',()=>{c.nextScene='MainGame Scene';});
  };
  c.defeat=()=>{
    c.open(`<div class="stack"><header><span class="tag">NOVA / SINYAL TERPUTUS</span><h2>Game Over</h2></header><p>HP Nova habis. Gunakan Pulse dua kali untuk Bug Berbaju Besi, hindari pulsa Glitch, dan selesaikan urutan A → C → B.</p><div class="menu-actions"><button class="primary" id="retry">Coba Lagi</button><button id="defeat-title">Menu Pabrik</button></div></div>`,{screen:'defeat',back:null});c.button('retry',c.restart);c.button('defeat-title',c.restart);
  };
  c.assembly=()=>{
    const connections=[['SensorHub.DATA','GPIO34'],['Relay.VCC','5V'],['Relay.GND','GND'],['Relay.IN','GPIO26'],['Pump.PLUS','RELAY_NO'],['Pump.MINUS','GND'],['Servo.VCC','5V'],['Servo.GND','GND'],['Servo.SIGNAL','GPIO18'],['LED.ANODE','GPIO2_R'],['LED.CATHODE','GND']];
    const ports=['GPIO34','5V','GND','GPIO26','RELAY_NO','GPIO18','GPIO2_R'];
    c.placed={};c.selectedChip=null;
    c.open(`<div class="stack screen-body"><header><span class="tag">WORKBENCH / KONTROL OTOMATIS</span><h2>Rakit Smart Controller</h2></header><p>Letakkan kelima komponen. Hubungkan jalur, lalu tentukan kapan pompa menyala.</p><div class="row">${sensorNames.map(n=>`<button draggable="true" class="chip" data-chip="${n}" aria-pressed="false">${icon(n,30)}${partNames[n]}</button>`).join('')}</div><div class="row">${sensorNames.map(n=>`<button class="slot" data-slot="${n}">${icon(n,28)}Slot ${n}</button>`).join('')}</div><p class="muted">Papan simulasi: ESP32 diberi catu 5V melalui VIN, GND bersama. Relay memakai driver; pompa mengambil catu terpisah melalui kontak COM/NO. GPIO2_R mewakili LED dengan resistor seri. Sensor Hub menggunakan antarmuka data simulasi.</p>${connections.map(([wire,expected])=>`<label class="settings-row"><span>${wire}<small>Petunjuk: ${expected}</small></span><select data-wire="${wire}"><option value="">--</option>${ports.map(p=>`<option>${p}</option>`).join('')}</select></label>`).join('')}<label class="settings-row"><span>Logika pompa<small>Tanah kering: kelembapan di bawah 40%</small></span><select id="logic"><option value="">Pilih kondisi</option><option value="dry">Tanah &lt; 40% → ON</option><option value="wet">Tanah &gt; 80% → ON</option></select></label></div><footer class="screen-footer"><div id="assembly-feedback" role="status"></div><div class="row"><button class="primary" id="test">Uji Rangkaian</button><button id="back">Kembali ke pabrik</button></div></footer>`,{screen:'workbench'});
    const chips=[...root.querySelectorAll('[data-chip]')];
    chips.forEach(el=>{el.ondragstart=e=>e.dataTransfer.setData('text/plain',el.dataset.chip);el.onclick=()=>{c.selectedChip=el.dataset.chip;chips.forEach(x=>x.setAttribute('aria-pressed',String(x===el)));};});
    root.querySelectorAll('[data-slot]').forEach(el=>{const place=n=>{if(n!==el.dataset.slot)return;c.placed[n]=true;el.dataset.placed='';el.innerHTML=icon(n,28)+'✓ '+n;};el.ondragover=e=>e.preventDefault();el.ondrop=e=>{e.preventDefault();place(e.dataTransfer.getData('text/plain'));};el.onclick=()=>place(c.selectedChip);});
    c.button('back',c.close);c.button('test',()=>{
      const errors=sensorNames.filter(n=>!c.placed[n]).map(n=>partNames[n]+' belum dipasang');
      for(const [wire,expected] of connections){const el=root.querySelector(`[data-wire="${wire}"]`),ok=el.value===expected;el.dataset.result=ok?'ok':'error';if(!ok)errors.push(wire);}
      const logic=c.$('#logic');logic.dataset.result=logic.value==='dry'?'ok':'error';if(logic.value!=='dry')errors.push('logika pompa');
      if(errors.length){c.$('#assembly-feedback').innerHTML='<p class="fail">Periksa: '+errors.join(', ')+'. Ikuti petunjuk jalur dan kondisi tanah kering.</p>';return;}
      c.assembled=true;const globals=game.getVariables();globals.get('SmartController').setNumber(1);globals.get('AssemblyResult').getChild('SmartController').setNumber(1);globals.get('StageUnlocked').setNumber(Math.max(3,globals.get('StageUnlocked').getAsNumber()));c.victory();
    });
  };
