const TOKEN_KEY = 'foodrush_token'

function getToken() {
  try { return localStorage.getItem(TOKEN_KEY) } catch { return null }
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
    err.data = json?.data
    throw err
  }
  return json
}

export async function fetchWallet() {
  if (!apiEnabled()) return null
  try {
    const json = await request('/api/wallet')
    return json?.data ?? null
  } catch {
    return null
  }
}

export async function fetchDailyCoinSummary() {
  if (!apiEnabled()) return null
  try {
    const json = await request('/api/wallet/daily-summary')
    return json?.data ?? null
  } catch {
    return null
  }
}

export async function fetchVouchers() {
  if (!apiEnabled()) return []
  try {
    const json = await request('/api/vouchers')
    return Array.isArray(json?.data) ? json.data : []
  } catch {
    return []
  }
}

export async function fetchRedemptionStatus() {
  if (!apiEnabled()) return null
  try {
    const json = await request('/api/vouchers/redemption-status')
    return json?.data || null
  } catch {
    return null
  }
}

export async function redeemVoucher(id) {
  try {
    const json = await request(`/api/vouchers/${id}/redeem`, { method: 'POST' })
    return { ok: true, voucher: json?.data || null }
  } catch (err) {
    return { ok: false, error: err.message, status: err.status }
  }
}

export async function fetchMyVouchers() {
  if (!apiEnabled()) return []
  try {
    const json = await request('/api/my-vouchers')
    return Array.isArray(json?.data) ? json.data : []
  } catch {
    return []
  }
}

// Admin
export async function adminListVouchers() {
  if (!apiEnabled()) return []
  try {
    const json = await request('/api/admin/vouchers')
    return Array.isArray(json?.data) ? json.data : []
  } catch {
    return []
  }
}

export async function adminCreateVoucher(payload) {
  const json = await request('/api/admin/vouchers', { method: 'POST', body: JSON.stringify(payload) })
  return json?.data || null
}

export async function adminUpdateVoucher(id, payload) {
  const json = await request(`/api/admin/vouchers/${id}`, { method: 'PUT', body: JSON.stringify(payload) })
  return json?.data || null
}

export async function adminUpdateVoucherStatus(id, active) {
  const json = await request(`/api/admin/vouchers/${id}/status`, { method: 'PATCH', body: JSON.stringify({ active }) })
  return json?.data || null
}

export async function adminUploadVoucherImage(file) {
  const token = getToken()
  const formData = new FormData()
  formData.append('image', file)
  const res = await fetch(getBaseUrl() + '/api/admin/vouchers/upload-image', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
    },
    body: formData,
  })
  const json = await res.json().catch(() => null)
  if (!res.ok) {
    const err = new Error(json?.message || json?.error || `HTTP ${res.status}`)
    err.status = res.status
    throw err
  }
  return json?.data || null
}

export async function adminIssuedVouchers() {
  if (!apiEnabled()) return []
  try {
    const json = await request('/api/admin/vouchers/issued')
    return Array.isArray(json?.data) ? json.data : []
  } catch {
    return []
  }
}

// Admin users
export async function adminListUsers({ keyword, role, page = 0, size = 10 } = {}) {
  if (!apiEnabled()) return { content: [], page: 0, size, totalItems: 0, totalPages: 0, first: true, last: true }
  const params = new URLSearchParams()
  if (keyword) params.set('keyword', keyword)
  if (role) params.set('role', role)
  params.set('page', String(page))
  params.set('size', String(size))
  try {
    const json = await request(`/api/admin/users?${params.toString()}`)
    const data = json?.data
    return {
      content: Array.isArray(data?.content) ? data.content : [],
      page: data?.page ?? 0,
      size: data?.size ?? size,
      totalItems: data?.totalItems ?? 0,
      totalPages: data?.totalPages ?? 0,
      first: data?.first ?? true,
      last: data?.last ?? true,
    }
  } catch (err) {
    console.warn('[voucherApi] adminListUsers failed', err)
    return { content: [], page: 0, size, totalItems: 0, totalPages: 0, first: true, last: true }
  }
}

export async function adminUserStats() {
  if (!apiEnabled()) return null
  try {
    const json = await request('/api/admin/users/stats')
    return json?.data ?? null
  } catch (err) {
    console.warn('[voucherApi] adminUserStats failed', err)
    return null
  }
}

export async function adminCreateUser(payload) {
  const json = await request('/api/admin/users', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
  return json?.data ?? null
}

export async function adminUpdateUser(id, payload) {
  const json = await request(`/api/admin/users/${id}`, {
    method: 'PUT',
    body: JSON.stringify(payload),
  })
  return json?.data ?? null
}

export async function adminSetUserActive(id, active) {
  const json = await request(`/api/admin/users/${id}`, {
    method: 'PUT',
    body: JSON.stringify({ active }),
  })
  return json?.data ?? null
}