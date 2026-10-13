import { useEffect, useState } from 'react'
import CouponCode from './CouponCode'

function formatDate(value) {
  if (!value) return ''
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return String(value)
  return date.toLocaleDateString('vi-VN')
}

export default function CouponList({ coupons: incomingCoupons, onClose, onRefresh }) {
  const [coupons, setCoupons] = useState([])

  useEffect(() => {
    setCoupons(Array.isArray(incomingCoupons) ? incomingCoupons : [])
  }, [incomingCoupons])

  const viewCoupons = coupons.map((coupon) => ({
    ...coupon,
    percent: coupon.discountPercent ?? coupon.percent,
  }))

  return (
    <div className="overlay overlay--coupons" role="dialog" aria-modal="true">
      <div className="coupon-card">
        <h2 className="coupon-title">🎟️ Mã giảm giá của tôi</h2>
        <p className="coupon-status is-available">Lịch sử mã từ tài khoản của bạn.</p>

        {viewCoupons.length === 0 ? (
          <p className="coupon-empty">Chưa có mã nào. Hãy chơi và đổi điểm lấy mã nhé!</p>
        ) : (
          <ul className="coupon-list">
            {viewCoupons.map((coupon) => (
              <li key={coupon.code} className="coupon-item">
                <CouponCode coupon={coupon} />
                <span className="coupon-item__meta">
                  {formatDate(coupon.issuedDate || coupon.date)} ·{' '}
                  {coupon.status === 'REDEEMED' ? 'Đã dùng' : coupon.status === 'EXPIRED' ? 'Hết hạn' : 'Còn hiệu lực'}
                </span>
              </li>
            ))}
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