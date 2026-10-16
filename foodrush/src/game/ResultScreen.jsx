import { useEffect, useState } from 'react'
import { fetchWallet } from './voucherApi'
import { apiEnabled, gameApi } from './gameApi'
import AuthModal from './AuthModal'
import { CoinIcon } from './icons'
import useModalLock from './useModalLock'

export default function ResultScreen({
  result,
  onRestart,
  onExit,
  onOpenShop,
  finishPromise,
  finishResult,
  onLoggedIn,
}) {
  const [walletBalance, setWalletBalance] = useState(null)
  const [loggedIn, setLoggedIn] = useState(() => apiEnabled())
  const [showAuth, setShowAuth] = useState(false)
  const [claiming, setClaiming] = useState(false)
  const [claimResult, setClaimResult] = useState(null)
  const [cooldown, setCooldown] = useState(2)

  useModalLock(true)

  useEffect(() => {
    const timer = setInterval(() => {
      setCooldown((prev) => {
        if (prev <= 1) {
          clearInterval(timer)
          return 0
        }
        return prev - 1
      })
    }, 1000)
    return () => clearInterval(timer)
  }, [])

  useEffect(() => {
    let cancelled = false

    const load = async () => {
      try {
        if (finishPromise) await finishPromise
      } catch {
        // ignore best-effort sync failures
      }
      if (cancelled) return

      const wallet = await fetchWallet()
      if (cancelled) return
      if (wallet) setWalletBalance(wallet.balance)
    }

    load()
    return () => {
      cancelled = true
    }
  }, [finishPromise])

  useEffect(() => {
    if (finishResult?.coinBalance != null) setWalletBalance(finishResult.coinBalance)
  }, [finishResult])

  // Guest / anonymous players get no session on the backend, so nothing was
  // credited. They can log in here and claim the coins for the round they just
  // played by opening a session and finishing it immediately.
  const claimCoins = async () => {
    setClaiming(true)
    try {
      const data = await gameApi.claimScore(result)
      if (!data) return
      setClaimResult(data)
      if (data.coinBalance != null) setWalletBalance(data.coinBalance)
      else {
        const wallet = await fetchWallet()
        if (wallet) setWalletBalance(wallet.balance)
      }
    } finally {
      setClaiming(false)
    }
  }

  const handleAuthSuccess = (loggedUser) => {
    setShowAuth(false)
    setLoggedIn(true)
    onLoggedIn?.(loggedUser)
    claimCoins()
  }

  const pendingCoins = Math.floor((result?.score || 0) / 10)
  const awaitingLogin = !loggedIn && !claimResult
  const earnedCoins = Number.isFinite(claimResult?.coinsEarned)
    ? claimResult.coinsEarned
    : Number.isFinite(finishResult?.coinsEarned)
      ? finishResult.coinsEarned
      : pendingCoins
  const coinSource = claimResult || finishResult
  const dailySummary =
    coinSource?.dailyCoinsEarned != null || coinSource?.dailyCoinCap != null ? coinSource : null

  return (
    <div className="overlay overlay--result" role="dialog" aria-modal="true">
      <div className="result-card">
        <h2 className="result-title">{result.score > 0 ? 'Hoàn thành!' : 'Hết mạng!'}</h2>

        <div className="result-grid">
          <div className="result-cell">
            <span>Điểm</span>
            <b>{result.score}</b>
          </div>
          <div className="result-cell">
            <span>Bug tiêu diệt</span>
            <b>{result.bugsKilled}</b>
          </div>
          <div className="result-cell">
            <span>{awaitingLogin ? 'Coin chờ nhận' : 'Coin vừa kiếm'}</span>
            <b>+{earnedCoins}</b>
          </div>
        </div>

        {awaitingLogin && (
          <div className="result-claim">
            <div className="result-claim__head">
              <span className="result-claim__icon">
                <CoinIcon size={28} />
              </span>
              <div className="result-claim__text">
                <b>Bạn đang chơi ẩn danh</b>
                <span>
                  Đăng nhập hoặc tạo tài khoản để nhận {pendingCoins.toLocaleString('vi-VN')} FiveCoin
                  thật và đổi voucher ngay.
                </span>
              </div>
            </div>
            <button
              type="button"
              className="btn btn--primary"
              onClick={() => {
                if (cooldown > 0) return
                setShowAuth(true)
              }}
              disabled={claiming || cooldown > 0}
            >
              Đăng nhập để nhận coin
            </button>
          </div>
        )}

        {!awaitingLogin && (
          <div className="result-section">
            <div className="result-row">
              <span className="result-row__label">Coin của bạn</span>
              <span className="result-row__value">
                {walletBalance !== null ? walletBalance.toLocaleString('vi-VN') : '...'}
              </span>
            </div>
            {dailySummary && (
              <div className="result-row">
                <span className="result-row__label">Coin hôm nay</span>
                <span className="result-row__value">
                  {dailySummary.dailyCoinsEarned != null ? dailySummary.dailyCoinsEarned.toLocaleString('vi-VN') : '0'} / {dailySummary.dailyCoinCap != null ? dailySummary.dailyCoinCap.toLocaleString('vi-VN') : '∞'}
                </span>
                <div className="result-row__hint">
                  {dailySummary.dailyCoinCap != null && dailySummary.dailyCoinCap > 0
                    ? `Còn ${Math.max(0, dailySummary.dailyCoinCap - (dailySummary.dailyCoinsEarned || 0)).toLocaleString('vi-VN')} coin có thể kiếm hôm nay`
                    : 'Không giới hạn coin hôm nay'}
                </div>
              </div>
            )}
          </div>
        )}

        <div className="result-actions" style={{ pointerEvents: cooldown > 0 ? 'none' : 'auto' }}>
          <button
            type="button"
            className="btn btn--primary"
            onClick={() => {
              if (cooldown > 0) return
              onRestart?.()
            }}
            disabled={cooldown > 0}
          >
            {cooldown > 0 ? `Chơi lại (${cooldown}s)` : 'Chơi lại'}
          </button>
          {onOpenShop && (
            <button
              type="button"
              className="btn btn--ghost"
              onClick={() => {
                if (cooldown > 0) return
                onOpenShop?.()
              }}
              disabled={cooldown > 0}
            >
              Mở cửa hàng voucher
            </button>
          )}
          <button
            type="button"
            className="btn btn--ghost"
            onClick={() => {
              if (cooldown > 0) return
              onExit?.()
            }}
            disabled={cooldown > 0}
          >
            Về menu
          </button>
        </div>
      </div>

      {showAuth && (
        <AuthModal
          isOpen={showAuth}
          onClose={() => setShowAuth(false)}
          onSuccess={handleAuthSuccess}
        />
      )}
    </div>
  )
}
