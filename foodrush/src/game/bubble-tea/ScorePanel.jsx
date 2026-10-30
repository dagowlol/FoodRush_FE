import { getSpeedTier, isMaxSpeed } from './bubbleTeaAssets'

export default function ScorePanel({
  score,
  bestScore,
  lives,
  soundOn,
  onToggleSound,
  onTogglePause,
  livesShaking,
}) {
  const speedTier = getSpeedTier(score)
  const isMax = isMaxSpeed(score)

  return (
    <header className="btc-score-panel">
      {/* 1. Left: Action Buttons (Pause & Sound) */}
      <div className="btc-hud-actions">
        <button
          type="button"
          className="btc-icon-btn btc-icon-btn--pause"
          onClick={onTogglePause}
          aria-label="Tạm dừng trò chơi"
          title="Tạm dừng (Phím P hoặc Esc)"
        >
          <span className="btc-pause-icon">⏸</span>
        </button>

        <button
          type="button"
          className="btc-icon-btn btc-icon-btn--sound"
          onClick={onToggleSound}
          aria-label={soundOn ? 'Tắt âm thanh' : 'Bật âm thanh'}
          title={soundOn ? 'Âm thanh: BẬT' : 'Âm thanh: TẮT'}
        >
          {soundOn ? '🔊' : '🔇'}
        </button>
      </div>

      {/* 2. Center: Consolidated Score, Speed Tier & Best Score */}
      <div className="btc-hud-score-box">
        <div className="btc-hud-score-main">
          <span className="btc-hud-score-label">ĐIỂM</span>
          <span className="btc-hud-score-val">{score}</span>
          {isMax ? (
            <span className="btc-hud-speed-badge btc-hud-speed-badge--max" title="Tốc độ rơi tối đa!">
              {/* ⚡ MAX */}
            </span>
          ) : speedTier > 0 ? (
            <span className="btc-hud-speed-badge" title={`Tốc độ cấp ${speedTier} (+${speedTier * 20} px/s)`}>
              {/* ⚡ +{speedTier} */}
            </span>
          ) : null}
        </div>

      </div>

      {/* 3. Right: Lives Indicator (MẠNG 5 Hearts) */}
      <div
        className={`btc-hud-lives-box ${livesShaking ? 'btc-hud-lives-box--shake' : ''}`}
        aria-label={`Mạng: ${lives}/5`}
        title={`Mạng: ${lives}/5`}
      >
        <span className="btc-hud-lives-label">MẠNG</span>
        <div className="btc-hud-lives-hearts">
          {[0, 1, 2, 3, 4].map((idx) => {
            const isAlive = idx < lives
            return (
              <span
                key={idx}
                className={`btc-heart ${isAlive ? 'btc-heart--active' : 'btc-heart--lost'}`}
              >
                {isAlive ? '❤️' : '🤍'}
              </span>
            )
          })}
        </div>
      </div>
    </header>
  )
}
