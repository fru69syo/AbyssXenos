import { PARTS, PartDef, PartRarity, PART_GACHA_WEIGHTS, PART_DUPLICATE_COINS } from '../data/parts';
import { PlayerData } from './PlayerData';

export interface GachaResult {
  part: PartDef;
  isNew: boolean;
  isDuplicate: boolean;
  coinRefund: number;
}

const PITY_THRESHOLD = 50;
const GACHA_COST_GEMS = 100;

export class GachaManager {
  pull(playerData: PlayerData): GachaResult | null {
    if (!playerData.spendGems(GACHA_COST_GEMS)) return null;

    playerData.data.gachaPity++;
    const isPity = playerData.data.gachaPity >= PITY_THRESHOLD;

    const rarity = isPity ? this.guaranteedSRPlus() : this.rollRarity();
    const part = this.pickPartOfRarity(rarity);

    if (isPity) {
      playerData.data.gachaPity = 0;
    }

    const isNew = playerData.addPart(part.id);
    const coinRefund = isNew ? 0 : PART_DUPLICATE_COINS[part.rarity];
    if (!isNew) {
      playerData.addCoins(coinRefund);
    }

    playerData.save();

    return { part, isNew, isDuplicate: !isNew, coinRefund };
  }

  private rollRarity(): PartRarity {
    const total = Object.values(PART_GACHA_WEIGHTS).reduce((a, b) => a + b, 0);
    const roll = Math.random() * total;
    let sum = 0;
    for (const [rarity, weight] of Object.entries(PART_GACHA_WEIGHTS) as [PartRarity, number][]) {
      sum += weight;
      if (roll < sum) return rarity;
    }
    return 'n';
  }

  private guaranteedSRPlus(): PartRarity {
    const roll = Math.random();
    if (roll < 0.05) return 'ur';
    if (roll < 0.25) return 'ssr';
    return 'sr';
  }

  private pickPartOfRarity(rarity: PartRarity): PartDef {
    const pool = PARTS.filter(p => p.rarity === rarity);
    if (pool.length === 0) {
      // フォールバック: 該当レアリティがなければNを返す
      const fallback = PARTS.filter(p => p.rarity === 'n');
      return fallback[Math.floor(Math.random() * fallback.length)];
    }
    return pool[Math.floor(Math.random() * pool.length)];
  }

  getCost(): number { return GACHA_COST_GEMS; }
  getPityCount(playerData: PlayerData): number { return playerData.data.gachaPity; }
  getPityThreshold(): number { return PITY_THRESHOLD; }
}
