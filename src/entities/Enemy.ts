import { GAME_WIDTH, GAME_HEIGHT } from '../config';
import { EnemyDef, MoveTypeCode, AttackTypeCode } from '../data/enemies';
import { SpecialDropType } from '../data/dropTypes';
import { playAnimIfExists } from '../utils/playAnimIfExists';

export class Enemy extends Phaser.Physics.Arcade.Sprite {
  def!: EnemyDef;
  hp: number = 1;
  maxHp: number = 1;
  moveSpeed: number = 100;
  expValue: number = 0;
  coinDrop: number = 1;
  movePattern: MoveTypeCode = 'straight';
  attackTypeCode: AttackTypeCode = 'none';
  attackInterval: number = 0;
  attackTimer: number = 0;
  specialDropFlag: boolean = false;
  specialDropType: SpecialDropType = 'none';
  specialDropChance: number = 0;
  private zigzagTimer: number = 0;
  private zigzagDir: number = 1;
  private sineSeed: number = 0;
  speedModifier: number = 1;
  private frozen: boolean = false;
  private frozenTimer: number = 0;
  private burning: boolean = false;
  private burnTimer: number = 0;
  private burnDamageTimer: number = 0;
  // Pattern state for new movement types
  private patternTimer: number = 0;
  private phase: 0 | 1 = 0;
  private aimDirX: number = 0;
  private aimDirY: number = 1;
  // Self-destruct state
  private selfDestructArmed: boolean = false;
  private selfDestructTimer: number = 0;
  private selfDestructTween: Phaser.Tweens.Tween | null = null;

  constructor(scene: Phaser.Scene, x: number, y: number, texture: string) {
    super(scene, x, y, texture);
    scene.add.existing(this);
    scene.physics.add.existing(this);
    this.setData('isEnemy', true);
  }

  spawn(x: number, y: number, def: EnemyDef, speedBase: number, hpMultiplier: number = 1): void {
    this.setPosition(x, y);
    this.setActive(true);
    this.setVisible(true);
    (this.body as Phaser.Physics.Arcade.Body).enable = true;

    this.def = def;
    const scaledHp = Math.max(1, Math.round(def.hp * hpMultiplier));
    this.hp = scaledHp;
    this.maxHp = scaledHp;
    this.moveSpeed = speedBase * def.speedMul;
    this.expValue = def.exp;
    this.coinDrop = def.coin;
    this.movePattern = def.moveType;
    this.attackTypeCode = def.attackType;
    this.attackInterval = def.attackInterval;
    this.attackTimer = 0;
    this.specialDropFlag = def.specialDropFlag;
    this.specialDropType = def.specialDropType;
    this.specialDropChance = def.specialDropChance;

    this.setTexture(def.graphic);
    this.setScale(def.scale);
    this.clearTint();
    playAnimIfExists(this, `${def.graphic}_idle`);

    this.frozen = false;
    this.burning = false;
    this.zigzagTimer = 0;
    this.zigzagDir = Math.random() > 0.5 ? 1 : -1;
    this.sineSeed = Math.random() * Math.PI * 2;
    this.patternTimer = 0;
    this.phase = 0;
    this.aimDirX = 0;
    this.aimDirY = 1;
    this.selfDestructArmed = false;
    this.selfDestructTimer = 0;
    if (this.selfDestructTween) {
      this.selfDestructTween.stop();
      this.selfDestructTween = null;
    }
  }

  /** player 位置から aim 方向 (単位ベクトル) を計算。player 不在なら真下 */
  private computeAimDir(): void {
    const player = this.scene.registry.get('player') as Phaser.GameObjects.Sprite | undefined;
    if (!player || !player.active) {
      this.aimDirX = 0;
      this.aimDirY = 1;
      return;
    }
    const a = Phaser.Math.Angle.Between(this.x, this.y, player.x, player.y);
    this.aimDirX = Math.cos(a);
    this.aimDirY = Math.sin(a);
  }

