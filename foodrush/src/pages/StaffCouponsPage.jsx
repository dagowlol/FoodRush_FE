import { useEffect, useState } from 'react'
import { getStoredUser, fetchMeApi } from '../game/authApi'
import { validateStaffCoupon, redeemStaffCoupon, fetchStaffRedemptions } from './staffApi'
import './staff.css'

function formatDate(value) {
  if (!value) return ''
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return String(value)
  return d.toLocaleString('vi-VN')
}

const STATUS_LABELS = {
  ACTIVE: 'Còn hiệu lực',
  REDEEMED: 'Đã sử dụng',
  EXPIRED: 'Hết hạn',
}

function GateScreen({ icon, title, description }) {
  return (
    <div className="staff-gate">
      <div className="staff-gate__card">
        <div className="staff-gate__icon">{icon}</div>
        <h2>{title}</h2>
        <p>{description}</p>
        <button type="button" className="staff-btn" onClick={() => window.location.assign('/')}>
          ← Về trang chính
        </button>
      </div>
    </div>
  )
}

export default function StaffCouponsPage() {
  const [user, setUser] = useState(() => getStoredUser())
  const [code, setCode] = useState('')
  const [validation, setValidation] = useState(null)
  const [note, setNote] = useState('')
  const [checking, setChecking] = useState(false)
  const [redeeming, setRedeeming] = useState(false)
  const [message, setMessage] = useState('')
  const [redeemed, setRedeemed] = useState(null)
  const [history, setHistory] = useState([])
  const [stats, setStats] = useState({ total: 0, todayCount: 0, voucherCount: 0 })
  const [loadingHistory, setLoadingHistory] = useState(true)

  useEffect(() => {
    fetchMeApi().then((fresh) => {
      if (fresh) setUser(fresh)
    })
  }, [])

  const refreshHistory = async () => {
    setLoadingHistory(true)
    try {
      const rows = await fetchStaffRedemptions()
      setHistory(rows)
      // Counted here (not during render) so the derived values stay stable.
      const today = new Date().toDateString()
      setStats({
        total: rows.length,
        todayCount: rows.filter((r) => new Date(r.redeemedAt).toDateString() === today).length,
        voucherCount: rows.filter((r) => r.codeType === 'VOUCHER').length,
      })
    } finally {
      setLoadingHistory(false)
    }
  }

  useEffect(() => {
    refreshHistory()
  }, [])

  const goHome = () => window.location.assign('/')

  if (!user) {
    return (
      <GateScreen
        icon="🔐"
        title="Vui lòng đăng nhập"
        description="Bạn cần đăng nhập để dùng quầy đổi mã của nhân viên."
      />
    )
  }

  if (user.role !== 'STAFF' && user.role !== 'ADMIN') {
    return (
      <GateScreen
        icon="⛔"
        title="Không có quyền truy cập"
        description="Trang này chỉ dành cho tài khoản STAFF hoặc ADMIN."
      />
    )
  }

  const handleValidate = async (e) => {
    e?.preventDefault()
    if (!code.trim() || checking) return
    setChecking(true)
    setMessage('')
    setValidation(null)
    setRedeemed(null)
    try {
      setValidation(await validateStaffCoupon(code.trim()))
    } catch (err) {
      setMessage(err.message || 'Không kiểm tra được mã. Vui lòng thử lại.')
    } finally {
      setChecking(false)
    }
  }

  const handleRedeem = async () => {
    if (!code.trim() || redeeming) return
    setRedeeming(true)
    setMessage('')
    try {
      const data = await redeemStaffCoupon(code.trim(), note.trim())
      setRedeemed(data)
      setValidation(null)
      setCode('')
      setNote('')
      await refreshHistory()
    } catch (err) {
      setMessage(err.message || 'Không đổi được mã. Vui lòng thử lại.')
    } finally {
      setRedeeming(false)
    }
  }

  const isVoucher = validation?.codeType === 'VOUCHER'

  return (
    <div className="staff-root">
      <div className="staff-shell">
        <header className="staff-header">
          <div className="staff-header__title">
            <span className="staff-header__icon">🎫</span>
            <div>
              <h1>Quầy đổi mã</h1>
              <p>Five Star • Dành cho nhân viên cửa hàng</p>
            </div>
          </div>
          <div className="staff-header__actions">
            <div className="staff-header__user">
              <span className="staff-header__avatar">🛡️</span>
              {user.displayName || user.username}
            </div>
            <button type="button" className="staff-btn staff-btn--ghost" onClick={goHome}>
              ← Về trang chính
            </button>
          </div>
        </header>

        <div className="staff-summary">
          <div className="staff-card">
            <span>Đã đổi hôm nay</span>
            <strong>{stats.todayCount}</strong>
          </div>
          <div className="staff-card">
            <span>Tổng lượt đổi</span>
            <strong>{stats.total}</strong>
          </div>
          <div className="staff-card">
            <span>Voucher (đổi bằng coin)</span>
            <strong>{stats.voucherCount}</strong>
          </div>
        </div>

        {message && <div className="staff-alert is-error">⚠️ {message}</div>}

        <section className="staff-panel">
          <div className="staff-panel__head">
            <span style={{ fontSize: 22 }}>⌨️</span>
            <div>
              <h2>Nhập mã của khách</h2>
              <p>Hỗ trợ cả mã coupon (thưởng game) và voucher (đổi bằng coin)</p>
            </div>
          </div>

          <form className="staff-scanner" onSubmit={handleValidate}>
            <input
              autoFocus
              placeholder="Nhập mã coupon / voucher"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              aria-label="Mã coupon hoặc voucher"
            />
            <button type="submit" className="staff-btn" disabled={checking || !code.trim()}>
              {checking ? 'Đang kiểm tra...' : 'Kiểm tra'}
            </button>
          </form>

          {validation && (
            <div className={`staff-result ${validation.valid ? 'is-valid' : 'is-invalid'}`}>
              <div className="staff-result__head">
                <span style={{ fontSize: 22 }}>{validation.valid ? '✅' : '⛔'}</span>
                <h3>{validation.valid ? 'Mã hợp lệ' : 'Mã không thể sử dụng'}</h3>
              </div>
              <p className="staff-result__message">
                <span className="staff-result__code">{validation.code}</span>
                {' · '}
                <span className={`staff-badge staff-badge--${isVoucher ? 'voucher' : 'coupon'}`}>
                  {isVoucher ? 'Voucher • đổi bằng coin' : 'Coupon • thưởng game'}
                </span>
                {' · '}
                {STATUS_LABELS[String(validation.status)] || String(validation.status)}
              </p>

              <div className="staff-fields">
                <div className="staff-field">
                  <span>Khách hàng</span>
                  <b>{validation.ownerName}</b>
                </div>
                {isVoucher ? (
                  <>
                    <div className="staff-field">
                      <span>Voucher</span>
                      <b>{validation.voucherName}</b>
                    </div>
                    <div className="staff-field">
                      <span>Ưu đãi</span>
                      <b>{validation.discountValue}</b>
                    </div>
                    <div className="staff-field">
                      <span>Ngày áp dụng</span>
                      <b>{String(validation.issuedDate)}</b>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="staff-field">
                      <span>Mức giảm</span>
                      <b>{validation.discountPercent}%</b>
                    </div>
                    <div className="staff-field">
                      <span>Ngày phát</span>
                      <b>{String(validation.issuedDate)}</b>
                    </div>
                    <div className="staff-field">
                      <span>Hết hạn</span>
                      <b>{formatDate(validation.expiresAt)}</b>
                    </div>
                  </>
                )}
              </div>

              {validation.valid ? (
                <div className="staff-result__actions">
                  <input
                    className="staff-note-input"
                    placeholder="Ghi chú (tuỳ chọn)"
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                  />
                  <button
                    type="button"
                    className="staff-btn staff-btn--block"
                    onClick={handleRedeem}
                    disabled={redeeming}
                  >
                    {redeeming ? 'Đang đổi...' : '✓ Xác nhận đổi'}
                  </button>
                </div>
              ) : (
                <div className="staff-result__actions">
                  <button
                    type="button"
                    className="staff-btn staff-btn--ghost staff-btn--block"
                    onClick={() => setValidation(null)}
                  >
                    Nhập mã khác
                  </button>
                </div>
              )}
            </div>
          )}

          {redeemed && (
            <div className="staff-result is-valid">
              <div className="staff-result__head">
                <span style={{ fontSize: 22 }}>🎉</span>
                <h3>Đổi thành công</h3>
              </div>
              <div className="staff-fields">
                <div className="staff-field">
                  <span>Mã</span>
                  <b className="staff-result__code">{redeemed.couponCode}</b>
                </div>
                <div className="staff-field">
                  <span>Khách hàng</span>
                  <b>{redeemed.customerName}</b>
                </div>
                <div className="staff-field">
                  <span>Ưu đãi</span>
                  <b>
                    {redeemed.codeType === 'VOUCHER'
                      ? redeemed.discountValue
                      : `${redeemed.discountPercent}%`}
                  </b>
                </div>
                <div className="staff-field">
                  <span>Thời gian</span>
                  <b>{formatDate(redeemed.redeemedAt)}</b>
                </div>
              </div>
              <div className="staff-result__actions">
                <button
                  type="button"
                  className="staff-btn staff-btn--block"
                  onClick={() => setRedeemed(null)}
                >
                  Nhập mã tiếp theo
                </button>
              </div>
            </div>
          )}
        </section>

        <section className="staff-panel">
          <div className="staff-history__head">
            <h2>Lịch sử đổi mã</h2>
            <button
              type="button"
              className="staff-btn staff-btn--ghost"
              onClick={refreshHistory}
              disabled={loadingHistory}
            >
              {loadingHistory ? 'Đang tải...' : '↻ Làm mới'}
            </button>
          </div>

          {loadingHistory ? null : history.length === 0 ? (
            <p className="staff-empty">Chưa có lượt đổi nào.</p>
          ) : (
            <div className="staff-table-wrap">
              <table className="staff-table">
                <thead>
                  <tr>
                    <th>Mã</th>
                    <th>Loại</th>
                    <th>Khách</th>
                    <th>Ưu đãi</th>
                    <th>Nhân viên</th>
                    <th>Thời gian</th>
                    <th>Ghi chú</th>
                  </tr>
                </thead>
                <tbody>
                  {history.map((h) => (
                    <tr key={`${h.codeType}-${h.id}`}>
                      <td className="staff-table__code">{h.couponCode}</td>
                      <td>
                        <span
                          className={`staff-badge staff-badge--${h.codeType === 'VOUCHER' ? 'voucher' : 'coupon'}`}
                        >
                          {h.codeType === 'VOUCHER' ? 'Voucher' : 'Coupon'}
                        </span>
                      </td>
                      <td>{h.customerName}</td>
                      <td>{h.codeType === 'VOUCHER' ? h.discountValue : `${h.discountPercent}%`}</td>
                      <td>{h.staffName}</td>
                      <td>{formatDate(h.redeemedAt)}</td>
                      <td className="staff-table__note">{h.note || '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>
    </div>
  )
}