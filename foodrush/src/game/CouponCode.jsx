import { useState } from 'react'

export default function CouponCode({ coupon }) {
  const [copied, setCopied] = useState(false)

  const isActive = !['REDEEMED', 'USED', 'EXPIRED'].includes(String(coupon.status).toUpperCase())

  const copy = async () => {
    if (!isActive) return
    try {
      await navigator.clipboard.writeText(coupon.code)
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    } catch {
      // clipboard unavailable; the code is still visible to copy manually
    }
  }

  const badge =
    Number.isFinite(coupon.percent) && coupon.percent > 0
      ? `-${coupon.percent}%`
      : coupon.discountValue || coupon.name || 'Voucher'

  return (
    <button
      type="button"
      className={`coupon-code ${isActive ? '' : 'is-inactive'}`}
      onClick={copy}
      disabled={!isActive}
      title={isActive ? 'Bấm để sao chép mã' : 'Mã đã được sử dụng hoặc hết hạn'}
    >
      <span className="coupon-code__percent">{badge}</span>
      <span className="coupon-code__value">{coupon.code}</span>
      <span className="coupon-code__copy">{isActive ? (copied ? '✓ Đã chép' : '📋 Chép') : ''}</span>
    </button>
  )
}
