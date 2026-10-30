import { cupImg, TOPPING_DEFINITIONS } from './bubbleTeaAssets'
import { bubbleAudio } from './bubbleTeaAudio'

export default function StartScreen({
  onPlay,
  bestScore,
  soundOn,
  onToggleSound,
  onExit,
}) {
  const handlePlayClick = () => {
    bubbleAudio.playClick()
    onPlay()
  }

  return (
    <div className="btc-screen btc-start-screen">
      {/* Top action bar: sound & exit */}
      <div className="btc-start-screen__top-bar">
        {onExit ? (
          <button
            type="button"
            className="btc-icon-btn btc-icon-btn--light"
            onClick={onExit}
            aria-label="Back"
            title="Quay lại"
          >
            ←
          </button>
        ) : <span />}

        <button
          type="button"
          className="btc-icon-btn btc-icon-btn--light"
          onClick={onToggleSound}
          aria-label={soundOn ? 'Tắt âm thanh' : 'Bật âm thanh'}
          title={soundOn ? 'Âm thanh: BẬT' : 'Âm thanh: TẮT'}
        >
          {soundOn ? '🔊' : '🔇'}
        </button>
      </div>

      <div className="btc-start-screen__hero">
        <h1 className="btc-start-screen__title">BUBBLE TEA CATCH</h1>
        <p className="btc-start-screen__subtitle">Hứng trọn topping theo ĐƠN HÀNG!</p>

        {/* Mascot bubble tea cup with floating mini toppings */}
        <div className="btc-mascot-container">
          <div className="btc-mascot-glow" />
          <img
            src={cupImg}
            alt="Bubble Tea Mascot"
            className="btc-mascot-img"
            draggable={false}
          />

          {/* Floating preview toppings around mascot */}
          <div className="btc-mascot-orbit btc-mascot-orbit--1">
            <img src={TOPPING_DEFINITIONS[0].img} alt="Trân châu đen" />
          </div>
          <div className="btc-mascot-orbit btc-mascot-orbit--2">
            <img src={TOPPING_DEFINITIONS[2].img} alt="Thạch dâu" />
          </div>
          <div className="btc-mascot-orbit btc-mascot-orbit--3">
            <img src={TOPPING_DEFINITIONS[3].img} alt="Pudding trứng" />
          </div>
        </div>

        {/* High score badge */}
        {bestScore > 0 && (
          <div className="btc-start-screen__best-badge">
            <span className="btc-best-label">KỶ LỤC CỦA BẠN:</span>
            <span className="btc-best-val">{bestScore} điểm</span>
          </div>
        )}
      </div>

      {/* Control instructions */}
      <div className="btc-instructions-card">
        <div className="btc-instructions-title">CÁCH CHƠI / LUẬT CHƠI MỚI</div>
        <div className="btc-instructions-grid">
          <div className="btc-instruction-item">
            <div className="btc-instruction-text">
              <strong>Điều khiển:</strong> Kéo ngón tay trên màn hình hoặc dùng phím mũi tên <strong>←</strong> <strong>→</strong>.
            </div>
          </div>
          <div className="btc-instruction-item">
            <div className="btc-instruction-text">
              <strong>ĐƠN HÀNG đa món:</strong> Hứng đủ các món trong <strong>ĐƠN HÀNG</strong> (từ 1 đến 3 món). Hứng sai hoặc bỏ lỡ món trong đơn sẽ mất 1 mạng!
            </div>
          </div>
          <div className="btc-instruction-item">
            <div className="btc-instruction-text">
              <strong>Vật phẩm Trái Tim:</strong> Hứng trái tim rơi để hồi thêm 1 mạng (tối đa 5 mạng). Bỏ lỡ tim không bị trừ mạng.
            </div>
          </div>
          <div className="btc-instruction-item">
            <div className="btc-instruction-text">
              <strong>Tốc độ tăng dần:</strong> Mỗi <strong>30 điểm</strong> tốc độ rơi sẽ tăng nhanh hơn cho đến khi đạt <strong>TỐC ĐỘ TỐI ĐA</strong>!
            </div>
          </div>
        </div>
      </div>

      {/* Play Button */}
      <div className="btc-start-screen__actions">
        <button
          type="button"
          className="btc-btn-primary btc-btn-primary--large"
          onClick={handlePlayClick}
        >
          <span>CHƠI NGAY</span>
          <span className="btc-btn-arrow">▶</span>
        </button>
      </div>
    </div>
  )
}
