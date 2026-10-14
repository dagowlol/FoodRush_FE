/**
 * Phân loại lỗi khi đổi voucher để hiển thị đúng thông điệp cho người dùng.
 *
 * Backend trả về ApiResponse.error(...) với HTTP status khác nhau:
 *   409 VOUCHER_OUT_OF_STOCK     "Voucher này đã hết"
 *   409 VOUCHER_REDEEMED_TODAY  "Bạn đã đổi voucher này hôm nay"
 *   400 VOUCHER_INACTIVE         "Voucher này hiện không hoạt động"
 *   400 INSUFFICIENT_COINS       "Bạn không đủ coin để đổi voucher này"
 *
 * Không đoán mò theo chuỗi tiếng Việt là chính; ưu tiên status trước, chuỗi
 * message chỉ là dự phòng khi backend đổi nội dung.
 */

export const REDEEM_ERROR = {
  OUT_OF_STOCK: 'out-of-stock',
  REDEEMED_TODAY: 'redeemed-today',
  INACTIVE: 'inactive',
  NO_COINS: 'no-coins',
  UNKNOWN: 'unknown',
}

const COPY = {
  [REDEEM_ERROR.OUT_OF_STOCK]: {
    title: 'Đã hết lượt đổi',
    message:
      'Voucher này vừa được người khác đổi mất lượt cuối. Bạn có thể chọn voucher khác hoặc quay lại sau.',
  },
  [REDEEM_ERROR.REDEEMED_TODAY]: {
    title: 'Bạn đã đổi voucher hôm nay',
    message:
      'Mỗi ngày chỉ được đổi 1 voucher. Hãy dùng mã đã đổi ở mục “Mã của tôi” hoặc quay lại vào ngày mai nhé.',
  },
  [REDEEM_ERROR.INACTIVE]: {
    title: 'Voucher đang tạm dừng',
    message: 'Voucher này tạm thời không nhận đổi. Bạn có thể chọn voucher khác.',
  },
  [REDEEM_ERROR.NO_COINS]: {
    title: 'Chưa đủ FiveCoin',
    message: 'Số dư của bạn chưa đủ để đổi voucher này. Chơi thêm để tích coin nhé.',
  },
  [REDEEM_ERROR.UNKNOWN]: {
    title: 'Không đổi được voucher',
    message: 'Đã có lỗi xảy ra khi đổi voucher. Vui lòng thử lại sau.',
  },
}

export function classifyRedeemError({ status, error } = {}) {
  const text = String(error ?? '').toLowerCase()

  if (status === 409 || text.includes('đã hết') || text.includes('het stock')) {
    return REDEEM_ERROR.OUT_OF_STOCK
  }
  if (text.includes('hôm nay')) return REDEEM_ERROR.REDEEMED_TODAY
  if (status === 400 && (text.includes('không hoạt động') || text.includes('tạm dừng'))) {
    return REDEEM_ERROR.INACTIVE
  }
  if (status === 400 && (text.includes('không đủ coin') || text.includes('không đủ'))) {
    return REDEEM_ERROR.NO_COINS
  }
  return REDEEM_ERROR.UNKNOWN
}

export function redeemErrorCopy(kind) {
  return COPY[kind] ?? COPY[REDEEM_ERROR.UNKNOWN]
}
