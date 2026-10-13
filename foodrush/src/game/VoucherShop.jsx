import { useEffect, useState } from 'react'
import {
  fetchVouchers,
  fetchWallet,
  fetchRedemptionStatus,
  redeemVoucher,
} from './voucherApi'

export default function VoucherShop({ user, onClose, onRedeemed }) {
  const [vouchers, setVouchers] = useState([])
  const [balance, setBalance] = useState(null)
  const [status, setStatus] = useState(null)
  const [loading, setLoading] = useState(true)
  const [message, setMessage] = useState('')
  const [confirming, setConfirming] = useState(null)
  const [issued, setIssued] = useState(null)
  const [redeeming, setRedeeming] = useState(false)

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
  const allOutOfStock = vouchers.length > 0 && vouchers.every((v) => v.outOfStock || !v.active)

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
        setMessage(res.error || 'Redemption failed.')
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
        ) : allOutOfStock ? (
          <p>Tất cả phần thưởng đã được nhận. Bạn vẫn có thể chơi để kiếm coin.</p>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 12 }}>
            {vouchers.map((v) => {
              const disabled =
                !canRedeemToday ||
                v.outOfStock ||
                !v.active ||
                (balance !== null && balance < v.priceCoins)
              return (
                <div key={v.id} style={{ border: '1px solid #ddd', borderRadius: 8, padding: 12, overflow: 'hidden' }}>
                  {v.imageUrl ? (
                    <img
                      src={v.imageUrl}
                      alt={v.name}
                      style={{ width: '100%', height: 140, objectFit: 'cover', borderRadius: 6, marginBottom: 8, background: '#f4e7cf' }}
                      onError={(e) => { e.currentTarget.style.display = 'none' }}
                    />
                  ) : (
                    <div style={{ width: '100%', height: 140, borderRadius: 6, marginBottom: 8, background: '#f4e7cf', display: 'grid', placeItems: 'center', color: '#8a6a3b' }}>
                      Chưa có ảnh
                    </div>
                  )}
                  <h3 style={{ margin: '0 0 4px' }}>{v.name}</h3>
                  <p style={{ margin: '0 0 8px', fontSize: 13 }}>{v.description || v.discountValue}</p>
                  <div>Giá: <b>{v.priceCoins}</b> coin</div>
                  <div>Tồn kho: <b>{v.remainingStock}</b></div>
                  <div>Trạng thái: {v.outOfStock ? 'Hết hàng' : (v.active ? 'Đang hoạt động' : 'Đã tắt')}</div>
                  <button
                    type="button"
                    className="btn btn--primary"
                    style={{ marginTop: 8 }}
                    disabled={disabled}
                    onClick={() => setConfirming(v)}
                  >
                    {v.outOfStock ? 'Hết hàng' : 'Đổi'}
                  </button>
                  {balance !== null && balance < v.priceCoins && !v.outOfStock && (
                    <div style={{ fontSize: 12, color: '#b00', marginTop: 4 }}>Không đủ coin</div>
                  )}
                </div>
              )
            })}
          </div>
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