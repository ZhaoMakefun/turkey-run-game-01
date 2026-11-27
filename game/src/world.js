// The simulation for Gobble Getaway: a turkey sprinting away from the farm,
// the farmer closing in behind, and the road from the barnyard to the kitchen.
// The world owns the state machine (title, playing, paused, caught, escaped),
// the turkey's physics, the farmer's gap, spawning, collisions, hiding in
// haystacks, and the three stages. It knows nothing about drawing or sound:
// each update returns the events that happened, and main.js turns them into
// noises while render.js draws the state.

import {
  FIELD, STEP, TURKEY, FARMER, LIVES_START, LIVES_MAX,
  CORN_POINTS, FEATHER_POINTS, STAGE_BONUS, DISTANCE_POINTS_PER_METRE,
  STAGES, SPAWN,
} from './config.js';
import { createRandom, rangeRandom } from './random.js';

export const PHASES = ['title', 'playing', 'paused', 'caught', 'escaped'];

function stageEndMetres(index) {
  let total = 0;
  for (let i = 0; i <= index; i += 1) total += STAGES[i].metres;
  return total;
}

function freshTurkey() {
  return {
    y: FIELD.groundY,
    vy: 0,
    onGround: true,
    ducking: false,
    hidden: false,
    dashing: 0,
    dashCooldown: 0,
    invulnerable: 0,
    runCycle: 0,
  };
}

export function createWorld(seed) {
  const rng = createRandom(seed);
  let best = 0;
  try {
    best = Number(window.localStorage.getItem('gobble-getaway.best')) || 0;
  } catch {
    best = 0;
  }

  const world = {
    phase: 'title',
    rng,
    turkey: freshTurkey(),
    obstacles: [],
    knives: [],
    pickups: [],
    distancePx: 0,
    distanceMetres: 0,
    score: 0,
    bonus: 0,
    corn: 0,
    feathers: 0,
    lives: LIVES_START,
    gap: FARMER.startGap,
    stageIndex: 0,
    banner: '',
    bannerTime: 0,
    spawnInPx: 500,
    knifeInSeconds: 4,
    time: 0,
    speed: STAGES[0].speed,
    best,
    newBest: false,
    farmerState: 'chasing',
    farmerStateTime: 0,
    caughtReason: '',
    shake: 0,
    hideTime: 0,
    events: [],
  };
  return world;
}

export function startRun(world) {
  const keepBest = world.best;
  const rng = world.rng;
  const fresh = createWorld(1);
  Object.assign(world, fresh, { rng, best: keepBest, phase: 'playing' });
  world.banner = STAGES[0].name;
  world.bannerTime = 2.2;
  world.events.push('gobble');
}

export function togglePause(world) {
  if (world.phase === 'playing') world.phase = 'paused';
  else if (world.phase === 'paused') world.phase = 'playing';
}

function currentStage(world) {
  return STAGES[world.stageIndex];
}

function saveBest(world) {
  if (world.score > world.best) {
    world.best = world.score;
    world.newBest = true;
    try {
      window.localStorage.setItem('gobble-getaway.best', String(world.best));
    } catch {
      // Best score is a nicety; a browser without storage still plays fine.
    }
  }
}

function endRun(world, reason) {
  world.phase = reason === 'escaped' ? 'escaped' : 'caught';
  world.caughtReason = reason;
  world.events.push(reason === 'escaped' ? 'escaped' : 'caught');
  saveBest(world);
}

function loseLife(world, cause) {
  if (world.turkey.invulnerable > 0 || world.turkey.hidden) return;
  world.lives -= 1;
  world.gap = Math.max(0, world.gap - FARMER.hitLoss);
  world.turkey.invulnerable = 1.6;
  world.shake = 0.45;
  world.events.push('hit');
  if (world.lives <= 0 || world.gap <= 0) {
    endRun(world, world.gap <= 0 && world.lives > 0 ? 'grabbed' : 'caught');
  }
}

function spawnObstacle(world) {
  const stage = currentStage(world);
  const roll = world.rng();
  const x = FIELD.width + 80;
  if (stage.palette === 'kitchen' && roll < 0.3) {
    // The oven: tall, hot, and only jumpable at full speed — the kitchen's signature danger.
    world.obstacles.push({ kind: 'oven', x, w: 96, h: 108, flame: world.rng() * 10 });
  } else if (roll < 0.52) {
    world.obstacles.push({ kind: 'fence', x, w: 34, h: 64 + world.rng() * 26 });
  } else if (roll < 0.72) {
    world.obstacles.push({ kind: 'haybale', x, w: 74, h: 58 });
  } else if (roll < 0.84) {
    world.obstacles.push({ kind: 'puddle', x, w: 110, h: 12 });
  } else {
    // A haystack is shelter, not a wall: duck inside it and the farmer loses you.
    world.obstacles.push({ kind: 'haystack', x, w: 130, h: 92 });
  }
  // Corn often trails an obstacle so a good jump pays for itself.
  if (world.rng() < SPAWN.cornRowChance) {
    const count = 3 + Math.floor(world.rng() * 3);
    for (let i = 0; i < count; i += 1) {
      world.pickups.push({
        kind: 'corn', x: x + 60 + i * 36, y: FIELD.groundY - 96 - (i % 2) * 34,
        taken: false, bob: world.rng() * 6,
      });
    }
  }
  const rare = world.rng();
  if (rare < SPAWN.featherChance) {
    world.pickups.push({
      kind: 'feather', x: x + 200, y: FIELD.groundY - 170, taken: false, bob: 0,
    });
  } else if (rare < SPAWN.featherChance + SPAWN.pieChance) {
    world.pickups.push({
      kind: 'pie', x: x + 200, y: FIELD.groundY - 90, taken: false, bob: 0,
    });
  }
}

