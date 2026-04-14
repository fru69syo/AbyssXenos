import { GAME_WIDTH, GAME_HEIGHT } from '../config';
import { Player } from '../entities/Player';
import { Bullet } from '../entities/Bullet';
import { Enemy } from '../entities/Enemy';
import { Boss } from '../entities/Boss';
import { Obstacle } from '../entities/Obstacle';
import { PowerUp } from '../entities/PowerUp';
import { RunState } from '../managers/RunState';
import { SkillManager } from '../managers/SkillManager';
import { WaveManager } from '../managers/WaveManager';
import { PlayerData } from '../managers/PlayerData';
import { calcPartStats, PartSlot } from '../data/parts';
import { applyPartAbilities } from '../data/partAbilities';
import { UPGRADES } from '../data/upgrades';
import { getEnemyById } from '../data/enemies';
import { HUD } from '../ui/HUD';
import { TouchControls } from '../ui/TouchControls';
import { reportError } from '../utils/errorBanner';
import { AudioManager } from '../audio/AudioManager';

export class GameScene extends Phaser.Scene {
  private player!: Player;
  private playerBullets!: Phaser.GameObjects.Group;
  private enemyBullets!: Phaser.GameObjects.Group;
  private enemies!: Phaser.GameObjects.Group;
  private powerUps!: Phaser.GameObjects.Group;
  private obstacles!: Phaser.GameObjects.Group;
  private obstacleSpawnTimer: number = 0;
  private boss: Boss | null = null;
  private midBoss: Boss | null = null;
  private runState!: RunState;
  private skillManager!: SkillManager;
  private waveManager!: WaveManager;
  private playerData!: PlayerData;
  private hud!: HUD;
  private touchControls!: TouchControls;
  private bgLayers: Phaser.GameObjects.TileSprite[] = [];
  private waveTransition: boolean = false;
  private stageIndex: number = 0;
  /** プレイヤー死亡演出中 (true のあいだ HUD/シーン遷移系を止める) */
  private dying: boolean = false;
  /** ステージクリア演出に入ったら true。isStageComplete 経路での二重発火を防止 */
  private stageCleared: boolean = false;
  /** 現在のステージで boss が一度でも生成されたか (撃破前にステージクリア扱いにさせないガード) */
  private bossSpawned: boolean = false;
  private particles!: Phaser.GameObjects.Particles.ParticleEmitter;
  // Skill effect timers
  private barrierTimer: number = 0;
  private hpRegenCounter: number = 0;
  private rapidFireCDTimer: number = 0;
  private overchargeTimer: number = 0;
  private orbitalAngle: number = 0;
  private orbitalDamageTimer: number = 0;
  private orbitals: Phaser.GameObjects.Arc[] = [];
  private cloneSprite: Phaser.GameObjects.Sprite | null = null;
  private cloneFireTimer: number = 0;
  private lastWaveIndex: number = -1;

  constructor() {
    super('GameScene');
  }

  init(data: { playerData: PlayerData; startStageIndex?: number }): void {
    this.playerData = data.playerData;
    const equipped = this.playerData.data.equippedParts as Record<PartSlot, string>;
    const stats = calcPartStats(equipped);

    // Apply permanent upgrades
    let bonusHp = 0, bonusAtk = 0, bonusSpeed = 0;
    for (const upg of UPGRADES) {
      const level = this.playerData.getUpgradeLevel(upg.id);
      if (level > 0) {
        switch (upg.effect.stat) {
          case 'maxHp': bonusHp += upg.effect.valuePerLevel * level; break;
          case 'atk': bonusAtk += upg.effect.valuePerLevel * level; break;
          case 'speed': bonusSpeed += upg.effect.valuePerLevel * level; break;
        }
      }
    }

    this.runState = new RunState(
      stats.hp + bonusHp,
      stats.atk + bonusAtk,
      stats.speed + bonusSpeed,
      stats.fireRate,
    );

    // Apply part abilities (N/R 基本能力 + SR/UR/LR ボーナス能力)
    applyPartAbilities(this.runState, stats.abilities, stats.bonusAbilities);

    // Apply coin rate upgrade
    const coinLevel = this.playerData.getUpgradeLevel('coin_rate');
    if (coinLevel > 0) this.runState.coinMultiplier += coinLevel * 0.1;

    // Apply start shield
    const shieldLevel = this.playerData.getUpgradeLevel('start_shield');
    if (shieldLevel > 0) this.runState.shield = shieldLevel;

    this.stageIndex = data.startStageIndex ?? 0;
    this.skillManager = new SkillManager();
  }

  create(): void {
    AudioManager.get().playBGM('battle');
    this.createBackground();
    this.createBulletPools();
    this.createEnemyPool();
    this.createObstaclePool();
    this.createPowerUpPool();
    this.createPlayer();
    this.createParticles();
    this.setupCollisions();

    this.hud = new HUD(this);
    this.touchControls = new TouchControls(this, this.player);

    this.waveManager = new WaveManager(this.stageIndex);
    this.waveTransition = false;
    this.dying = false;
    this.stageCleared = false;
    this.bossSpawned = false;
    this.boss = null;
    this.midBoss = null;

    // Scene 再起動時にハンドラが重複登録されるのを防止
    this.events.off('enemy-escaped');
    this.events.off('enemy-bullet-explode');
    this.events.off('enemy-self-destruct');

    // 画面外に逃げた敵もウェーブカウンタから差し引く
    this.events.on('enemy-escaped', () => {
      this.waveManager.onEnemyDestroyed();
    });

    // 敵弾の時限爆発 / 敵の自爆 → 自機範囲ダメージ
    this.events.on('enemy-bullet-explode', (d: { x: number; y: number; radius: number; damage: number }) => {
      this.applyEnemyExplosion(d.x, d.y, d.radius, d.damage);
    });
    this.events.on('enemy-self-destruct', (d: { x: number; y: number; radius: number; damage: number }) => {
      this.applyEnemyExplosion(d.x, d.y, d.radius, d.damage);
      this.waveManager.onEnemyDestroyed();
    });
  }

