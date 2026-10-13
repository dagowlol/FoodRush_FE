import { useEffect, useState } from 'react'
import { getStoredUser, fetchMeApi } from '../game/authApi'
import { validateStaffCoupon, redeemStaffCoupon, fetchStaffRedemptions } from './staffApi'

function formatDate(value) {
  if (!value) return ''
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return String(value)
  return d.toLocaleString('vi-VN')
}

export default function StaffCouponsPage() {
  const [user, setUser] = useState(() => getStoredUser())
  const [code, setCode] = useState('')
  const [validation, setValidation] = useState(null)
  const [note, setNote] = useState('')
  const [redeeming, setRedeeming] = useState(false)
  const [message, setMessage] = useState('')
  const [redeemed, setRedeemed] = useState(null)
  const [history, setHistory] = useState([])
  const [loadingHistory, setLoadingHistory] = useState(true)

  useEffect(() => {
    fetchMeApi().then((fresh) => { if (fresh) setUser(fresh) })
  }, [])

  const refreshHistory = async () => {
    setLoadingHistory(true)
    try {
      setHistory(await fetchStaffRedemptions())
    } finally {
      setLoadingHistory(false)
    }
  }

  useEffect(() => { refreshHistory() }, [])

  const goHome = () => { window.location.assign('/') }

  if (!user) {
    return (
      <div style={{ minHeight: '100vh', display: 'grid', placeItems: 'center', fontFamily: 'sans-serif' }}>
        <div style={{ textAlign: 'center' }}>
          <h2>Vui lòng đăng nhập</h2>
          <button onClick={goHome}>Về trang chính</button>
        </div>
      </div>
    )
  }

  if (user.role !== 'STAFF' && user.role !== 'ADMIN') {
    return (
      <div style={{ minHeight: '100vh', display: 'grid', placeItems: 'center', fontFamily: 'sans-serif' }}>
        <div style={{ textAlign: 'center' }}>
          <h2>Không có quyền truy cập (chỉ STAFF/ADMIN)</h2>
          <button onClick={goHome}>Về trang chính</button>
        </div>
      </div>
    )
  }

  const handleValidate = async (e) => {
    e.preventDefault()
    setMessage('')
    setValidation(null)
    setRedeemed(null)
    if (!code.trim()) return
    try {
      const data = await validateStaffCoupon(code.trim())
      setValidation(data)
    } catch (err) {
      setMessage(err.message || 'Validate failed')
    }
  }

  const handleRedeem = async () => {
    if (!code.trim()) return
    setRedeeming(true)
    setMessage('')
    try {
      const data = await redeemStaffCoupon(code.trim(), note.trim())
      setRedeemed(data)
      setValidation(null)
      setNote('')
      await refreshHistory()
    } catch (err) {
      setMessage(err.message || 'Redeem failed')
    } finally {
      setRedeeming(false)
    }
  }

  return (
    <div style={{ minHeight: '100vh', padding: 24, fontFamily: 'sans-serif', background: '#fff8ec' }}>
      <div style={{ maxWidth: 980, margin: '0 auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <h1 style={{ margin: 0 }}>Staff • Quản lý voucher web</h1>
          <button onClick={goHome}>Về trang chính</button>
        </div>

        {message && <p style={{ color: '#b00' }}>{message}</p>}

        <div style={{ background: '#fff', border: '1px solid #ddd', borderRadius: 8, padding: 16, marginBottom: 16 }}>
          <h3 style={{ marginTop: 0 }}>Kiểm tra / Đổi voucher web (coupon)</h3>
          <form onSubmit={handleValidate} style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <input
              placeholder="Nhập mã coupon"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              style={{ flex: 1, minWidth: 220, padding: 8 }}
            />
            <button type="submit">Kiểm tra</button>
          </form>

          {validation && (
            <div style={{ marginTop: 12, borderTop: '1px solid #eee', paddingTop: 12 }}>
              <div><b>Mã:</b> {validation.code}</div>
              <div><b>Trạng thái:</b> {String(validation.status)}</div>
              <div><b>Hợp lệ:</b> {validation.valid ? 'Có' : 'Không'}</div>
              <div><b>Giảm:</b> {validation.discountPercent}%</div>
              <div><b>Khách:</b> {validation.ownerName}</div>
              <div><b>Ngày phát:</b> {String(validation.issuedDate)}</div>
              <div><b>Hết hạn:</b> {formatDate(validation.expiresAt)}</div>
              <div><b>Thông điệp:</b> {validation.message}</div>

              {validation.valid && (
                <div style={{ marginTop: 12 }}>
                  <input
                    placeholder="Ghi chú (tuỳ chọn)"
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    style={{ width: '100%', padding: 8, marginBottom: 8 }}
                  />
                  <button onClick={handleRedeem} disabled={redeeming}>
                    {redeeming ? 'Đang đổi...' : 'Đổi coupon'}
                  </button>
                </div>
              )}
            </div>
          )}

          {redeemed && (
            <div style={{ marginTop: 12, border: '2px solid #2a7', padding: 12, borderRadius: 8 }}>
              <h4 style={{ margin: '0 0 4px' }}>Đổi thành công</h4>
              <div>Mã: <b>{redeemed.couponCode}</b></div>
              <div>Giảm: <b>{redeemed.discountPercent}%</b></div>
              <div>Khách: {redeemed.customerName}</div>
              <div>Nhân viên: {redeemed.staffName}</div>
              <div>Thời gian: {formatDate(redeemed.redeemedAt)}</div>
            </div>
          )}
        </div>

        <div style={{ background: '#fff', border: '1px solid #ddd', borderRadius: 8, padding: 16 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3 style={{ margin: 0 }}>Lịch sử đổi coupon</h3>
            <button onClick={refreshHistory}>Làm mới</button>
          </div>
          {loadingHistory ? <p>Đang tải...</p> : history.length === 0 ? (
            <p>Chưa có lịch sử.</p>
          ) : (
            <div style={{ overflowX: 'auto', marginTop: 12 }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr>
                    <th>Mã</th><th>Khách</th><th>Giảm</th><th>Nhân viên</th><th>Thời gian</th><th>Ghi chú</th>
                  </tr>
                </thead>
                <tbody>
                  {history.map((h) => (
                    <tr key={h.id}>
                      <td>{h.couponCode}</td>
                      <td>{h.customerName}</td>
                      <td>{h.discountPercent}%</td>
                      <td>{h.staffName}</td>
                      <td>{formatDate(h.redeemedAt)}</td>
                      <td>{h.note}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
