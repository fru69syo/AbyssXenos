import { GAME_WIDTH, GAME_HEIGHT, COLORS } from '../config';
import { Player } from '../entities/Player';
import { Bullet } from '../entities/Bullet';
import { Enemy } from '../entities/Enemy';
import { Boss } from '../entities/Boss';
import { PowerUp } from '../entities/PowerUp';
import { RunState } from '../managers/RunState';
import { SkillManager } from '../managers/SkillManager';
import { WaveManager } from '../managers/WaveManager';
import { PlayerData } from '../managers/PlayerData';
import { SHIPS } from '../data/ships';
import { UPGRADES } from '../data/upgrades';
import { HUD } from '../ui/HUD';
import { TouchControls } from '../ui/TouchControls';

export class GameScene extends Phaser.Scene {
  private player!: Player;
  private playerBullets!: Phaser.GameObjects.Group;
  private enemyBullets!: Phaser.GameObjects.Group;
  private enemies!: Phaser.GameObjects.Group;
  private powerUps!: Phaser.GameObjects.Group;
  private boss: Boss | null = null;
  private runState!: RunState;
  private skillManager!: SkillManager;
  private waveManager!: WaveManager;
  private playerData!: PlayerData;
  private hud!: HUD;
  private touchControls!: TouchControls;
  private bgLayers: Phaser.GameObjects.TileSprite[] = [];
  private waveTransition: boolean = false;
  private stageIndex: number = 0;
  private particles!: Phaser.GameObjects.Particles.ParticleEmitter;

  constructor() {
    super('GameScene');
  }

  init(data: { playerData: PlayerData; shipId: string }): void {
    this.playerData = data.playerData;
    const ship = SHIPS.find(s => s.id === data.shipId) ?? SHIPS[0];

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
      ship.baseHp + bonusHp,
      ship.baseAtk + bonusAtk,
      ship.baseSpeed + bonusSpeed,
      ship.fireRate,
    );

    // Apply coin rate upgrade
    const coinLevel = this.playerData.getUpgradeLevel('coin_rate');
    if (coinLevel > 0) this.runState.coinMultiplier += coinLevel * 0.1;

    // Apply start shield
    const shieldLevel = this.playerData.getUpgradeLevel('start_shield');
    if (shieldLevel > 0) this.runState.shield = shieldLevel;

