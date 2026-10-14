const TOKEN_KEY = 'foodrush_token'
const USER_KEY = 'foodrush_user'

function getToken() {
  try {
    return localStorage.getItem(TOKEN_KEY)
  } catch {
    return null
  }
}

/** Internal helper - nothing outside this module needs it. */
function apiEnabled() {
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

/** Bản ném lỗi — dùng cho ví voucher để hiển thị trạng thái "tải thất bại". */
export async function fetchMyCouponsStrict() {
  if (!apiEnabled()) return []
  const json = await request('/api/coupons/my')
  return Array.isArray(json?.data) ? json.data : []
}