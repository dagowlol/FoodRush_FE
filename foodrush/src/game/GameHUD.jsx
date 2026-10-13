import { StarLogo } from './icons'

export default function GameHUD({
  score,
  discountPercent = 0,
  combo,
  lives,
  maxLives,
  paused,
  onTogglePause,
}) {
  return (
    <header className="hud">
      <div className="hud__brand">
        <StarLogo />
      </div>

      <div className="hud__stats">
        <div className="stat stat--score">
          <span className="stat__label">Điểm</span>
          <span className="stat__value">{score}</span>
        </div>
        <div className="stat stat--discount" title="Mức giảm giá hiện tại">
          <span className="stat__label">Ưu đãi</span>
          <span className={`stat__value ${discountPercent > 0 ? 'stat__value--discount' : ''}`}>
            {discountPercent > 0 ? `-${discountPercent}%` : '0%'}
          </span>
        </div>
        <div className="stat stat--lives" aria-label={`Mạng còn lại ${lives} trên ${maxLives}`}>
          <span className="stat__label">Mạng</span>
          <span className="lives">
            {Array.from({ length: maxLives }).map((_, i) => (
              // eslint-disable-next-line react/no-array-index-key
              <i key={i} className={i < lives ? 'life life--on' : 'life life--off'} />
            ))}
          </span>
        </div>
        {combo > 1 && <div className="stat stat--combo">🔥 x{combo}</div>}
      </div>

      <div className="hud__actions">
        <button
          type="button"
          className="icon-btn"
          onClick={onTogglePause}
          aria-label={paused ? 'Tiếp tục' : 'Tạm dừng'}
        >
          {paused ? '▶' : '❚❚'}
        </button>
      </div>
    </header>
  )
}