  private createBackground(): void {
    // Create parallax background layers with graphics
    const createBgLayer = (color: number, alpha: number, dotCount: number, speed: number) => {
      const canvas = this.textures.createCanvas(`bg_${speed}`, GAME_WIDTH, GAME_HEIGHT);
      if (!canvas) return null;
      const ctx = canvas.context;
      ctx.fillStyle = `rgba(0,0,0,0)`;
      ctx.clearRect(0, 0, GAME_WIDTH, GAME_HEIGHT);
      for (let i = 0; i < dotCount; i++) {
        const x = Math.random() * GAME_WIDTH;
        const y = Math.random() * GAME_HEIGHT;
        const r = Math.random() * 2 + 0.5;
        ctx.fillStyle = `rgba(${(color >> 16) & 0xff},${(color >> 8) & 0xff},${color & 0xff},${alpha})`;
        ctx.beginPath();
        ctx.arc(x, y, r, 0, Math.PI * 2);
        ctx.fill();
      }
      canvas.refresh();
      const layer = this.add.tileSprite(0, 0, GAME_WIDTH, GAME_HEIGHT, `bg_${speed}`)
        .setOrigin(0, 0).setDepth(-1);
      layer.setData('scrollSpeed', speed);
      return layer;
    };

    const l1 = createBgLayer(0x222266, 0.3, 50, 0.3);
    const l2 = createBgLayer(0x4444aa, 0.5, 30, 0.7);
    const l3 = createBgLayer(0x6666ff, 0.7, 15, 1.2);
    this.bgLayers = [l1, l2, l3].filter((l): l is Phaser.GameObjects.TileSprite => l !== null);
  }

  private createBulletPools(): void {
    this.playerBullets = this.add.group({
      classType: Bullet,
      maxSize: 100,
      runChildUpdate: true,
    });
    for (let i = 0; i < 100; i++) {
      const b = new Bullet(this, -50, -50, 'bullet_player');
      b.deactivate();
      this.playerBullets.add(b);
    }

    this.enemyBullets = this.add.group({
      classType: Bullet,
      maxSize: 200,
      runChildUpdate: true,
    });
    for (let i = 0; i < 200; i++) {
      const b = new Bullet(this, -50, -50, 'bullet_enemy');
      b.deactivate();
      this.enemyBullets.add(b);
    }
  }

  private createEnemyPool(): void {
    this.enemies = this.add.group({
      classType: Enemy,
      maxSize: 80,
      runChildUpdate: true,
    });
    for (let i = 0; i < 80; i++) {
      const e = new Enemy(this, -50, -50, 'enemy_1');
      e.deactivate();
      this.enemies.add(e);
    }
  }

  private createObstaclePool(): void {
    this.obstacles = this.add.group({
      classType: Obstacle,
      maxSize: 8,
      runChildUpdate: true,
    });
    for (let i = 0; i < 8; i++) {
      const o = new Obstacle(this, -100, -100);
      o.deactivate();
      this.obstacles.add(o);
    }
    this.obstacleSpawnTimer = 0;
  }

  private createPowerUpPool(): void {
    this.powerUps = this.add.group({
      classType: PowerUp,
      maxSize: 30,
      runChildUpdate: true,
    });
    for (let i = 0; i < 30; i++) {
      const p = new PowerUp(this, -50, -50, 'powerup_coin');
      p.deactivate();
      this.powerUps.add(p);
    }
  }

  private createPlayer(): void {
    this.player = new Player(this, GAME_WIDTH / 2, GAME_HEIGHT - 80);
    this.player.setName('player');
    this.player.init(this.runState, this.playerBullets);
    // Expose player to enemies / enemy bullets for aiming / homing
    this.registry.set('player', this.player);
  }

  private createParticles(): void {
    this.particles = this.add.particles(0, 0, 'particle', {
      speed: { min: 50, max: 150 },
      lifespan: 300,
      scale: { start: 1, end: 0 },
      emitting: false,
    });
  }

