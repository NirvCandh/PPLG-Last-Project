  const progress = game._cqCloud;
  const ending = s.getName()==='WinScreen Scene' && game.getVariables().get('Stage3Completed').getAsBoolean();
  if (ending) {
    c.open(`<div class="stack screen-body"><header><span class="tag">DESA SENSORIKA</span><h2>Smart Greenhouse aktif</h2></header>
      <div class="greenhouse" role="img" aria-label="Rumah kaca aktif. Pompa menyiram, atap terbuka, dan LED menyala."><div class="greenhouse-roof"></div><div class="greenhouse-wall"><i></i><i></i><i></i></div><b></b></div>
      <p>Sensor mengirim data ke ESP32. Dashboard menerima pesan MQTT, pompa menyiram tanaman, dan servo membuka atap. Bug-Zero kembali membantu menjaga jaringan desa.</p>
      <div class="reading-grid"><div class="reading">${icon('Pump',29)}<b>Pompa ON</b></div><div class="reading">${icon('Servo',29)}<b>Atap terbuka</b></div><div class="reading">${icon('LED',29)}<b>LED ON</b></div></div>
      <button id="home" class="primary">Kembali ke awal</button></div>`,{screen:'victory',back:null});
  } else {
    const timeout=progress?.failure==='time';
    c.open(`<div class="stack"><h2>Game Over</h2><p>${timeout?'Waktu integrasi habis. Kit tetap tersimpan.':'HP Nova habis. Kit tetap tersimpan.'}</p><div class="menu-actions"><button id="retry" class="primary">${timeout?'Ulangi Puzzle':'Coba Lagi dari Checkpoint'}</button><button id="home">Kembali ke awal</button></div></div>`,{screen:'defeat',back:null});
    c.button('retry',()=>{ c.nextScene=timeout?'Stage3_Assembly':'Stage3_Map'; });
  }
  c.button('home',()=>{
    const vars=game.getVariables();
    for (const name of ['HasPowerSupply','HasOLED','HasCloudDashboard','HasWiFi','HasMQTTKey','BossDefeated','BugZeroRestored','Stage3Completed']) vars.get(name).setBoolean(false);
    for (const id of ['PowerSupply','OLED','CloudDashboard','WiFi','MQTTKey']) vars.get('Inventory').getChild(id).setNumber(0);
    for (const id of ['CloudTerminal','CableA','CableB']) vars.get('QuestState').getChild(id).setNumber(0);
    vars.get('AssemblyResult').getChild('SmartGreenhouse').setNumber(0);
    vars.get('CurrentStage').setNumber(1);
    delete game._cqCloud;
    delete game._cqStageTransfer;
    c.nextScene='MainGame Scene';
  });
}
const c=s._cq;
if (c.nextScene) {
  c.root._cqDispose?.(); c.root.remove();
  gdjs.evtTools.runtimeScene.replaceScene(s,c.nextScene,false);
}
