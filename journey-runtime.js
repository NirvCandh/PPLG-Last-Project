// Shared features installed after each scene's existing event. No external assets/CDN needed.
function circuitJourney(s, config) {
  const c=s._cq;
  if (!c || c.leavingJourney) return;
  const game=s.getGame(), globals=game.getVariables();
  const journey=game._cqJourney ??= {coins:0,shields:0,claims:{},levels:{},completed:{},quakes:{},volume:.45};
  const input=k=>Boolean(c.touch?.[k])||gdjs.evtTools.input.isKeyPressed(s,k);
  if (!c.journey) {
    c.journey=journey;
    const root=c.root, stage=config.stage, player=c.player;
    const img=(name,size=36)=>`<img src="${config.art[name]}" alt="" width="${size}" height="${size}" draggable="false" style="image-rendering:pixelated;object-fit:contain">`;
    const audio=game._cqAudio ??= {context:null,next:{}};
    c.sfx=(name,scale=1)=>{
      if (!audio.context || audio.context.state!=='running' || journey.volume<=0 || document.hidden) return;
      const ctx=audio.context, now=ctx.currentTime;
      if (now<(audio.next[name]??0)) return;
      audio.next[name]=now+({step:.17,npc:.22,hover:1.2,enemy:.55}[name]??.075);
      const tones={step:[100,55,.045,'triangle'],jump:[230,570,.13,'square'],land:[110,45,.09,'triangle'],climb:[150,210,.055,'triangle'],pulse:[750,120,.16,'sawtooth'],hurt:[150,35,.19,'square'],interact:[420,660,.08,'triangle'],npc:[340,290,.04,'triangle'],hover:[120,145,.08,'sine'],enemy:[78,62,.06,'triangle'],coin:[950,1600,.14,'square'],buy:[650,1150,.22,'triangle'],shield:[880,360,.2,'triangle'],portal:[260,1400,.55,'sine'],quake:[55,22,1.6,'sawtooth']};
      const [start,end,duration,type]=tones[name]??tones.interact;
      try {
        const osc=ctx.createOscillator(), gain=ctx.createGain();
        osc.type=type; osc.frequency.setValueAtTime(start,now); osc.frequency.exponentialRampToValueAtTime(end,now+duration);
        gain.gain.setValueAtTime(0,now); gain.gain.linearRampToValueAtTime(Math.min(.16,journey.volume*.12*scale),now+.008); gain.gain.exponentialRampToValueAtTime(.0001,now+duration);
        osc.connect(gain); gain.connect(ctx.destination); osc.start(now); osc.stop(now+duration+.01);
        osc.onended=()=>{osc.disconnect();gain.disconnect();};
      } catch (_) { /* Audio failure must never interrupt gameplay. */ }
    };
    const unlock=()=>{
      try {
        const Audio=window.AudioContext||window.webkitAudioContext;
        if (!audio.context&&Audio) audio.context=new Audio();
        audio.context?.resume()?.catch(()=>{});
      } catch (_) {}
    };
    document.addEventListener('pointerdown',unlock); document.addEventListener('keydown',unlock);
    const cleanup=root._cqDispose;
    root._cqDispose=()=>{
      document.removeEventListener('pointerdown',unlock); document.removeEventListener('keydown',unlock);
      const canvas=game.getRenderer?.().getCanvas?.();
      if (canvas?.style&&c.quakeCanvasTransform!==undefined) canvas.style.transform=c.quakeCanvasTransform;
      cleanup?.();
    };
    const style=document.createElement('style');
    style.textContent=`
      #cq-ui .journey-tools{position:absolute;right:clamp(5px,1.2cqw,16px);top:clamp(76px,12cqh,100px);display:flex;align-items:center;gap:6px;flex-wrap:wrap;max-width:95%;padding:4px 7px;color:#f4ce73;font-size:13px}
      #cq-ui:not([data-playing]) .journey-tools{display:none}
      #cq-ui[data-dialogue] .journey-tools{visibility:hidden}
      #cq-ui .journey-wallet{display:inline-flex;align-items:center;gap:4px;white-space:nowrap}
      #cq-ui #cq-shields{color:#a7f1dd}
      #cq-ui #cq-shields[hidden]{display:none}
      #cq-ui .journey-tools button{font-size:13px;padding:4px 7px;min-height:28px}
      #cq-ui .shop-banner{display:flex;align-items:center;gap:16px;border-bottom:2px solid #947047;padding-bottom:12px}
      #cq-ui .shop-banner>img{width:112px;height:96px;image-rendering:pixelated;object-fit:contain}
      #cq-ui .shop-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:12px}
      #cq-ui .shop-item{border:3px solid #9e794c;box-shadow:inset 0 0 0 3px #0b1322,4px 4px #070c17;background:#1b2837;padding:14px 10px;display:grid;justify-items:center;gap:8px;text-align:center}
      #cq-ui .shop-item>img{width:56px;height:56px;image-rendering:pixelated}
      #cq-ui .shop-item small{color:#c4c4b1;min-height:3em;font-size:.78em}
      #cq-ui .shop-status{color:#92e5c1;min-height:1.4em}
      #cq-ui .shield-receipt{display:flex;align-items:center;gap:8px;padding:7px 10px;border:2px solid #64dbc4;background:#132b34;color:#c7ffeb}
      #cq-ui .shield-receipt img{flex:none}
      #cq-ui .shop-audio{display:flex;align-items:center;gap:10px;flex-wrap:wrap;border-top:1px solid #806144;padding-top:10px;font-size:.8em}
      #cq-ui .shop-audio input{width:140px}
      #cq-quake{position:absolute;top:24%;left:50%;transform:translateX(-50%);width:min(90%,560px);text-align:center;padding:12px;background:#111e30;border:3px solid #d2ab65;color:#ffe8b3;box-shadow:4px 4px #080d18;pointer-events:none;font-size:clamp(15px,2cqw,24px);z-index:10}
      #cq-ui .portal-note{color:#91ddcc;font-size:.85em}
      @container(max-width:560px){#cq-ui .shop-grid{grid-template-columns:1fr}#cq-ui .shop-item{grid-template-columns:48px 1fr auto;text-align:left;justify-items:start;gap:4px 8px;padding:8px}#cq-ui .shop-item>img{grid-row:1/3;width:40px;height:40px}#cq-ui .shop-item small{grid-column:2;min-height:0}#cq-ui .shop-item button{grid-column:3;grid-row:1/3}#cq-ui .shop-banner>img{width:72px;height:64px}#cq-ui .journey-tools{gap:3px;font-size:11px}}
    `;
    root.appendChild(style);
    if (player) {
      const tools=document.createElement('div'); tools.className='journey-tools cq-frame';
      tools.innerHTML=`<span class="journey-wallet">${img('Coin',18)}<b id="cq-coins">0</b> KOIN</span><span id="cq-shields" class="journey-wallet" role="img" hidden>${img('Shield',20)}<b id="cq-shield-count"></b></span><button id="cq-shop" type="button">SHOP [B]</button><button id="cq-audio" type="button" aria-label="Aktifkan atau matikan suara">SFX ON</button>`;
      c.$('#cq-hud').appendChild(tools);
      c.$('#cq-shop').onclick=()=>c.shop();
      c.$('#cq-audio').onclick=()=>{unlock();journey.volume=journey.volume>0?0:.45;c.sfx('interact');};
      const saved=journey.levels[stage];
      if (saved) {
        Object.assign(c.inv,saved.inv); c.power=saved.power;
        if (saved.sequence) c.sequence=[...saved.sequence];
        if (stage===2) {c.escapeStarted=Boolean(saved.escapeStarted);c.escapeLeft=saved.escapeLeft??65;c.assembled=Boolean(saved.assembled);}
        if (saved.escapeDone) {c.escapeDone=true;c.escapeStarted=false;}
        for (const name of Object.keys(c.inv)) s.getObjects(name).forEach(o=>o.hide());
        for (const chest of s.getObjects('Chest')) if(c.inv[chest.getVariables().get('sensor').getAsString()])chest.setAnimation(1);
        if (stage===2&&c.power) s.getObjects('LaserBarrier').forEach(o=>o.getBehavior('Platform').activate(false));
      }
      const arrival=journey.arrival;
      if (arrival?.stage===stage) {
        c.hp=Math.max(1,Math.min(5,arrival.hp)); c.energy=Math.max(0,Math.min(100,arrival.energy));
        player.setPosition(...(arrival.position??(arrival.at==='exit'?config.arrivalExit:config.arrivalEntry)));
        if(stage!==3)c.checkpoint=stage===2&&!c.escapeDone&&c.escapeStarted?[4280,966]:[player.getX(),player.getY()];
        c.beh.setCurrentSpeed(0);c.beh.setCurrentFallSpeed(0);c.cameraY=undefined;
        delete journey.arrival;
        if(arrival.retry){c.started=true;root.dataset.playing='';c.close();c.say('Nova kembali ke checkpoint.',3);}
      }
    }
    let shieldAura, shieldFlashLeft=0, shieldFlashDuration=1;
    const flashShield=duration=>{
      shieldFlashDuration=duration;
      shieldFlashLeft=duration;
    };
    c.updateShieldVisual=dt=>{
      const charges=c.$('#cq-shields');
      if(c.shieldHudCount!==journey.shields){
        charges.hidden=journey.shields===0;
        charges.setAttribute('aria-label',`Perisai Volt, ${journey.shields} dari 3 muatan`);
        c.$('#cq-shield-count').textContent=`${journey.shields}/3`;
        c.shieldHudCount=journey.shields;
      }

      // Keep the purchase flash until the player returns from the shop.
      if(!c.modal)shieldFlashLeft=Math.max(0,shieldFlashLeft-dt);
      const reduceMotion=game._cqUiOptions?.reduceMotion||window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches;
      const glow=reduceMotion ? 0 : shieldFlashLeft/shieldFlashDuration;
      const visible=c.started&&!c.dead&&(journey.shields>0||glow>0);
      if(visible&&!shieldAura){
        shieldAura=s.createObject('JourneyShieldAura');
        shieldAura.setSize(player.getWidth()+8,player.getHeight()+8);
        shieldAura.setZOrder(22);
      }
      if(!shieldAura)return;
      shieldAura.hide(!visible);
      if(!visible)return;
      shieldAura.setPosition(player.getX()-4,player.getY()-4);
      const opacity=journey.shields>0?156:0;
      shieldAura.setOpacity(Math.round(opacity+(255-opacity)*glow));
    };
    c.clearJourneyArrival=()=>{c.leavingJourney=true;delete journey.arrival;delete game._cqStageTransfer;};
    c.retryJourney=()=>{
      c.clearJourneyArrival();
      if(stage===2&&c.escapeStarted&&!c.escapeDone)c.escapeLeft=65;
      c.snapshotJourney();
      // Restore progress from the old scene, then start the new attempt safely.
      journey.arrival={stage,position:[...c.checkpoint],hp:5,energy:100,retry:true};
    };
    c.snapshotJourney=()=>{
      if (player) journey.levels[stage]={inv:{...c.inv},power:c.power,sequence:c.sequence?[...c.sequence]:undefined,escapeDone:c.escapeDone,escapeStarted:c.escapeStarted,escapeLeft:c.escapeLeft,assembled:c.assembled};
      if(player&&c.nextScene==='Stage3_Assembly') journey.arrival={stage:3,position:[player.getX(),player.getY()],hp:c.hp,energy:c.energy};
      const destination={'MainGame Scene':1,'Level2 Scene':2,'Stage3_Map':3}[c.nextScene];
      if(player&&destination&&!journey.arrival){journey.arrival={stage:destination,at:destination<stage?'exit':'entry',hp:c.hp,energy:c.energy};game._cqStageTransfer={hp:c.hp,energy:c.energy};}
      globals.get('Coins').setNumber(journey.coins); globals.get('ShieldCharges').setNumber(journey.shields);
      if(player){globals.get('PlayerHP').setNumber(c.hp);globals.get('PlayerEnergy').setNumber(c.energy);}
    };
    c.buy=id=>{
      if (!c.shopOpen||c.dead) return false;
      const item={heart:{price:12,available:c.hp<5,apply:()=>{c.hp=Math.min(5,c.hp+2);}},energy:{price:10,available:c.energy<100,apply:()=>{c.energy=100;}},shield:{price:25,available:journey.shields<3,apply:()=>{journey.shields++;}}}[id];
      if (!item||!item.available||journey.coins<item.price) return false;
      journey.coins-=item.price;
      item.apply();
      c.snapshotJourney();
      c.sfx('buy');
      if(id==='shield'){
        flashShield(.75);
        c.shop(`Perisai Volt aktif · ${journey.shields}/3 muatan.`,true);
      }else{
        c.shop('Pembelian berhasil. Item langsung digunakan.');
      }
      return true;
    };
    const close=c.close;
    c.close=(...args)=>{if(c.quakeLeft>0)return;c.shopOpen=false;return close(...args);};
    c.shop=(feedback='',shieldPurchased=false)=>{
      if (!player||!c.started||c.dead||(c.modal&&!c.shopOpen)||c.quakeLeft>0) return;
      c.shopOpen=true; c.touch={}; c.jumpQueuedUntil=0;
      const products=[['heart','Heart','Hati Kapasitor','Pulihkan 2 HP, maksimal 5.',12,c.hp<5],['energy','Battery','Sel Energi','Isi energi Pulse sampai 100.',10,c.energy<100],['shield','Shield','Perisai Volt','Menahan 1 serangan. Maksimal 3.',25,journey.shields<3]];
      const receipt=shieldPurchased?img('Shield',26):'';
      c.open(`<div class="stack"><header class="shop-banner">${img('Shop',96)}<div><span class="tag">VOLT / SUPPLY SHOP</span><h2>Bekal petualangan</h2><p>Kalahkan bug, kumpulkan koin, siapkan perjalanan.</p></div></header><div class="row"><b class="journey-wallet">${img('Coin',24)} ${journey.coins} KOIN</b><span>HP ${c.hp}/5 · ENERGI ${Math.round(c.energy)}/100 · PERISAI ${journey.shields}/3</span></div><div class="shop-grid">${products.map(([id,art,name,desc,price,available])=>`<article class="shop-item">${img(art)}<b>${name}</b><small>${desc}</small><button type="button" id="buy-${id}" ${!available||journey.coins<price?'disabled':''}>${!available?'PENUH':price+' KOIN'}</button></article>`).join('')}</div><p class="shop-status${shieldPurchased?' shield-receipt':''}" id="shop-feedback" role="status">${receipt}${feedback||'Komponen misi diperoleh dari peti dan quest.'}</p><label class="shop-audio">Volume efek suara <input id="shop-volume" aria-label="Volume efek suara" type="range" min="0" max="100" value="${Math.round(journey.volume*100)}"><span id="shop-volume-label">${Math.round(journey.volume*100)}%</span></label><button type="button" id="shop-close" class="primary">Kembali bermain</button></div>`,{screen:'shop'});
      for (const [id] of products)c.button('buy-'+id,()=>c.buy(id));
      c.button('shop-close',c.close);
      c.$('#shop-volume').oninput=e=>{unlock();journey.volume=Math.max(0,Math.min(1,Number(e.target.value)/100));c.$('#shop-volume-label').textContent=Math.round(journey.volume*100)+'%';};
    };
    const damage=c.damage;
    c.damage=()=>{
      if(c.invuln>0||c.dead) return;
      if(journey.shields>0){journey.shields--;flashShield(.28);c.invuln=1.5;c.sfx('shield');c.say('Perisai Volt menahan serangan.',2);return;}
      damage();c.sfx('hurt');
    };
    c.award=(token,amount)=>{
      if(journey.claims[token])return false;
      journey.claims[token]=true;journey.coins+=amount;c.snapshotJourney();c.sfx('coin');c.say('+'+amount+' koin · B / SHOP untuk membeli bekal.',2.5);return true;
    };
    c.awardEnemy=enemy=>{
      const name=enemy.getName();
      const token=enemy._cqCoinToken??stage+':'+name+':'+Math.round(enemy.getX())+':'+Math.round(enemy.getY());
      return c.award(token,name==='GlitchFragment'?3:name==='DroneMalware'?10:8);
    };
    c.startQuake=()=>{
      if(journey.quakes[stage])return;
      journey.quakes[stage]=true;journey.completed[stage]=true;c.quakeLeft=2.2;c.quakeWasModal=c.modal;
      c.modal=true;c.touch={};c.jumpQueuedUntil=0;c.beh?.setCurrentSpeed(0);c.beh?.activate(false);c.sfx('quake');
      const notice=document.createElement('div');notice.id='cq-quake';notice.setAttribute('role','status');notice.textContent='GEMPA! Jaringan pulih · Portal sedang terbuka…';root.appendChild(notice);c.quakeNotice=notice;
      const modal=c.$('#cq-modal');c.quakePointerEvents=modal.style.pointerEvents;modal.style.pointerEvents='none';
      c.quakeButtons=[...modal.querySelectorAll('button')].map(button=>({button,disabled:button.disabled}));c.quakeButtons.forEach(({button})=>{button.disabled=true;});
    };
    c.travel=(target,at='entry')=>{
      if(c.dead||c.quakeLeft>0)return false;
      const destination={'MainGame Scene':1,'Level2 Scene':2,'Stage3_Map':3}[target];
      if(!destination||destination>stage&&!journey.completed[stage])return false;
      if(stage===3&&s.getVariables().get('BossStarted').getAsBoolean()&&!globals.get('BossDefeated').getAsBoolean())return false;
      c.snapshotJourney();journey.arrival={stage:destination,at,hp:c.hp,energy:c.energy};
      game._cqStageTransfer={hp:c.hp,energy:c.energy};globals.get('CurrentStage').setNumber(destination);
      c.sfx('portal');c.nextScene=target;return true;
    };
    const portalNear=portal=>Math.abs(player.getX()+48-portal.getX()-portal.getWidth()/2)<83&&Math.abs(player.getY()+90-portal.getY()-portal.getHeight())<85;
    const portalOpen=portal=>!portal.getVariables().get('forward').getAsNumber()||(journey.completed[stage]&&!c.quakeLeft);
    c.useJourneyPortal=()=>{
      const portal=s.getObjects('JourneyPortal').find(portalNear);
      if(!portal)return false;
      const vars=portal.getVariables(),forward=vars.get('forward').getAsNumber();
      if(portalOpen(portal))c.travel(vars.get('target').getAsString(),forward?'entry':'exit');
      return true;
    };
    c.advanceJourneyShot=(shot,distance)=>{
      const x=shot.getX(), y=shot.getY()+shot.getHeight()/2, width=shot.getWidth(), dx=distance*shot._dir;
      const left=Math.min(x,x+dx),right=Math.max(x,x+dx)+width;
      const blocks=s.getObjects('Solid').concat(stage===2&&!c.power?s.getObjects('LaserBarrier'):[]);
      if(stage===3){
        const bossDefeated=globals.get('BossDefeated').getAsBoolean(),quest=globals.get('QuestState');
        const gateNames=[];
        if(!quest.getChild('CableA').getAsNumber()||!quest.getChild('CableB').getAsNumber())gateNames.push('TunnelGate');
        if(!bossDefeated)gateNames.push('ArenaGate');
        if(!bossDefeated&&s.getVariables().get('BossStarted').getAsBoolean())gateNames.push('ArenaSeal');
        for(const name of gateNames)blocks.push(...s.getObjects(name));
      }
      if(blocks.some(o=>right>o.getX()&&left<o.getX()+o.getWidth()&&y>=o.getY()&&y<o.getY()+o.getHeight()))return false;
      shot.setX(x+dx);return true;
    };
    c.journeyPortalNear=portalNear;
    c.journeyPortalOpen=portalOpen;
    if(player&&stage<3){
      const victory=c.victory;
      c.victory=()=>{
        victory(); c.startQuake();
        const id=stage===1?'next-stage':'continue-cloud';
        c.button(id,()=>{if(c.quakeLeft>0)return;c.close();player.setPosition(...config.arrivalExit);c.cameraY=undefined;c.say('Portal aktif! Dekati gerbang bercahaya dan tekan E.',6);});
        const button=c.$('#'+id);button.textContent='Menuju portal';
      };
    }
    if(config.ending&&globals.get('Stage3Completed').getAsBoolean())c.startQuake();
    c.journeyPrev={};c.audioActors=new WeakMap();
  }
  const dt=Math.max(0,Math.min(s.getElapsedTime()/1000,.05));
  const player=c.player, stage=config.stage;
  if(player&&!c.nextScene)c.snapshotJourney();
  // Stable spawn IDs prevent repeat rewards. Only explicit combat defeats call awardEnemy.
  for(const name of ['Bug','Glitch','GlitchFragment','DroneMalware'])for(const enemy of s.getObjects(name)){
    const token=enemy._cqCoinToken??stage+':'+name+':'+Math.round(enemy.getX())+':'+Math.round(enemy.getY());
    enemy._cqCoinToken=token;
    if(journey.claims[token])enemy.deleteFromScene(s);
  }
  if(stage===3&&player&&globals.get('BossDefeated').getAsBoolean())c.award('boss:BugZero',50);
  if(c.quakeLeft>0){
    c.quakeLeft=Math.max(0,c.quakeLeft-dt);c.modal=true;c.beh?.activate(false);
    const canvas=game.getRenderer?.().getCanvas?.();
    if(canvas?.style){
      c.quakeCanvasTransform??=canvas.style.transform||'';
      const reduce=game._cqUiOptions?.reduceMotion||window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
      const amplitude=reduce?0:Math.ceil(7*c.quakeLeft/2.2),time=c.quakeLeft*47;
      canvas.style.transform=c.quakeCanvasTransform+` translate(${Math.round(Math.sin(time)*amplitude)}px,${Math.round(Math.cos(time*1.4)*amplitude)}px)`;
      if(!c.quakeLeft)canvas.style.transform=c.quakeCanvasTransform;
    }
    if(!c.quakeLeft){c.quakeNotice?.remove();c.quakeButtons?.forEach(({button,disabled})=>{button.disabled=disabled;});c.$('#cq-modal').style.pointerEvents=c.quakePointerEvents||'';c.modal=c.quakeWasModal;c.say?.('Gempa mereda. Portal aktif.',4);}
    if(stage<3&&player){const next=c.$('#'+(stage===1?'next-stage':'continue-cloud'));if(next)next.disabled=c.quakeLeft>0;}
  }
  // Completion is restored on revisits, without replaying the earthquake.
  if(player&&stage<3&&globals.get(stage===1?'SensorHub':'SmartController').getAsNumber())journey.completed[stage]=true;
  if(player){
    c.$('#cq-coins').textContent=journey.coins;
    c.updateShieldVisual(dt);
    c.$('#cq-audio').textContent=journey.volume>0?'SFX ON':'SFX OFF';
    const b=input('b');if(b&&!c.journeyPrev.b){if(c.shopOpen)c.close();else c.shop();}c.journeyPrev.b=b;
    for(const portal of s.getObjects('JourneyPortal')){
      const target=portal.getVariables().get('target').getAsString();
      const active=c.journeyPortalOpen(portal);
      portal.setOpacity(active?220+Math.round(Math.sin(c.wall*4)*30):75);portal.setColor(active?'170;255;235':'125;125;145');
      if(c.journeyPortalNear(portal)&&!c.modal){c.$('#cq-tip').hidden=false;c.$('#cq-prompt').textContent=active?'E · Portal ke '+({'MainGame Scene':'Hutan Sensor','Level2 Scene':'Pabrik','Stage3_Map':'Menara Cloud'}[target]):'Portal terkunci · Selesaikan puzzle perakitan';}
    }
    const behavior=c.beh, action=player.getAnimationName(),state=c.audioActors.get(player)||{};
    if(!c.modal&&!c.dead){
      if(c.attackUntil!==state.attackCue&&c.attackUntil>c.wall)c.sfx('pulse');
      if(c.interactUntil!==state.interactCue&&c.interactUntil>c.wall)c.sfx('interact');
      state.attackCue=c.attackUntil;state.interactCue=c.interactUntil;
      const cue=({Jump:'jump',Hurt:'hurt'})[action];
      if(action!==state.action&&cue)c.sfx(cue);
      if(['Walk','Run','Climb','ClimbSide'].includes(action)&&c.wall>(state.next||0)){
        const moving=action.startsWith('Climb')?['w','s','Up','Down'].some(input):Math.abs(behavior.getCurrentSpeed())>15;
        if(moving){c.sfx(action.startsWith('Climb')?'climb':'step');state.next=c.wall+(action==='Run'?.21:.34);}
      }
      const grounded=behavior.isOnFloor();if(grounded&&state.grounded===false)c.sfx('land');state.grounded=grounded;
    }
    state.action=action;c.audioActors.set(player,state);
    for(const name of ['Ohm','Warga','Volt','Bug','Glitch','DroneMalware','BugZero'])for(const npc of s.getObjects(name)){
      if(!npc.isVisible()||Math.abs(npc.getX()-player.getX())>480)continue;
      const state=c.audioActors.get(npc)||{},action=npc.getAnimationName();
      const speaking=c.npcSpeaker===name&&c.dialogue;
      const moving=state.x!==undefined&&Math.abs(npc.getX()-state.x)>.2;
      if((!c.modal||speaking)&&(action!=='Idle'||moving)&&c.wall>(state.next||0)){
        if(speaking)c.sfx('npc',.45);else if(name==='Volt')c.sfx('hover',.3);else if(moving||action!==state.action)c.sfx(name==='Ohm'||name==='Warga'?'npc':'enemy',.45);
        state.next=c.wall+(speaking?.16:name==='Volt'?1.7:.6);
      }
      state.x=npc.getX();state.action=action;c.audioActors.set(npc,state);
    }
  }
}
