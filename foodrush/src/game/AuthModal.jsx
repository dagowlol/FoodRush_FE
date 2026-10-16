import { useState, useRef, useEffect } from 'react'
import { loginApi, registerApi } from './authApi'
import { FiveStarLogo, CoinIcon } from './icons'
import useModalLock from './useModalLock'

/* Small inline glyphs - no emoji anywhere in this dialog. */
function CheckIcon({ size = 14 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M4 12.5 9.5 18 20 6.5" />
    </svg>
  )
}

function SparkIcon({ size = 14 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M12 2.5l2.2 5.6 5.6 2.2-5.6 2.2L12 18.1l-2.2-5.6L4.2 10.3l5.6-2.2z" />
    </svg>
  )
}

function VoucherIcon({ size = 14 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M3 8.5V6.5a1 1 0 0 1 1-1h16a1 1 0 0 1 1 1v2a2.5 2.5 0 0 0 0 7v2a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1v-2a2.5 2.5 0 0 0 0-7z" />
      <path d="M14 6v12" strokeDasharray="2 2.4" />
    </svg>
  )
}

function GoogleIcon({ size = 16 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" aria-hidden="true">
      <path fill="#4285F4" d="M45.1 24.5c0-1.6-.1-2.8-.4-4.1H24v7.8h11.8c-.2 2-1.6 5-4.4 7l6.7 5.2c3.9-3.6 6-8.9 6-15.2z" />
      <path fill="#34A853" d="M24 46c5.6 0 10.3-1.8 13.7-5.1l-6.7-5.2c-1.8 1.2-4.2 2-7 2-5.4 0-10-3.6-11.6-8.5l-7 5.4C9.5 40.8 16.2 46 24 46z" />
      <path fill="#FBBC05" d="M12.4 29.2c-.5-1.4-.8-2.9-.8-4.4s.3-3 .8-4.4l-7-5.4C3.9 17.9 3 20.8 3 24s.9 6.1 2.4 9z" />
      <path fill="#EA4335" d="M24 10.6c3.2 0 6 1.1 8.3 3.2l6.2-6.2C34.3 3.8 29.6 2 24 2 16.2 2 9.5 7.2 5.4 14.6l7 5.4c1.7-4.9 6.3-8.5 11.6-8.5z" />
    </svg>
  )
}

const FOCUSABLE = 'a[href],button:not([disabled]),input:not([disabled]),select,textarea,[tabindex]:not([tabindex="-1"])'

