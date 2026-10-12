// Daily coupon exchange, stored locally in the browser.
// The game hands out one exchange turn per day: a finished run whose score
// reaches a tier can be turned into a discount coupon. Only ONE coupon can be
// claimed per day — after claiming, no further claims are allowed that day,
// even if a later run scores higher.
import { COUPON_TIERS } from './config'

const KEY_COUPONS = 'fdf_coupons'
const KEY_LAST_DATE = 'fdf_last_claim_date'

function todayKey() {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

function readCoupons() {
  try {
    const raw = JSON.parse(localStorage.getItem(KEY_COUPONS))
    return Array.isArray(raw) ? raw : []
  } catch {
    return []
  }
}

function writeCoupons(list) {
  try {
    localStorage.setItem(KEY_COUPONS, JSON.stringify(list))
  } catch {
    // ignore storage failures (private mode, quota, ...)
  }
}

// Highest tier the given score reaches, or null when it is below every tier.
export function tierForScore(score) {
  let best = null
  for (const tier of COUPON_TIERS) {
    if (score >= tier.minScore) best = tier
  }
  return best
}

// The next tier the score has not reached yet (for "score X more" hints).
export function nextTierForScore(score) {
  return COUPON_TIERS.find((tier) => score < tier.minScore) || null
}

export function getCoupons() {
  return readCoupons()
}

export function hasClaimedToday() {
  try {
    return localStorage.getItem(KEY_LAST_DATE) === todayKey()
  } catch {
    return false
  }
}

export function todayCoupon() {
  const today = todayKey()
  return readCoupons().find((c) => c.date === today) || null
}

// One exchange turn per day.
export function turnsLeftToday() {
  return hasClaimedToday() ? 0 : 1
}

function makeCode(percent) {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  let suffix = ''
  for (let i = 0; i < 6; i += 1) suffix += chars[Math.floor(Math.random() * chars.length)]
  return `FD${percent}-${suffix}`
}

// Claim today's coupon for the given score.
// Returns { ok, coupon } on success or { ok:false, reason } otherwise.
export function claimCoupon(score) {
  const tier = tierForScore(score)
  if (!tier) return { ok: false, reason: 'score' }
  if (hasClaimedToday()) return { ok: false, reason: 'daily', coupon: todayCoupon() }

  const coupon = {
    code: makeCode(tier.percent),
    percent: tier.percent,
    score,
    date: todayKey(),
    claimedAt: Date.now(),
  }
  const list = readCoupons()
  list.unshift(coupon)
  writeCoupons(list)
  try {
    localStorage.setItem(KEY_LAST_DATE, coupon.date)
  } catch {
    // ignore storage failures
  }
  return { ok: true, coupon }
}
