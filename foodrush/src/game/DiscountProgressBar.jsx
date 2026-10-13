import { useMemo } from 'react'
import { COUPON_TIERS, MAX_COUPON_SCORE } from './config'
import { tierForScore, nextTierForScore } from './coupons'

export default function DiscountProgressBar({ score = 0 }) {
  const currentTier = useMemo(() => tierForScore(score), [score])
  const nextTier = useMemo(() => nextTierForScore(score), [score])

  const currentPercent = currentTier ? currentTier.percent : 0
  const progressPct = Math.min(100, Math.max(0, (score / MAX_COUPON_SCORE) * 100))

  return (
    <div className="discount-bar-container" aria-label="Thanh tiến độ giảm giá">
      <div className="discount-bar__meta">
        <div className="discount-bar__status">
          <span className="discount-bar__icon">🎟️</span>
          <span className="discount-bar__label">Mã giảm giá:</span>
          <span className={`discount-bar__badge ${currentPercent > 0 ? 'is-active' : ''}`}>
            {currentPercent > 0 ? `${currentPercent}%` : '0%'}
          </span>
        </div>

        <div className="discount-bar__hint">
          {nextTier ? (
            <span>
              Cần <b>+{nextTier.minScore - score}</b> điểm để mở khóa <b>{nextTier.percent}%</b>
            </span>
          ) : (
            <span className="discount-bar__maxed">👑 Đã mở khóa tối đa 15%!</span>
          )}
        </div>
      </div>

      <div className="discount-bar__track-wrap">
        <div className="discount-bar__track">
          <div
            className="discount-bar__fill"
            style={{ width: `${progressPct}%` }}
          >
            <div className="discount-bar__shimmer" />
          </div>

          {COUPON_TIERS.map((tier) => {
            const isReached = score >= tier.minScore
            const leftPct = (tier.minScore / MAX_COUPON_SCORE) * 100

            return (
              <div
                key={tier.percent}
                className={`discount-milestone ${isReached ? 'is-reached' : ''}`}
                style={{ left: `${leftPct}%` }}
              >
                <div className="discount-milestone__pin">
                  {isReached ? '✓' : ''}
                </div>
                <div className="discount-milestone__label">
                  <span className="discount-milestone__pct">{tier.percent}%</span>
                  <span className="discount-milestone__pts">{tier.minScore}đ</span>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
