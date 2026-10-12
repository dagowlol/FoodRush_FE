import { getCoupons, turnsLeftToday } from './coupons'
import CouponCode from './CouponCode'

function formatDate(key) {
  const [y, m, d] = key.split('-')
  return `${d}/${m}/${y}`
}

export default function CouponList({ onClose }) {
  const coupons = getCoupons()
  const turnsLeft = turnsLeftToday()

  return (
    <div className="overlay overlay--coupons" role="dialog" aria-modal="true">
      <div className="coupon-card">
        <h2 className="coupon-title">🎟️ Mã giảm giá của tôi</h2>
        <p className={`coupon-status ${turnsLeft ? 'is-available' : 'is-used'}`}>
          {turnsLeft
            ? 'Hôm nay bạn còn 1 lượt đổi mã.'
            : 'Hôm nay bạn đã dùng lượt đổi mã. Mai quay lại nhé!'}
        </p>

        {coupons.length === 0 ? (
          <p className="coupon-empty">Chưa có mã nào. Hãy chơi và đổi điểm lấy mã nhé!</p>
        ) : (
          <ul className="coupon-list">
            {coupons.map((coupon) => (
              <li key={coupon.code} className="coupon-item">
                <CouponCode coupon={coupon} />
                <span className="coupon-item__meta">
                  {formatDate(coupon.date)} · {coupon.score} điểm
                </span>
              </li>
            ))}
          </ul>
        )}

        <div className="coupon-actions">
          <button type="button" className="btn btn--ghost" onClick={onClose}>
            Đóng
          </button>
        </div>
      </div>
    </div>
  )
}
