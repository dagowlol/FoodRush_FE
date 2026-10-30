import OrderPanel from './TargetBanner'
import ScorePanel from './ScorePanel'
import PlayerCup from './PlayerCup'
import FallingTopping from './FallingTopping'
import GameOverScreen from './GameOverScreen'
import PauseModal from './PauseModal'

export default function GameScreen({
  playfieldRef,
  score,
  bestScore,
  lives,
  combo,
  order,
  orderChangeKey,
  toppings,
  cupX,
  cupY,
  cupWidth,
  cupHeight,
  reactionState,
  cupParticles,
  popups,
  missMarkers = [],
  screenFlash,
  livesShaking,
  countdown,
  isPaused,
  onTogglePause,
  onResume,
  isGameOver,
  isNewBest,
  soundOn,
  onToggleSound,
  onPlayAgain,
  onBackToMenu,
  onPointerDown,
  onPointerMove,
  onPointerUp,
}) {
  const catchLineY = cupY + 20

  return (
    <div
      ref={playfieldRef}
      className={`btc-game-screen ${screenFlash ? 'btc-game-screen--flash' : ''}`}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerUp}
      tabIndex={0}
    >
      {/* 1. Redesigned Top HUD: Action buttons (Pause/Sound), Centered Score, Right Lives */}
      <ScorePanel
        score={score}
        bestScore={bestScore}
        lives={lives}
        soundOn={soundOn}
        onToggleSound={onToggleSound}
        onTogglePause={onTogglePause}
        livesShaking={livesShaking}
      />

      {/* 2. Order Panel: "ĐƠN HÀNG" with Integrated Combo and Completion Progress */}
      <OrderPanel order={order} changeKey={orderChangeKey} combo={combo} />

      {/* 3. Middle Area: Playfield with Falling Toppings & Catch Height */}
      <div className="btc-playfield-area">
        {/* Đường kẻ đỏ ngang playfield xác định độ cao hứng của bé ly */}
        <div
          className="btc-catch-guideline"
          style={{ top: `${catchLineY}px` }}
          aria-hidden="true"
        >
          <div className="btc-catch-guideline__beam" />
          <span className="btc-catch-guideline__tag">ĐỘ CAO HỨNG</span>
        </div>

        {/* Falling toppings & heart powerups */}
        {toppings.map((topping) => (
          <FallingTopping key={topping.id} topping={topping} />
        ))}

        {/* Dấu X đỏ tại vị trí bỏ lỡ topping trong đơn hàng */}
        {missMarkers.map((m) => (
          <div
            key={m.id}
            className="btc-miss-marker"
            style={{ left: `${m.x}px`, top: `${m.y}px` }}
          >
            <span className="btc-miss-marker__x">✕</span>
            <span className="btc-miss-marker__tag">HỤT ĐƠN!</span>
          </div>
        ))}

        {/* Floating feedback popups (+10, combo, wrong, heart, order complete) */}
        {popups.map((popup) => (
          <div
            key={popup.id}
            className={`btc-popup btc-popup--${popup.type}`}
            style={{
              left: `${popup.x}px`,
              top: `${popup.y}px`,
            }}
          >
            {popup.text}
          </div>
        ))}

        {/* 4. Bottom Area: Player Cup với thanh đỏ tại miệng cốc */}
        <PlayerCup
          x={cupX}
          y={cupY}
          width={cupWidth}
          height={cupHeight}
          reactionState={reactionState}
          particles={cupParticles}
        />
      </div>

      {/* Countdown Overlay (3, 2, 1, BẮT ĐẦU!) */}
      {countdown !== null && (
        <div className="btc-countdown-overlay">
          <div className="btc-countdown-num" key={countdown}>
            {countdown}
          </div>
          <div className="btc-countdown-hint">
            Hứng đủ <strong>ĐƠN HÀNG</strong> ở trên!
          </div>
        </div>
      )}

      {/* Pause Modal Overlay */}
      {isPaused && (
        <PauseModal
          score={score}
          bestScore={bestScore}
          order={order}
          onResume={onResume}
          onRestart={onPlayAgain}
          onExitToMenu={onBackToMenu}
          soundOn={soundOn}
          onToggleSound={onToggleSound}
        />
      )}

      {/* Game Over Screen */}
      {isGameOver && (
        <GameOverScreen
          score={score}
          bestScore={bestScore}
          isNewBest={isNewBest}
          onPlayAgain={onPlayAgain}
          onBackToMenu={onBackToMenu}
        />
      )}
    </div>
  )
}
