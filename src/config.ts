export const GAME_WIDTH = 390;
export const GAME_HEIGHT = 844;

export const PLAYER = {
  SPEED: 400,
  FIRE_RATE: 200,
  MAX_HP: 5,
  BULLET_SPEED: 600,
  START_Y_OFFSET: 80,
};

export const ENEMY = {
  BASE_SPEED: 120,
  BULLET_SPEED: 300,
  SPAWN_MARGIN: 40,
};

export const WAVE = {
  ENEMIES_PER_WAVE_BASE: 8,
  ENEMIES_PER_WAVE_INCREMENT: 2,
  SPAWN_INTERVAL: 800,
  WAVES_PER_STAGE: 5,
};

export const SKILL_RARITY_WEIGHTS = {
  normal: 60,
  rare: 30,
  epic: 10,
  legendary: 0,
};

export const COLORS = {
  PLAYER: 0x00ccff,
  PLAYER_BULLET: 0x00ffff,
  ENEMY_BASIC: 0xff4444,
  ENEMY_ZIGZAG: 0xff8800,
  ENEMY_SHOOTER: 0xcc00ff,
  ENEMY_SWARM: 0xffcc00,
  ENEMY_BULLET: 0xff6666,
  BOSS: 0xff0044,
  POWERUP_COIN: 0xffd700,
  POWERUP_HP: 0x00ff66,
  BG_DEEP: 0x0a0a2e,
  UI_TEXT: '#ffffff',
  UI_ACCENT: '#00ccff',
};
