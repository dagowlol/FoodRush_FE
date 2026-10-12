// Central configuration for Five Star: Food Defender.
// All gameplay tuning (bugs, tools, foods, waves) lives in the frontend on purpose.

// Fixed logical coordinate system. The rendered field scales to any screen,
// but positions/sizes are always expressed in these units so circles stay round.
export const FIELD = { W: 800, H: 1000 }

export const BUG_TYPES = {
  GROUND: 'ground',
  FLYING: 'flying',
}

export const TOOLS = {
  spray: {
    id: 'spray',
    name: 'Bình xịt',
    subtitle: 'Bọ bò (kiến)',
    bugType: BUG_TYPES.GROUND,
    damage: 1,
    cooldownMs: 160,
  },
  swatter: {
    id: 'swatter',
    name: 'Vợt đập ruồi',
    subtitle: 'Ruồi bay',
    bugType: BUG_TYPES.FLYING,
    damage: 1,
    cooldownMs: 160,
  },
}

// The single dish the player must protect. It sits centered in the field.
// r = hit radius (logical units). Bugs that reach it cost the player one life
// and the dish is instantly replaced by a different, fresh (safe) dish.
export const FOOD = { x: 400, y: 620, r: 108 }
export const FOOD_TYPES = ['burger', 'chicken', 'fries']

// How many dishes the player may lose before the shift is over.
export const LIVES = 3

// Daily coupon exchange: a finished run that reaches a score threshold can be
// turned into a discount coupon. Only one coupon may be claimed per day.
export const COUPON_TIERS = [
  { minScore: 200, percent: 5 },
  { minScore: 350, percent: 10 },
  { minScore: 500, percent: 15 },
]

export const SCORE = {
  ground: 10,
  flying: 15,
  comboSpan: 3,
  comboBonus: 5,
}

// 5 waves with progressive difficulty. Ground bugs are deliberately slow so the
// player has time to react before they reach the dish.
export const WAVES = [
  { ground: 4, flying: 0, spawnMs: 1250, groundSpeed: 64, flyingSpeed: 0, hp: 1 },
  { ground: 4, flying: 3, spawnMs: 1050, groundSpeed: 70, flyingSpeed: 92, hp: 1 },
  { ground: 5, flying: 4, spawnMs: 900, groundSpeed: 76, flyingSpeed: 104, hp: 1 },
  { ground: 5, flying: 5, spawnMs: 780, groundSpeed: 82, flyingSpeed: 116, hp: 2 },
  { ground: 6, flying: 6, spawnMs: 660, groundSpeed: 88, flyingSpeed: 128, hp: 2 },
]

export const TOTAL_WAVES = WAVES.length

// Vertical bands used for spawn hints and rules of thumb.
export const GROUND_BAND = { minY: 800, maxY: 980 }
export const FLYING_BAND = { minY: 60, maxY: 380 }

export const rand = (min, max) => min + Math.random() * (max - min)

export function buildWaveQueue(cfg) {
  const queue = []
  for (let i = 0; i < cfg.ground; i += 1) queue.push(BUG_TYPES.GROUND)
  for (let i = 0; i < cfg.flying; i += 1) queue.push(BUG_TYPES.FLYING)
  // Light shuffle so ground/flying bugs mix instead of arriving in blocks.
  for (let i = queue.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[queue[i], queue[j]] = [queue[j], queue[i]]
  }
  return queue
}

// Ground bugs always enter from the sides or the bottom edge, far away from the
// centered dish, so they crawl slowly across the field before arriving.
export function groundSpawn() {
  const roll = Math.random()
  if (roll < 0.42) return { x: -70, y: rand(GROUND_BAND.minY, GROUND_BAND.maxY) }
  if (roll < 0.84) return { x: FIELD.W + 70, y: rand(GROUND_BAND.minY, GROUND_BAND.maxY) }
  return { x: Math.random() < 0.5 ? -70 : FIELD.W + 70, y: FIELD.H + 70 }
}

export function flyingSpawn() {
  const roll = Math.random()
  if (roll < 0.5) return { x: rand(90, FIELD.W - 90), y: -70 }
  if (roll < 0.75) return { x: -70, y: rand(FLYING_BAND.minY, FLYING_BAND.maxY) }
  return { x: FIELD.W + 70, y: rand(FLYING_BAND.minY, FLYING_BAND.maxY) }
}