function throwKnife(world) {
  const farmerX = TURKEY.x - world.gap * 2.1;
  world.knives.push({
    x: Math.max(60, farmerX + 70),
    y: FIELD.groundY - 44,
    vx: world.speed * 1.55,
    spin: 0,
  });
  world.events.push('knife');
  world.farmerState = 'throwing';
  world.farmerStateTime = 0.6;
}

function turkeyBox(world) {
  const t = world.turkey;
  const height = t.ducking || t.hidden ? TURKEY.duckHeight : TURKEY.height;
  return {
    x: TURKEY.x - TURKEY.width / 2,
    y: t.y - height,
    w: TURKEY.width,
    h: height,
  };
}

function boxesOverlap(a, b) {
  return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
}

function updatePlaying(world, input, dt) {
  const t = world.turkey;
  const stage = currentStage(world);
  world.time += dt;
  world.shake = Math.max(0, world.shake - dt);
  world.bannerTime = Math.max(0, world.bannerTime - dt);
  t.invulnerable = Math.max(0, t.invulnerable - dt);
  t.dashCooldown = Math.max(0, t.dashCooldown - dt);
  if (world.farmerStateTime > 0) {
    world.farmerStateTime -= dt;
    if (world.farmerStateTime <= 0) world.farmerState = 'chasing';
  }

  // --- Controls: jump, duck/hide, dash. ---
  t.ducking = input.duckHeld() && t.onGround;
  if (input.jumpPressed() && t.onGround && !t.hidden) {
    t.vy = TURKEY.jumpVelocity;
    t.onGround = false;
    world.events.push('jump');
  }
  if (input.dashPressed() && t.dashCooldown <= 0 && !t.hidden) {
    t.dashing = TURKEY.dashTime;
    t.dashCooldown = 1.6;
    world.events.push('dash');
  }

  // --- Physics and the road scrolling past. ---
  const dashing = t.dashing > 0;
  if (dashing) t.dashing -= dt;
  const speed = dashing ? TURKEY.dashSpeed : stage.speed;
  world.speed = speed;
  t.vy += TURKEY.gravity * dt;
  t.y += t.vy * dt;
  if (t.y >= FIELD.groundY) {
    t.y = FIELD.groundY;
    t.vy = 0;
    t.onGround = true;
  }
  t.runCycle += (speed / 60) * dt;
  const travelled = speed * dt;
  world.distancePx += travelled;
  world.distanceMetres = world.distancePx / 50;
  world.score = Math.floor(world.distanceMetres * DISTANCE_POINTS_PER_METRE)
    + world.corn * CORN_POINTS + world.feathers * FEATHER_POINTS + world.bonus;

  // --- Hiding: ducking inside a haystack makes the farmer search, not chase. ---
  const shelter = world.obstacles.find((o) => o.kind === 'haystack'
    && TURKEY.x + 20 > o.x && TURKEY.x - 20 < o.x + o.w);
  const wasHidden = t.hidden;
  t.hidden = Boolean(shelter && t.ducking && t.onGround);
  if (t.hidden) {
    world.hideTime += dt;
    world.gap = Math.min(FARMER.maxGap, world.gap + 22 * dt);
    world.farmerState = 'searching';
    world.farmerStateTime = 0.4;
    if (!wasHidden) world.events.push('hide');
  } else {
    world.hideTime = 0;
    // The farmer gains a little ground every second the turkey runs in the open.
    world.gap = Math.max(0, world.gap - FARMER.drainPerSecond * dt);
    if (world.gap <= 0) {
      endRun(world, 'grabbed');
      return;
    }
  }

  // --- Spawning ahead of the turkey. ---
  world.spawnInPx -= travelled;
  if (world.spawnInPx <= 0) {
    spawnObstacle(world);
    world.spawnInPx = rangeRandom(world.rng, SPAWN.minGapPx, SPAWN.maxGapPx)
      + stage.spawnGap * 260;
  }
  world.knifeInSeconds -= dt;
  if (world.knifeInSeconds <= 0 && !t.hidden) {
    throwKnife(world);
    world.knifeInSeconds = stage.knifeEvery * rangeRandom(world.rng, 0.85, 1.25);
  }

  // --- Move everything left at road speed. ---
  const move = (list) => {
    for (const item of list) item.x -= travelled;
    return list.filter((item) => item.x > -220);
  };
  world.obstacles = move(world.obstacles);
  world.knives = move(world.knives);
  world.pickups = move(world.pickups);
  for (const knife of world.knives) {
    knife.x += knife.vx * dt;
    knife.spin += dt * 14;
  }

  // --- Collisions. ---
  const box = turkeyBox(world);
  for (const obstacle of world.obstacles) {
    if (obstacle.kind === 'haystack' || obstacle.kind === 'puddle') continue;
    const obstacleBox = { x: obstacle.x, y: FIELD.groundY - obstacle.h, w: obstacle.w, h: obstacle.h };
    if (t.hidden) continue;
    // A jump clears a fence or haybale only if the turkey's feet are above its top.
    const cleared = t.y < FIELD.groundY - obstacle.h - 6;
    if (!cleared && boxesOverlap(box, obstacleBox)) {
      loseLife(world, obstacle.kind);
      obstacle.x = -9999; // One hit per obstacle; it is spent.
      if (world.phase !== 'playing') return;
    }
  }
  for (const obstacle of world.obstacles) {
    if (obstacle.kind !== 'puddle') continue;
    const puddleBox = { x: obstacle.x, y: FIELD.groundY - 14, w: obstacle.w, h: 14 };
    if (!t.hidden && t.onGround && boxesOverlap(box, puddleBox)) {
      // Splashing through a puddle is slow and the farmer gains on you.
      world.gap = Math.max(0, world.gap - 9 * dt);
    }
  }
  for (const knife of world.knives) {
    const knifeBox = { x: knife.x - 26, y: knife.y - 12, w: 52, h: 24 };
    if (!t.hidden && boxesOverlap(box, knifeBox)) {
      loseLife(world, 'knife');
      knife.x = -9999;
      if (world.phase !== 'playing') return;
    }
  }
  for (const pickup of world.pickups) {
    if (pickup.taken || t.hidden) continue;
    const pickupBox = { x: pickup.x - 20, y: pickup.y - 20, w: 40, h: 40 };
    if (boxesOverlap(box, pickupBox)) {
      pickup.taken = true;
      if (pickup.kind === 'corn') {
        world.corn += 1;
        world.gap = Math.min(FARMER.maxGap, world.gap + FARMER.cornGain);
        world.events.push('corn');
      } else if (pickup.kind === 'feather') {
        world.feathers += 1;
        world.events.push('feather');
      } else if (pickup.kind === 'pie') {
        world.lives = Math.min(LIVES_MAX, world.lives + 1);
        world.events.push('pie');
      }
      world.score = Math.floor(world.distanceMetres * DISTANCE_POINTS_PER_METRE)
        + world.corn * CORN_POINTS + world.feathers * FEATHER_POINTS + world.bonus;
    }
  }

  // --- Stage finish: clear the road, bank the bonus, run faster. ---
  if (world.distanceMetres >= stageEndMetres(world.stageIndex)) {
    world.bonus += STAGE_BONUS;
    world.events.push('stage');
    if (world.stageIndex >= STAGES.length - 1) {
      endRun(world, 'escaped');
      return;
    }
    world.stageIndex += 1;
    world.obstacles = [];
    world.knives = [];
    world.banner = STAGES[world.stageIndex].name;
    world.bannerTime = 2.4;
    world.knifeInSeconds = 3.5;
    world.spawnInPx = 700;
  }
}

