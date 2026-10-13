import { useState, useRef, useEffect } from 'react'
import { guestLogin, loginApi, requestOtpApi, verifyOtpApi } from './authApi'

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

  useEffect(() => {
    return () => { if (timerRef.current) clearInterval(timerRef.current) }
  }, [])

  if (!isOpen) return null

  const startCountdown = (seconds = 60) => {
    setCountdown(seconds)
    if (timerRef.current) clearInterval(timerRef.current)
    timerRef.current = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) { clearInterval(timerRef.current); return 0 }
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

  const fillStaffDemo = () => {
    setMode('login')
    setUsername('staff')
    setPassword('cCNk3Namif9AqHp7')
    setError(null)
  }

  const handleGuest = () => {
    const user = guestLogin('Khách Chơi Game')
    onSuccess(user)
    onClose()
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
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

    // === REGISTER: Step 1 — send OTP ===
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

    // === REGISTER: Step 2 — verify OTP ===
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
        setSuccessMsg('Đăng ký tài khoản thành công! 🎉')
        setTimeout(() => {
          onSuccess(user)
          onClose()
        }, 600)
      } catch (err) {
        setError(err.message || 'Xác thực OTP thất bại. Vui lòng thử lại.')
      } finally {
        setLoading(false)
      }
      return
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

  return (
    <div className="overlay" role="dialog" aria-modal="true">
      <div className="auth-card">
        <button
          type="button"
          className="auth-close-btn"
          onClick={onClose}
          aria-label="Đóng"
        >
          ✕
        </button>

        <div className="auth-header">
          <h2 className="auth-title">
            {mode === 'login'
              ? 'Đăng nhập FoodRush'
              : mode === 'otp'
                ? 'Xác thực OTP'
                : 'Tạo tài khoản mới'}
          </h2>
          <p className="auth-desc">
            {mode === 'login'
              ? 'Đăng nhập để lưu điểm số và đổi mã giảm giá Five Star!'
              : mode === 'otp'
                ? `Nhập mã xác thực đã gửi đến ${email}`
                : 'Đăng ký ngay để nhận ưu đãi và tham gia bảng xếp hạng!'}
          </p>
        </div>

        {mode !== 'otp' && (
          <div className="auth-tabs">
            <button
              type="button"
              className={`auth-tab ${mode === 'login' ? 'is-active' : ''}`}
              onClick={() => handleSwitchMode('login')}
            >
              Đăng nhập
            </button>
            <button
              type="button"
              className={`auth-tab ${mode === 'register' ? 'is-active' : ''}`}
              onClick={() => handleSwitchMode('register')}
            >
              Đăng ký
            </button>
          </div>
        )}

        {error && <div className="auth-alert auth-alert--error">{error}</div>}
        {successMsg && <div className="auth-alert auth-alert--success">{successMsg}</div>}

        <form className="auth-form" onSubmit={handleSubmit}>
          {/* === OTP verification step === */}
          {mode === 'otp' && (
            <>
              <div className="form-group">
                <label className="form-label" htmlFor="auth-otp">
                  Mã OTP
                </label>
                <input
                  id="auth-otp"
                  type="text"
                  className="form-input form-input--otp"
                  placeholder="Nhập mã OTP từ email"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  autoComplete="one-time-code"
                  inputMode="numeric"
                  maxLength={6}
                  autoFocus
                  required
                />
              </div>
              <div className="otp-actions">
                <button
                  type="button"
                  className="btn btn--ghost otp-resend-btn"
                  onClick={handleResendOtp}
                  disabled={countdown > 0 || loading}
                >
                  {countdown > 0
                    ? `Gửi lại OTP (${countdown}s)`
                    : 'Gửi lại OTP'}
                </button>
                <button
                  type="button"
                  className="btn btn--ghost otp-back-btn"
                  onClick={() => handleSwitchMode('register')}
                >
                  ← Quay lại
                </button>
              </div>
            </>
          )}

          {/* === Login & Register fields === */}
          {mode !== 'otp' && (
            <>
              <div className="form-group">
                <label className="form-label" htmlFor="auth-username">
                  Tên đăng nhập
                </label>
                <input
                  id="auth-username"
                  type="text"
                  className="form-input"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  autoComplete="username"
                  required
                />
              </div>

              {mode === 'register' && (
                <>
                  <div className="form-group">
                    <label className="form-label" htmlFor="auth-email">
                      Email <span className="form-required">*</span>
                    </label>
                    <input
                      id="auth-email"
                      type="email"
                      className="form-input"
                      placeholder="VD: you@gmail.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      autoComplete="email"
                      required
                    />
                    <span className="form-hint">Dùng để nhận mã OTP xác thực tài khoản</span>
                  </div>

                  <div className="form-group">
                    <label className="form-label" htmlFor="auth-display-name">
                      Tên hiển thị (tùy chọn)
                    </label>
                    <input
                      id="auth-display-name"
                      type="text"
                      className="form-input"
                      placeholder="VD: Hoàng Phúc"
                      value={displayName}
                      onChange={(e) => setDisplayName(e.target.value)}
                    />
                  </div>
                </>
              )}

              <div className="form-group">
                <label className="form-label" htmlFor="auth-password">
                  Mật khẩu
                </label>
                <input
                  id="auth-password"
                  type="password"
                  className="form-input"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
                  required
                />
              </div>
            </>
          )}

          <button
            type="submit"
            className="btn btn--primary auth-submit-btn"
            disabled={loading}
          >
            {loading
              ? 'Đang xử lý...'
              : mode === 'login'
                ? 'Đăng nhập ngay'
                : mode === 'otp'
                  ? 'Xác nhận OTP'
                  : 'Gửi mã xác thực'}
          </button>
        </form>
        <div className='auth-divider'>
          <span>hoặc</span>
        </div>
        <button
          type='button'
          className='btn btn--ghost auth-quick-btn'
          onClick={() => { window.location.href = '/oauth2/authorization/google'; }}
        >
          Đăng nhập bằng Google
        </button>

        <div className="auth-divider">
          <span>hoặc trải nghiệm nhanh</span>
        </div>

        <div className="auth-quick-actions">
          <button
            type="button"
            className="btn btn--ghost auth-quick-btn"
            onClick={fillStaffDemo}
            title="Tự động điền tài khoản mẫu từ hệ thống"
          >
            ⚡ Tài khoản mẫu (Staff)
          </button>
          <button
            type="button"
            className="btn btn--ghost auth-quick-btn"
            onClick={handleGuest}
          >
            👤 Chơi thử (Khách)
          </button>
        </div>
      </div>
    </div>
  )
}