  update(_time: number, delta: number): void {
    if (!this.active) return;

    // Self-destruct countdown (damage-ignoring enemies)
    if (this.selfDestructArmed) {
      this.selfDestructTimer -= delta;
      if (this.selfDestructTimer <= 0) {
        const sd = this.def.selfDestruct!;
        this.scene.events.emit('enemy-self-destruct', {
          x: this.x, y: this.y, radius: sd.radius, damage: sd.damage,
        });
        this.deactivate();
        return;
      }
    }

    // Frozen state
    if (this.frozen) {
      this.frozenTimer -= delta;
      if (this.frozenTimer <= 0) this.frozen = false;
      this.setVelocity(0, 0);
      return;
    }

    // Burn DoT
    if (this.burning) {
      this.burnTimer -= delta;
      this.burnDamageTimer -= delta;
      if (this.burnDamageTimer <= 0) {
        this.burnDamageTimer = 500;
        this.hp -= 1;
        if (this.hp <= 0) {
          this.deactivate();
          return;
        }
      }
      if (this.burnTimer <= 0) this.burning = false;
    }

    this.patternTimer += delta;

    // Movement
    switch (this.movePattern) {
      case 'straight':
        this.setVelocity(0, this.moveSpeed);
        break;
      case 'zigzag':
        this.zigzagTimer += delta;
        if (this.zigzagTimer > 800) {
          this.zigzagTimer = 0;
          this.zigzagDir *= -1;
        }
        this.setVelocity(this.zigzagDir * this.moveSpeed * 0.6, this.moveSpeed * 0.8);
        break;
      case 'sine':
        this.setVelocity(
          Math.sin(Date.now() * 0.002 + this.sineSeed) * this.moveSpeed * 0.7,
          this.moveSpeed * 0.85
        );
        break;
      case 'slow_descent':
        this.setVelocity(0, this.moveSpeed);
        break;
      case 'swarm':
        this.setVelocity(
          Math.sin(Date.now() * 0.003 + this.x) * this.moveSpeed * 0.3,
          this.moveSpeed
        );
        break;
      case 'aim_straight': {
        // 初回のみ aim を決定
        if (this.phase === 0) {
          this.computeAimDir();
          this.phase = 1;
        }
        this.setVelocity(this.aimDirX * this.moveSpeed, this.aimDirY * this.moveSpeed);
        break;
      }
      case 'orbit_forward': {
        const t = this.patternTimer * 0.006;
        this.setVelocity(
          Math.cos(t + this.sineSeed) * this.moveSpeed * 0.5,
          this.moveSpeed * 0.8 + Math.sin(t + this.sineSeed) * this.moveSpeed * 0.25,
        );
        break;
      }
      case 'side_sway_forward': {
        if (this.patternTimer < 2500) {
          this.setVelocity(Math.sin(this.patternTimer * 0.002) * this.moveSpeed * 1.4, 0);
        } else {
          this.setVelocity(0, this.moveSpeed);
        }
        break;
      }
      case 'side_sway_aim': {
        if (this.patternTimer < 2500) {
          this.setVelocity(Math.sin(this.patternTimer * 0.002) * this.moveSpeed * 1.4, 0);
        } else {
          if (this.phase === 0) {
            this.computeAimDir();
            this.phase = 1;
          }
          this.setVelocity(this.aimDirX * this.moveSpeed, this.aimDirY * this.moveSpeed);
        }
        break;
      }
    }

    // Apply slow field modifier
    if (this.speedModifier !== 1) {
      const body = this.body as Phaser.Physics.Arcade.Body;
      body.velocity.x *= this.speedModifier;
      body.velocity.y *= this.speedModifier;
    }

    // Off-screen check — 逃したときも Wave 進行用に通知
    if (this.y > GAME_HEIGHT + 50) {
      this.scene.events.emit('enemy-escaped', this);
      this.deactivate();
    } else if (this.x < -80 || this.x > GAME_WIDTH + 80) {
      // 横方向に逃げ切った場合も wave 進行のために通知
      this.scene.events.emit('enemy-escaped', this);
      this.deactivate();
    }
  }

  takeDamage(amount: number, hasFreeze: boolean, hasBurn: boolean): boolean {
    // Self-destruct enemies: first hit arms the timer, further hits ignored
    if (this.def.selfDestruct) {
      if (!this.selfDestructArmed) {
        this.selfDestructArmed = true;
        this.selfDestructTimer = this.def.selfDestruct.delay;
        this.setTint(0xff2222);
        this.selfDestructTween = this.scene.tweens.add({
          targets: this,
          scaleX: this.def.scale * 1.2,
          scaleY: this.def.scale * 1.2,
          duration: 180,
          yoyo: true,
          repeat: -1,
          ease: 'Sine.easeInOut',
        });
      }
      return false;
    }

    this.hp -= amount;

    if (hasFreeze && !this.frozen) {
      this.frozen = true;
      this.frozenTimer = 1000;
      this.setTint(0x88ccff);
    }

    if (hasBurn && !this.burning) {
      this.burning = true;
      this.burnTimer = 2000;
      this.burnDamageTimer = 500;
      this.setTint(0xff4400);
    }

    if (!hasFreeze && !hasBurn) this.clearTint();

    // Flash white on hit
    this.setTintFill(0xffffff);
    this.scene.time.delayedCall(50, () => {
      if (this.active) {
        if (this.frozen) this.setTint(0x88ccff);
        else if (this.burning) this.setTint(0xff4400);
        else this.clearTint();
      }
    });

    return this.hp <= 0;
  }

  deactivate(): void {
    this.setActive(false);
    this.setVisible(false);
    this.setVelocity(0, 0);
    if (this.body) (this.body as Phaser.Physics.Arcade.Body).enable = false;
  }
}
