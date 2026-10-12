import { useState } from 'react'

export default function CouponCode({ coupon }) {
  const [copied, setCopied] = useState(false)

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(coupon.code)
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    } catch {
      // clipboard unavailable; the code is still visible to copy manually
    }
  }

  return (
    <button type="button" className="coupon-code" onClick={copy} title="Bấm để sao chép mã">
      <span className="coupon-code__percent">-{coupon.percent}%</span>
      <span className="coupon-code__value">{coupon.code}</span>
      <span className="coupon-code__copy">{copied ? '✓ Đã chép' : '📋 Chép'}</span>
    </button>
  )
}
