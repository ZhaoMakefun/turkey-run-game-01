// A small seeded random source (mulberry32) so screenshot scenes can be
// replayed exactly: the same seed always deals the same fences, corn and
// knives. Live play seeds from the clock instead.

export function createRandom(seed) {
  let state = (seed | 0) || 1;
  return function nextRandom() {
    state = (state + 0x6d2b79f5) | 0;
    let value = Math.imul(state ^ (state >>> 15), 1 | state);
    value = (value + Math.imul(value ^ (value >>> 7), 61 | value)) ^ value;
    return ((value ^ (value >>> 14)) >>> 0) / 4294967296;
  };
}

export function pickRandom(rng, list) {
  return list[Math.floor(rng() * list.length)];
}

// A float in [low, high): spawn gaps, knife timers and flame phases use it.
export function rangeRandom(rng, low, high) {
  return low + rng() * (high - low);
}
