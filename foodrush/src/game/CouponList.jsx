import { useEffect, useState } from 'react'
import CouponCode from './CouponCode'

function formatDate(value) {
  if (!value) return ''
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return String(value)
  return date.toLocaleDateString('vi-VN')
}

// Coupon (thưởng game) dùng CouponStatus, voucher (đổi bằng coin) dùng
// IssuedVoucherStatus — cả hai cùng dùng chuỗi trạng thái nên gộp về 3 nhóm.
function statusInfo(coupon) {
  const status = String(coupon.status ?? '').toUpperCase()
  if (status === 'REDEEMED' || status === 'USED') {
    return { key: 'used', label: 'Đã đổi' }
  }
  if (status === 'EXPIRED') {
    return { key: 'expired', label: 'Hết hạn' }
  }
  return { key: 'active', label: 'Còn hiệu lực' }
}

export default function CouponList({ coupons: incomingCoupons, onClose, onRefresh }) {
  const [coupons, setCoupons] = useState([])

  useEffect(() => {
    setCoupons(Array.isArray(incomingCoupons) ? incomingCoupons : [])
  }, [incomingCoupons])

  return (
    <div className="overlay overlay--coupons" role="dialog" aria-modal="true">
      <div className="coupon-card">
        <h2 className="coupon-title">🎟️ Mã giảm giá của tôi</h2>
        <p className="coupon-status is-available">Lịch sử mã từ tài khoản của bạn.</p>

        {coupons.length === 0 ? (
          <p className="coupon-empty">Chưa có mã nào. Hãy chơi và đổi điểm lấy mã nhé!</p>
        ) : (
          <ul className="coupon-list">
            {coupons.map((coupon) => {
              const status = statusInfo(coupon)
              return (
                <li
                  key={coupon.key || coupon.code}
                  className={`coupon-item is-${status.key}`}
                >
                  <div className="coupon-item__head">
                    <CouponCode coupon={coupon} />
                    <span className={`coupon-item__status is-${status.key}`}>{status.label}</span>
                  </div>
                  <span className="coupon-item__meta">
                    {coupon.name ? `${coupon.name} · ` : ''}
                    {formatDate(coupon.issuedDate || coupon.date)}
                    {coupon.usedAt || coupon.redeemedAt
                      ? ` · Đổi lúc ${formatDate(coupon.usedAt || coupon.redeemedAt)}`
                      : ''}
                  </span>
                </li>
              )
            })}
          </ul>
        )}

        <div className="coupon-actions">
          {onRefresh && (
            <button type="button" className="btn btn--ghost" onClick={onRefresh}>
              Làm mới
            </button>
          )}
          <button type="button" className="btn btn--primary" onClick={onClose}>
            Đóng
          </button>
        </div>
      </div>
    </div>
  )
}