  private setupCollisions(): void {
    // Player bullets hit enemies
    this.physics.add.overlap(this.playerBullets, this.enemies,
      (bulletObj, enemyObj) => {
        const bullet = bulletObj as Bullet;
        const enemy = enemyObj as Enemy;
        if (!bullet.active || !enemy.active) return;

        // Critical hit calculation
        const { damage, isCrit } = this.calcBulletDamage(bullet);
        if (isCrit) {
          this.showFloatingText(enemy.x, enemy.y - 15, 'CRITICAL!', '#ffd700');
        }

        const ex = enemy.x;
        const ey = enemy.y;
        const killed = enemy.takeDamage(damage, bullet.hasFreeze, bullet.hasBurn);
        if (!bullet.isPiercing) bullet.deactivate();

        // Explosion AoE
        if (bullet.hasExplosion) {
          this.applyExplosion(ex, ey, Math.ceil(damage * 0.5));
        }

        if (killed) {
          this.onEnemyKilled(enemy);
        }
      }
    );

    // Player bullets hit boss
    this.physics.add.overlap(this.playerBullets, this.children.getAll().filter(
      c => c.getData('isBoss')
    ) as Phaser.GameObjects.GameObject[], () => {}, undefined, this);

    // Enemy bullets hit player
    this.physics.add.overlap(this.enemyBullets, this.player,
      (bulletObj, _playerObj) => {
        const bullet = bulletObj as Bullet;
        if (!bullet.active || !this.player.active) return;
        bullet.deactivate();
        const dead = this.player.takeDamage(bullet.damage);
        if (dead) this.onPlayerDeath();
      }
    );

    // Enemies collide with player
    this.physics.add.overlap(this.enemies, this.player,
      (enemyObj, _playerObj) => {
        const enemy = enemyObj as Enemy;
        if (!enemy.active || !this.player.active) return;
        enemy.deactivate();
        this.waveManager.onEnemyDestroyed();
        const dead = this.player.takeDamage(1);
        if (dead) this.onPlayerDeath();
      }
    );

    // Player bullets are blocked by obstacles (no damage to obstacle)
    this.physics.add.overlap(this.playerBullets, this.obstacles,
      (bulletObj, _obObj) => {
        const bullet = bulletObj as Bullet;
        if (!bullet.active) return;
        bullet.deactivate();
      }
    );

    // Obstacle touches player
    this.physics.add.overlap(this.obstacles, this.player,
      (_obObj, _playerObj) => {
        if (!this.player.active) return;
        const dead = this.player.takeDamage(1);
        if (dead) this.onPlayerDeath();
      }
    );

    // Player collects power-ups
    this.physics.add.overlap(this.powerUps, this.player,
      (puObj, _playerObj) => {
        try {
          const pu = puObj as PowerUp;
          if (!pu.active) return;
          // コインドロップは廃止。敵撃破時に即時加算しているため pu.powerUpType === 'coin' は発火しない
          if (pu.powerUpType === 'heal') {
            const maxHp = this.runState.overMaxHp ? this.runState.maxHp + 5 : this.runState.maxHp;
            this.runState.hp = Math.min(this.runState.hp + 1, maxHp);
            AudioManager.get().playPowerUp();
          } else if (pu.powerUpType === 'special') {
            this.collectSpecialDrop(pu);
            AudioManager.get().playPowerUp();
          }
          pu.deactivate();
        } catch (e) {
          reportError('powerup-overlap', e);
          throw e;
        }
      }
    );
  }

  private collectSpecialDrop(pu: PowerUp): void {
    switch (pu.specialDropType) {
      case 'gacha_ticket':
        this.playerData.addGachaTicket(1);
        this.showFloatingText(pu.x, pu.y, '🎫 +1', '#ff44ff');
        break;
      case 'gem':
        this.playerData.addGems(1);
        this.showFloatingText(pu.x, pu.y, '💎 +1', '#44aaff');
        break;
      case 'rare_part':
        // Reserved for future use
        this.showFloatingText(pu.x, pu.y, '⚙ +1', '#ffaa00');
        break;
      default:
        break;
    }
  }

  private showFloatingText(x: number, y: number, text: string, color: string): void {
    const t = this.add.text(x, y, text, {
      fontSize: '16px', color, fontFamily: 'monospace', fontStyle: 'bold',
    }).setOrigin(0.5).setDepth(60);
    this.tweens.add({
      targets: t,
      y: y - 40,
      alpha: 0,
      duration: 900,
      onComplete: () => t.destroy(),
    });
  }

  update(time: number, delta: number): void {
    try {
      this._update(time, delta);
    } catch (e) {
      reportError('GameScene.update', e);
      throw e;
    }
  }

