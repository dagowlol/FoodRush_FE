import { bubbleAudio } from './bubbleTeaAudio'
import { cupImg } from './bubbleTeaAssets'

export default function GameOverScreen({
  score,
  bestScore,
  isNewBest,
  onPlayAgain,
  onBackToMenu,
}) {
  const handlePlayAgain = () => {
    bubbleAudio.playClick()
    onPlayAgain()
  }

  const handleMenu = () => {
    bubbleAudio.playClick()
    onBackToMenu()
  }

  return (
    <div className="btc-overlay btc-game-over-overlay">
      <div className="btc-game-over-card">
        {/* Mascot Face */}
        <div className="btc-game-over-mascot">
          <img
            src={cupImg}
            alt="Bé ly trà sữa"
            className="btc-game-over-mascot-img"
          />
          <div className="btc-sweat-drop">💧</div>
        </div>

        <div className="btc-game-over-title">KẾT THÚC</div>
        <div className="btc-game-over-subtitle">Bạn đã hết số mạng cho phép!</div>

        {isNewBest && (
          <div className="btc-new-best-banner">
            <span>🎉 KỶ LỤC MỚI! 🎉</span>
          </div>
        )}

        {/* Score comparison display */}
        <div className="btc-result-box">
          <div className="btc-result-col">
            <span className="btc-result-label">ĐIỂM ĐẠT ĐƯỢC</span>
            <span className="btc-result-val btc-result-val--score">{score}</span>
          </div>

          <div className="btc-result-divider" />

          <div className="btc-result-col">
            <span className="btc-result-label">ĐIỂM CAO NHẤT</span>
            <span className="btc-result-val btc-result-val--best">{bestScore}</span>
          </div>
        </div>

        {/* Actions */}
        <div className="btc-game-over-actions">
          <button
            type="button"
            className="btc-btn-primary btc-btn-primary--gameover"
            onClick={handlePlayAgain}
          >
            <span>CHƠI LẠI</span>
          </button>

          <button
            type="button"
            className="btc-btn-secondary"
            onClick={handleMenu}
          >
            <span>VỀ MENU</span>
          </button>
        </div>
      </div>
    </div>
  )
}
