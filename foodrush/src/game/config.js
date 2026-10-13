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

export const MAX_COUPON_SCORE = 500

export const SCORE = {
  ground: 10,
  flying: 15,
  comboSpan: 3,
  comboBonus: 5,
}

// Progressive difficulty calculated dynamically from current score.
// Starts gentle with slow ground bugs, then gradually increases spawn rate,
// flying bug mix, movement speed, and occasional tougher 2-HP bugs.
export function getDifficulty(score = 0) {
  const s = Math.max(0, score)

  // Spawn interval decreases smoothly as score increases (from 1450ms down to 520ms)
  const spawnMs = Math.max(520, 1450 - s * 1.35)

  // Ratio of flying bugs: 0% at the start, smoothly rising to 50%
  const flyingProb = s < 30 ? 0 : Math.min(0.5, 0.15 + (s - 30) * 0.00075)

  // Speeds scale smoothly with a tiny random variation per spawn
  const groundSpeed = Math.min(96, 62 + s * 0.055) + rand(-3, 4)
  const flyingSpeed = Math.min(138, 88 + s * 0.075) + rand(-4, 5)

  // Tougher bugs (HP = 2) appear after reaching 200+ score
  const hpChance = s < 200 ? 0 : Math.min(0.38, (s - 200) * 0.0009)
  const hp = Math.random() < hpChance ? 2 : 1

  // Max concurrent bugs on screen to keep gameplay fast and responsive
  const maxBugs = Math.min(8, 3 + Math.floor(s / 110))

  return {
    spawnMs,
    flyingProb,
    groundSpeed,
    flyingSpeed,
    hp,
    maxBugs,
    level: Math.floor(s / 100) + 1,
  }
}

// Retained for backward compatibility
export const WAVES = [
  { ground: 4, flying: 0, spawnMs: 1250, groundSpeed: 64, flyingSpeed: 0, hp: 1 },
]
export const TOTAL_WAVES = COUPON_TIERS.length

// Vertical bands used for spawn hints and rules of thumb.
export const GROUND_BAND = { minY: 800, maxY: 980 }
export const FLYING_BAND = { minY: 60, maxY: 380 }

export const rand = (min, max) => min + Math.random() * (max - min)

export function buildWaveQueue(cfg) {
  const queue = []
  for (let i = 0; i < (cfg?.ground || 0); i += 1) queue.push(BUG_TYPES.GROUND)
  for (let i = 0; i < (cfg?.flying || 0); i += 1) queue.push(BUG_TYPES.FLYING)
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
