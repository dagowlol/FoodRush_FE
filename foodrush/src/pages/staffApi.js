const TOKEN_KEY = 'foodrush_token'

function getToken() {
  try { return localStorage.getItem(TOKEN_KEY) } catch { return null }
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
    err.data = json?.data
    throw err
  }
  return json
}

export async function validateStaffCoupon(code) {
  const json = await request(`/api/staff/coupons/${encodeURIComponent(code)}/validate`)
  return json?.data ?? null
}

export async function redeemStaffCoupon(code, note) {
  const json = await request(`/api/staff/coupons/${encodeURIComponent(code)}/redeem`, {
    method: 'POST',
    body: JSON.stringify(note ? { note } : {}),
  })
  return json?.data ?? null
}

export async function fetchStaffRedemptions() {
  try {
    const json = await request('/api/staff/redemptions')
    return Array.isArray(json?.data) ? json.data : []
  } catch {
    return []
  }
}
