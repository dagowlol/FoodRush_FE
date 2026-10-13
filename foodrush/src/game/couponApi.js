const TOKEN_KEY = 'foodrush_token'
const USER_KEY = 'foodrush_user'

function getToken() {
  try {
    return localStorage.getItem(TOKEN_KEY)
  } catch {
    return null
  }
}

export function apiEnabled() {
  const token = getToken()
  return Boolean(token) && !String(token).startsWith('mock_token_')
}

function getBaseUrl() {
  return (import.meta.env.VITE_API_BASE_URL || '').replace(/\/+$/, '')
}

async function request(path, options = {}) {
  const res = await fetch(getBaseUrl() + path, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${getToken()}`,
      ...(options.headers || {}),
    },
  })
  const json = await res.json().catch(() => null)
  if (!res.ok) {
    const err = new Error(json?.message || json?.error || `HTTP ${res.status}`)
    err.status = res.status
    throw err
  }
  return json
}

export async function fetchMyCoupons() {
  if (!apiEnabled()) return []
  try {
    const json = await request('/api/coupons/my')
    return Array.isArray(json?.data) ? json.data : []
  } catch {
    return []
  }
}

export async function fetchRewardEligibility() {
  if (!apiEnabled()) return null
  try {
    const json = await request('/api/rewards/eligibility')
    return json?.data || null
  } catch {
    return null
  }
}

export async function claimCouponBackend(discountPercent) {
  if (!apiEnabled()) {
    return { ok: false, reason: 'unauthenticated', coupon: null, error: 'Bạn cần đăng nhập để nhận mã.' }
  }
  try {
    const json = await request('/api/coupons/claim', {
      method: 'POST',
      body: JSON.stringify(
        discountPercent ? { discountPercent } : {}
      ),
    })
    return { ok: true, coupon: json?.data || null }
  } catch (err) {
    let coupon = null
    if (err.status === 409) {
      try {
        const coupons = await fetchMyCoupons()
        const today = new Date()
        const todayKey = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`
        coupon = coupons.find((c) => c.issuedDate === todayKey) || null
      } catch {
        coupon = null
      }
    }
    return { ok: false, reason: err.status === 409 ? 'daily' : 'error', coupon, error: err.message }
  }
}