  private _update(time: number, delta: number): void {
    // 死亡演出中 (delayedCall で HUD 破棄 + scene 遷移待ち) は全スキップ
    // — このまま続けると破棄された HUD の setText で Frame.data が null になり落ちる
    if (this.dying) return;
    if (this.waveTransition) return;

    // Parallax background
    for (const layer of this.bgLayers) {
      layer.tilePositionY -= layer.getData('scrollSpeed');
    }

    this.player.update(time, delta);

    // === Skill effect systems ===
    this.updateSkillTimers(delta);
    this.updateSkillEntities(time, delta);

    // Attract power-ups
    this.powerUps.getChildren().forEach(child => {
      const pu = child as PowerUp;
      if (pu.active) pu.attract(this.player.x, this.player.y, this.runState.magnetRange);
    });

    // Boss phase
    if (this.boss && this.boss.active) {
      this.boss.update(time, delta);
      // Check player bullets vs boss
      this.playerBullets.getChildren().forEach(child => {
        const bullet = child as Bullet;
        if (!bullet.active || !this.boss || !this.boss.active) return;
        const dist = Phaser.Math.Distance.Between(bullet.x, bullet.y, this.boss.x, this.boss.y);
        if (dist < 35) {
          const { damage, isCrit } = this.calcBulletDamage(bullet);
          if (isCrit) this.showFloatingText(this.boss.x, this.boss.y - 25, 'CRIT!', '#ffd700');
          const killed = this.boss.takeDamage(damage);
          if (!bullet.isPiercing) bullet.deactivate();
          if (killed) this.onBossKilled();
        }
      });
      this.updateHud();
      return;
    }

    // Bomb: wave start screen nuke
    if (this.runState.hasBomb && this.waveManager.currentWaveIndex !== this.lastWaveIndex) {
      this.lastWaveIndex = this.waveManager.currentWaveIndex;
      this.cameras.main.flash(200, 255, 200, 50);
      this.enemies.getChildren().forEach(child => {
        const enemy = child as Enemy;
        if (!enemy.active) return;
        const killed = enemy.takeDamage(3, false, false);
        if (killed) this.onEnemyKilled(enemy);
      });
    }

    // Spawn enemies (複数のサブグループからまとめて生成される可能性あり)
    // 敵 HP はステージ数に比例してスケール (stage 1 = ×3、stage 15 = ×17)
    // 序盤の敵が弱すぎて手応えが無い問題を解消するため +2 のオフセットを入れる
    const hpMul = this.stageIndex + 3;
    const spawnCmds = this.waveManager.update(delta);
    for (const spawnCmd of spawnCmds) {
      const enemy = this.enemies.getFirstDead(false) as Enemy | null;
      if (enemy) {
        const def = getEnemyById(spawnCmd.enemyId);
        enemy.spawn(spawnCmd.x, spawnCmd.y, def, spawnCmd.speedBase, hpMul);
        this.waveManager.onEnemySpawned();
      }
      // プール枯渇時は silently drop: phantom count を避けるため onEnemySpawned を呼ばない
    }

    // 中ボス生成チェック (波開始時に1度だけ)
    const midBossData = this.waveManager.consumeMidBoss();
    if (midBossData) {
      this.spawnMidBoss(midBossData);
    }

    // 中ボス更新 + 衝突判定 (通常敵と同時に存在)
    if (this.midBoss && this.midBoss.active) {
      this.midBoss.update(time, delta);
      this.playerBullets.getChildren().forEach(child => {
        const bullet = child as Bullet;
        if (!bullet.active || !this.midBoss || !this.midBoss.active) return;
        const dist = Phaser.Math.Distance.Between(bullet.x, bullet.y, this.midBoss.x, this.midBoss.y);
        if (dist < 28) {
          const { damage, isCrit } = this.calcBulletDamage(bullet);
          if (isCrit) this.showFloatingText(this.midBoss.x, this.midBoss.y - 20, 'CRIT!', '#ffd700');
          const killed = this.midBoss.takeDamage(damage);
          if (!bullet.isPiercing) bullet.deactivate();
          if (killed) this.onMidBossKilled();
        }
      });
      // 中ボスとプレイヤーの接触 (forEach 内で撃破された場合 midBoss は null)
      if (this.midBoss && this.midBoss.active && this.player.active) {
        const dist = Phaser.Math.Distance.Between(this.player.x, this.player.y, this.midBoss.x, this.midBoss.y);
        if (dist < 30) {
          const dead = this.player.takeDamage(1);
          if (dead) this.onPlayerDeath();
        }
      }
    }

    // Enemy shooting (interval-based, attack type pattern)
    this.enemies.getChildren().forEach(child => {
      const enemy = child as Enemy;
      if (!enemy.active || enemy.attackInterval <= 0 || enemy.attackTypeCode === 'none') return;
      enemy.attackTimer += delta;
      if (enemy.attackTimer >= enemy.attackInterval) {
        enemy.attackTimer = 0;
        this.fireEnemyAttack(enemy);
      }
    });

    // Obstacle: periodic spawn + aimed fire
    this.updateObstacles(delta);

    // Check wave completion (waveTransition 中は再突入させない)
    if (this.waveManager.isWaveComplete && !this.waveTransition) {
      if (this.waveManager.isBoss) {
        this.spawnBoss();
      } else if (this.waveManager.isStageComplete && this.bossSpawned) {
        // ボスを実際に出現させて撃破した時だけ stage clear を許可する。
        // bossSpawned=false で isStageComplete=true になるのは不正 state なので無視。
        this.onStageComplete();
      } else if (!this.waveManager.isStageComplete) {
        this.onWaveComplete();
      }
    }

    this.updateHud();
  }

  private updateObstacles(delta: number): void {
    // 定期スポーン: ~8 秒おきに 1 体、画面上部ランダム x。ボス戦時は出さない。
    if (!this.boss) {
      this.obstacleSpawnTimer += delta;
      const activeCount = this.obstacles.getChildren().filter(o => (o as Obstacle).active).length;
      if (this.obstacleSpawnTimer >= 8000 && activeCount < 3) {
        this.obstacleSpawnTimer = 0;
        const ob = this.obstacles.getFirstDead(false) as Obstacle | null;
        if (ob) {
          const margin = 50;
          const x = margin + Math.random() * (GAME_WIDTH - margin * 2);
          ob.spawn(x, -40);
        }
      }
    }

    // Aimed fire
    const speed = 230;
    this.obstacles.getChildren().forEach(child => {
      const ob = child as Obstacle;
      if (!ob.active) return;
      ob.attackTimer += delta;
      if (ob.attackTimer >= ob.attackInterval) {
        ob.attackTimer = 0;
        if (!this.player.active) return;
        const a = Phaser.Math.Angle.Between(ob.x, ob.y, this.player.x, this.player.y);
        const bullet = this.enemyBullets.getFirstDead(false) as Bullet | null;
        if (bullet) bullet.fire(ob.x, ob.y, Math.cos(a) * speed, Math.sin(a) * speed, 1);
      }
    });
  }

  private updateHud(): void {
    this.hud.update(
      this.runState,
      this.waveManager.currentWaveIndex,
      this.waveManager.totalWaves,
      this.waveManager.stageName,
      this.boss,
      this.midBoss,
    );
    this.hud.showSkillIcons(this.runState.skills);
  }

