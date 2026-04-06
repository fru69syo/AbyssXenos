import { SkillDef } from '../data/skills';

export interface ActiveSkill {
  skill: SkillDef;
  stacks: number;
}

export class RunState {
  hp: number;
  maxHp: number;
  atk: number;
  speed: number;
  fireRate: number;
  bulletSpeed: number;
  defense: number;
  shield: number;
  coins: number;
  currentStage: number;
  currentWave: number;
  skills: ActiveSkill[];
  coinMultiplier: number;
  magnetRange: number;
  hasPierce: boolean;
  hasHoming: boolean;
  hasSplitShot: boolean;
  hasFreeze: boolean;
  hasBurn: boolean;
  hasRearShot: boolean;
  hasInvincibleDash: boolean;
  shotPattern: 'single' | 'double' | 'triple';
  drones: number;
  regenPerWave: number;
  bulletSizeMultiplier: number;

  constructor(baseHp: number, baseAtk: number, baseSpeed: number, baseFireRate: number) {
    this.hp = baseHp;
    this.maxHp = baseHp;
    this.atk = baseAtk;
    this.speed = baseSpeed;
    this.fireRate = baseFireRate;
    this.bulletSpeed = 600;
    this.defense = 0;
    this.shield = 0;
    this.coins = 0;
    this.currentStage = 0;
    this.currentWave = 0;
    this.skills = [];
    this.coinMultiplier = 1;
    this.magnetRange = 50;
    this.hasPierce = false;
    this.hasHoming = false;
    this.hasSplitShot = false;
    this.hasFreeze = false;
    this.hasBurn = false;
    this.hasRearShot = false;
    this.hasInvincibleDash = false;
    this.shotPattern = 'single';
    this.drones = 0;
    this.regenPerWave = 0;
    this.bulletSizeMultiplier = 1;
  }

  applySkill(skill: SkillDef): void {
    const existing = this.skills.find(s => s.skill.id === skill.id);
    if (existing && skill.stackable && existing.stacks < skill.maxStacks) {
      existing.stacks++;
    } else if (!existing) {
      this.skills.push({ skill, stacks: 1 });
    }

    switch (skill.id) {
      case 'atk_up': this.atk += 1; break;
      case 'fire_rate_up': this.fireRate = Math.max(50, this.fireRate * 0.85); break;
      case 'bullet_speed_up': this.bulletSpeed *= 1.2; break;
      case 'bullet_size_up': this.bulletSizeMultiplier *= 1.25; break;
      case 'double_shot': this.shotPattern = 'double'; break;
      case 'triple_shot': this.shotPattern = 'triple'; break;
      case 'rear_shot': this.hasRearShot = true; break;
      case 'pierce': this.hasPierce = true; break;
      case 'homing': this.hasHoming = true; break;
      case 'split_shot': this.hasSplitShot = true; break;
      case 'hp_up': this.maxHp += 1; this.hp += 1; break;
      case 'heal': this.hp = Math.min(this.hp + 1, this.maxHp); break;
      case 'def_up': this.defense += 1; break;
      case 'regen': this.regenPerWave += 1; break;
      case 'shield': this.shield += 1; break;
      case 'invincible_dash': this.hasInvincibleDash = true; break;
      case 'magnet': this.magnetRange += 40; break;
      case 'coin_bonus': this.coinMultiplier += 0.25; break;
      case 'freeze_shot': this.hasFreeze = true; break;
      case 'burn_shot': this.hasBurn = true; break;
      case 'side_drone': this.drones += 1; break;
    }
  }

  onWaveComplete(): void {
    if (this.regenPerWave > 0) {
      this.hp = Math.min(this.hp + this.regenPerWave, this.maxHp);
    }
  }
}
