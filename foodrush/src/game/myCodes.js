/**
 * Display model cho "Mã giảm giá của tôi".
 *
 * Nguồn dữ liệu thật (không có field nào được tự thêm):
 *   - IssuedVoucherResponse (GET /api/my-vouchers):
 *       id, code, voucherName, discountValue, usageInstructions,
 *       issuedAt, redemptionDate, status, usedAt
 *   - CouponResponse (GET /api/coupons/my):
 *       id, code, discountPercent, status, issuedDate, createdAt, redeemedAt
 *
 * Lưu ý nghiệp vụ: IssuedVoucher (voucher đổi bằng coin) KHÔNG có ngày hết
 * hạn — dùng bao lâu cũng được. Coupon (thưởng theo điểm) thì CÓ hạn dùng,
 * và BE tự tính status EXPIRED, nên ta hiển thị đúng trạng thái API trả về
 * thay vì giấu đi.
 */

export const VOUCHER_STATUS = {
  USABLE: 'usable',
  USED: 'used',
  EXPIRED: 'expired',
}

const STATUS_META = {
  [VOUCHER_STATUS.USABLE]: { label: 'Có thể dùng', hint: 'Sẵn sàng dùng tại quầy Five Star' },
  [VOUCHER_STATUS.USED]: { label: 'Đã sử dụng', hint: 'Mã này đã được quét tại cửa hàng' },
  [VOUCHER_STATUS.EXPIRED]: { label: 'Đã hết hạn', hint: 'Mã này đã quá thời gian áp dụng' },
}

export function normalizeStatus(raw) {
  const s = String(raw ?? '').toUpperCase()
  if (s === 'REDEEMED' || s === 'USED') return VOUCHER_STATUS.USED
  if (s === 'EXPIRED') return VOUCHER_STATUS.EXPIRED
  return VOUCHER_STATUS.USABLE
}

function formatDateTime(value) {
  if (!value) return ''
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return String(value)
  return date.toLocaleDateString('vi-VN')
}

function toTime(value) {
  if (!value) return 0
  const t = new Date(value).getTime()
  return Number.isNaN(t) ? 0 : t
}

/**
 * Định dạng giá trị phần thưởng từ dữ liệu thật. API chỉ có `discountValue`
 * (string tự do) và `discountPercent` (số) — không có minOrder/maxDiscount.
 */
export function formatReward({ percent, discountValue, fallback = 'Voucher' }) {
  if (Number.isFinite(Number(percent)) && Number(percent) > 0) {
    return `-${Number(percent)}%`
  }

  const raw = String(discountValue ?? '').trim()
  if (!raw) return fallback

  if (raw.startsWith('-')) return raw
  if (/%$/.test(raw)) return `-${raw}` // '20%' -> '-20%'
  if (/đ$/i.test(raw)) return `-${raw}` // '50.000đ' -> '-50.000đ'
  return `Tặng ${raw}` // '1 phần' -> 'Tặng 1 phần'
}

function fromCoupons(coupons) {
  return (coupons || []).map((c) => {
    const status = normalizeStatus(c.status)
    return {
      key: `coupon-${c.id ?? c.code}`,
      source: 'coupon',
      code: c.code,
      title: `Giảm ${c.discountPercent ?? 0}%`,
      reward: formatReward({ percent: c.discountPercent, discountValue: null, fallback: 'Voucher' }),
      status,
      usage: 'Xuất trình mã này tại quầy Five Star để nhận ưu đãi.',
      // Coupon có hạn dùng thật trong hệ thống nên hiện ngày nhận cho dễ tra cứu.
      acquiredLabel: formatDateTime(c.issuedDate || c.createdAt),
      usedLabel: formatDateTime(c.redeemedAt),
      sortAt: toTime(c.issuedDate || c.createdAt),
      usedSortAt: toTime(c.redeemedAt),
    }
  })
}

function fromIssuedVouchers(issuedVouchers) {
  return (issuedVouchers || []).map((v) => {
    const status = normalizeStatus(v.status)
    return {
      key: `voucher-${v.id ?? v.code}`,
      source: 'voucher',
      code: v.code,
      title: v.voucherName ?? 'Voucher',
      reward: formatReward({ percent: null, discountValue: v.discountValue }),
      status,
      usage: v.usageInstructions || 'Xuất trình mã này tại cửa hàng Five Star để nhận voucher.',
      // Không có ngày hết hạn — chỉ ghi ngày nhận.
      acquiredLabel: formatDateTime(v.issuedAt || v.redemptionDate),
      usedLabel: formatDateTime(v.usedAt),
      sortAt: toTime(v.issuedAt || v.redemptionDate),
      usedSortAt: toTime(v.usedAt),
    }
  })
}

/** Gộp coupon + issued voucher, không mutate mảng gốc từ API. */
export function buildVoucherCards(coupons, issuedVouchers) {
  return [...fromIssuedVouchers(issuedVouchers), ...fromCoupons(coupons)]
}

/**
 * Sắp xếp: voucher dùng được → mới nhận trước; voucher đã dùng → dùng gần
 * nhất trước. Tuyệt đối không sort theo hạn dùng.
 */
export function sortVoucherCards(cards) {
  return [...cards].sort((a, b) => {
    const aUsable = a.status === VOUCHER_STATUS.USABLE
    const bUsable = b.status === VOUCHER_STATUS.USABLE
    if (aUsable !== bUsable) return aUsable ? -1 : 1
    const at = aUsable ? a.sortAt : a.usedSortAt
    const bt = bUsable ? b.sortAt : b.usedSortAt
    if (at !== bt) return bt - at
    return String(a.code ?? '').localeCompare(String(b.code ?? ''))
  })
}

export function statusMeta(status) {
  return STATUS_META[status] ?? STATUS_META[VOUCHER_STATUS.USABLE]
}

/** Chỉ voucher còn dùng được mới được sao chép mã. */
export function isCopyable(status) {
  return status === VOUCHER_STATUS.USABLE
}
