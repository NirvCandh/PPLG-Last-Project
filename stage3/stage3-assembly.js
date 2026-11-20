  const globals = game.getVariables(), inventory = globals.get('Inventory');
  const flag = name => globals.get(name).getAsBoolean();
  const progress = game._cqCloud;
  const vars = s.getVariables();
  const placed = new Set();
  const entries = [
    ['SensorHub','Sensor Hub','Data dari DHT22, LDR, kelembapan tanah dan PIR'],
    ['ESP32','ESP32','Memproses data sensor'],
    ['HasWiFi','Modul WiFi','Menyambungkan ESP32 ke jaringan'],
    ['HasMQTTKey','MQTT Access Key','Membuka akses pengiriman pesan'],
    ['HasCloudDashboard','Cloud Dashboard','Menampilkan status sistem'],
    ['Relay','Modul Relay','Menyakelar daya pompa'],
    ['Pump','Pompa Air Mini','Mengalirkan air ke tanaman'],
    ['Servo','Servo','Mengatur bukaan atap'],
    ['LED','LED','Menampilkan status lokal'],
    ['HasPowerSupply','Power Supply','Memasok daya rangkaian'],
    ['HasOLED','OLED','Menampilkan data di panel lokal'],
  ];
  const names = Object.fromEntries(entries.map(([id,label]) => [id,label]));
  const owns = id => id.startsWith('Has') ? flag(id) : progress?.preview || (id==='SensorHub' ? globals.get('SensorHub').getAsNumber()>0 : inventory.getChild(id).getAsNumber()>0);
  c.navigate = target => { c.nextScene = target; };
  c.runAssembly = () => {
    vars.get('AssemblyTimer').setNumber(180);
    vars.get('AssemblyStarted').setBoolean(true);
    c.open(`<div class="stack screen-body"><header><span class="tag">WORKBENCH / MENARA CLOUD</span><h2>Rakit Smart Greenhouse</h2></header>
      <p>Tarik komponen ke slot yang sesuai, atau pilih komponen lalu pilih slot.</p>
      <div class="cloud-parts" aria-label="Komponen">${[4,9,7,0,3,6,10,1,8,2,5].map(index => {
        const [id,label]=entries[index];
        return `<button draggable="${Boolean(owns(id))}" ${owns(id)?'':'disabled'} class="chip" data-chip="${id}" aria-pressed="false">${icon(id,23)}${label}</button>`;
      }).join('')}</div>
      <div class="cloud-slots" aria-label="Alur integrasi">${entries.map(([id,label,hint],index) => `<button class="slot" data-slot="${id}"><small>${index<9?index+1:'Pendukung'}</small><span>${hint}</span></button>`).join('')}</div></div>
      <footer class="screen-footer"><div id="assembly-feedback" role="status"></div><div class="row"><span id="assembly-clock" aria-label="Sisa waktu">03:00</span><button class="primary" id="test">Test Circuit</button></div></footer>`,{screen:'workbench',back:null});
    const chips = [...root.querySelectorAll('[data-chip]')];
    const feedback = c.$('#assembly-feedback');
    let selected;
    const clearSelection = () => { selected=undefined; chips.forEach(el => el.setAttribute('aria-pressed','false')); };
    for (const chip of chips) {
      chip.ondragstart = event => event.dataTransfer.setData('text/plain',chip.dataset.chip);
      chip.onclick = () => { clearSelection(); selected=chip.dataset.chip; chip.setAttribute('aria-pressed','true'); };
    }
    for (const slot of root.querySelectorAll('[data-slot]')) {
      const place = id => {
        if (!names[id] || !owns(id) || placed.has(id) || c.nextScene) return;
        clearSelection();
        if (id!==slot.dataset.slot) { feedback.textContent=names[id]+' kembali ke baki. Coba slot lain.'; return; }
        placed.add(id);
        slot.dataset.placed='';
        slot.innerHTML=icon(id,23)+'✓ '+names[id];
        chips.find(chip=>chip.dataset.chip===id).disabled=true;
        feedback.textContent=`${placed.size} / ${entries.length} komponen terpasang.`;
      };
      slot.ondragover = event => event.preventDefault();
      slot.ondrop = event => { event.preventDefault(); place(event.dataTransfer.getData('text/plain')); };
      slot.onclick = () => place(selected);
    }
    c.button('test', () => {
      if (c.nextScene || vars.get('AssemblyTimer').getAsNumber()<=0) return;
      const missing = entries.filter(([id]) => !placed.has(id));
      if (missing.length) { feedback.textContent='Lengkapi '+missing.length+' slot. Berikutnya: '+missing[0][2]+'.'; return; }
      vars.get('AssemblyCompleted').setBoolean(true);
      vars.get('AssemblyStarted').setBoolean(false);
      globals.get('AssemblyResult').getChild('SmartGreenhouse').setNumber(1);
      globals.get('Stage3Completed').setBoolean(true);
      c.navigate('WinScreen Scene');
    });
  };
  const ready = progress && flag('BugZeroRestored') && entries.every(([id]) => owns(id));
  if (ready) c.runAssembly();
  else {
    c.open('<div class="stack"><h2>Workbench terkunci</h2><p>Lengkapi kit dari ketiga stage dan pulihkan Bug-Zero untuk membuka papan integrasi.</p><button id="return">Kembali ke menara</button></div>',{screen:'workbench',back:null});
    c.button('return',()=>c.navigate('Stage3_Map'));
  }
}
const c=s._cq, vars=s.getVariables();
if (!c.nextScene && vars.get('AssemblyStarted').getAsBoolean()) {
  const timer=vars.get('AssemblyTimer');
  const left=Math.max(0,timer.getAsNumber()-s.getElapsedTime()/1000);
  timer.setNumber(left);
  const seconds=Math.ceil(left);
  if (seconds!==c.lastSecond) {
    c.lastSecond=seconds;
    c.$('#assembly-clock').textContent=`${String(Math.floor(seconds/60)).padStart(2,'0')}:${String(seconds%60).padStart(2,'0')}`;
  }
  if (!left) {
    vars.get('AssemblyStarted').setBoolean(false);
    s.getGame()._cqCloud.failure='time';
    c.nextScene='GameOver Scene';
  }
}
if (c.nextScene) {
  c.root._cqDispose?.(); c.root.remove();
  gdjs.evtTools.runtimeScene.replaceScene(s,c.nextScene,false);
}
