import { loadData, saveData } from '../utils/storage';
import {
  PartSlot, PartRarity, PRESETS, PART_LINES,
  partKey, parsePartKey, NEXT_RARITY, EVOLUTION_COST,
} from '../data/parts';

export interface PlayerSave {
  coins: number;
  gems: number;
  ownedShips: string[];
  selectedShip: string;
  // 旧形式 (マイグレーション用、ランタイムでは使わない)
  ownedParts?: string[];
  // 新形式: パーツインベントリ (キー = "lineId:rarity", 値 = 所持数)
  partInventory: Record<string, number>;
  equippedParts: Record<string, string>;
  upgradeLevels: Record<string, number>;
  highestStage: number;
  totalRuns: number;
  gachaPity: number;
  gachaTickets: number;
  /** 初回クリアボーナスを受け取り済みのステージ番号 (1-based) */
  firstClearedStages: number[];
}

const DEFAULT_PRESET = PRESETS[0]; // アビス・スカウト

function buildDefaultInventory(): Record<string, number> {
  const inv: Record<string, number> = {};
  for (const key of Object.values(DEFAULT_PRESET.parts)) {
    inv[key] = 1;
  }
  return inv;
}

const DEFAULT_SAVE: PlayerSave = {
  coins: 0,
  gems: 0,
  ownedShips: ['abyss_scout'],
  selectedShip: 'abyss_scout',
  partInventory: buildDefaultInventory(),
  equippedParts: { ...DEFAULT_PRESET.parts },
  upgradeLevels: {},
  highestStage: 0,
  totalRuns: 0,
  gachaPity: 0,
  gachaTickets: 0,
  firstClearedStages: [],
};

export class PlayerData {
  data: PlayerSave;

  constructor() {
    const loaded = loadData<PlayerSave>('playerData');
    this.data = loaded ? { ...DEFAULT_SAVE, ...loaded } : { ...DEFAULT_SAVE };
    this.migrateIfNeeded();
  }

  /** 旧セーブからの移行 */
  private migrateIfNeeded(): void {
    let dirty = false;

    // 旧形式 ownedParts (string[]) → 新形式 partInventory
    const oldParts = (this.data as any).ownedParts;
    if (oldParts && Array.isArray(oldParts) && oldParts.length > 0) {
      if (!this.data.partInventory || Object.keys(this.data.partInventory).length === 0) {
        this.data.partInventory = {};
        for (const pid of oldParts) {
          const key = pid.includes(':') ? pid : `${pid}:n`;
          this.data.partInventory[key] = (this.data.partInventory[key] ?? 0) + 1;
        }
        dirty = true;
      }
      delete (this.data as any).ownedParts;
      dirty = true;
    }

    // equippedParts 旧形式 ("core_basic") → 新形式 ("core_basic:n")
    if (this.data.equippedParts) {
      for (const [slot, val] of Object.entries(this.data.equippedParts)) {
        if (val && !val.includes(':')) {
          this.data.equippedParts[slot] = `${val}:n`;
          dirty = true;
        }
      }
    }

    // partInventory が空 → 初期プリセットを付与
    if (!this.data.partInventory || Object.keys(this.data.partInventory).length === 0) {
      this.data.partInventory = buildDefaultInventory();
      this.data.equippedParts = { ...DEFAULT_PRESET.parts };
      dirty = true;
    }

    // firstClearedStages が無い (古いセーブ) → 空配列で初期化
    if (!Array.isArray(this.data.firstClearedStages)) {
      this.data.firstClearedStages = [];
      dirty = true;
    }

    if (dirty) this.save();
  }

  // ====== パーツインベントリ ======

  /** パーツコピーを追加 (ガチャ取得時) */
  addPartCopy(lineId: string, rarity: PartRarity, count: number = 1): void {
    const key = partKey(lineId, rarity);
    this.data.partInventory[key] = (this.data.partInventory[key] ?? 0) + count;
    this.save();
  }

  /** パーツの所持数を取得 */
  getPartCount(lineId: string, rarity: PartRarity): number {
    return this.data.partInventory[partKey(lineId, rarity)] ?? 0;
  }

  /** 進化可能かチェック */
  canEvolve(lineId: string, rarity: PartRarity): boolean {
    if (!NEXT_RARITY[rarity]) return false;
    return this.getPartCount(lineId, rarity) >= EVOLUTION_COST;
  }

