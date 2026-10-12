import { useState } from 'react'
import { tierForScore, nextTierForScore, todayCoupon, claimCoupon } from './coupons'
import { sound } from './sound'
import CouponCode from './CouponCode'

export default function ResultScreen({ result, onRestart, onExit }) {
  const [claimed, setClaimed] = useState(() => todayCoupon())
  const [justClaimed, setJustClaimed] = useState(false)

  if (!result) return null

  const won = result.victory
  const tier = tierForScore(result.score)
  const next = nextTierForScore(result.score)

  const handleClaim = () => {
    const res = claimCoupon(result.score)
    if (res.ok) {
      setClaimed(res.coupon)
      setJustClaimed(true)
      sound.play('win')
    } else if (res.coupon) {
      setClaimed(res.coupon)
    }
  }

  return (
    <div className="overlay overlay--result" role="dialog" aria-modal="true">
      <div className="result-card">
        <div className="result-burst" aria-hidden="true">
          {won ? '🎉' : '😢'}
        </div>
        <h2 className="result-title">{won ? 'Tuyệt vời!' : 'Hết mạng!'}</h2>

        <div className={`result-safety ${won ? 'is-safe' : 'is-bad'}`}>
          {won ? '🛡️ Bảo vệ thành công đồ ăn' : '💔 Bạn đã để mất hết đồ ăn'}
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
            <span>Wave</span>
            <b>
              {result.wavesCompleted}/{result.totalWaves}
            </b>
          </div>
        </div>

        <div className="result-lives">
          Mạng còn lại: <b>{result.lives}</b>/{result.maxLives}
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
