import { useEffect, useState } from 'react'
import { fetchMyVouchers } from './voucherApi'

export default function MyVouchers({ onClose }) {
  const [vouchers, setVouchers] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchMyVouchers().then((data) => {
      setVouchers(data)
      setLoading(false)
    })
  }, [])

  return (
    <div className="overlay" role="dialog" aria-modal="true">
      <div className="result-card" style={{ maxWidth: 800, width: '95%' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
          <h2 style={{ margin: 0 }}>Voucher của tôi</h2>
          <button className="btn btn--ghost" onClick={onClose}>Đóng</button>
        </div>
        {loading ? <p>Đang tải...</p> : vouchers.length === 0 ? (
          <p>Bạn chưa đổi voucher nào.</p>
        ) : (
          <div style={{ display: 'grid', gap: 8 }}>
            {vouchers.map((v) => (
              <div key={v.id} style={{ border: '1px solid #ddd', borderRadius: 8, padding: 12 }}>
                <div><b>{v.voucherName}</b> ({v.discountValue})</div>
                <div>Mã: <b>{v.code}</b></div>
                <div>Ngày đổi: {v.redemptionDate}</div>
                <div>Trạng thái: {v.status}</div>
                <div style={{ fontSize: 12 }}>{v.usageInstructions}</div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
