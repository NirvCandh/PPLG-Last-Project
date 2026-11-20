  const gameVars = game.getVariables();
  const componentNames = {
    HasPowerSupply: 'Power Supply', HasOLED: 'OLED', HasCloudDashboard: 'Cloud Dashboard',
    HasWiFi: 'Modul WiFi', HasMQTTKey: 'MQTT Access Key',
  };
  const flag = name => gameVars.get(name).getAsBoolean();
  const save = (name, value = true) => gameVars.get(name).setBoolean(value);
  const transfer = game._cqStageTransfer;
  const progress = game._cqCloud ??= {preview: !transfer || Boolean(transfer.preview), checkpoint: 'Exterior'};
  if (transfer) {
    c.hp = Math.max(1, Math.min(5, transfer.hp));
    c.energy = Math.max(0, Math.min(100, transfer.energy));
    delete game._cqStageTransfer;
  }
  gameVars.get('CurrentStage').setNumber(3);
  const sceneVars = s.getVariables();
  const number = name => sceneVars.get(name);
  const objects = name => s.getObjects(name);
  const at = name => objects(name)[0];
  const prop = (object, name) => object.getVariables().get(name);
  const checkpoint = objects('Checkpoint').find(o => prop(o,'id').getAsString() === progress.checkpoint);
  if (checkpoint) c.player.setPosition(checkpoint.getX(), checkpoint.getY() + checkpoint.getHeight() - 90);
  c.checkpoint = [c.player.getX(), c.player.getY()];
  c.partsMissing = () => sensorNames.filter(name => !c.inv[name]);
  c.componentNames = componentNames;
  c.collect = name => {
    if (c.inv[name]) return;
    c.inv[name] = true;
    save(name);
    gameVars.get('Inventory').getChild(name.slice(3)).setNumber(1);
    objects(name).forEach(o => o.deleteFromScene(s));
    c.say(`${componentNames[name]} masuk inventory.`);
    c.voltMood = 'Happy'; c.voltUntil = c.wall + 2;
  };
  for (const name of sensorNames) {
    if (!flag(name)) continue;
    c.inv[name] = true;
    objects(name).forEach(o => o.deleteFromScene(s));
  }
  const connectorNames = ['Data Input', 'Communication', 'Cloud Connection'];
  c.recovery = () => {
    if (!flag('BossDefeated')) return;
    const step = number('RepairStep');
    if (step.getAsNumber()===3) { c.say('Ketiga konektor aktif. Bug-Zero sudah pulih.'); return; }
    c.open(`<div class="stack"><header><span class="tag">REPAIR AFTER</span><h2>Recovery Console</h2></header>
      <p>Terima data sensor, pulihkan komunikasi, lalu sambungkan kembali cloud.</p>
      <div class="row">${connectorNames.map((name,i) => `<button id="repair-${i}" ${i < step.getAsNumber() ? 'disabled' : ''}>${i < step.getAsNumber() ? '✓ ' : ''}${name}</button>`).join('')}</div>
      <p id="repair-feedback" role="status">${step.getAsNumber()} / 3 konektor aktif</p><div class="row"><button id="repair-back">Kembali</button></div></div>`, {screen:'repair'});
    connectorNames.forEach((_,i) => c.button('repair-'+i, () => {
      if (i !== step.getAsNumber()) {
        c.$('#repair-feedback').textContent = 'Sambungkan '+connectorNames[step.getAsNumber()]+' terlebih dahulu.';
        return;
      }
      step.setNumber(i+1);
      if (i < 2) { c.recovery(); return; }
      save('BugZeroRestored');
      c.close();
      c.say('Bug-Zero sudah pulih. Workbench Smart Greenhouse aktif.', 7);
    }));
    c.button('repair-back',c.close);
  };
  if (flag('BugZeroRestored')) number('RepairStep').setNumber(3);
  if (flag('BossDefeated')) number('BossHP').setNumber(0);
  c.title = () => {
    c.open(`<div class="title-grid"><header class="title-lockup stack"><div class="title-emblem">${icon('HasCloudDashboard',48)}<i></i></div><span class="tag">CIRCUIT QUEST / STAGE 03</span><h1>Menara<br><span>Cloud</span></h1><p>Pulihkan jaringan menara dan sambungkan kembali rumah kaca Desa Sensorika.</p></header><nav class="title-nav stack"><div class="menu-actions"><button id="begin" class="primary">Masuk Menara</button><button id="title-settings">Pengaturan</button></div>${progress.preview ? '<p class="muted">Preview langsung memakai kit uji Stage 1 dan 2.</p>' : ''}</nav></div>`, {screen:'title',back:null});
    c.button('begin', () => { c.started=true; root.dataset.playing=''; c.close(); });
    c.button('title-settings', () => c.settings(c.title));
  };
  c.pause = () => {
    if (!c.started || c.dead) return;
    c.open('<div class="stack"><h2>Dijeda</h2><div class="menu-actions"><button class="primary" id="resume">Lanjutkan</button><button id="inventory">Inventory</button><button id="settings">Pengaturan</button></div></div>',{screen:'pause'});
    c.button('resume',c.close); c.button('inventory',c.inventory); c.button('settings',() => c.settings(c.pause));
  };
  c.inventory = () => {
    if (!c.started || c.dead) return;
    c.open(`<div class="stack"><h2>Kit komunikasi</h2><div class="kit-grid">${sensorNames.map(n => `<div class="kit-item ${c.inv[n]?'':'missing'}">${icon(n,42)}<b>${componentNames[n]}</b><small>${c.inv[n]?'TERKUMPUL':'DICARI'}</small></div>`).join('')}</div><button id="resume">Kembali</button></div>`,{screen:'inventory'});
    c.button('resume',c.close);
  };
  c.defeat = () => {
    progress.failure = 'hp';
    c.nextScene = 'GameOver Scene';
  };
  c.bossHud = c.$('#cq-boss');
  c.bossMeter = c.$('#cq-boss-hp');
  c.bossLabel = c.$('#cq-boss-phase');
  c.title();
