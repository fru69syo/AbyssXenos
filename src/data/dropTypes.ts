export type SpecialDropType = 'none' | 'gacha_ticket' | 'gem' | 'rare_part';

export interface DropTypeDef {
  type: SpecialDropType;
  textureKey: string;
  color: number;
  label: string;
}

export const DROP_TYPES: Record<SpecialDropType, DropTypeDef> = {
  none:         { type: 'none',         textureKey: '',                  color: 0x000000, label: '' },
  gacha_ticket: { type: 'gacha_ticket', textureKey: 'drop_gacha_ticket', color: 0xff44ff, label: 'チケット' },
  gem:          { type: 'gem',          textureKey: 'drop_gem',          color: 0x44aaff, label: 'ジェム' },
  rare_part:    { type: 'rare_part',    textureKey: 'drop_rare_part',    color: 0xffaa00, label: 'パーツ' },
};
