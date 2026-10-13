// Optional backend bridge. The backend exposes game session endpoints, but the
// frontend must run standalone, so every call is best-effort and never blocks
// gameplay. It only activates when VITE_API_BASE_URL is set AND a JWT is stored.
const baseUrl = (import.meta.env.VITE_API_BASE_URL || '').replace(/\/+$/, '')
const TOKEN_KEY = 'foodrush_token'

function getToken() {
  try {
    return localStorage.getItem(TOKEN_KEY)
  } catch {
    return null
  }
}

export function apiEnabled() {
  const token = getToken()
  return Boolean(token) && !token.startsWith('mock_token_')
}

async function request(path, options = {}) {
  const res = await fetch(baseUrl + path, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${getToken()}`,
      ...(options.headers || {}),
    },
  })
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  const json = await res.json().catch(() => null)
  return json
}

export const gameApi = {
  enabled: apiEnabled,

  async startSession() {
    if (!apiEnabled()) return null
    try {
      const res = await request('/api/game/sessions', { method: 'POST' })
      return res?.data?.sessionId ?? null
    } catch (error) {
      console.warn('[gameApi] startSession failed', error)
      return null
    }
  },

  async contaminate(sessionId) {
    if (!apiEnabled() || !sessionId) return
    try {
      await request(`/api/game/sessions/${sessionId}/food-safety/contaminate`, { method: 'POST' })
    } catch (error) {
      console.warn('[gameApi] contaminate failed', error)
    }
  },

  async finish(sessionId, result) {
    if (!apiEnabled() || !sessionId) return
    try {
      await request(`/api/game/sessions/${sessionId}/finish`, {
        method: 'POST',
        body: JSON.stringify({
          score: result.score,
          bugsKilled: result.bugsKilled,
          wavesCompleted: result.wavesCompleted,
        }),
      })
    } catch (error) {
      console.warn('[gameApi] finish failed', error)
    }
  },
}
