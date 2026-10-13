export default function PowerUpBar({ gauge = 0, isActive = false }) {
  const percent = Math.min(100, Math.max(0, gauge))

  return (
    <div
      className={`powerup-bar ${isActive ? 'is-active' : ''}`}
      aria-label="Thanh Power Up sát thương nhân đôi"
    >
      <div className="powerup-header">
        <span className="powerup-icon">{isActive ? '🔥' : '⚡'}</span>
        {/* <span className="powerup-title">POWER UP</span> */}
        {isActive && <span className="powerup-multiplier">2X DAME</span>}
      </div>

      <div className="powerup-track">
        <div
          className="powerup-fill"
          style={{ height: `${percent}%` }}
        >
          <div className="powerup-shimmer" />
        </div>

        <div className="powerup-markers" aria-hidden="true">
          <span className="powerup-marker marker--75" />
          <span className="powerup-marker marker--50" />
          <span className="powerup-marker marker--25" />
        </div>
      </div>

      <div className="powerup-footer">
        {isActive ? (
          <span className="powerup-status-active">BÙNG NỔ!</span>
        ) : (
          <span className="powerup-percent">{Math.round(percent)}%</span>
        )}
      </div>
    </div>
  )
}
