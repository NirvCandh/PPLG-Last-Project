  // Shared collision, controls and state for Menara Cloud.
  const boss = at('BugZero');
  const clearAttacks = () => {
    for (const name of ['BossWave', 'BugZeroClone', 'BossZone']) objects(name).forEach(o => o.deleteFromScene(s));
  };
  c.beginBossState = (state, duration) => {
    c.bossState = state;
    number('BossAttackCooldown').setNumber(duration);
    number('BossInvulnerable').setBoolean(state !== 'vulnerable');
  };
  c.useBossHit = () => {
    if (flag('BossDefeated') || number('BossInvulnerable').getAsBoolean() || c.t < (c.bossHitAt || 0)) return;
    const hp = number('BossHP'), value = Math.max(0,hp.getAsNumber()-10);
    hp.setNumber(value);
    c.bossHitAt = c.t + .45;
    c.bossFlashUntil = c.t + .16;
    if (!value) {
      clearAttacks();
      save('BossDefeated');
      c.beginBossState('defeated',0);
      c.say('Bug-Zero berhenti menyerang. Buka Recovery Console di kanan.',8);
      return;
    }
    const phase = value <= 40 ? 3 : value <= 80 ? 2 : 1;
    if (number('BossPhase').getAsNumber() !== phase) {
      clearAttacks();
      number('BossPhase').setNumber(phase);
      c.beginBossState('warning',1.4);
    }
  };
  c.updateBoss = (dt, hit, spawn) => {
    if (!number('BossStarted').getAsBoolean() || flag('BossDefeated')) return;
    const phase = number('BossPhase').getAsNumber();
    const cooldown = number('BossAttackCooldown');
    cooldown.setNumber(cooldown.getAsNumber()-dt);
    if (cooldown.getAsNumber() <= 0) {
      const wave = () => {
        const direction = c.player.getX() < boss.getX() ? -1 : 1;
        const width=52, x=direction<0 ? boss.getX()-width : boss.getX()+boss.getWidth();
        spawn('BossWave', x, 574, width, 30, 24)._direction = direction;
      };
      switch (c.bossState) {
        case 'warning':
          if (phase === 1) wave();
          if (phase === 2) {
            spawn('BugZeroClone',5900,544,85,64,17)._home = 5900;
            spawn('BugZeroClone',6610,490,85,64,17)._home = 6610;
          }
          if (phase === 3) {
            const zone = at('BossZone');
            zone.setOpacity(210);
            zone._active = true;
          }
          c.beginBossState('attacking',phase === 1 ? 1.65 : phase === 2 ? 2.3 : .30);
          break;
        case 'attacking':
          clearAttacks();
          if (phase === 3) { c.beginBossState('follow-up-warning',.55); break; }
          // A minimum charge at each opening keeps a zero-energy run winnable.
          c.energy = Math.max(c.energy,20);
          c.beginBossState('vulnerable',2.6);
          break;
        case 'follow-up-warning':
          wave(); c.beginBossState('follow-up',1.65);
          break;
        case 'follow-up':
          clearAttacks();
          c.energy = Math.max(c.energy,20);
          c.beginBossState('vulnerable',2.6);
          break;
        case 'vulnerable':
          c.beginBossState('warning', phase === 3 ? 1.45 : 1.0);
          break;
      }
    }
    if (phase === 3 && c.bossState === 'warning' && !at('BossZone')) {
      const playerLeft = c.player.getX()+48 < 6272;
      // Leave a visible safe lane around the core between the two marked sides.
      const zone = spawn('BossZone',playerLeft ? 5664 : 6496,544,playerLeft?448:384,64,23);
      zone.setOpacity(105);
    }
    for (const wave of objects('BossWave')) {
      wave.setX(wave.getX()+wave._direction*570*dt);
      if (hit(c.player,wave)) { c.damage(); wave.deleteFromScene(s); }
    }
    for (const copy of objects('BugZeroClone')) {
      copy.setX(copy._home + Math.sin(c.t*2.8 + copy._home)*145);
      copy.setColor('120;225;255');
      copy.setOpacity(145);
      if (hit(c.player,copy)) c.damage();
    }
    const zone = at('BossZone');
    if (zone?._active && hit(c.player,zone)) c.damage();
  };
