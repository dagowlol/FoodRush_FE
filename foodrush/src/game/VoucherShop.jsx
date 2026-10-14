import { useEffect, useMemo, useState } from 'react'
import {
  fetchVouchers,
  fetchWallet,
  fetchRedemptionStatus,
  redeemVoucher,
} from './voucherApi'
import couponDefault from '../assets/coupon_default.png'
const SORT_OPTIONS = [
  { id: 'featured', label: 'Nổi bật' },
  { id: 'price-asc', label: 'Giá: thấp → cao' },
  { id: 'price-desc', label: 'Giá: cao → thấp' },
  { id: 'stock-desc', label: 'Tồn kho nhiều nhất' },
  { id: 'name-asc', label: 'Tên A → Z' },
]

function parseDiscount(discountValue) {
  if (!discountValue) return null
  const match = String(discountValue).match(/(\d+(?:[.,]\d+)?)/)
  if (!match) return null
  const value = Number(match[1].replace(',', '.'))
  return Number.isFinite(value) ? value : null
}

export default function VoucherShop({ onClose, onRedeemed }) {
  const [vouchers, setVouchers] = useState([])
  const [balance, setBalance] = useState(null)
  const [status, setStatus] = useState(null)
  const [loading, setLoading] = useState(true)
  const [message, setMessage] = useState('')
  const [confirming, setConfirming] = useState(null)
  const [issued, setIssued] = useState(null)
  const [redeeming, setRedeeming] = useState(false)

  const [keyword, setKeyword] = useState('')
  const [onlyAffordable, setOnlyAffordable] = useState(false)
  const [sort, setSort] = useState('featured')

  const refresh = async () => {
    setLoading(true)
    try {
      const [vs, w, rs] = await Promise.all([fetchVouchers(), fetchWallet(), fetchRedemptionStatus()])
      setVouchers(vs)
      if (w) setBalance(w.balance)
      setStatus(rs)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    refresh()
  }, [])

  const canRedeemToday = status?.canRedeemToday !== false

  // Voucher het hang hoac da bi admin tat khong con hien thi cho khach.
  const purchasable = useMemo(
    () => vouchers.filter((v) => v.active && !v.outOfStock),
    [vouchers]
  )

  // Chi khi so du cua khach duoc nhieu hon gia re nhat moi co y nghia.
  const affordableToggleDisabled = useMemo(() => {
    if (balance === null || purchasable.length === 0) return true
    return balance >= Math.min(...purchasable.map((v) => v.priceCoins))
  }, [balance, purchasable])

  const visibleVouchers = useMemo(() => {
    const kw = keyword.trim().toLowerCase()

    const filtered = purchasable.filter((v) => {
      if (onlyAffordable && balance !== null && balance < v.priceCoins) return false
      if (!kw) return true
      const haystack = `${v.name} ${v.description ?? ''} ${v.discountValue ?? ''}`.toLowerCase()
      return haystack.includes(kw)
    })

    const sorted = [...filtered]
    switch (sort) {
      case 'price-asc':
        sorted.sort((a, b) => a.priceCoins - b.priceCoins)
        break
      case 'price-desc':
        sorted.sort((a, b) => b.priceCoins - a.priceCoins)
        break
      case 'stock-desc':
        sorted.sort((a, b) => b.remainingStock - a.remainingStock)
        break
      case 'name-asc':
        sorted.sort((a, b) => a.name.localeCompare(b.name, 'vi'))
        break
      default:
        // "Noi bat": uu tien muc giam cao, sau do gia thap.
        sorted.sort((a, b) => {
          const da = parseDiscount(a.discountValue) ?? 0
          const db = parseDiscount(b.discountValue) ?? 0
          if (db !== da) return db - da
          return a.priceCoins - b.priceCoins
        })
    }
    return sorted
  }, [purchasable, keyword, onlyAffordable, balance, sort])

  const hasActiveFilter = keyword.trim() !== '' || onlyAffordable || sort !== 'featured'

  const resetFilters = () => {
    setKeyword('')
    setOnlyAffordable(false)
    setSort('featured')
  }

  const handleRedeem = async () => {
    if (!confirming) return
    setRedeeming(true)
    setMessage('')
    try {
      const res = await redeemVoucher(confirming.id)
      if (res.ok) {
        setIssued(res.voucher)
        setConfirming(null)
        await refresh()
        // Let the parent refresh the "Mã của tôi" list right away.
        onRedeemed?.()
      } else {
        setMessage(res.error || 'Không đổi được voucher.')
        setConfirming(null)
      }
    } finally {
      setRedeeming(false)
    }
  }

  return (
    <div className="overlay" style={{ alignItems: 'flex-start', overflowY: 'auto', padding: '24px 18px' }} role="dialog" aria-modal="true">
      <div className="result-card" style={{ maxWidth: 880, width: '95%', maxHeight: '88vh', overflow: 'auto' }}>
        <h2 style={{ marginTop: 0 }}>Cửa hàng voucher</h2>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
          <div>Số coin: <b>{balance !== null ? balance : '...'}</b></div>
          <button className="btn btn--ghost" onClick={onClose}>Đóng</button>
        </div>
        {status && !status.canRedeemToday && (
          <p style={{ color: '#b00' }}>{status.message}</p>
        )}
        {message && <p style={{ color: '#b00' }}>{message}</p>}

        {loading ? (
          <p>Đang tải...</p>
        ) : purchasable.length === 0 ? (
          <p>Tất cả phần thưởng đã được nhận. Bạn vẫn có thể chơi để kiếm coin.</p>
        ) : (
          <>
            <div className="shop-filters">
              <div className="shop-filters__row">
                <input
                  type="search"
                  className="shop-filter-input"
                  placeholder="Tìm theo tên hoặc mô tả..."
                  value={keyword}
                  onChange={(e) => setKeyword(e.target.value)}
                  aria-label="Tìm voucher"
                />

                <select
                  className="shop-filter-select"
                  value={sort}
                  onChange={(e) => setSort(e.target.value)}
                  aria-label="Sắp xếp"
                >
                  {SORT_OPTIONS.map((opt) => (
                    <option key={opt.id} value={opt.id}>{opt.label}</option>
                  ))}
                </select>

                <label className={`shop-filter-check ${affordableToggleDisabled ? 'is-disabled' : ''}`}>
                  <input
                    type="checkbox"
                    checked={onlyAffordable}
                    onChange={(e) => setOnlyAffordable(e.target.checked)}
                    disabled={affordableToggleDisabled}
                  />
                  Chỉ hiện voucher đủ coin
                </label>

                <span className="shop-filter-count">
                  {visibleVouchers.length}/{purchasable.length}
                </span>

                {hasActiveFilter && (
                  <button type="button" className="shop-filter-reset" onClick={resetFilters}>
                    ✕ Xóa lọc
                  </button>
                )}
              </div>
            </div>

            {visibleVouchers.length === 0 ? (
              <p className="shop-empty">
                Không có voucher nào khớp bộ lọc.{' '}
                <button type="button" className="shop-filter-reset" onClick={resetFilters}>
                  Xóa lọc
                </button>
              </p>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 12 }}>
                {visibleVouchers.map((v) => {
                  const affordable = balance === null || balance >= v.priceCoins
                  const disabled = !canRedeemToday || !affordable
                  const discount = parseDiscount(v.discountValue)
                  return (
                    <div key={v.id} className="shop-item">
                      {v.imageUrl ? (
                        <img
                          src={v.imageUrl}
                          alt={v.name}
                          className="shop-item__img"
                          onError={(e) => { e.currentTarget.src = couponDefault }}                        />
                      ) : (
                        <img
                          src={couponDefault}
                          alt={v.name}
                          className="shop-item__img"
                        />
                      )}

                      {discount !== null && discount <= 100 && (
                        <span className="shop-item__ribbon">-{discount}%</span>
                      )}

                      <h3 className="shop-item__name">{v.name}</h3>
                      <p className="shop-item__desc">{v.description || v.discountValue}</p>

                      <div className="shop-item__meta">
                        <span>🪙 <b>{v.priceCoins.toLocaleString('vi-VN')}</b> coin</span>
                        <span className="shop-item__stock">
                          Còn <b>{v.remainingStock.toLocaleString('vi-VN')}</b>
                        </span>
                      </div>

                      <button
                        type="button"
                        className="btn btn--primary shop-item__btn"
                        disabled={disabled}
                        onClick={() => setConfirming(v)}
                      >
                        Đổi
                      </button>

                      {!affordable && (
                        <div className="shop-item__warn">
                          Thiếu {(v.priceCoins - balance).toLocaleString('vi-VN')} coin
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            )}
          </>
        )}

        {confirming && (
          <div
            className="overlay overlay--modal"
            role="dialog"
            aria-modal="true"
            onClick={(e) => {
              if (e.target === e.currentTarget && !redeeming) setConfirming(null)
            }}
          >
            <div className="confirm-card">
              <div className="confirm-card__icon">🎟️</div>
              <h3 className="confirm-card__title">Xác nhận đổi voucher</h3>
              <p className="confirm-card__text">
                Bạn có muốn đổi <b>{confirming.name}</b> với <b>{confirming.priceCoins} coin</b> không?
              </p>

              <div className="confirm-card__summary">
                <div className="confirm-card__row">
                  <span>Voucher</span>
                  <b>{confirming.name}</b>
                </div>
                <div className="confirm-card__row">
                  <span>Chi phí</span>
                  <b>-{confirming.priceCoins} coin</b>
                </div>
                <div className="confirm-card__row">
                  <span>Số dư còn lại</span>
                  <b className="is-warn">
                    {balance !== null
                      ? `${Math.max(0, balance - confirming.priceCoins).toLocaleString('vi-VN')} coin`
                      : '...'}
                  </b>
                </div>
              </div>

              {confirming.usageInstructions && (
                <p className="confirm-card__note">{confirming.usageInstructions}</p>
              )}

              <div className="confirm-card__actions">
                <button
                  type="button"
                  className="btn btn--primary"
                  onClick={handleRedeem}
                  disabled={redeeming}
                >
                  {redeeming ? 'Đang đổi...' : 'Xác nhận đổi'}
                </button>
                <button
                  type="button"
                  className="btn btn--ghost"
                  onClick={() => setConfirming(null)}
                  disabled={redeeming}
                >
                  Hủy
                </button>
              </div>
            </div>
          </div>
        )}

        {issued && (
          <div className="overlay overlay--modal" role="dialog" aria-modal="true">
            <div className="confirm-card is-success">
              <div className="confirm-card__icon">🎉</div>
              <h3 className="confirm-card__title">Đổi voucher thành công!</h3>
              <div className="confirm-card__summary">
                <div className="confirm-card__row">
                  <span>Voucher</span>
                  <b>{issued.voucherName}</b>
                </div>
                <div className="confirm-card__row">
                  <span>Mã</span>
                  <b>{issued.code}</b>
                </div>
                <div className="confirm-card__row">
                  <span>Ngày đổi</span>
                  <b>{issued.redemptionDate}</b>
                </div>
              </div>
              {issued.usageInstructions && (
                <p className="confirm-card__note">{issued.usageInstructions}</p>
              )}
              <div className="confirm-card__actions">
                <button type="button" className="btn btn--primary" onClick={() => setIssued(null)}>
                  OK
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}