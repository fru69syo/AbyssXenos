import { PART_LINES, PartLineDef, PartRarity, PART_GACHA_WEIGHTS } from '../data/parts';
import { PlayerData } from './PlayerData';

export interface GachaResult {
  line: PartLineDef;
  rarity: PartRarity;
  newCount: number; // 取得後の所持数
}

const PITY_THRESHOLD = 50;
const GACHA_COST_GEMS = 100;

export class GachaManager {
  pull(playerData: PlayerData): GachaResult | null {
    if (!playerData.spendGems(GACHA_COST_GEMS)) return null;

    playerData.data.gachaPity++;
    const isPity = playerData.data.gachaPity >= PITY_THRESHOLD;

    const rarity = isPity ? 'sr' as PartRarity : this.rollRarity();
    const line = this.pickRandomLine();

    if (isPity) {
      playerData.data.gachaPity = 0;
    }

    playerData.addPartCopy(line.id, rarity);
    const newCount = playerData.getPartCount(line.id, rarity);

    playerData.save();

    return { line, rarity, newCount };
  }

  private rollRarity(): PartRarity {
    const entries = Object.entries(PART_GACHA_WEIGHTS) as [PartRarity, number][];
    const total = entries.reduce((a, [, w]) => a + w, 0);
    const roll = Math.random() * total;
    let sum = 0;
    for (const [rarity, weight] of entries) {
      sum += weight;
      if (roll < sum) return rarity;
    }
    return 'n';
  }

  /** 全パーツラインからランダムに1つ選ぶ */
  private pickRandomLine(): PartLineDef {
    return PART_LINES[Math.floor(Math.random() * PART_LINES.length)];
  }

  getCost(): number { return GACHA_COST_GEMS; }
  getPityCount(playerData: PlayerData): number { return playerData.data.gachaPity; }
  getPityThreshold(): number { return PITY_THRESHOLD; }
}
