import { useCallback, useEffect, useState } from 'react'
import { fetchMyCouponsStrict } from './couponApi'
import { fetchMyVouchersStrict, apiEnabled } from './voucherApi'
import { buildVoucherCards } from './myCodes'

/**
 * Nguồn dữ liệu duy nhất cho "Mã giảm giá của tôi".
 *
 * Gom cả coupon (thưởng điểm) và issued voucher (đổi bằng coin) về một
 * display model, đồng thời quản lý loading / error để ví voucher có thể hiển
 * thị skeleton và nút thử lại thay vì im lặng báo rỗng.
 */
export function useMyVouchers({ enabled = true } = {}) {
  const [cards, setCards] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const load = useCallback(async () => {
    if (!enabled || !apiEnabled()) {
      setCards([])
      setError(null)
      setLoading(false)
      return
    }

    setLoading(true)
    setError(null)
    try {
      const [coupons, issuedVouchers] = await Promise.all([
        fetchMyCouponsStrict(),
        fetchMyVouchersStrict(),
      ])
      setCards(buildVoucherCards(coupons, issuedVouchers))
    } catch {
      // Không lộ lỗi server ra UI.
      setError('Không tải được danh sách mã của bạn.')
    } finally {
      setLoading(false)
    }
  }, [enabled])

  useEffect(() => {
    load()
  }, [load])

  return { cards, loading, error, reload: load }
}