// One fixed-step update. Input is the object from input.js; dt is seconds.
export function updateWorld(world, input, dt) {
  world.events = [];
  if (world.phase === 'title') {
    world.time += dt;
    if (input.startPressed()) startRun(world);
    return world.events;
  }
  if (world.phase === 'paused') {
    if (input.pausePressed()) togglePause(world);
    return world.events;
  }
  if (world.phase === 'caught' || world.phase === 'escaped') {
    world.time += dt;
    if (input.restartPressed()) startRun(world);
    return world.events;
  }
  if (input.pausePressed()) {
    togglePause(world);
    return world.events;
  }
  let remaining = dt;
  while (remaining > 0) {
    const step = Math.min(STEP, remaining);
    updatePlaying(world, input, step);
    if (world.phase !== 'playing') break;
    remaining -= step;
  }
  return world.events;
}

export function stageProgress(world) {
  const start = world.stageIndex === 0 ? 0 : stageEndMetres(world.stageIndex - 1);
  const end = stageEndMetres(world.stageIndex);
  return Math.max(0, Math.min(1, (world.distanceMetres - start) / (end - start)));
}

export function stageName(world) {
  return STAGES[world.stageIndex].name;
}

export function paletteName(world) {
  return STAGES[world.stageIndex].palette;
}