  private fireEnemyAttack(enemy: Enemy): void {
    const speed = 220;
    const fire = (vx: number, vy: number) => {
      const bullet = this.enemyBullets.getFirstDead(false) as Bullet | null;
      if (bullet) bullet.fire(enemy.x, enemy.y, vx, vy, 1);
    };
    const aim = () => Phaser.Math.Angle.Between(enemy.x, enemy.y, this.player.x, this.player.y);

    switch (enemy.attackTypeCode) {
      case 'aimed_single': {
        const a = aim();
        fire(Math.cos(a) * speed, Math.sin(a) * speed);
        break;
      }
      case 'aimed_burst': {
        const a = aim();
        for (let i = 0; i < 3; i++) {
          this.time.delayedCall(i * 100, () => {
            if (enemy.active) fire(Math.cos(a) * speed, Math.sin(a) * speed);
          });
        }
        break;
      }
      case 'spread3': {
        const base = Math.PI / 2; // straight down
        for (const off of [-0.26, 0, 0.26]) { // ~15 degrees
          const a = base + off;
          fire(Math.cos(a) * speed, Math.sin(a) * speed);
        }
        break;
      }
      case 'spread5': {
        const base = Math.PI / 2;
        for (const off of [-0.52, -0.26, 0, 0.26, 0.52]) {
          const a = base + off;
          fire(Math.cos(a) * speed, Math.sin(a) * speed);
        }
        break;
      }
      case 'circle8': {
        for (let i = 0; i < 8; i++) {
          const a = (Math.PI * 2 * i) / 8;
          fire(Math.cos(a) * speed, Math.sin(a) * speed);
        }
        break;
      }
      case 'homing': {
        const a = aim();
        const bullet = this.enemyBullets.getFirstDead(false) as Bullet | null;
        if (bullet) {
          bullet.fire(enemy.x, enemy.y, Math.cos(a) * speed * 0.85, Math.sin(a) * speed * 0.85, 1);
          bullet.enemyHoming = true;
        }
        break;
      }
      case 'delayed_explode': {
        const a = aim();
        const bullet = this.enemyBullets.getFirstDead(false) as Bullet | null;
        if (bullet) {
          bullet.fire(enemy.x, enemy.y, Math.cos(a) * speed * 0.7, Math.sin(a) * speed * 0.7, 1);
          bullet.explodeIn = 1000;
          bullet.explodeRadius = 55;
          bullet.explodeDamage = 1;
          bullet.setTint(0xff6622);
        }
        break;
      }
      case 'aimed_double': {
        const a = aim();
        for (let i = 0; i < 2; i++) {
          this.time.delayedCall(i * 150, () => {
            if (enemy.active) fire(Math.cos(a) * speed, Math.sin(a) * speed);
          });
        }
        break;
      }
      case 'aimed_triple': {
        const a = aim();
        for (let i = 0; i < 3; i++) {
          this.time.delayedCall(i * 80, () => {
            if (enemy.active) fire(Math.cos(a) * speed, Math.sin(a) * speed);
          });
        }
        break;
      }
      case 'stop_then_aim': {
        const bullet = this.enemyBullets.getFirstDead(false) as Bullet | null;
        if (bullet) {
          bullet.fire(enemy.x, enemy.y, 0, speed * 0.9, 1);
          bullet.stopAfter = 700;
          bullet.resumeAim = true;
          bullet.resumeSpeed = speed * 1.15;
          bullet.setTint(0xffaa44);
        }
        break;
      }
    }
  }

  private onEnemyKilled(enemy: Enemy): void {
    // 同じ enemy に対して onEnemyKilled が二重に呼ばれるのを防ぐ
    // (chain damage + direct bullet など複数経路から到達するケース)
    if (!enemy.active) return;
    // Capture state before deactivating
    const ex = enemy.x;
    const ey = enemy.y;
    const expValue = enemy.expValue;
    const coinDrop = enemy.coinDrop;
    const dropFlag = enemy.specialDropFlag;
    const dropType = enemy.specialDropType;
    const dropChance = enemy.specialDropChance;
    AudioManager.get().playExplode();

    // Explosion effect
    this.particles.emitParticleAt(ex, ey, 8);

    // Chain damage: hurt nearby enemies on kill
    if (this.runState.hasChainDamage) {
      this.enemies.getChildren().forEach(child => {
        const nearby = child as Enemy;
        if (!nearby.active || nearby === enemy) return;
        const dist = Phaser.Math.Distance.Between(ex, ey, nearby.x, nearby.y);
        if (dist < 80) {
          const chainKilled = nearby.takeDamage(this.runState.atk, false, false);
          this.particles.emitParticleAt(nearby.x, nearby.y, 3);
          if (chainKilled) {
            this.time.delayedCall(50, () => this.onEnemyKilled(nearby));
          }
        }
      });
    }

    // Lifesteal: 5% chance to heal on kill
    if (this.runState.hasLifesteal && Math.random() < 0.05) {
      this.runState.hp = Math.min(this.runState.hp + 1, this.runState.maxHp);
      this.showFloatingText(this.player.x, this.player.y - 25, '+1 HP', '#00ff66');
    }

    // Coin: award immediately on kill. Gem conversion (Alchemy evolution) rolls here.
    if (this.runState.hasGemConversion && Math.random() < 0.05) {
      this.playerData.addGems(1);
      this.showFloatingText(ex, ey, '💎 +1', '#44aaff');
    } else {
      this.runState.coins += Math.ceil(coinDrop * this.runState.coinMultiplier);
    }
    AudioManager.get().playCoin();

    // Occasional heal drop (still a pickup)
    if (Math.random() < 0.15) {
      const pu = this.powerUps.getFirstDead(false) as PowerUp | null;
      if (pu) pu.spawn(ex, ey, 'heal', 0);
    }

    // Gem finder: 2% chance to drop gem
    if (this.runState.hasGemFinder && Math.random() < 0.02) {
      const gp = this.powerUps.getFirstDead(false) as PowerUp | null;
      if (gp) gp.spawnSpecial(ex, ey, 'gem');
    }

    // Special drop (table-driven) with dropLuck
    const luckMultiplier = 1 + this.runState.dropLuck * 0.2;
    if (dropFlag && Math.random() < dropChance * luckMultiplier) {
      const sp = this.powerUps.getFirstDead(false) as PowerUp | null;
      if (sp) sp.spawnSpecial(ex, ey, dropType);
    }

    enemy.deactivate();
    this.waveManager.onEnemyDestroyed();

    // Award EXP and trigger level-up flow
    const levelUps = this.runState.addExp(expValue);
    if (levelUps > 0) {
      this.queueLevelUpSkillSelect();
    }
  }

  // === Skill effect helper methods ===

  private calcBulletDamage(bullet: Bullet): { damage: number; isCrit: boolean } {
    let damage = bullet.damage;
    let isCrit = false;
    if (this.runState.critChance > 0 && Math.random() < this.runState.critChance) {
      damage = Math.ceil(damage * this.runState.critDamage);
      isCrit = true;
    }
    return { damage, isCrit };
  }

