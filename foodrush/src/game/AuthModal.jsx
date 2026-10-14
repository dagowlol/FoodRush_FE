import { useState, useRef, useEffect } from 'react'
import { loginApi, requestOtpApi, verifyOtpApi } from './authApi'
import { FiveStarLogo, CoinIcon } from './icons'

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
  const [mode, setMode] = useState('login') // 'login' | 'register' | 'otp'
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [displayName, setDisplayName] = useState('')
  const [email, setEmail] = useState('')
  const [otp, setOtp] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [successMsg, setSuccessMsg] = useState(null)
  const [countdown, setCountdown] = useState(0)
  const timerRef = useRef(null)
  const dialogRef = useRef(null)
  const firstFieldRef = useRef(null)
  const restoreFocusRef = useRef(null)

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
    const prevOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    return () => {
      clearTimeout(focusFirst)
      document.removeEventListener('keydown', onKeyDown)
      document.body.style.overflow = prevOverflow
      restoreFocusRef.current?.focus?.()
    }
  }, [isOpen, onClose])

  // Clear the resend countdown if the dialog closes mid-timer.
  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current)
    }
  }, [])

  if (!isOpen) return null

  const startCountdown = (seconds = 60) => {
    setCountdown(seconds)
    if (timerRef.current) clearInterval(timerRef.current)
    timerRef.current = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timerRef.current)
          return 0
        }
        return prev - 1
      })
    }, 1000)
  }

  const handleSwitchMode = (newMode) => {
    setMode(newMode)
    setError(null)
    setSuccessMsg(null)
    setOtp('')
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

    // === REGISTER: Step 1 - request OTP ===
    if (mode === 'register') {
      if (!username.trim() || !password.trim() || !email.trim()) {
        setError('Vui lòng nhập đầy đủ tên đăng nhập, email và mật khẩu.')
        return
      }
      if (password.length < 6) {
        setError('Mật khẩu phải có ít nhất 6 ký tự.')
        return
      }
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      if (!emailRegex.test(email.trim())) {
        setError('Email không hợp lệ.')
        return
      }
      setLoading(true)
      try {
        await requestOtpApi({
          username: username.trim(),
          email: email.trim(),
          password,
          displayName: displayName.trim() || username.trim(),
        })
        setSuccessMsg(`Mã OTP đã được gửi đến ${email.trim()}. Vui lòng kiểm tra email!`)
        setMode('otp')
        startCountdown(60)
      } catch (err) {
        setError(err.message || 'Gửi OTP thất bại. Vui lòng thử lại.')
      } finally {
        setLoading(false)
      }
      return
    }

    // === REGISTER: Step 2 - verify OTP ===
    if (mode === 'otp') {
      if (!otp.trim()) {
        setError('Vui lòng nhập mã OTP từ email.')
        return
      }
      setLoading(true)
      try {
        const user = await verifyOtpApi({
          email: email.trim(),
          otp: otp.trim(),
          username: username.trim(),
          password,
          displayName: displayName.trim() || username.trim(),
        })
        setSuccessMsg('Đăng ký tài khoản thành công!')
        setTimeout(() => {
          onSuccess(user)
          onClose()
        }, 600)
      } catch (err) {
        setError(err.message || 'Xác thực OTP thất bại. Vui lòng thử lại.')
      } finally {
        setLoading(false)
      }
    }
  }

  const handleResendOtp = async () => {
    if (countdown > 0) return
    setError(null)
    setLoading(true)
    try {
      await requestOtpApi({
        username: username.trim(),
        email: email.trim(),
        password,
        displayName: displayName.trim() || username.trim(),
      })
      setSuccessMsg(`Đã gửi lại mã OTP đến ${email.trim()}.`)
      startCountdown(60)
    } catch (err) {
      setError(err.message || 'Gửi lại OTP thất bại.')
    } finally {
      setLoading(false)
    }
  }

  const submitLabel = loading
    ? 'Đang xử lý...'
    : mode === 'login'
      ? 'Đăng nhập'
      : mode === 'otp'
        ? 'Xác nhận OTP'
        : 'Tạo tài khoản'

  const heading = mode === 'login' ? 'Chào mừng trở lại' : mode === 'otp' ? 'Xác thực OTP' : 'Tạo tài khoản'
  const subHeading =
    mode === 'login'
      ? 'Tiếp tục hành trình săn thưởng của bạn.'
      : mode === 'otp'
        ? `Nhập mã 6 chữ số đã gửi tới ${email}.`
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

          <div className="fs-auth-bonus">
            <span className="fs-auth-bonus__spark"><SparkIcon size={14} /></span>
            <div className="fs-auth-bonus__text">
              <strong>+100 FiveCoin</strong>
              <span>Quà chào mừng thành viên mới</span>
            </div>
          </div>
        </aside>

        {/* ---------- Right: the form ---------- */}
        <div className="fs-auth-panel">
          <header className="fs-auth-head">
            <h2 className="fs-auth-title" id="fs-auth-title">{heading}</h2>
            <p className="fs-auth-sub">{subHeading}</p>
          </header>

          {mode !== 'otp' && (
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
          )}

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
            {mode === 'otp' ? (
              <>
                <div className="fs-auth-field">
                  <label className="fs-auth-label" htmlFor="fs-auth-otp">Mã OTP</label>
                  <input
                    id="fs-auth-otp"
                    ref={firstFieldRef}
                    type="text"
                    className="fs-auth-input fs-auth-input--otp"
                    placeholder="000000"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                    autoComplete="one-time-code"
                    inputMode="numeric"
                    maxLength={6}
                    aria-describedby="fs-auth-otp-hint"
                    required
                  />
                  <span className="fs-auth-hint" id="fs-auth-otp-hint">
                    Mã gửi tới {email}
                  </span>
                </div>

                <div className="fs-auth-otp-actions">
                  <button
                    type="button"
                    className="fs-auth-btn-ghost"
                    onClick={handleResendOtp}
                    disabled={countdown > 0 || loading}
                  >
                    {countdown > 0 ? `Gửi lại OTP (${countdown}s)` : 'Gửi lại OTP'}
                  </button>
                  <button type="button" className="fs-auth-btn-ghost" onClick={() => handleSwitchMode('register')}>
                    Quay lại
                  </button>
                </div>
              </>
            ) : (
              <>
                <div className="fs-auth-field">
                  <label className="fs-auth-label" htmlFor="fs-auth-username">Tên đăng nhập</label>
                  <input
                    id="fs-auth-username"
                    ref={firstFieldRef}
                    type="text"
                    className="fs-auth-input"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    autoComplete="username"
                    required
                  />
                </div>

                {mode === 'register' && (
                  <>
                    <div className="fs-auth-field">
                      <label className="fs-auth-label" htmlFor="fs-auth-email">Email</label>
                      <input
                        id="fs-auth-email"
                        type="email"
                        className="fs-auth-input"
                        placeholder="ban@email.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        autoComplete="email"
                        required
                      />
                      <span className="fs-auth-hint">Dùng để nhận mã OTP xác thực</span>
                    </div>

                    <div className="fs-auth-field">
                      <label className="fs-auth-label" htmlFor="fs-auth-display">
                        Tên hiển thị <span className="fs-auth-optional">tùy chọn</span>
                      </label>
                      <input
                        id="fs-auth-display"
                        type="text"
                        className="fs-auth-input"
                        placeholder="Nguyễn Văn A"
                        value={displayName}
                        onChange={(e) => setDisplayName(e.target.value)}
                        autoComplete="name"
                      />
                    </div>
                  </>
                )}

                <div className="fs-auth-field">
                  <label className="fs-auth-label" htmlFor="fs-auth-password">Mật khẩu</label>
                  <input
                    id="fs-auth-password"
                    type="password"
                    className="fs-auth-input"
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
                  <p className="fs-auth-terms">
                    Bằng việc tạo tài khoản, bạn đồng ý với Điều khoản sử dụng của FiveStar Rush.
                  </p>
                )}
              </>
            )}

            <button type="submit" className="fs-auth-submit" disabled={loading}>
              {submitLabel}
            </button>
          </form>

          <div className="fs-auth-divider"><span>hoặc</span></div>

          <button
            type="button"
            className="fs-auth-google"
            onClick={() => { window.location.href = '/oauth2/authorization/google' }}
          >
            <GoogleIcon size={16} />
            <span>Đăng nhập bằng Google</span>
          </button>
        </div>
      </div>
    </div>
  )
}