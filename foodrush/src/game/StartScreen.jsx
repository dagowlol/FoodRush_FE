import { useState } from 'react'
import { AntIcon, FlyIcon, SprayIcon, StarLogo, SwatterIcon } from './icons'
import { getCoupons, turnsLeftToday } from './coupons'
import CouponList from './CouponList'
import backgroundMain from '../assets/background_main.png'

export default function StartScreen({ onPlay, onTutorial }) {
  const [showCoupons, setShowCoupons] = useState(false)
  const couponCount = getCoupons().length

  return (
    <div
      className="screen screen--start"
      style={{
        backgroundImage: `linear-gradient(rgba(255, 248, 236, 0.35), rgba(255, 236, 200, 0.62)), url(${backgroundMain})`,
      }}
    >
      <div className="start-hero">
        <StarLogo className="start-hero__logo" />
        <h1 className="game-title">Food Defender</h1>
        <p className="game-sub">Bảo vệ Burger, Gà rán và Khoai tây khỏi côn trùng!</p>
      </div>

      <div className="legend">
        <div className="legend-pair">
          <span className="legend-icon"><AntIcon /></span>
          <span className="legend-arrow">→</span>
          <span className="legend-icon legend-icon--tool"><SprayIcon /></span>
          <span className="legend-label">Bọ bò</span>
        </div>
        <div className="legend-pair">
          <span className="legend-icon"><FlyIcon /></span>
          <span className="legend-arrow">→</span>
          <span className="legend-icon legend-icon--tool"><SwatterIcon /></span>
          <span className="legend-label">Ruồi bay</span>
        </div>
      </div>

      <div className="screen-actions">
        <button type="button" className="btn btn--primary btn--big" onClick={onPlay}>
          ▶ Chơi ngay
        </button>
        <button type="button" className="btn btn--ghost" onClick={onTutorial}>
          ? Hướng dẫn
        </button>
        <button type="button" className="btn btn--ghost" onClick={() => setShowCoupons(true)}>
          🎟️ Mã của tôi{couponCount > 0 ? ` (${couponCount})` : ''}
          {turnsLeftToday() ? ' • 1 lượt' : ''}
        </button>
      </div>

      {showCoupons && <CouponList onClose={() => setShowCoupons(false)} />}
    </div>
  )
}
