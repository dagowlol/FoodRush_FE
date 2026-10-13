// Coupon tier helpers. Coupon ownership, history, and daily eligibility are now
// authoritative on the backend; these helpers only map a game score to a tier.
import { COUPON_TIERS } from './config'

export function tierForScore(score) {
  let best = null
  for (const tier of COUPON_TIERS) {
    if (score >= tier.minScore) best = tier
  }
  return best
}

export function nextTierForScore(score) {
  return COUPON_TIERS.find((tier) => score < tier.minScore) || null
}