export default function AuthModal({ isOpen, onClose, onSuccess }) {
  const [mode, setMode] = useState('login') // 'login' | 'register'
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [successMsg, setSuccessMsg] = useState(null)
  const dialogRef = useRef(null)
  const firstFieldRef = useRef(null)
  const restoreFocusRef = useRef(null)

  // Khoá trang + ẩn thanh điều hướng dưới (dùng chung cho mọi hộp thoại).
  useModalLock(isOpen)

  // --- dialog behaviour: escape, backdrop, focus restore, scroll lock ---
  useEffect(() => {
    if (!isOpen) return undefined

    restoreFocusRef.current = document.activeElement

    const focusFirst = setTimeout(() => firstFieldRef.current?.focus(), 80)

    const onKeyDown = (e) => {
      if (e.key === 'Escape') {
        e.stopPropagation()
        onClose()
        return
      }
      if (e.key !== 'Tab' || !dialogRef.current) return
      const nodes = [...dialogRef.current.querySelectorAll(FOCUSABLE)].filter(
        (el) => el.offsetParent !== null || el === document.activeElement
      )
      if (nodes.length === 0) return
      const first = nodes[0]
      const last = nodes[nodes.length - 1]
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault()
        last.focus()
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault()
        first.focus()
      }
    }

    document.addEventListener('keydown', onKeyDown)

    return () => {
      clearTimeout(focusFirst)
      document.removeEventListener('keydown', onKeyDown)
      restoreFocusRef.current?.focus?.()
    }
  }, [isOpen, onClose])

  if (!isOpen) return null

  const handleSwitchMode = (newMode) => {
    setMode(newMode)
    setError(null)
    setSuccessMsg(null)
    setConfirmPassword('')
  }

  const handleSubmit = async (e) => {
    e.preventDefault() // never let the page reload, even if the backend is down
    setError(null)
    setSuccessMsg(null)

    // === LOGIN ===
    if (mode === 'login') {
      if (!username.trim() || !password.trim()) {
        setError('Vui lòng nhập đầy đủ tên đăng nhập và mật khẩu.')
        return
      }
      setLoading(true)
      try {
        const user = await loginApi(username.trim(), password)
        onSuccess(user)
        onClose()
      } catch (err) {
        setError(err.message || 'Đã có lỗi xảy ra. Vui lòng thử lại.')
      } finally {
        setLoading(false)
      }
      return
    }

    // === REGISTER ===
    if (mode === 'register') {
      if (!username.trim() || !password.trim() || !confirmPassword.trim()) {
        setError('Vui lòng nhập đầy đủ tên đăng nhập, mật khẩu và xác nhận mật khẩu.')
        return
      }
      if (username.trim().length < 3 || username.trim().length > 50) {
        setError('Tên đăng nhập phải có từ 3 đến 50 ký tự.')
        return
      }
      if (!/^[a-zA-Z0-9._-]+$/.test(username.trim())) {
        setError('Tên đăng nhập chỉ được chứa chữ, số, dấu chấm, gạch dưới hoặc gạch ngang.')
        return
      }
      if (password.length < 6) {
        setError('Mật khẩu phải có ít nhất 6 ký tự.')
        return
      }
      if (password !== confirmPassword) {
        setError('Mật khẩu xác nhận không khớp.')
        return
      }
      setLoading(true)
      try {
        const user = await registerApi({
          username: username.trim(),
          password,
        })
        setSuccessMsg('Đăng ký tài khoản thành công!')
        setTimeout(() => {
          onSuccess(user)
          onClose()
        }, 600)
      } catch (err) {
        setError(err.message || 'Đăng ký thất bại. Vui lòng thử lại.')
      } finally {
        setLoading(false)
      }
      return
    }
  }

  const submitLabel = loading
    ? 'Đang xử lý...'
    : mode === 'login'
      ? 'Đăng nhập'
      : 'Tạo tài khoản'

  const heading = mode === 'login' ? 'Chào mừng trở lại' : 'Tạo tài khoản'
  const subHeading =
    mode === 'login'
      ? 'Tiếp tục hành trình săn thưởng của bạn.'
      : 'Chỉ mất một phút để bắt đầu tích FiveCoin.'

  return (
    <div
      className="fs-auth-overlay"
      onMouseDown={(e) => {
        // Only a real backdrop press closes; clicks inside the sheet must not.
        if (e.target === e.currentTarget) onClose()
      }}
    >
      <div
        className="fs-auth-dialog"
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="fs-auth-title"
      >
        <button type="button" className="fs-auth-close" onClick={onClose} aria-label="Đóng">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor"
            strokeWidth="2.6" strokeLinecap="round" aria-hidden="true">
            <path d="M6 6l12 12M18 6L6 18" />
          </svg>
        </button>

        {/* ---------- Left: branding + member benefits (desktop only) ---------- */}
        <aside className="fs-auth-promo">
          <FiveStarLogo className="fs-auth-promo__logo" />

          <h3 className="fs-auth-promo__heading">
            Chơi vui hơn.<br />
            Thưởng nhiều hơn.
          </h3>
          <p className="fs-auth-promo__desc">
            Đăng nhập để lưu FiveCoin, tiến độ trò chơi và toàn bộ voucher Five Star trên mọi thiết bị.
          </p>

          <ul className="fs-auth-perks">
            <li className="fs-auth-perk">
              <span className="fs-auth-perk__icon"><CoinIcon size={14} /></span>
              <span>Giữ FiveCoin và điểm số không bị mất</span>
            </li>
            <li className="fs-auth-perk">
              <span className="fs-auth-perk__icon"><CheckIcon size={14} /></span>
              <span>Tích lũy combo xuyên suốt các phiên chơi</span>
            </li>
            <li className="fs-auth-perk">
              <span className="fs-auth-perk__icon"><VoucherIcon size={14} /></span>
              <span>Sở hữu voucher đã đổi trong tài khoản</span>
            </li>
          </ul>

        </aside>

        {/* ---------- Right: the form ---------- */}
        <div className="fs-auth-panel">
          <header className="fs-auth-head">
            <h2 className="fs-auth-title" id="fs-auth-title">{heading}</h2>
            <p className="fs-auth-sub">{subHeading}</p>
          </header>

          <div className="fs-auth-tabs" role="tablist" aria-label="Chế độ đăng nhập">
            <button
              type="button"
              role="tab"
              aria-selected={mode === 'login'}
              className={`fs-auth-tab ${mode === 'login' ? 'is-active' : ''}`}
              onClick={() => handleSwitchMode('login')}
            >
              Đăng nhập
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={mode === 'register'}
              className={`fs-auth-tab ${mode === 'register' ? 'is-active' : ''}`}
              onClick={() => handleSwitchMode('register')}
            >
              Đăng ký
            </button>
          </div>

          <div className="fs-auth-messages">
            {error && (
              <p className="fs-auth-alert is-error" role="alert">
                {error}
              </p>
            )}
            {successMsg && (
              <p className="fs-auth-alert is-success" role="status">
                {successMsg}
              </p>
            )}
          </div>

          <form className="fs-auth-form" onSubmit={handleSubmit} noValidate>
            <div className="fs-auth-field">
              <label className="fs-auth-label" htmlFor="fs-auth-username">Tên đăng nhập</label>
              <input
                id="fs-auth-username"
                ref={firstFieldRef}
                type="text"
                className="fs-auth-input"
                placeholder="Nhập tên đăng nhập"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                autoComplete="username"
                required
              />
            </div>

            <div className="fs-auth-field">
              <label className="fs-auth-label" htmlFor="fs-auth-password">Mật khẩu</label>
              <input
                id="fs-auth-password"
                type="password"
                className="fs-auth-input"
                placeholder={mode === 'register' ? 'Tối thiểu 6 ký tự' : 'Nhập mật khẩu'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
                aria-describedby={mode === 'register' ? 'fs-auth-password-hint' : undefined}
                required
              />
              {mode === 'register' && (
                <span className="fs-auth-hint" id="fs-auth-password-hint">Tối thiểu 6 ký tự</span>
              )}
            </div>

            {mode === 'register' && (
              <div className="fs-auth-field">
                <label className="fs-auth-label" htmlFor="fs-auth-confirm-password">Xác nhận mật khẩu</label>
                <input
                  id="fs-auth-confirm-password"
                  type="password"
                  className="fs-auth-input"
                  placeholder="Nhập lại mật khẩu"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  autoComplete="new-password"
                  required
                />
              </div>
            )}

            {mode === 'register' && (
              <p className="fs-auth-terms">
                Bằng việc tạo tài khoản, bạn đồng ý với Điều khoản sử dụng của FiveStar Rush.
              </p>
            )}

            <button type="submit" className="fs-auth-submit" disabled={loading}>
              {submitLabel}
            </button>
          </form>

          <div className="fs-auth-divider"><span>hoặc</span></div>

          <button
            type="button"
            className="fs-auth-google"
            onClick={() => {
              const apiBase = (import.meta.env.VITE_API_BASE_URL || '').replace(/\/+$/, '')
              // If frontend is deployed on a different domain (e.g. Vercel), redirect directly to backend
              // to avoid reverse-proxy/rewrite stripping the Set-Cookie header.
              const target = apiBase 
                ? `${apiBase}/oauth2/authorization/google`
                : (window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1')
                  ? 'https://api.foodrush.id.vn/oauth2/authorization/google'
                  : '/oauth2/authorization/google'
              window.location.href = target
            }}
          >
            <GoogleIcon size={16} />
            <span>Đăng nhập bằng Google</span>
          </button>
        </div>
      </div>
    </div>
  )
}