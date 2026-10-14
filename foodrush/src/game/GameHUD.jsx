import { FiveStarLogo, CloseIcon, PlayIcon, PauseIcon } from './icons'

export default function GameHUD({
  score,
  combo,
  elapsed = 0,
  lives,
  maxLives = 3,
  paused,
  onTogglePause,
  onClose,
}) {
  const minutes = Math.floor(elapsed / 60)
  const seconds = String(elapsed % 60).padStart(2, '0')

  return (
    <header className="fs-game-hud" aria-label="Bảng điểm Food Defender">
      <div className="fs-game-hud__left">
        {onClose && (
          <button
            type="button"
            className="fs-hud-btn fs-hud-btn--close"
            onClick={onClose}
            title="Đóng / Về trang chủ"
            aria-label="Về trang chủ"
          >
            <CloseIcon size={18} />
          </button>
        )}
        <div className="fs-hud-brand">
          <FiveStarLogo />
        </div>
      </div>

      <div className="fs-game-hud__stats">
        {/* Score */}
        <div className="fs-hud-stat">
          <span className="fs-hud-stat__label">ĐIỂM</span>
          <span className="fs-hud-stat__val">{score}</span>
        </div>

        {/* Combo */}
        <div className={`fs-hud-stat fs-hud-stat--combo ${combo > 1 ? 'is-active' : ''}`}>
          <span className="fs-hud-stat__label">COMBO</span>
          <span className="fs-hud-stat__val">{combo > 1 ? `x${combo}` : '0'}</span>
        </div>

        {/* Elapsed Time (count up) */}
        <div className="fs-hud-stat fs-hud-stat--time">
          <span className="fs-hud-stat__label">THỜI GIAN</span>
          <span className="fs-hud-stat__val">
            {minutes}:{seconds}
          </span>
        </div>

        {/* Lives */}
        <div className="fs-hud-stat fs-hud-stat--lives">
          <span className="fs-hud-stat__label">MẠNG</span>
          <div className="fs-hud-lives-dots">
            {Array.from({ length: maxLives }).map((_, i) => (
              <span
                key={i}
                className={`fs-life-dot ${i < lives ? 'fs-life-dot--active' : 'fs-life-dot--lost'}`}
              />
            ))}
          </div>
        </div>
      </div>

      <div className="fs-game-hud__right">
        {/* Start / Pause Toggle Button */}
        <button
          type="button"
          className="fs-hud-btn fs-hud-btn--pause"
          onClick={onTogglePause}
          aria-label={paused ? 'Tiếp tục' : 'Tạm dừng'}
        >
          {paused ? <PlayIcon size={16} /> : <PauseIcon size={16} />}
          <span className="fs-hud-btn__text">{paused ? 'Tiếp tục' : 'Tạm dừng'}</span>
        </button>
      </div>
    </header>
  )
}
