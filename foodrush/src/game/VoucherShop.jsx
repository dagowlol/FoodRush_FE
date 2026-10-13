import { useEffect, useState } from 'react'
import {
  fetchVouchers,
  fetchWallet,
  fetchRedemptionStatus,
  redeemVoucher,
} from './voucherApi'

export default function VoucherShop({ user, onClose }) {
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
      } else {
        setMessage(res.error || 'Redemption failed.')
        setConfirming(null)
      }
    } finally {
      setRedeeming(false)
    }
  }

  return (
    <div className="overlay" role="dialog" aria-modal="true">
      <div className="result-card" style={{ maxWidth: 880, width: '95%' }}>
        <h2 style={{ marginTop: 0 }}>Voucher Shop</h2>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
          <div>Coin balance: <b>{balance !== null ? balance : '...'}</b></div>
          <button className="btn btn--ghost" onClick={onClose}>Close</button>
        </div>
        {status && !status.canRedeemToday && (
          <p style={{ color: '#b00' }}>{status.message}</p>
        )}
        {message && <p style={{ color: '#b00' }}>{message}</p>}
        {loading ? (
          <p>Loading...</p>
        ) : allOutOfStock ? (
          <p>All rewards have been claimed. You can still play and earn coins.</p>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 12 }}>
            {vouchers.map((v) => {
              const disabled =
                !canRedeemToday ||
                v.outOfStock ||
                !v.active ||
                (balance !== null && balance < v.priceCoins)
              return (
                <div key={v.id} style={{ border: '1px solid #ddd', borderRadius: 8, padding: 12 }}>
                  <h3 style={{ margin: '0 0 4px' }}>{v.name}</h3>
                  <p style={{ margin: '0 0 8px', fontSize: 13 }}>{v.description || v.discountValue}</p>
                  <div>Price: <b>{v.priceCoins}</b> coins</div>
                  <div>Stock: <b>{v.remainingStock}</b></div>
                  <div>Status: {v.outOfStock ? 'Out of stock' : (v.active ? 'Active' : 'Inactive')}</div>
                  <button
                    type="button"
                    className="btn btn--primary"
                    style={{ marginTop: 8 }}
                    disabled={disabled}
                    onClick={() => setConfirming(v)}
                  >
                    {v.outOfStock ? 'Out of stock' : 'Redeem'}
                  </button>
                  {balance !== null && balance < v.priceCoins && !v.outOfStock && (
                    <div style={{ fontSize: 12, color: '#b00', marginTop: 4 }}>Not enough coins</div>
                  )}
                </div>
              )
            })}
          </div>
        )}

        {confirming && (
          <div style={{ marginTop: 16, border: '1px solid #ccc', padding: 12, borderRadius: 8 }}>
            <p>Redeem <b>{confirming.name}</b> for <b>{confirming.priceCoins}</b> coins?</p>
            <div style={{ display: 'flex', gap: 8 }}>
              <button className="btn btn--primary" onClick={handleRedeem} disabled={redeeming}>
                {redeeming ? 'Redeeming...' : 'Confirm'}
              </button>
              <button className="btn" onClick={() => setConfirming(null)} disabled={redeeming}>Cancel</button>
            </div>
          </div>
        )}

        {issued && (
          <div style={{ marginTop: 16, border: '2px solid #2a7', padding: 12, borderRadius: 8 }}>
            <h3>Redemption successful!</h3>
            <div>Voucher: <b>{issued.voucherName}</b></div>
            <div>Code: <b>{issued.code}</b></div>
            <div>Redemption date: <b>{issued.redemptionDate}</b></div>
            <div>{issued.usageInstructions}</div>
            <button className="btn" onClick={() => setIssued(null)} style={{ marginTop: 8 }}>OK</button>
          </div>
        )}
      </div>
    </div>
  )
}