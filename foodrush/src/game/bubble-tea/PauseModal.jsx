import { cupImg, getSpeedTier, isMaxSpeed, getFallingSpeed } from './bubbleTeaAssets'
import { bubbleAudio } from './bubbleTeaAudio'

export default function PauseModal({
  score,
  bestScore,
  order,
  onResume,
  onRestart,
  onExitToMenu,
  soundOn,
  onToggleSound,
}) {
  const handleResume = () => {
    bubbleAudio.playClick()
    onResume()
  }

  const handleRestart = () => {
    bubbleAudio.playClick()
    onRestart()
  }

  const handleExit = () => {
    bubbleAudio.playClick()
    onExitToMenu()
  }

  const completedCount = order?.items?.filter((i) => i.completed).length || 0
  const totalCount = order?.items?.length || 0
  const speedTier = getSpeedTier(score)
  const isMax = isMaxSpeed(score)
  const currentSpeed = getFallingSpeed(score)

  return (
    <div className="btc-overlay btc-pause-overlay" role="dialog" aria-modal="true">
      <div className="btc-pause-card">
        {/* Mascot Rest State */}
        <div className="btc-pause-mascot">
          <img
            src={cupImg}
            alt="Bé ly trà sữa nghỉ ngơi"
            className="btc-pause-mascot-img"
          />
          <div className="btc-pause-zzz">💤</div>
        </div>

        <h2 className="btc-pause-title">TẠM DỪNG</h2>
        <p className="btc-pause-subtitle">Trò chơi đang dừng. Nghỉ tay một chút nhé!</p>

        {/* Current Game Stats Preview */}
        <div className="btc-pause-stats">
          <div className="btc-pause-stat-item">
            <span className="btc-pause-stat-label">ĐIỂM SỐ</span>
            <span className="btc-pause-stat-val btc-pause-stat-val--score">{score}</span>
          </div>

          <div className="btc-pause-stat-divider" />

          <div className="btc-pause-stat-item">
            <span className="btc-pause-stat-label">KỶ LỤC</span>
            <span className="btc-pause-stat-val">{Math.max(score, bestScore)}</span>
          </div>

          <div className="btc-pause-stat-divider" />

          <div className="btc-pause-stat-item">
            <span className="btc-pause-stat-label">ĐƠN HÀNG</span>
            <span className="btc-pause-stat-val btc-pause-stat-val--order">
              {completedCount}/{totalCount}
            </span>
          </div>

          <div className="btc-pause-stat-divider" />

          <div className="btc-pause-stat-item">
            <span className="btc-pause-stat-label">TỐC ĐỘ</span>
            <span className="btc-pause-stat-val btc-pause-stat-val--speed" title={`${currentSpeed} px/s`}>
              {isMax ? 'TỐI ĐA ⚡' : `Cấp ${speedTier}`}
            </span>
          </div>
        </div>

        {/* Order Items Preview */}
        {order?.items && order.items.length > 0 && (
          <div className="btc-pause-order-preview">
            <span className="btc-pause-order-title">Món đang thực hiện:</span>
            <div className="btc-pause-order-chips">
              {order.items.map((item) => (
                <div
                  key={item.id}
                  className={`btc-pause-chip ${
                    item.completed ? 'btc-pause-chip--done' : 'btc-pause-chip--pending'
                  }`}
                >
                  <img src={item.topping.img} alt="" className="btc-pause-chip-img" />
                  <span>{item.topping.nameVi}</span>
                  {item.completed ? <span className="btc-chip-check">✓</span> : null}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Sound toggle inside Pause Modal */}
        <div className="btc-pause-sound-bar">
          <button
            type="button"
            className="btc-pause-sound-btn"
            onClick={onToggleSound}
          >
            <span>{soundOn ? '🔊 Âm thanh: BẬT' : '🔇 Âm thanh: TẮT'}</span>
          </button>
        </div>

        {/* Action Buttons */}
        <div className="btc-pause-actions">
          <button
            type="button"
            className="btc-btn-primary btc-btn-primary--resume"
            onClick={handleResume}
          >
            <span>TIẾP TỤC</span>
            <span className="btc-btn-icon">▶</span>
          </button>

          <button
            type="button"
            className="btc-btn-secondary"
            onClick={handleRestart}
          >
            <span>CHƠI LẠI</span>
            <span className="btc-btn-icon">🔄</span>
          </button>

          <button
            type="button"
            className="btc-btn-ghost"
            onClick={handleExit}
          >
            <span>VỀ MENU</span>
          </button>
        </div>
      </div>
    </div>
  )
}

