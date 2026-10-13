const TOKEN_KEY = 'foodrush_token'
const USER_KEY = 'foodrush_user'

export function getStoredToken() {
  try {
    return localStorage.getItem(TOKEN_KEY)
  } catch {
    return null
  }
}

export function getStoredUser() {
  try {
    const raw = localStorage.getItem(USER_KEY)
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

export function setAuthData(token, user) {
  try {
    if (token) localStorage.setItem(TOKEN_KEY, token)
    else localStorage.removeItem(TOKEN_KEY)

    if (user) localStorage.setItem(USER_KEY, JSON.stringify(user))
    else localStorage.removeItem(USER_KEY)
  } catch {
    // ignore local storage errors
  }
}

export function clearAuthData() {
  try {
    localStorage.removeItem(TOKEN_KEY)
    localStorage.removeItem(USER_KEY)
  } catch {
    // ignore
  }
}

export async function loginApi(username, password) {
  try {
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password }),
    })
    const data = await res.json()
    if (!res.ok) {
      throw new Error(data.message || data.error || 'Tên đăng nhập hoặc mật khẩu không chính xác.')
    }
    const auth = data.data
    setAuthData(auth.token, auth.user)
    return auth.user
  } catch (err) {
    // If backend is unreachable, offer graceful offline guest fallback if username is provided
    if (err.message.includes('Failed to fetch') || err.message.includes('NetworkError')) {
      throw new Error('Không thể kết nối đến máy chủ backend (port 8080). Vui lòng thử lại!')
    }
    throw err
  }
}

/** Step 1: Request OTP — sends verification code to user's email */
export async function requestOtpApi({ username, email, password, displayName }) {
  try {
    const res = await fetch('/api/auth/register/request-otp', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        username,
        email,
        password,
        displayName: displayName || username,
      }),
    })
    const data = await res.json()
    if (!res.ok) {
      throw new Error(data.message || data.error || 'Gửi OTP thất bại. Vui lòng thử lại.')
    }
    return data
  } catch (err) {
    if (err.message.includes('Failed to fetch') || err.message.includes('NetworkError')) {
      throw new Error('Không thể kết nối đến máy chủ backend (port 8080). Vui lòng thử lại!')
    }
    throw err
  }
}

/** Step 2: Verify OTP and complete registration */
export async function verifyOtpApi({ email, otp, username, password, displayName }) {
  try {
    const res = await fetch('/api/auth/register/verify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email,
        otp,
        username,
        password,
        displayName: displayName || username,
      }),
    })
    const data = await res.json()
    if (!res.ok) {
      throw new Error(data.message || data.error || 'Xác thực OTP không thành công.')
    }
    const auth = data.data
    setAuthData(auth.token, auth.user)
    return auth.user
  } catch (err) {
    if (err.message.includes('Failed to fetch') || err.message.includes('NetworkError')) {
      throw new Error('Không thể kết nối đến máy chủ backend (port 8080). Vui lòng thử lại!')
    }
    throw err
  }
}

/** Legacy register without OTP (kept for backward compatibility) */
export async function registerApi({ username, password, displayName }) {
  try {
    const res = await fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        username,
        password,
        displayName: displayName || username,
      }),
    })
    const data = await res.json()
    if (!res.ok) {
      throw new Error(data.message || data.error || 'Đăng ký tài khoản không thành công.')
    }
    const auth = data.data
    setAuthData(auth.token, auth.user)
    return auth.user
  } catch (err) {
    if (err.message.includes('Failed to fetch') || err.message.includes('NetworkError')) {
      throw new Error('Không thể kết nối đến máy chủ backend (port 8080). Vui lòng thử lại!')
    }
    throw err
  }
}

export async function fetchMeApi() {
  const token = getStoredToken()
  if (!token) return null
  try {
    const res = await fetch('/api/auth/me', {
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
    })
    if (!res.ok) {
      if (res.status === 401 || res.status === 403) {
        clearAuthData()
      }
      return null
    }
    const data = await res.json()
    const user = data.data
    if (user) {
      localStorage.setItem(USER_KEY, JSON.stringify(user))
    }
    return user
  } catch {
    return getStoredUser()
  }
}

export function guestLogin(name = 'Khách VIP') {
  const mockUser = {
    id: 999,
    username: 'guest_' + Math.floor(Math.random() * 1000),
    displayName: name,
    role: 'CUSTOMER',
    totalScore: 0,
    isGuest: true,
  }
  setAuthData('mock_token_' + Date.now(), mockUser)
  return mockUser
}
