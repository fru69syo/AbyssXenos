/**
 * パーツの能力 ID を RunState の静的ステータスに反映する。
 *
 * parts.ts の `ability` (N/R基本能力) と SR/UR/LR の `bonusAbilities` は
 * これまで収集されていたが、実ゲームロジック側で一切消費されていなかった。
 * (= SR以上を装備してもパーツ固有スキルが機能していなかった)
 *
 * 本モジュールは各能力 ID を RunState のフィールド (atk/defense/shield/
 * hasPierce 等) に best-effort でマップし、静的なバフを適用する。
 *
 * 動的ランタイムフックが必要な能力 (被弾時反射弾/爆発、テレポート、残像等)
 * は厳密には同一ではなく近似バフに置換している。完全再現は各システム側の
 * 改修が必要なため、本ファイルでは "何かしら効果が発生する" ことを担保する。
 */
import { RunState } from '../managers/RunState';
import { BonusAbility } from './parts';

export function applyPartAbilities(
  r: RunState,
  abilityIds: string[],
  bonusAbilities: BonusAbility[],
): void {
  for (const id of abilityIds) {
    if (id) applyAbilityId(r, id);
  }
  for (const ab of bonusAbilities) {
    if (ab && ab.id) applyAbilityId(r, ab.id);
  }
}

function addFireRate(r: RunState, delta: number): void {
  r.fireRateReduction = Math.min(0.8, r.fireRateReduction + delta);
}

