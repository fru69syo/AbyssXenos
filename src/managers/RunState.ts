import { SkillDef, SKILLS } from '../data/skills';

export interface ActiveSkill {
  skill: SkillDef;
  stacks: number;
}

export interface EvolutionResult {
  evolvedSkill: SkillDef;
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
  exp: number;
  level: number;
  expToNextLevel: number;
  pendingLevelUps: number;

  // New fields for expanded skills
  critChance: number;
  critDamage: number;
  dodgeChance: number;
  hasThorns: boolean;
  thornsHoming: boolean;
  hasBarrier: boolean;
  hasLifesteal: boolean;
  hasExplosion: boolean;
  hasChainDamage: boolean;
  hasMultiBounce: boolean;
  hasSlowField: boolean;
  hasOrbital: boolean;
  hasTimeSlow: boolean;
  hasBomb: boolean;
  hasClone: boolean;
  hasLastStand: boolean;
  lastStandUsed: boolean;
  hasDamageCap: boolean;
  hasAbsorb: boolean;
  hasOvercharge: boolean;
  hasPowerShot: boolean;
  hasElementalBurst: boolean;
  hasGemFinder: boolean;
  expMultiplier: number;
  dropLuck: number;
  speedMultiplier: number;
  rapidFireStacks: number;
  hpRegenTimer: number;
  skillChoiceBonus: number;
  hasBulletAbsorb: boolean;
  hasGemConversion: boolean;
  overMaxHp: boolean;
  autoShieldPerWave: boolean;
  fullHealPerWave: boolean;
  droneAllDirection: boolean;
  rapidFireActive: boolean;
  fireRateReduction: number;
  thornsDamageMul: number;

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
    this.exp = 0;
    this.level = 1;
    this.expToNextLevel = this.calcExpForLevel(2);
    this.pendingLevelUps = 0;