    this.stageIndex = 0;
    this.skillManager = new SkillManager();
  }

  create(): void {
    this.createBackground();
    this.createBulletPools();
    this.createEnemyPool();
    this.createPowerUpPool();
    this.createPlayer();
    this.createParticles();
    this.setupCollisions();

    this.hud = new HUD(this);
    this.touchControls = new TouchControls(this, this.player);

    this.waveManager = new WaveManager(this.stageIndex);
    this.waveTransition = false;
    this.boss = null;
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
      maxSize: 40,
      runChildUpdate: true,
    });
    for (let i = 0; i < 40; i++) {
      const e = new Enemy(this, -50, -50, 'enemy_drifter');
      e.deactivate();
      this.enemies.add(e);
    }
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

        const killed = enemy.takeDamage(bullet.damage, bullet.hasFreeze, bullet.hasBurn);
        if (!bullet.isPiercing) bullet.deactivate();

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
      (playerObj, bulletObj) => {
        const bullet = bulletObj as Bullet;
        if (!bullet.active || !this.player.active) return;
        bullet.deactivate();
        const dead = this.player.takeDamage(bullet.damage);
        if (dead) this.onPlayerDeath();
      }
    );

    // Enemies collide with player
    this.physics.add.overlap(this.enemies, this.player,
      (playerObj, enemyObj) => {
        const enemy = enemyObj as Enemy;
        if (!enemy.active || !this.player.active) return;
        enemy.deactivate();
        this.waveManager.onEnemyDestroyed();
        const dead = this.player.takeDamage(1);
        if (dead) this.onPlayerDeath();
      }
    );

    // Player collects power-ups
    this.physics.add.overlap(this.powerUps, this.player,
      (playerObj, puObj) => {
        const pu = puObj as PowerUp;
        if (!pu.active) return;
        if (pu.powerUpType === 'coin') {
          this.runState.coins += Math.ceil(pu.value * this.runState.coinMultiplier);
        } else if (pu.powerUpType === 'heal') {
          this.runState.hp = Math.min(this.runState.hp + 1, this.runState.maxHp);
        }
        pu.deactivate();
      }
    );
  }

  update(time: number, delta: number): void {
    if (this.waveTransition) return;

    // Parallax background
    for (const layer of this.bgLayers) {
      layer.tilePositionY -= layer.getData('scrollSpeed');
    }

    this.player.update(time, delta);

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
          const killed = this.boss.takeDamage(bullet.damage);
          if (!bullet.isPiercing) bullet.deactivate();
          if (killed) this.onBossKilled();
        }
      });
      this.updateHud();
      return;
    }

    // Spawn enemies
    const spawnCmd = this.waveManager.update(delta);
    if (spawnCmd) {
      const enemy = this.enemies.getFirstDead(false) as Enemy | null;
      if (enemy) {
        const texKey = `enemy_${spawnCmd.enemyType}`;
        enemy.setTexture(texKey);
        enemy.spawn(spawnCmd.x, spawnCmd.y, spawnCmd.enemyType, spawnCmd.speed, spawnCmd.shootChance);
      }
    }

    // Enemy shooting
    this.enemies.getChildren().forEach(child => {
      const enemy = child as Enemy;
      if (!enemy.active || enemy.shootChance <= 0) return;
      if (Math.random() < enemy.shootChance) {
        const bullet = this.enemyBullets.getFirstDead(false) as Bullet | null;
        if (bullet) {
          const angle = Phaser.Math.Angle.Between(enemy.x, enemy.y, this.player.x, this.player.y);
          bullet.fire(enemy.x, enemy.y, Math.cos(angle) * 200, Math.sin(angle) * 200, 1);
        }
      }
    });

    // Check wave completion
    if (this.waveManager.isWaveComplete) {
      if (this.waveManager.isBoss) {
        this.spawnBoss();
      } else if (this.waveManager.isStageComplete) {
        this.onStageComplete();
      } else {
        this.onWaveComplete();
      }
    }

    this.updateHud();
  }

  private updateHud(): void {
    this.hud.update(
      this.runState,
      this.waveManager.currentWaveIndex,
      this.waveManager.totalWaves,
      this.waveManager.stageName,
      this.boss,
    );
    this.hud.showSkillIcons(this.runState.skills);
  }

  private onEnemyKilled(enemy: Enemy): void {
    // Explosion effect
    this.particles.emitParticleAt(enemy.x, enemy.y, 8);

    // Drop power-ups
    const pu = this.powerUps.getFirstDead(false) as PowerUp | null;
    if (pu) {
      const type = Math.random() < 0.15 ? 'heal' : 'coin';
      pu.spawn(enemy.x, enemy.y, type, enemy.coinDrop);
    }

    enemy.deactivate();
    this.waveManager.onEnemyDestroyed();
  }

  private onBossKilled(): void {
    if (!this.boss) return;

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

    // Drop lots of coins
    for (let i = 0; i < 10; i++) {
      const pu = this.powerUps.getFirstDead(false) as PowerUp | null;
      if (pu) {
        pu.spawn(
          this.boss.x + Phaser.Math.Between(-40, 40),
          this.boss.y + Phaser.Math.Between(-30, 30),
          'coin', 5
        );
      }
    }

    this.boss.deactivate();
    this.waveManager.onBossDefeated();
    this.boss = null;
    this.onStageComplete();
  }

  private spawnBoss(): void {
    this.waveTransition = true;

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
        this.waveTransition = false;
      },
    });
  }

  private onWaveComplete(): void {
    this.waveTransition = true;
    this.runState.onWaveComplete();

    // Show skill select
    const skills = this.skillManager.getRandomSkillChoices(this.runState, 3);
    this.scene.launch('SkillSelectScene', {
      skills,
      onSelect: (skillId: string) => {
        const skill = skills.find(s => s.id === skillId);
        if (skill) {
          this.runState.applySkill(skill);
          if (skill.id === 'side_drone') this.player.updateDrones();
        }
        this.scene.resume();
        this.waveManager.nextWave();
        this.waveTransition = false;
      },
    });
    this.scene.pause();
  }

  private onStageComplete(): void {
    this.waveTransition = true;
    this.runState.currentStage++;
    this.stageIndex++;
    this.runState.onWaveComplete();

    // Stage clear message + skill select
    const clearText = this.add.text(GAME_WIDTH / 2, GAME_HEIGHT / 2, `STAGE ${this.stageIndex} CLEAR!`, {
      fontSize: '32px', color: '#00ff88', fontFamily: 'monospace', fontStyle: 'bold',
    }).setOrigin(0.5).setDepth(50);

    this.time.delayedCall(1500, () => {
      clearText.destroy();
      const skills = this.skillManager.getRandomSkillChoices(this.runState, 3);
      this.scene.launch('SkillSelectScene', {
        skills,
        onSelect: (skillId: string) => {
          const skill = skills.find(s => s.id === skillId);
          if (skill) {
            this.runState.applySkill(skill);
            if (skill.id === 'side_drone') this.player.updateDrones();
          }
          this.scene.resume();
          this.waveManager = new WaveManager(this.stageIndex);
          this.waveTransition = false;
        },
      });
      this.scene.pause();
    });
  }

  private onPlayerDeath(): void {
    this.player.setActive(false);
    this.player.setVisible(false);
    this.player.destroyDrones();

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
  }
}