function applyAbilityId(r: RunState, id: string): void {
  switch (id) {
    // ===== Core: Guard / 防御 =====
    case 'def_1': r.defense += 1; break;
    case 'def_reflect': r.hasThorns = true; break;
    case 'def_absorb': r.hasLifesteal = true; break;
    case 'def_perfect': r.hasDamageCap = true; break;

    // ===== Core: Auto Shield =====
    case 'auto_shield': r.autoShieldPerWave = true; break;
    case 'shield_60': r.shield += 1; break;
    case 'shield_double': r.shield += 2; break;
    case 'shield_regen':
      r.hpRegenTimer = r.hpRegenTimer > 0 ? Math.min(r.hpRegenTimer, 10) : 10; break;

    // ===== Core: Fortress =====
    case 'fortress': r.defense += 2; r.regenPerWave += 1; break;
    case 'fortress_hp2': r.regenPerWave += 1; break;
    case 'fortress_def3': r.defense += 3; break;
    case 'fortress_iron': r.hasDamageCap = true; break;

    // ===== Core: Immortal / LastStand =====
    case 'immortal': r.hasLastStand = true; break;
    case 'immortal_inv': r.hasLastStand = true; break;
    case 'immortal_2': r.hasLastStand = true; r.maxHp += 2; r.hp += 2; break;
    case 'immortal_rage': r.atk += 1; break;

    // ===== Core: Regen =====
    case 'regen': r.regenPerWave += 1; break;
    case 'regen_2': r.regenPerWave += 1; break;
    case 'regen_passive':
      r.hpRegenTimer = r.hpRegenTimer > 0 ? r.hpRegenTimer : 15; break;
    case 'regen_overheal': r.overMaxHp = true; r.maxHp += 5; break;

    // ===== Core: Lightweight =====
    case 'lightweight': break; // 基本ステのみ: 速度はすでに加算済み
    case 'dodge_10': r.dodgeChance += 0.1; break;
    case 'low_hp_speed': r.speedMultiplier += 0.1; break;
    case 'afterimage':
      r.dodgeChance = Math.max(r.dodgeChance, 0.3); r.hasThorns = true; break;

    // ===== Core: Nova =====
    case 'nova_explode': r.hasExplosion = true; break;
    case 'nova_range': r.hasExplosion = true; break;
    case 'nova_stun': r.hasFreeze = true; break;
    case 'nova_chain': r.hasExplosion = true; r.hasChainDamage = true; break;

    // ===== Engine: Phantom / Dash =====
    case 'invincible_dash': r.hasInvincibleDash = true; break;
    case 'dash_extend': r.hasInvincibleDash = true; r.dodgeChance += 0.1; break;
    case 'dash_attack': r.hasInvincibleDash = true; r.hasThorns = true; break;
    case 'phase_shift': r.dodgeChance += 0.2; break;

    // ===== Engine: Warp =====
    case 'warp': break; // 動的処理、近似なし
    case 'warp_blast': r.hasExplosion = true; break;
    case 'warp_inv': break;
    case 'warp_timestop': r.hasTimeSlow = true; break;

    // ===== Engine: Speed-Atk =====
    case 'speed_atk': r.atk += 1; break;
    case 'speed_atk4': r.atk += 1; break;
    case 'speed_crit': r.critChance += 0.2; break;
    case 'speed_max_atk': r.atk += 3; break;

    // ===== Engine: Stealth =====
    case 'stealth': r.dodgeChance += 0.1; break;
    case 'stealth_fast': r.dodgeChance += 0.05; break;
    case 'stealth_crit': r.critChance += 0.2; break;
    case 'stealth_perm': r.dodgeChance += 0.2; break;

    // ===== Engine: Burst =====
    case 'burst_dodge': r.dodgeChance += 0.05; r.speedMultiplier += 0.05; break;
    case 'burst_3x': r.speedMultiplier += 0.05; break;
    case 'burst_atk': r.atk += 1; break;
    case 'burst_chain': r.speedMultiplier += 0.1; break;

    // ===== Engine: Gravity =====
    case 'gravity_pull': r.magnetRange += 30; break;
    case 'gravity_wide': r.magnetRange += 40; break;
    case 'gravity_dmg': r.hasBulletAbsorb = true; break;
    case 'singularity':
      r.magnetRange = Math.max(r.magnetRange, 9999); r.hasBulletAbsorb = true; break;

    // ===== Engine: misc =====
    case 'kill_speed': r.speedMultiplier += 0.05; break;
    case 'momentum_dmg': r.hasThorns = true; break;
    case 'speed_aura':
      r.hasThorns = true;
      r.thornsDamageMul = Math.max(r.thornsDamageMul, 0.5); break;
    case 'accel_buff': r.speedMultiplier += 0.05; break;
    case 'speed_break': r.speedMultiplier += 0.2; break;
    case 'sonic_boom': r.hasExplosion = true; break;

    // ===== Wing: coin / exp / fortune =====
    case 'coin_25': r.coinMultiplier += 0.25; break;
    case 'coin_40': r.coinMultiplier += 0.40; break;
    case 'coin_rare': r.coinMultiplier += 0.15; break;
    case 'coin_atk': r.coinMultiplier += 0.10; break;
    case 'exp_30': r.expMultiplier += 0.3; break;
    case 'exp_50': r.expMultiplier += 0.5; break;
    case 'exp_10': r.expMultiplier += 0.1; break;
    case 'bonus_lv': r.pendingLevelUps += 1; break;
    case 'skill_choice': r.skillChoiceBonus += 1; break;
    case 'fortune':
      r.coinMultiplier += 0.5; r.expMultiplier += 0.3; r.magnetRange += 50; break;
    case 'fortune_gem': r.dropLuck += 1; break;
    case 'fortune_ticket': r.coinMultiplier += 0.1; break;
    case 'fortune_crit': r.critChance += 0.25; break;

    // ===== Wing: drop / magnet =====
    case 'drop_2x': r.dropLuck += 2; break;
    case 'drop_3x': r.dropLuck += 3; break;
    case 'drop_rare': r.dropLuck += 1; break;
    case 'drop_boss': r.dropLuck += 1; break;
    case 'drop_15': r.dropLuck += 1; break;
    case 'drop_25': r.dropLuck += 2; break;
    case 'drop_quality': r.dropLuck += 1; break;
    case 'drop_legend': r.dropLuck += 2; break;
    case 'drop_double': r.dropLuck += 2; break;
    case 'pickup_range': r.magnetRange += 50; break;
    case 'magnet_up': r.magnetRange += 80; break;
    case 'magnet_120': r.magnetRange += 120; break;
    case 'magnet_auto': r.magnetRange = Math.max(r.magnetRange, 9999); break;
    case 'magnet_heal': r.magnetRange += 30; break;

    // ===== Wing: shield / assault =====
    case 'wing_shield': r.shield += 1; break;
    case 'wing_shield2': r.shield += 2; break;
    case 'shield_regen_w': r.autoShieldPerWave = true; break;
    case 'shield_reflect': r.hasThorns = true; break;
    case 'assault': r.atk += 1; break;
    case 'assault_rate': r.atk += 1; break;
    case 'assault_dur': r.atk += 1; break;
    case 'assault_chain': r.atk += 2; break;

    // ===== Main Weapon =====
    case 'dmg_up_10': r.atk += 1; break;
    case 'double_dmg': r.critChance += 0.1; r.critDamage += 0.2; break;
    case 'tenth_shot': r.atk += 1; break;
    case 'rapid_boost': addFireRate(r, 0.15); break;
    case 'rapid_ramp': addFireRate(r, 0.10); break;
    case 'bullet_hell': addFireRate(r, 0.30); r.shotPattern = 'triple'; break;
    case 'double_shot':
      if (r.shotPattern === 'single') r.shotPattern = 'double'; break;
    case 'triple_shot': r.shotPattern = 'triple'; break;
    case 'penta_shot': r.shotPattern = 'triple'; r.hasSplitShot = true; break;
    case 'omni_shot':
      r.shotPattern = 'triple'; r.hasSplitShot = true; r.hasRearShot = true; break;
    case 'pierce': r.hasPierce = true; break;
    case 'pierce_trail': r.hasPierce = true; break;
    case 'pierce_wide': r.hasPierce = true; r.bulletSizeMultiplier *= 1.25; break;
    case 'pierce_infinite': r.hasPierce = true; r.atk += 1; break;
    case 'homing_pierce': r.hasHoming = true; r.hasPierce = true; break;
    case 'homing_strong': r.hasHoming = true; break;
    case 'multi_lock': r.hasHoming = true; break;
    case 'plasma_field': r.hasExplosion = true; break;
    case 'shotgun_spread': r.shotPattern = 'triple'; break;
    case 'shotgun_5': r.shotPattern = 'triple'; r.hasSplitShot = true; break;
    case 'shotgun_knock': r.hasFreeze = true; break;
    case 'shotgun_kill': r.critChance += 0.1; r.critDamage += 0.5; break;
    case 'sniper_crit': r.critChance += 0.3; r.atk += 1; break;
    case 'crit_45': r.critChance += 0.15; break;
    case 'crit_dmg_2x': r.critDamage += 0.5; break;
    case 'oneshot': r.critChance += 0.05; r.critDamage += 1.0; break;
    case 'chain_lightning': r.hasChainDamage = true; break;
    case 'chain_3': r.hasChainDamage = true; break;
    case 'chain_stun': r.hasChainDamage = true; r.hasFreeze = true; break;
    case 'chain_storm': r.hasChainDamage = true; r.hasSlowField = true; break;

    // ===== Sub Weapon =====
    case 'auto_missile': r.hasBomb = true; break;
    case 'missile_2': r.hasBomb = true; break;
    case 'missile_homing': r.hasBomb = true; r.hasHoming = true; break;
    case 'missile_barrage': r.hasBomb = true; r.atk += 1; break;
    case 'drone_1': r.drones += 1; break;
    case 'drone_2': r.drones += 1; break;
    case 'drone_rapid': addFireRate(r, 0.10); break;
    case 'drone_ability': r.drones += 1; break;
    case 'shield_2': r.shield += 2; break;
    case 'shield_3': r.shield += 3; break;
    case 'shield_recharge': r.autoShieldPerWave = true; break;
    case 'shield_explode': r.hasExplosion = true; break;
    case 'satellite': r.drones += 2; r.hasRearShot = true; break;
    case 'sat_3': r.drones += 3; r.hasRearShot = true; break;
    case 'sat_360': r.drones += 2; r.droneAllDirection = true; break;
    case 'sat_beam': r.drones += 2; r.hasPierce = true; break;
    case 'auto_mine': r.hasBomb = true; break;
    case 'mine_2': r.hasBomb = true; break;
    case 'mine_homing': r.hasBomb = true; r.hasHoming = true; break;
    case 'mine_field': r.hasBomb = true; r.hasExplosion = true; break;
    case 'auto_repair':
      r.hpRegenTimer = r.hpRegenTimer > 0 ? Math.min(r.hpRegenTimer, 20) : 20; break;
    case 'repair_15': r.hpRegenTimer = 15; break;
    case 'repair_2': r.regenPerWave += 1; break;
    case 'repair_overheal': r.overMaxHp = true; r.maxHp += 3; break;
    case 'side_beam': r.hasSplitShot = true; r.hasPierce = true; break;
    case 'beam_dmg': r.atk += 1; break;
    case 'beam_4dir': r.hasSplitShot = true; r.hasRearShot = true; break;
    case 'beam_rotate': r.hasOrbital = true; break;
    case 'sub_atk': r.atk += 1; break;
    case 'sub_random': r.hasExplosion = true; break;
    case 'sub_copy': r.hasRearShot = true; break;

    // ===== Chip =====
    case 'all_stat_1':
      r.atk += 1; r.maxHp += 1; r.hp += 1; r.speedMultiplier += 0.05; break;
    case 'skill_cd': r.skillChoiceBonus += 1; break;
    case 'extra_skill': r.skillChoiceBonus += 1; break;
    case 'crit_15': r.critChance += 0.15; break;
    case 'crit_25': r.critChance += 0.25; break;
    case 'crit_dmg': r.critDamage += 0.5; break;
    case 'crit_chain': r.hasChainDamage = true; r.critChance += 0.1; break;
    case 'vampire': r.hasLifesteal = true; break;
    case 'vampire_8': r.hasLifesteal = true; break;
    case 'vampire_12': r.hasLifesteal = true; r.regenPerWave += 1; break;
    case 'vampire_aura': r.hasLifesteal = true; r.hasThorns = true; break;
    case 'overclock':
      r.atk += 1; r.speedMultiplier += 0.05; r.expMultiplier += 0.1; break;
    case 'oc_boost': r.atk += 1; r.speedMultiplier += 0.05; break;
    case 'oc_burst': r.atk += 2; break;
    case 'oc_perm':
      r.atk += 2; r.speedMultiplier += 0.15; addFireRate(r, 0.10); break;
    case 'rage': r.atk += 1; break;
    case 'rage_5': r.atk += 2; break;
    case 'rage_70': r.atk += 1; break;
    case 'berserk': r.atk += 5; break;
    case 'combo': r.atk += 1; break;
    case 'combo_fast': r.atk += 1; break;
    case 'combo_keep': r.atk += 1; break;
    case 'combo_inf': r.atk += 2; break;
    case 'start_shield': r.shield += 1; break;
    case 'start_shield2': r.shield += 2; break;
    case 'wave_shield': r.autoShieldPerWave = true; break;
    case 'shield_to_atk': r.atk += 1; r.shield += 1; break;

    // ===== ラン開始時ボーナス能力 (minor) =====
    case 'minor_shield': r.shield += 1; break;
    case 'passive_def': r.defense += 1; break;
    case 'auto_revive': r.hasLastStand = true; break;

    default:
      // 未知の ID は無視 (将来追加する能力の placeholder になっても安全)
      break;
  }
}