    // New fields
    this.critChance = 0;
    this.critDamage = 1.5;
    this.dodgeChance = 0;
    this.hasThorns = false;
    this.thornsHoming = false;
    this.hasBarrier = false;
    this.hasLifesteal = false;
    this.hasExplosion = false;
    this.hasChainDamage = false;
    this.hasMultiBounce = false;
    this.hasSlowField = false;
    this.hasOrbital = false;
    this.hasTimeSlow = false;
    this.hasBomb = false;
    this.hasClone = false;
    this.hasLastStand = false;
    this.lastStandUsed = false;
    this.hasDamageCap = false;
    this.hasAbsorb = false;
    this.hasOvercharge = false;
    this.hasPowerShot = false;
    this.hasElementalBurst = false;
    this.hasGemFinder = false;
    this.expMultiplier = 1;
    this.dropLuck = 0;
    this.speedMultiplier = 1;
    this.rapidFireStacks = 0;
    this.hpRegenTimer = 0;
    this.skillChoiceBonus = 0;
    this.hasBulletAbsorb = false;
    this.hasGemConversion = false;
    this.overMaxHp = false;
    this.autoShieldPerWave = false;
    this.fullHealPerWave = false;
    this.droneAllDirection = false;
    this.rapidFireActive = false;
    this.fireRateReduction = 0;
    this.thornsDamageMul = 0.5;
  }

  /** Returns number of level-ups triggered. */
  addExp(amount: number): number {
    const adjusted = Math.floor(amount * this.expMultiplier);
    this.exp += adjusted;
    let levelUps = 0;
    while (this.exp >= this.expToNextLevel) {
      this.exp -= this.expToNextLevel;
      this.level++;
      levelUps++;
      this.expToNextLevel = this.calcExpForLevel(this.level + 1);
    }
    this.pendingLevelUps += levelUps;
    return levelUps;
  }

  private calcExpForLevel(lv: number): number {
    return 30 + (lv - 2) * 20; // Lv2:30, Lv3:50, Lv4:70, ...
  }

  applySkill(skill: SkillDef): EvolutionResult | null {
    const existing = this.skills.find(s => s.skill.id === skill.id);
    if (existing && skill.stackable && existing.stacks < skill.maxStacks) {
      existing.stacks++;
    } else if (!existing) {
      this.skills.push({ skill, stacks: 1 });
    }

    // Apply base effect
    this.applySkillEffect(skill.id);

    // Check evolution
    if (skill.evolvesTo && skill.evolveStacks) {
      const active = this.skills.find(s => s.skill.id === skill.id);
      if (active && active.stacks >= skill.evolveStacks) {
        const evolvedSkill = SKILLS.find(s => s.id === skill.evolvesTo);
        if (evolvedSkill) {
          // Remove base skill, add evolved skill
          this.skills = this.skills.filter(s => s.skill.id !== skill.id);
          this.skills.push({ skill: evolvedSkill, stacks: 1 });
          // Apply evolved effect (additional bonuses on top of base stacks)
          this.applySkillEffect(evolvedSkill.id);
          return { evolvedSkill };
        }
      }
    }

    return null;
  }

  private applySkillEffect(skillId: string): void {
    switch (skillId) {
      // ===== Base Attack =====
      case 'atk_up': this.atk += 1; break;
      case 'fire_rate_up': this.fireRateReduction = Math.min(0.8, this.fireRateReduction + 0.10); break;
      case 'bullet_speed_up': this.bulletSpeed *= 1.2; break;
      case 'bullet_size_up': this.bulletSizeMultiplier *= 1.25; break;
      case 'crit_chance': this.critChance += 0.1; break;
      case 'rapid_fire': this.rapidFireStacks += 1; break;
      case 'double_shot': this.shotPattern = 'double'; break;
      case 'triple_shot': this.shotPattern = 'triple'; break;
      case 'rear_shot': this.hasRearShot = true; break;
      case 'pierce': this.hasPierce = true; break;
      case 'explosion_shot': this.hasExplosion = true; break;
      case 'chain_damage': this.hasChainDamage = true; break;
      case 'power_shot': this.hasPowerShot = true; break;
      case 'multi_bounce': this.hasMultiBounce = true; break;
      case 'homing': this.hasHoming = true; break;
      case 'split_shot': this.hasSplitShot = true; break;
      case 'elemental_burst': this.hasElementalBurst = true; this.hasFreeze = true; this.hasBurn = true; break;
      case 'overcharge': this.hasOvercharge = true; break;

      // ===== Base Defense =====
      case 'hp_up': this.maxHp += 1; this.hp += 1; break;
      case 'heal': this.hp = Math.min(this.hp + 1, this.maxHp); break;
      case 'def_up': this.defense += 1; break;
      case 'dodge': this.dodgeChance += 0.15; break;
      case 'thorns': this.hasThorns = true; break;
      case 'hp_regen_time': this.hpRegenTimer = this.hpRegenTimer > 0 ? this.hpRegenTimer - 3 : 15; break;
      case 'regen': this.regenPerWave += 1; break;
      case 'shield': this.shield += 1; break;
      case 'barrier': this.hasBarrier = true; break;
      case 'lifesteal': this.hasLifesteal = true; break;
      case 'last_stand': this.hasLastStand = true; break;
      case 'invincible_dash': this.hasInvincibleDash = true; break;
      case 'damage_cap': this.hasDamageCap = true; break;
      case 'absorb': this.hasAbsorb = true; break;

      // ===== Base Special =====
      case 'magnet': this.magnetRange += 40; break;
      case 'coin_bonus': this.coinMultiplier += 0.25; break;
      case 'exp_bonus': this.expMultiplier += 0.2; break;
      case 'speed_up': this.speedMultiplier += 0.15; break;
      case 'item_luck': this.dropLuck += 1; break;
      case 'freeze_shot': this.hasFreeze = true; break;
      case 'burn_shot': this.hasBurn = true; break;
      case 'gem_finder': this.hasGemFinder = true; break;
      case 'slow_field': this.hasSlowField = true; break;
      case 'orbital': this.hasOrbital = true; break;
      case 'bomb': this.hasBomb = true; break;
      case 'side_drone': this.drones += 1; break;
      case 'time_slow': this.hasTimeSlow = true; break;
      case 'clone': this.hasClone = true; break;

      // ===== Legendary (進化ボーナス - base stacks already applied) =====
      case 'atk_awakening': this.atk += 2; this.critChance += 0.1; break;
      case 'machine_gun': this.fireRateReduction = Math.min(0.8, this.fireRateReduction + 0.30); break;
      case 'light_speed_bullet': this.bulletSpeed *= 2; this.hasPierce = true; break;
      case 'giant_bullet': this.bulletSizeMultiplier *= 1.5; break;
      case 'critical_master':
        this.critChance = Math.max(this.critChance, 0.5);
        this.critDamage = Math.max(this.critDamage, 2.0);
        break;
      case 'full_auto': this.fireRateReduction = Math.min(0.8, this.fireRateReduction + 0.20); break;

      case 'life_spring': this.maxHp += 2; this.hp = this.maxHp; break;
      case 'iron_wall': this.hasThorns = true; break;
      case 'auto_shield': this.autoShieldPerWave = true; break;
      case 'immortal': this.fullHealPerWave = true; break;
      case 'afterimage': this.dodgeChance = Math.max(this.dodgeChance, 0.3); this.hasThorns = true; break;
      case 'retaliation': this.hasThorns = true; this.thornsHoming = true; this.thornsDamageMul = 1.0; break;
      case 'regen_blessing': this.hpRegenTimer = 5; this.overMaxHp = true; break;

      case 'black_hole': this.magnetRange = Math.max(this.magnetRange, 9999); this.hasBulletAbsorb = true; break;
      case 'alchemy': this.coinMultiplier += 1.0; this.hasGemConversion = true; break;
      case 'genius': this.expMultiplier += 1.0; this.skillChoiceBonus = 1; break;
      case 'gale': this.speedMultiplier += 0.5; this.hasInvincibleDash = true; break;
      case 'lucky_star': this.dropLuck = Math.max(this.dropLuck, 5) * 2; break;
      case 'drone_army': this.drones = Math.max(this.drones, 4); this.droneAllDirection = true; break;
    }
  }

  onWaveComplete(): void {
    if (this.regenPerWave > 0) {
      this.hp = Math.min(this.hp + this.regenPerWave, this.maxHp);
    }
    if (this.autoShieldPerWave) {
      this.shield = 3;
    }
    if (this.fullHealPerWave) {
      this.hp = this.maxHp;
    }
  }
}