  private applyExplosion(x: number, y: number, damage: number): void {
    this.particles.emitParticleAt(x, y, 12);
    this.enemies.getChildren().forEach(child => {
      const nearby = child as Enemy;
      if (!nearby.active) return;
      const dist = Phaser.Math.Distance.Between(x, y, nearby.x, nearby.y);
      if (dist < 60) {
        const killed = nearby.takeDamage(damage, false, false);
        if (killed) this.onEnemyKilled(nearby);
      }
    });
  }

  /** 敵弾の時限爆発や自爆敵の爆風を自機に適用 */
  private applyEnemyExplosion(x: number, y: number, radius: number, damage: number): void {
    AudioManager.get().playExplode();
    this.particles.emitParticleAt(x, y, 14);
    // 視覚的な赤いフラッシュリング
    const ring = this.add.circle(x, y, radius, 0xff4422, 0.35);
    this.tweens.add({
      targets: ring,
      alpha: 0,
      scaleX: 1.2,
      scaleY: 1.2,
      duration: 260,
      onComplete: () => ring.destroy(),
    });
    if (!this.player.active) return;
    const dist = Phaser.Math.Distance.Between(x, y, this.player.x, this.player.y);
    if (dist < radius) {
      const dead = this.player.takeDamage(damage);
      if (dead) this.onPlayerDeath();
    }
  }

  private updateSkillTimers(delta: number): void {
    // Barrier: auto shield every 10s
    if (this.runState.hasBarrier) {
      this.barrierTimer += delta;
      if (this.barrierTimer >= 10000) {
        this.barrierTimer = 0;
        this.runState.shield++;
        this.showFloatingText(this.player.x, this.player.y - 30, '🛡+1', '#44aaff');
      }
    }

    // HP regen timer
    if (this.runState.hpRegenTimer > 0) {
      this.hpRegenCounter += delta;
      const interval = this.runState.hpRegenTimer * 1000;
      if (this.hpRegenCounter >= interval) {
        this.hpRegenCounter = 0;
        const maxHp = this.runState.overMaxHp ? this.runState.maxHp + 5 : this.runState.maxHp;
        if (this.runState.hp < maxHp) {
          this.runState.hp++;
          this.showFloatingText(this.player.x, this.player.y - 30, '+1 HP', '#00ff66');
        }
      }
    }

    // Rapid fire burst: 3s active / 10s cooldown
    if (this.runState.rapidFireStacks > 0) {
      this.rapidFireCDTimer += delta;
      if (this.runState.rapidFireActive) {
        if (this.rapidFireCDTimer >= 3000) {
          this.runState.rapidFireActive = false;
          this.rapidFireCDTimer = 0;
        }
      } else {
        if (this.rapidFireCDTimer >= 10000) {
          this.runState.rapidFireActive = true;
          this.rapidFireCDTimer = 0;
          this.showFloatingText(this.player.x, this.player.y - 30, 'RAPID!', '#ffaa00');
        }
      }
    }

    // Overcharge: auto-fire powerful shot every 8s
    if (this.runState.hasOvercharge) {
      this.overchargeTimer += delta;
      if (this.overchargeTimer >= 8000) {
        this.overchargeTimer = 0;
        this.fireOverchargeShot();
      }
    }
  }

  private updateSkillEntities(time: number, delta: number): void {
    // Slow field: reduce enemy speed near player
    if (this.runState.hasSlowField) {
      this.enemies.getChildren().forEach(child => {
        const enemy = child as Enemy;
        if (!enemy.active) return;
        const dist = Phaser.Math.Distance.Between(this.player.x, this.player.y, enemy.x, enemy.y);
        enemy.speedModifier = dist < 120 ? 0.4 : 1.0;
      });
    }

    // Bullet absorb: destroy enemy bullets near player
    if (this.runState.hasBulletAbsorb) {
      this.enemyBullets.getChildren().forEach(child => {
        const bullet = child as Bullet;
        if (!bullet.active) return;
        const dist = Phaser.Math.Distance.Between(this.player.x, this.player.y, bullet.x, bullet.y);
        if (dist < 60) {
          bullet.deactivate();
          this.particles.emitParticleAt(bullet.x, bullet.y, 2);
        }
      });
    }

    // Orbital: rotating damage orbs
    if (this.runState.hasOrbital) {
      this.updateOrbitals(delta);
    }

    // Clone: shadow that follows and fires
    if (this.runState.hasClone) {
      this.updateClone(time, delta);
    }
  }

  private updateOrbitals(delta: number): void {
    if (this.orbitals.length === 0) {
      for (let i = 0; i < 2; i++) {
        const orb = this.add.circle(0, 0, 6, 0x44ffaa).setDepth(10);
        this.orbitals.push(orb);
      }
    }

    this.orbitalAngle += delta * 0.004;
    for (let i = 0; i < this.orbitals.length; i++) {
      const angle = this.orbitalAngle + (Math.PI * i);
      this.orbitals[i].setPosition(
        this.player.x + Math.cos(angle) * 50,
        this.player.y + Math.sin(angle) * 50
      );
    }

    this.orbitalDamageTimer += delta;
    if (this.orbitalDamageTimer >= 200) {
      this.orbitalDamageTimer = 0;
      for (const orb of this.orbitals) {
        this.enemies.getChildren().forEach(child => {
          const enemy = child as Enemy;
          if (!enemy.active) return;
          const dist = Phaser.Math.Distance.Between(orb.x, orb.y, enemy.x, enemy.y);
          if (dist < 20) {
            const killed = enemy.takeDamage(1, false, false);
            if (killed) this.onEnemyKilled(enemy);
          }
        });
        // Also damage mid-boss
        if (this.midBoss && this.midBoss.active) {
          const dist = Phaser.Math.Distance.Between(orb.x, orb.y, this.midBoss.x, this.midBoss.y);
          if (dist < 25) this.midBoss.takeDamage(1);
        }
      }
    }
  }