  /** パーツを進化 (3個消費 → 次レアリティ1個獲得) */
  evolvePart(lineId: string, fromRarity: PartRarity): boolean {
    const nextRarity = NEXT_RARITY[fromRarity];
    if (!nextRarity) return false;
    if (!this.canEvolve(lineId, fromRarity)) return false;

    const fromKey = partKey(lineId, fromRarity);
    const toKey = partKey(lineId, nextRarity);

    // 消費
    this.data.partInventory[fromKey] -= EVOLUTION_COST;
    if (this.data.partInventory[fromKey] <= 0) {
      delete this.data.partInventory[fromKey];
    }

    // 獲得
    this.data.partInventory[toKey] = (this.data.partInventory[toKey] ?? 0) + 1;

    // 装備中パーツが消費されて0個になった場合、進化先に自動切替
    for (const [slot, equipped] of Object.entries(this.data.equippedParts)) {
      if (equipped === fromKey && (this.data.partInventory[fromKey] ?? 0) <= 0) {
        this.data.equippedParts[slot] = toKey;
      }
    }

    this.save();
    return true;
  }

  // ====== 装備 ======

  equipPart(slot: PartSlot, key: string): void {
    this.data.equippedParts[slot] = key;
    this.save();
  }

  getEquippedParts(): Record<PartSlot, string> {
    return this.data.equippedParts as Record<PartSlot, string>;
  }

  /** 指定スロットの所持パーツ一覧 */
  getOwnedPartsForSlot(slot: PartSlot): { key: string; lineId: string; rarity: PartRarity; count: number }[] {
    const result: { key: string; lineId: string; rarity: PartRarity; count: number }[] = [];
    for (const [key, count] of Object.entries(this.data.partInventory)) {
      if (count <= 0) continue;
      const parsed = parsePartKey(key);
      const line = PART_LINES.find(l => l.id === parsed.lineId);
      if (line && line.slot === slot) {
        result.push({ key, lineId: parsed.lineId, rarity: parsed.rarity, count });
      }
    }
    // レアリティ降順 → 名前順
    const rarityOrder: Record<string, number> = { lr: 0, ur: 1, sr: 2, r: 3, n: 4 };
    result.sort((a, b) => (rarityOrder[a.rarity] ?? 9) - (rarityOrder[b.rarity] ?? 9));
    return result;
  }

  // ====== ガチャチケット ======

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

  // ====== 通貨 ======

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

  // ====== アップグレード ======

  getUpgradeLevel(upgradeId: string): number {
    return this.data.upgradeLevels[upgradeId] ?? 0;
  }

  setUpgradeLevel(upgradeId: string, level: number): void {
    this.data.upgradeLevels[upgradeId] = level;
    this.save();
  }

  // ====== 機体 (後方互換) ======

  addShip(shipId: string): boolean {
    if (this.data.ownedShips.includes(shipId)) return false;
    this.data.ownedShips.push(shipId);
    this.save();
    return true;
  }

  // ====== ランデータ ======

  recordRun(stageReached: number): void {
    this.data.totalRuns++;
    if (stageReached > this.data.highestStage) {
      this.data.highestStage = stageReached;
    }
    this.save();
  }

  /** プレイヤー死亡時: totalRuns のみ加算し、highestStage は更新しない */
  recordDeath(): void {
    this.data.totalRuns++;
    this.save();
  }

  // ====== 初回クリアボーナス ======

  /** 指定ステージ (1-based) の初回クリアボーナス額: コイン 500*N、ジェム 100*N */
  static firstClearReward(stageNumber: number): { coins: number; gems: number } {
    return { coins: 500 * stageNumber, gems: 100 * stageNumber };
  }

  hasReceivedFirstClear(stageNumber: number): boolean {
    return this.data.firstClearedStages.includes(stageNumber);
  }

  /** 初回クリア時に呼ぶ。未受領なら付与して報酬を返し、受領済みなら null */
  claimFirstClearBonus(stageNumber: number): { coins: number; gems: number } | null {
    if (this.hasReceivedFirstClear(stageNumber)) return null;
    const reward = PlayerData.firstClearReward(stageNumber);
    this.data.firstClearedStages.push(stageNumber);
    this.data.coins += reward.coins;
    this.data.gems += reward.gems;
    this.save();
    return reward;
  }

  // ====== デバッグ用リセット ======

  resetStageProgress(): void {
    this.data.highestStage = 0;
    this.data.totalRuns = 0;
    this.data.firstClearedStages = [];
    this.save();
  }

  resetStatus(): void {
    this.data.upgradeLevels = {};
    this.data.partInventory = buildDefaultInventory();
    this.data.equippedParts = { ...DEFAULT_PRESET.parts };
    this.save();
  }
}
