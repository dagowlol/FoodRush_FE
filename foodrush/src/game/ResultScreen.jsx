import { useEffect, useState } from 'react'
import { tierForScore, nextTierForScore } from './coupons'
import CouponCode from './CouponCode'
import { getStoredUser } from './authApi'
import {
  apiEnabled,
  fetchMyCoupons,
  fetchRewardEligibility,
  claimCouponBackend,
} from './couponApi'
import { fetchWallet } from './voucherApi'

function normalizeCoupon(coupon) {
  if (!coupon) return null
  return {
    ...coupon,
    percent: coupon.discountPercent ?? coupon.percent,
  }
}

function todayKey() {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

export default function ResultScreen({ result, onRestart, onExit, onOpenShop, finishPromise }) {
  const [claimed, setClaimed] = useState(null)
  const [eligibility, setEligibility] = useState(null)
  const [loading, setLoading] = useState(false)
  const [claimError, setClaimError] = useState('')
  const [justClaimed, setJustClaimed] = useState(false)
  const [walletBalance, setWalletBalance] = useState(null)

  const user = getStoredUser()
  const isAuthenticated = apiEnabled()

  useEffect(() => {
    let cancelled = false

    const load = async () => {
      if (!isAuthenticated) {
        if (!cancelled) {
          setClaimed(null)
          setEligibility(null)
        }
        return
      }

      try {
        if (finishPromise) await finishPromise
      } catch {
        // ignore best-effort sync failures
      }
      if (cancelled) return

      const [coupons, elig, wallet] = await Promise.all([fetchMyCoupons(), fetchRewardEligibility(), fetchWallet()])
      if (cancelled) return

      const todays = coupons.find((coupon) => coupon.issuedDate === todayKey()) || null
      setClaimed(normalizeCoupon(todays))
      setEligibility(elig)
      if (wallet) setWalletBalance(wallet.balance)
    }

    load()
    return () => {
      cancelled = true
    }
  }, [user?.id, finishPromise, isAuthenticated])

  const tier = tierForScore(result.score)
  const next = nextTierForScore(result.score)
  const won = Boolean(tier)

  const handleClaim = async () => {
    if (!isAuthenticated) {
      setClaimError('Bạn cần đăng nhập để nhận mã giảm giá.')
      return
    }
    if (!tier) return

    setClaimError('')
    setLoading(true)
    try {
      const res = await claimCouponBackend()
      if (res.ok && res.coupon) {
        setClaimed(normalizeCoupon(res.coupon))
        setJustClaimed(true)
      } else if (res.coupon) {
        setClaimed(normalizeCoupon(res.coupon))
        setClaimError(res.error || 'Hôm nay bạn đã nhận mã.')
      } else {
        setClaimError(res.error || 'Không thể nhận mã. Vui lòng thử lại.')
        const [coupons, elig] = await Promise.all([fetchMyCoupons(), fetchRewardEligibility()])
        const todays = coupons.find((coupon) => coupon.issuedDate === todayKey()) || null
        setClaimed(normalizeCoupon(todays))
        setEligibility(elig)
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="overlay overlay--result" role="dialog" aria-modal="true">
      <div className="result-card">
        <h2 className="result-title">{won ? 'Tuyệt vời!' : 'Hết mạng!'}</h2>

        <div className={`result-safety ${won ? 'is-safe' : 'is-bad'}`}>
          {won
            ? ` Bạn đã mở khóa mã giảm ${tier.percent}%!`
            : next
              ? ` Cố lên! Chỉ cần thêm ${next.minScore - result.score} điểm để mở khóa mã giảm ${next.percent}%.`
              : ' Chưa đạt mốc nhận mã — cố thêm chút nữa nhé!'}
        </div>

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
            <span>Ưu đãi</span>
            <b style={{ color: tier ? 'var(--brand-red)' : 'inherit' }}>
              {tier ? `${tier.percent}%` : '0%'}
            </b>
          </div>
        </div>

        <div className="coupon-box">
          <div className="coupon-box__title">🎟️ Đổi điểm lấy mã giảm giá</div>

          {claimed ? (
            <>
              <CouponCode coupon={claimed} />
              <p className="coupon-box__note">
                {justClaimed ? 'Bạn đã nhận mã hôm nay!' : 'Hôm nay bạn đã nhận mã.'} Mai quay lại đổi
                tiếp nhé!
              </p>
            </>
          ) : tier ? (
            <>
              <p className="coupon-box__note">
                Bạn đủ điều kiện nhận mã giảm <b>{tier.percent}%</b> (1 lượt/ngày).
                {!isAuthenticated && ' Vui lòng đăng nhập để lưu mã vào tài khoản.'}
              </p>
              <button
                type="button"
                className="btn btn--primary"
                onClick={handleClaim}
                disabled={loading}
              >
                {loading ? 'Đang nhận...' : `Nhận mã ${tier.percent}%`}
              </button>
              {claimError && <p className="coupon-box__note">{claimError}</p>}
            </>
          ) : (
            <p className="coupon-box__note">
              {next
                ? `Cần thêm ${next.minScore - result.score} điểm để nhận mã ${next.percent}%.`
                : 'Chưa đủ điểm để đổi mã.'}
            </p>
          )}
          {eligibility && eligibility.claimedToday && !claimed && (
            <p className="coupon-box__note">{eligibility.message}</p>
          )}
        </div>

        <div className="result-grid result-grid--coins">
          <div className="result-cell">
            <span>Coins earned this game</span>
            <b>{Math.floor(result.score / 10)}</b>
          </div>
          <div className="result-cell">
            <span>Total coin balance</span>
            <b>{walletBalance !== null ? walletBalance : '...'}</b>
          </div>
        </div>

        <div className="result-actions">
          <button type="button" className="btn btn--primary" onClick={onRestart}>
            ↻ Chơi lại
          </button>
          {onOpenShop && (
            <button type="button" className="btn btn--ghost" onClick={onOpenShop}>
              Open Voucher Shop
            </button>
          )}
          <button type="button" className="btn btn--ghost" onClick={onExit}>
            Back to menu
          </button>
        </div>
      </div>
    </div>
  )
}