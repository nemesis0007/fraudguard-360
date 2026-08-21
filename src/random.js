export function seededRandom(seed = 42) {
  let state = Number(seed) >>> 0;
  return () => {
    state = (state * 1664525 + 1013904223) >>> 0;
    return state / 4294967296;
  };
}

export function pick(random, items) {
  return items[Math.floor(random() * items.length)];
}

