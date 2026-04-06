import { SHIPS, ShipDef, ShipRarity, GACHA_WEIGHTS } from '../data/ships';
import { PlayerData } from './PlayerData';

export interface GachaResult {
  ship: ShipDef;
  isNew: boolean;
  isDuplicate: boolean;
  coinRefund: number;
}

const PITY_THRESHOLD = 50;
const GACHA_COST_GEMS = 100;
const DUPLICATE_COIN_REFUND: Record<ShipRarity, number> = {
  n: 50,
  r: 200,
  sr: 1000,
  ssr: 5000,
};

export class GachaManager {
  pull(playerData: PlayerData): GachaResult | null {
    if (!playerData.spendGems(GACHA_COST_GEMS)) return null;

    playerData.data.gachaPity++;
    const isPity = playerData.data.gachaPity >= PITY_THRESHOLD;

    const rarity = isPity ? this.guaranteedSRPlus() : this.rollRarity();
    const ship = this.pickShipOfRarity(rarity);

    if (isPity) {
      playerData.data.gachaPity = 0;
    }

    const isNew = playerData.addShip(ship.id);
    const coinRefund = isNew ? 0 : DUPLICATE_COIN_REFUND[ship.rarity];
    if (!isNew) {
      playerData.addCoins(coinRefund);
    }

    playerData.save();

    return { ship, isNew, isDuplicate: !isNew, coinRefund };
  }

  private rollRarity(): ShipRarity {
    const total = Object.values(GACHA_WEIGHTS).reduce((a, b) => a + b, 0);
    const roll = Math.random() * total;
    let sum = 0;
    for (const [rarity, weight] of Object.entries(GACHA_WEIGHTS) as [ShipRarity, number][]) {
      sum += weight;
      if (roll < sum) return rarity;
    }
    return 'n';
  }

  private guaranteedSRPlus(): ShipRarity {
    return Math.random() < 0.2 ? 'ssr' : 'sr';
  }

  private pickShipOfRarity(rarity: ShipRarity): ShipDef {
    const pool = SHIPS.filter(s => s.rarity === rarity);
    return pool[Math.floor(Math.random() * pool.length)];
  }

  getCost(): number { return GACHA_COST_GEMS; }
  getPityCount(playerData: PlayerData): number { return playerData.data.gachaPity; }
  getPityThreshold(): number { return PITY_THRESHOLD; }
}
