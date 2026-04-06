import { loadData, saveData } from '../utils/storage';

export interface PlayerSave {
  coins: number;
  gems: number;
  ownedShips: string[];
  selectedShip: string;
  upgradeLevels: Record<string, number>;
  highestStage: number;
  totalRuns: number;
  gachaPity: number;
}

const DEFAULT_SAVE: PlayerSave = {
  coins: 0,
  gems: 0,
  ownedShips: ['abyss_scout'],
  selectedShip: 'abyss_scout',
  upgradeLevels: {},
  highestStage: 0,
  totalRuns: 0,
  gachaPity: 0,
};

export class PlayerData {
  data: PlayerSave;

  constructor() {
    this.data = loadData<PlayerSave>('playerData') ?? { ...DEFAULT_SAVE };
  }

  save(): void {
    saveData('playerData', this.data);
  }

  addCoins(amount: number): void {
    this.data.coins += amount;
    this.save();
  }

  spendCoins(amount: number): boolean {
    if (this.data.coins < amount) return false;
    this.data.coins -= amount;
    this.save();
    return true;
  }

  addGems(amount: number): void {
    this.data.gems += amount;
    this.save();
  }

  spendGems(amount: number): boolean {
    if (this.data.gems < amount) return false;
    this.data.gems -= amount;
    this.save();
    return true;
  }

  getUpgradeLevel(upgradeId: string): number {
    return this.data.upgradeLevels[upgradeId] ?? 0;
  }

  setUpgradeLevel(upgradeId: string, level: number): void {
    this.data.upgradeLevels[upgradeId] = level;
    this.save();
  }

  addShip(shipId: string): boolean {
    if (this.data.ownedShips.includes(shipId)) return false;
    this.data.ownedShips.push(shipId);
    this.save();
    return true;
  }

  recordRun(stageReached: number): void {
    this.data.totalRuns++;
    if (stageReached > this.data.highestStage) {
      this.data.highestStage = stageReached;
    }
    this.save();
  }
}