  private updateClone(_time: number, delta: number): void {
    if (!this.cloneSprite) {
      this.cloneSprite = this.add.sprite(this.player.x - 40, this.player.y, 'player')
        .setAlpha(0.5).setDepth(5).setTint(0x8888ff);
    }

    const targetX = this.player.x - 40;
    const targetY = this.player.y + 20;
    this.cloneSprite.x += (targetX - this.cloneSprite.x) * 0.1;
    this.cloneSprite.y += (targetY - this.cloneSprite.y) * 0.1;

    this.cloneFireTimer += delta;
    if (this.cloneFireTimer >= this.runState.fireRate) {
      this.cloneFireTimer = 0;
      const bullet = this.playerBullets.getFirstDead(false) as Bullet | null;
      if (bullet) {
        bullet.fire(this.cloneSprite.x, this.cloneSprite.y - 15, 0, -this.runState.bulletSpeed, this.runState.atk);
        bullet.isPiercing = this.runState.hasPierce;
        bullet.isHoming = this.runState.hasHoming;
        bullet.setScale(this.runState.bulletSizeMultiplier * 0.8);
      }
    }
  }

  private fireOverchargeShot(): void {
    const bullet = this.playerBullets.getFirstDead(false) as Bullet | null;
    if (!bullet) return;
    bullet.fire(this.player.x, this.player.y - 15, 0, -this.runState.bulletSpeed * 0.8, this.runState.atk * 5);
    bullet.isPiercing = true;
    bullet.setScale(this.runState.bulletSizeMultiplier * 3);
    bullet.setTint(0xff44ff);
    this.cameras.main.shake(100, 0.005);
  }

  private buildEvolutionInfos(skills: import('../data/skills').SkillDef[]): Record<string, { current: number; required: number; evolvesTo: string }> {
    const infos: Record<string, { current: number; required: number; evolvesTo: string }> = {};
    for (const skill of skills) {
      const evo = this.skillManager.getEvolutionInfo(skill, this.runState);
      if (evo) infos[skill.id] = evo;
    }
    return infos;
  }

  private applySkillWithEvolution(skill: import('../data/skills').SkillDef): void {
    const result = this.runState.applySkill(skill);
    if (skill.id === 'side_drone' || (result && result.evolvedSkill.id === 'drone_army')) {
      this.player.updateDrones();
    }
    if (result) {
      this.showEvolutionText(result.evolvedSkill.name);
    }
  }

  private showEvolutionText(name: string): void {
    this.cameras.main.flash(500, 255, 215, 0);
    const evoText = this.add.text(GAME_WIDTH / 2, GAME_HEIGHT / 2 - 40, `✨ 進化! ${name} ✨`, {
      fontSize: '24px', color: '#ffd700', fontFamily: 'monospace', fontStyle: 'bold',
    }).setOrigin(0.5).setDepth(200);
    this.tweens.add({
      targets: evoText, alpha: 0, y: evoText.y - 60, duration: 2000,
      onComplete: () => evoText.destroy(),
    });
  }

  private queueLevelUpSkillSelect(): void {
    if (this.runState.pendingLevelUps <= 0) {
      this.waveTransition = false;
      return;
    }
    this.waveTransition = true;
    AudioManager.get().playLevelUp();
    const skills = this.skillManager.getRandomSkillChoices(this.runState, 3);
    this.scene.launch('SkillSelectScene', {
      skills,
      title: `LEVEL UP! Lv.${this.runState.level}`,
      evolutionInfos: this.buildEvolutionInfos(skills),
      onSelect: (skillId: string) => {
        const skill = skills.find(s => s.id === skillId);
        if (skill) this.applySkillWithEvolution(skill);
        this.runState.pendingLevelUps = Math.max(0, this.runState.pendingLevelUps - 1);
        this.scene.resume();
        if (this.runState.pendingLevelUps > 0) {
          this.queueLevelUpSkillSelect();
        } else {
          this.waveTransition = false;
        }
      },
    });
    this.scene.pause();
  }

  private onBossKilled(): void {
    if (!this.boss) return;
    AudioManager.get().playStageClear();

    // Big explosion
    for (let i = 0; i < 5; i++) {
      this.time.delayedCall(i * 100, () => {
        if (this.boss) {
          this.particles.emitParticleAt(
            this.boss.x + Phaser.Math.Between(-30, 30),
            this.boss.y + Phaser.Math.Between(-20, 20),
            15
          );
        }
      });
    }

    // Bonus coin payout (immediate)
    const bossBonus = Math.ceil(50 * this.runState.coinMultiplier);
    this.runState.coins += bossBonus;
    this.showFloatingText(this.boss.x, this.boss.y, `🪙 +${bossBonus}`, '#ffd700');
    AudioManager.get().playCoin();

    this.boss.deactivate();
    this.waveManager.onBossDefeated();
    this.boss = null;
    this.onStageComplete();
  }

  private spawnMidBoss(data: import('../data/stages').BossData): void {
    // 警告フラッシュ
    this.cameras.main.flash(200, 255, 150, 0);
    const warn = this.add.text(GAME_WIDTH / 2, GAME_HEIGHT / 2, '⚠ MID BOSS ⚠', {
      fontSize: '24px', color: '#ffaa00', fontFamily: 'monospace', fontStyle: 'bold',
    }).setOrigin(0.5).setDepth(50);
    this.tweens.add({
      targets: warn, alpha: 0, duration: 1200,
      onComplete: () => warn.destroy(),
    });

    this.midBoss = new Boss(this, this.enemyBullets);
    this.midBoss.initAsMidBoss(data);
  }

