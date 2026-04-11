import { loadData, saveData } from '../utils/storage';
import { PartSlot, PRESETS } from '../data/parts';

export interface PlayerSave {
  coins: number;
  gems: number;
  ownedShips: string[];
  selectedShip: string;
  ownedParts: string[];
  equippedParts: Record<string, string>;
  upgradeLevels: Record<string, number>;
  highestStage: number;
  totalRuns: number;
  gachaPity: number;
  gachaTickets: number;
}

const DEFAULT_PRESET = PRESETS[0]; // アビス・スカウト

const DEFAULT_SAVE: PlayerSave = {
  coins: 0,
  gems: 0,
  ownedShips: ['abyss_scout'],
  selectedShip: 'abyss_scout',
  ownedParts: Object.values(DEFAULT_PRESET.parts),
  equippedParts: { ...DEFAULT_PRESET.parts },
  upgradeLevels: {},
  highestStage: 0,
  totalRuns: 0,
  gachaPity: 0,
  gachaTickets: 0,
};

export class PlayerData {
  data: PlayerSave;

  constructor() {
    const loaded = loadData<PlayerSave>('playerData');
    this.data = loaded ? { ...DEFAULT_SAVE, ...loaded } : { ...DEFAULT_SAVE };
    // 旧セーブからの移行: ownedParts/equippedParts がなければ初期プリセットを付与
    if (!this.data.ownedParts || this.data.ownedParts.length === 0) {
      this.data.ownedParts = [...Object.values(DEFAULT_PRESET.parts)];
      this.data.equippedParts = { ...DEFAULT_PRESET.parts };
      this.save();
    }
  }

  addGachaTicket(amount: number = 1): void {
    this.data.gachaTickets += amount;
    this.save();
  }

  spendGachaTicket(): boolean {
    if (this.data.gachaTickets <= 0) return false;
    this.data.gachaTickets -= 1;
    this.save();
    return true;
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

  addPart(partId: string): boolean {
    if (this.data.ownedParts.includes(partId)) return false;
    this.data.ownedParts.push(partId);
    this.save();
    return true;
  }

  equipPart(slot: PartSlot, partId: string): void {
    this.data.equippedParts[slot] = partId;
    this.save();
  }

  getEquippedParts(): Record<PartSlot, string> {
    return this.data.equippedParts as Record<PartSlot, string>;
  }

  recordRun(stageReached: number): void {
    this.data.totalRuns++;
    if (stageReached > this.data.highestStage) {
      this.data.highestStage = stageReached;
    }
    this.save();
  }
}
