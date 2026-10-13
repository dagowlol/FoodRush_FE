import { useState } from 'react'
import { tierForScore, nextTierForScore, todayCoupon, claimCoupon } from './coupons'
import CouponCode from './CouponCode'

export default function ResultScreen({ result, onRestart, onExit }) {
  const [claimed, setClaimed] = useState(() => todayCoupon())
  const [justClaimed, setJustClaimed] = useState(false)

  if (!result) return null

  const tier = tierForScore(result.score)
  const next = nextTierForScore(result.score)
  const won = Boolean(tier)

  const handleClaim = () => {
    const res = claimCoupon(result.score)
    if (res.ok) {
      setClaimed(res.coupon)
      setJustClaimed(true)
    } else if (res.coupon) {
      setClaimed(res.coupon)
    }
  }

  return (
    <div className="overlay overlay--result" role="dialog" aria-modal="true">
      <div className="result-card">
        <h2 className="result-title">{won ? 'Tuyệt vời!' : 'Hết mạng!'}</h2>

        <div className={`result-safety ${won ? 'is-safe' : 'is-bad'}`}>
          {won
            ? ` Bạn đã mở khóa mã giảm ${tier.percent}%!`
            : next
              ? ` Cố lên! Chỉ cần thêm ${next.minScore - result.score} điểm để mở khóa mã giảm ${next.percent}%.`
              : ' Chưa đạt mốc nhận mã — cố thêm chút nữa nhé!'}
        </div>

        <div className="result-grid">
          <div className="result-cell">
            <span>Điểm</span>
            <b>{result.score}</b>
          </div>
          <div className="result-cell">
            <span>Bug tiêu diệt</span>
            <b>{result.bugsKilled}</b>
          </div>
          <div className="result-cell">
            <span>Ưu đãi</span>
            <b style={{ color: tier ? 'var(--brand-red)' : 'inherit' }}>
              {tier ? `${tier.percent}%` : '0%'}
            </b>
          </div>
        </div>

        <div className="coupon-box">
          <div className="coupon-box__title">🎟️ Đổi điểm lấy mã giảm giá</div>

          {claimed ? (
            <>
              <CouponCode coupon={claimed} />
              <p className="coupon-box__note">
                {justClaimed ? 'Bạn đã nhận mã hôm nay!' : 'Hôm nay bạn đã nhận mã.'} Mai quay lại đổi
                tiếp nhé!
              </p>
            </>
          ) : tier ? (
            <>
              <p className="coupon-box__note">
                Bạn đủ điều kiện nhận mã giảm <b>{tier.percent}%</b> (1 lượt/ngày).
              </p>
              <button type="button" className="btn btn--primary" onClick={handleClaim}>
                Nhận mã {tier.percent}%
              </button>
            </>
          ) : (
            <p className="coupon-box__note">
              {next
                ? `Cần thêm ${next.minScore - result.score} điểm để nhận mã ${next.percent}%.`
                : 'Chưa đủ điểm để đổi mã.'}
            </p>
          )}
        </div>

        <div className="result-actions">
          <button type="button" className="btn btn--primary" onClick={onRestart}>
            ↻ Chơi lại
          </button>
          <button type="button" className="btn btn--ghost" onClick={onExit}>
            Về menu
          </button>
        </div>
      </div>
    </div>
  )
}
