import blackPearlImg from '../../assets/bubble-tea/Black-tapioca-pearls.webp'
import whitePearlImg from '../../assets/bubble-tea/White-tapioca-pearls.webp'
import strawberryJellyImg from '../../assets/bubble-tea/Strawberry-jelly-cubes.webp'
import eggPuddingImg from '../../assets/bubble-tea/pudding-topping.webp'
import coconutJellyImg from '../../assets/bubble-tea/coconut-jelly.webp'
import cupImg from '../../assets/bubble-tea/bubble-tea.webp'

export { cupImg }

export const TOPPING_DEFINITIONS = [
  {
    id: 'black-pearl',
    name: 'Black Tapioca Pearls',
    shortName: 'Trân châu đen',
    nameVi: 'Trân châu đen',
    description: 'Hạt trân châu đen dai giòn đậm đà',
    color: '#3B2314',
    badgeBg: '#4A2E1B',
    accentColor: '#8C5E3C',
    img: blackPearlImg,
    width: 44,
    height: 44,
  },
  {
    id: 'white-pearl',
    name: 'White Tapioca Pearls',
    shortName: 'Trân châu trắng',
    nameVi: 'Trân châu trắng',
    description: 'Hạt trân châu trắng giòn ngọt thanh',
    color: '#F4F5F7',
    badgeBg: '#7A828E',
    accentColor: '#CBD5E1',
    img: whitePearlImg,
    width: 44,
    height: 44,
  },
  {
    id: 'strawberry-jelly',
    name: 'Strawberry Jelly',
    shortName: 'Thạch dâu',
    nameVi: 'Thạch dâu',
    description: 'Thạch dâu tây chua ngọt màu hồng',
    color: '#FF4D6D',
    badgeBg: '#E63956',
    accentColor: '#FFA8BA',
    img: strawberryJellyImg,
    width: 46,
    height: 42,
  },
  {
    id: 'egg-pudding',
    name: 'Egg Pudding',
    shortName: 'Pudding trứng',
    nameVi: 'Pudding trứng',
    description: 'Pudding trứng béo ngậy mềm mịn',
    color: '#FFBE0B',
    badgeBg: '#DDA006',
    accentColor: '#FFE072',
    img: eggPuddingImg,
    width: 46,
    height: 40,
  },
  {
    id: 'coconut-jelly',
    name: 'Coconut Jelly',
    shortName: 'Thạch dừa',
    nameVi: 'Thạch dừa',
    description: 'Thạch dừa giòn sần sật thanh mát',
    color: '#EBF4F6',
    badgeBg: '#647D87',
    accentColor: '#B0C7D1',
    img: coconutJellyImg,
    width: 48,
    height: 36,
  },
]

export const BASE_SPEED = 200 // px/s starting speed
export const SPEED_INCREMENT = 20 // px/s added every 30 points
export const MAX_SPEED = 480 // px/s maximum capped speed
export const SPEED_STEP_PTS = 30 // Points required per speed upgrade

export function getSpeedTier(score) {
  return Math.floor(Math.max(0, score) / SPEED_STEP_PTS)
}

export function getFallingSpeed(score) {
  const tier = getSpeedTier(score)
  const calculatedSpeed = BASE_SPEED + tier * SPEED_INCREMENT
  return Math.min(MAX_SPEED, calculatedSpeed)
}

export function isMaxSpeed(score) {
  const tier = getSpeedTier(score)
  return BASE_SPEED + tier * SPEED_INCREMENT >= MAX_SPEED
}

export const BASE_SPAWN_INTERVAL = 1.30 // seconds
export const SPAWN_INTERVAL_DECREMENT = 0.04 // seconds faster per 30 points
export const MIN_SPAWN_INTERVAL = 0.70 // seconds minimum spawn interval

export function getSpawnInterval(score) {
  const tier = getSpeedTier(score)
  const calculatedInterval = BASE_SPAWN_INTERVAL - tier * SPAWN_INTERVAL_DECREMENT
  return Math.max(MIN_SPAWN_INTERVAL, calculatedInterval)
}

/**
 * Returns the pool of toppings available based on the current score:
 * - 0 - 100: 3 topping types
 * - 101 - 300: 4 topping types
 * - 301+: all 5 topping types
 */
export function getAvailablePool(score) {
  if (score <= 100) {
    return TOPPING_DEFINITIONS.slice(0, 3)
  }
  if (score <= 300) {
    return TOPPING_DEFINITIONS.slice(0, 4)
  }
  return TOPPING_DEFINITIONS.slice(0, 5)
}

/**
 * Returns required topping types count based on score:
 * - 0–100: 1 type (Easy)
 * - 101–300: 2 types (Normal)
 * - 301–600: 2 types (Hard)
 * - 601–1000: 3 types (Expert)
 * - 1001+: 3 types (Endless Challenge)
 */
export function getOrderRequirementsCount(score) {
  if (score <= 100) return 1
  if (score <= 600) return 2
  return 3
}

let orderCounter = 1

/**
 * Generates a new multi-item order with distinct topping types:
 * - Selects `count` distinct toppings from the unlocked pool.
 * - Never includes duplicate topping types in the same order.
 * - Each item tracks its own completion state.
 */
export function generateNewOrder(score, prevOrderToppingIds = []) {
  const pool = getAvailablePool(score)
  const reqCount = Math.min(pool.length, getOrderRequirementsCount(score))

  // Shuffle pool to pick distinct toppings, prioritizing toppings not in previous order
  const shuffled = [...pool].sort((a, b) => {
    const aInPrev = prevOrderToppingIds.includes(a.id) ? 1 : 0
    const bInPrev = prevOrderToppingIds.includes(b.id) ? 1 : 0
    if (aInPrev !== bInPrev) return aInPrev - bInPrev
    return Math.random() - 0.5
  })

  const selected = shuffled.slice(0, reqCount)

  return {
    id: orderCounter++,
    items: selected.map((topping) => ({
      id: topping.id,
      topping,
      completed: false,
    })),
  }
}