  private onMidBossKilled(): void {
    if (!this.midBoss) return;
    AudioManager.get().playWaveClear();

    // 派手な爆発
    for (let i = 0; i < 3; i++) {
      this.time.delayedCall(i * 80, () => {
        if (this.midBoss) {
          this.particles.emitParticleAt(
            this.midBoss.x + Phaser.Math.Between(-20, 20),
            this.midBoss.y + Phaser.Math.Between(-15, 15), 12);
        }
      });
    }

    // ボーナスコイン (即時付与)
    const midBonus = Math.ceil(15 * this.runState.coinMultiplier);
    this.runState.coins += midBonus;
    this.showFloatingText(this.midBoss.x, this.midBoss.y, `🪙 +${midBonus}`, '#ffd700');
    AudioManager.get().playCoin();

    // 中ボス確定ドロップ（ガチャチケット）
    const sp = this.powerUps.getFirstDead(false) as PowerUp | null;
    if (sp) sp.spawnSpecial(this.midBoss.x, this.midBoss.y, 'gacha_ticket');

    // EXP付与
    this.runState.addExp(50);

    this.midBoss.deactivate();
    this.midBoss = null;
    this.waveManager.onMidBossDefeated();
  }

  private spawnBoss(): void {
    if (this.boss) return; // すでに生成済み / 生成中は無視
    this.waveTransition = true;
    AudioManager.get().playBossWarn();
    AudioManager.get().playBGM('boss');

    // ボス戦では障害物を一掃
    this.obstacles.getChildren().forEach(o => (o as Obstacle).deactivate());

    // Warning text
    const warning = this.add.text(GAME_WIDTH / 2, GAME_HEIGHT / 2, '⚠ WARNING ⚠\nBOSS APPROACHING', {
      fontSize: '28px', color: '#ff0044', fontFamily: 'monospace', align: 'center',
    }).setOrigin(0.5).setDepth(50);

    this.tweens.add({
      targets: warning,
      alpha: 0,
      duration: 300,
      yoyo: true,
      repeat: 3,
      onComplete: () => {
        warning.destroy();
        this.boss = new Boss(this, this.enemyBullets);
        this.boss.init(this.waveManager.bossData);
        this.bossSpawned = true;
        this.waveTransition = false;
      },
    });
  }

  private onWaveComplete(): void {
    this.waveTransition = true;
    this.runState.onWaveComplete();
    AudioManager.get().playWaveClear();

    // 文字演出は不要。SE のみ鳴らし、短いフェードで次ウェーブへ。
    this.time.delayedCall(400, () => {
      this.waveManager.nextWave();
      this.waveTransition = false;
    });
  }

  private onStageComplete(): void {
    if (this.stageCleared) return;
    this.stageCleared = true;
    this.waveTransition = true;
    this.runState.onWaveComplete();

    // ステージクリアを記録 (到達ステージ数の更新 + 獲得コインを永続化)
    const clearedStageNumber = this.stageIndex + 1;
    this.playerData.addCoins(this.runState.coins);
    this.playerData.recordRun(clearedStageNumber);

    const clearText = this.add.text(GAME_WIDTH / 2, GAME_HEIGHT / 2 - 40, `STAGE ${clearedStageNumber} CLEAR!`, {
      fontSize: '32px', color: '#00ff88', fontFamily: 'monospace', fontStyle: 'bold',
    }).setOrigin(0.5).setDepth(50);
    const subText = this.add.text(GAME_WIDTH / 2, GAME_HEIGHT / 2 + 10, `🪙 ${this.runState.coins} 獲得`, {
      fontSize: '18px', color: '#ffd700', fontFamily: 'monospace',
    }).setOrigin(0.5).setDepth(50);
    const hintText = this.add.text(GAME_WIDTH / 2, GAME_HEIGHT / 2 + 44, 'ロビーに戻ります…', {
      fontSize: '14px', color: '#aaaacc', fontFamily: 'monospace',
    }).setOrigin(0.5).setDepth(50);

    this.time.delayedCall(2000, () => {
      clearText.destroy();
      subText.destroy();
      hintText.destroy();
      this.hud.destroy();
      this.touchControls.destroy();
      this.scene.start('LobbyScene');
    });
  }

  private onPlayerDeath(): void {
    if (this.dying) return;
    this.dying = true;
    this.player.setActive(false);
    this.player.setVisible(false);
    this.player.destroyDrones();
    // Clean up skill entities
    for (const orb of this.orbitals) orb.destroy();
    this.orbitals = [];
    if (this.cloneSprite) { this.cloneSprite.destroy(); this.cloneSprite = null; }
    AudioManager.get().playGameOver();
    AudioManager.get().stopBGM();

    // Death explosion
    this.particles.emitParticleAt(this.player.x, this.player.y, 20);

    this.playerData.addCoins(this.runState.coins);
    this.playerData.recordRun(this.stageIndex + 1);

    this.time.delayedCall(1000, () => {
      this.hud.destroy();
      this.touchControls.destroy();
      this.scene.start('GameOverScene', {
        playerData: this.playerData,
        coins: this.runState.coins,
        stage: this.stageIndex + 1,
        wave: this.waveManager.currentWaveIndex + 1,
        skills: this.runState.skills.map(s => s.skill.name),
      });
    });
  }

  shutdown(): void {
    this.hud?.destroy();
    this.touchControls?.destroy();
    for (const orb of this.orbitals) orb.destroy();
    this.orbitals = [];
    if (this.cloneSprite) { this.cloneSprite.destroy(); this.cloneSprite = null; }
    // Scene events は再利用されるため、カスタムハンドラを確実に除去
    this.events.off('enemy-escaped');
    this.events.off('enemy-bullet-explode');
    this.events.off('enemy-self-destruct');
  }
}
