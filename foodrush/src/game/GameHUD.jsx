import { StarLogo } from './icons'

export default function GameHUD({
  score,
  wave,
  totalWaves,
  combo,
  lives,
  maxLives,
  muted,
  paused,
  onTogglePause,
  onToggleMute,
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
        <div className="stat stat--wave">
          <span className="stat__label">Wave</span>
          <span className="stat__value">
            {wave}/{totalWaves}
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
          onClick={onToggleMute}
          aria-label={muted ? 'Bật âm thanh' : 'Tắt âm thanh'}
        >
          {muted ? '🔇' : '🔊'}
        </button>
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
