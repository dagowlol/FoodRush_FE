import { useEffect, useState } from 'react'
import { fetchWallet } from './voucherApi'

export default function ResultScreen({ result, onRestart, onExit, onOpenShop, finishPromise, finishResult }) {
  const [walletBalance, setWalletBalance] = useState(null)

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

  const earnedCoins = Number.isFinite(finishResult?.coinsEarned) ? finishResult.coinsEarned : Math.floor(result.score / 10)

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
            <span>Coin vừa kiếm</span>
            <b>+{earnedCoins}</b>
          </div>
        </div>

        <div className="result-section">
          <div className="result-row">
            <span className="result-row__label">Coin của bạn</span>
            <span className="result-row__value">{walletBalance !== null ? walletBalance.toLocaleString('vi-VN') : '...'}</span>
          </div>
          {(finishResult?.dailyCoinsEarned != null || finishResult?.dailyCoinCap != null) && (
            <div className="result-row">
              <span className="result-row__label">Coin hôm nay</span>
              <span className="result-row__value">
                {finishResult?.dailyCoinsEarned != null ? finishResult.dailyCoinsEarned.toLocaleString('vi-VN') : '0'} / {finishResult?.dailyCoinCap != null ? finishResult.dailyCoinCap.toLocaleString('vi-VN') : '∞'}
              </span>
              <div className="result-row__hint">
                {finishResult?.dailyCoinCap != null && finishResult.dailyCoinCap > 0
                  ? `Còn ${Math.max(0, finishResult.dailyCoinCap - (finishResult.dailyCoinsEarned || 0)).toLocaleString('vi-VN')} coin có thể kiếm hôm nay`
                  : 'Không giới hạn coin hôm nay'}
              </div>
            </div>
          )}
        </div>

        <div className="result-actions">
          <button type="button" className="btn btn--primary" onClick={onRestart}>
            Chơi lại
          </button>
          {onOpenShop && (
            <button type="button" className="btn btn--ghost" onClick={onOpenShop}>
              Mở cửa hàng voucher
            </button>
          )}
          <button type="button" className="btn btn--ghost" onClick={onExit}>
            Về menu
          </button>
        </div>
      </div>
    </div>
  )
}
