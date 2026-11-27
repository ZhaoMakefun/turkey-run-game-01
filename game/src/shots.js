// Deterministic screenshot scenes for Gobble Getaway.
// `?shot=start`, `?shot=play`, `?shot=kitchen` or `?shot=end` (with an
// optional `&seed=`) stages one exact frame of the game — the title screen,
// a mid-run chase, the kitchen gauntlet, or the escape — so the screenshots
// in screenshots/ are reproducible renders of the game's own code. Live play
// never passes a shot parameter and is unaffected.

import { FIELD } from './config.js';
import { startRun } from './world.js';

function placeCorn(world, startX, count, height) {
  for (let i = 0; i < count; i += 1) {
    world.pickups.push({
      kind: 'corn', x: startX + i * 36, y: FIELD.groundY - height - (i % 2) * 30,
      taken: false, bob: i,
    });
  }
}

function stagePlayScene(world, options) {
  startRun(world);
  world.stageIndex = options.stageIndex;
  world.distanceMetres = options.distanceMetres;
  world.distancePx = options.distanceMetres * 50;
  world.score = options.score;
  world.corn = options.corn;
  world.gap = options.gap;
  world.lives = options.lives;
  world.banner = '';
  world.bannerTime = 0;
  world.time = options.time;
  world.best = Math.max(world.best, options.score);
  world.turkey.runCycle = 0.4;
  world.obstacles = options.obstacles;
  world.pickups = [];
  placeCorn(world, options.cornX, 4, 96);
  if (options.feather) {
    world.pickups.push({ kind: 'feather', x: 980, y: FIELD.groundY - 175, taken: false, bob: 0 });
  }
  if (options.pie) {
    world.pickups.push({ kind: 'pie', x: 1080, y: FIELD.groundY - 90, taken: false, bob: 0 });
  }
  world.knives = options.knives || [];
}

export function applyShot(world, search) {
  const params = new URLSearchParams(search);
  const shot = params.get('shot');
  if (!shot) return null;
  const seed = Number(params.get('seed')) || 7;

  if (shot === 'start') {
    // The title screen over a quiet barnyard, with a haystack and corn waiting.
    world.time = 1.5;
    world.best = 3420;
    world.obstacles = [{ kind: 'haystack', x: 900, w: 130, h: 92, quiet: true }];
    world.pickups = [];
    placeCorn(world, 700, 3, 96);
    return 'start';
  }

  if (shot === 'play') {
    // Mid-run in the cornfield: the farmer close behind, a knife in the air,
    // a fence and a haystack ahead, corn to grab.
    stagePlayScene(world, {
      stageIndex: 1,
      distanceMetres: 512,
      score: 1240,
      corn: 18,
      gap: 34,
      lives: 3,
      time: 2.5,
      cornX: 620,
      feather: true,
      pie: false,
      obstacles: [
        { kind: 'haystack', x: 430, w: 130, h: 92 },
        { kind: 'fence', x: 700, w: 34, h: 78 },
        { kind: 'haybale', x: 950, w: 74, h: 58 },
        { kind: 'puddle', x: 1120, w: 110, h: 12 },
      ],
      knives: [{ x: 620, y: FIELD.groundY - 44, vx: 0, spin: 0.8 }],
    });
    world.farmerState = 'throwing';
    world.farmerStateTime = 0.6;
    return 'play';
  }

  if (shot === 'kitchen') {
    // The final stage: a flaming oven ahead, the knife already thrown, the
    // farmer nearly on the turkey's tail.
    stagePlayScene(world, {
      stageIndex: 2,
      distanceMetres: 968,
      score: 2310,
      corn: 34,
      gap: 21,
      lives: 2,
      time: 3.2,
      cornX: 560,
      feather: false,
      pie: true,
      obstacles: [
        { kind: 'oven', x: 780, w: 96, h: 108, flame: 2.5 },
        { kind: 'fence', x: 1010, w: 34, h: 84 },
      ],
      knives: [{ x: 480, y: FIELD.groundY - 44, vx: 0, spin: 2.1 }],
    });
    world.farmerState = 'throwing';
    world.farmerStateTime = 0.6;
    return 'kitchen';
  }

  if (shot === 'end') {
    // The escape: the end screen after all three stages, a new best score.
    startRun(world);
    world.phase = 'escaped';
    world.score = 3420;
    world.distanceMetres = 1120;
    world.distancePx = 1120 * 50;
    world.corn = 41;
    world.feathers = 3;
    world.lives = 2;
    world.stageIndex = 2;
    world.best = 3420;
    world.newBest = true;
    world.banner = '';
    world.bannerTime = 0;
    world.time = 1.2;
    world.obstacles = [];
    world.knives = [];
    world.pickups = [];
    return 'end';
  }

  return null;
}
