// Gobble Getaway — tuning, palette and stage data.
// One place for every number the game balances on, so the feel can be tuned
// without touching the simulation. The playfield is a fixed 1280x720 logical
// area; the renderer scales it to whatever window the browser gives it.

export const FIELD = { width: 1280, height: 720, groundY: 612 };

export const STEP = 1 / 60;

export const TURKEY = {
  x: 250,
  width: 64,
  height: 58,
  runSpeed: 320,
  dashSpeed: 560,
  dashTime: 0.55,
  jumpVelocity: -820,
  gravity: 2350,
  duckHeight: 34,
};

export const FARMER = {
  width: 58,
  height: 96,
  // Gap is 0..100. At 100 the farmer is a speck far behind; at 0 he grabs the turkey.
  startGap: 78,
  drainPerSecond: 1.6,
  hitLoss: 26,
  hideGain: 34,
  cornGain: 1.5,
  maxGap: 100,
};

export const LIVES_START = 3;
export const LIVES_MAX = 4;

export const CORN_POINTS = 10;
export const FEATHER_POINTS = 50;
export const STAGE_BONUS = 250;
export const DISTANCE_POINTS_PER_METRE = 1;

// Each stage is a stretch of road in metres; finish the third and the turkey escapes.
export const STAGES = [
  {
    name: 'Barnyard Breakout',
    metres: 320,
    speed: 320,
    spawnGap: 1.05,
    knifeEvery: 7.5,
    palette: 'barnyard',
    hint: 'Jump the fences — duck under the knives!',
  },
  {
    name: 'Cornfield Dash',
    metres: 380,
    speed: 375,
    spawnGap: 0.9,
    knifeEvery: 5.6,
    palette: 'cornfield',
    hint: 'Hide in a haystack (hold DOWN) to lose the farmer!',
  },
  {
    name: 'The Kitchen Gauntlet',
    metres: 420,
    speed: 430,
    spawnGap: 0.78,
    knifeEvery: 4.2,
    palette: 'kitchen',
    hint: 'Jump the ovens — the carving knife is coming!',
  },
];

export const SPAWN = {
  minGapPx: 210,
  maxGapPx: 430,
  cornRowChance: 0.55,
  featherChance: 0.07,
  pieChance: 0.06,
  haystackChance: 0.16,
  puddleChance: 0.12,
};

export const PALETTES = {
  barnyard: {
    skyTop: '#f7b267', skyMid: '#f4845f', skyLow: '#e76f51',
    sun: '#ffd166', sunGlow: '#ffe29a',
    far: '#8a5a3b', mid: '#6b4226', ground: '#7c4a21', groundTop: '#a9713f',
    grass: '#c98f4e', fence: '#5d3a1a', barn: '#a63d2f', barnRoof: '#7e2a20',
  },
  cornfield: {
    skyTop: '#f4a259', skyMid: '#e07a4f', skyLow: '#c65d3b',
    sun: '#ffcf5c', sunGlow: '#ffe9a8',
    far: '#7d5a2e', mid: '#5f4423', ground: '#6e4520', groundTop: '#9c6b34',
    grass: '#d9a441', fence: '#54341a', barn: '#93402e', barnRoof: '#6e2b1f',
  },
  kitchen: {
    skyTop: '#3b2a4a', skyMid: '#5c2e3e', skyLow: '#8a3b2e',
    sun: '#ffb347', sunGlow: '#ffcf7d',
    far: '#4a2c33', mid: '#3a2230', ground: '#4a2c22', groundTop: '#6e4530',
    grass: '#8a5a3a', fence: '#2e1a12', barn: '#5c2a24', barnRoof: '#3c1a16',
  },
};

export const COLOURS = {
  turkeyBody: '#8a5a2b',
  turkeyBelly: '#c98d4b',
  turkeyHead: '#e8e0d0',
  turkeyBeak: '#e8821e',
  turkeyWattle: '#d64541',
  turkeyTail: ['#b5651d', '#d2691e', '#e8a33c', '#a0522d'],
  turkeyLeg: '#e8821e',
  farmerShirt: '#4a6fa5',
  farmerOveralls: '#3a5a80',
  farmerSkin: '#e8b98a',
  farmerHat: '#6b4226',
  knifeBlade: '#dfe6ee',
  knifeHandle: '#3a2a1a',
  ovenBody: '#3d3d46',
  ovenDoor: '#1f1f26',
  flame: ['#ff9f1c', '#ff6b35', '#ffd166'],
  corn: '#f2c94c',
  cornHusk: '#7fb069',
  feather: '#ffd166',
  pie: '#e07a5f',
  hay: '#e3b505',
  puddle: '#5b8db2',
  hudPanel: 'rgba(20, 12, 8, 0.62)',
  hudText: '#fff3e0',
  hudAccent: '#ffd166',
  danger: '#ff5a4e',
};

export const FONT = '"Trebuchet MS", "Segoe UI", system-ui, sans-serif';

export const BEST_KEY = 'gobble-getaway.best';
export const MUTE_KEY = 'gobble-getaway.muted';
