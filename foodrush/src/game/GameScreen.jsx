import { useCallback, useEffect, useRef, useState } from 'react'
import { FIELD } from './config'
import { gameApi } from './gameApi'
import { useGameEngine } from './useGameEngine'
import { sound } from './sound'
import Bug from './Bug'
import FoodArea from './FoodArea'
import ToolBar from './ToolBar'
import GameHUD from './GameHUD'
import PowerUpBar from './PowerUpBar'
import ResultScreen from './ResultScreen'
import { LightbulbIcon, PlayIcon } from './icons'
import bugsprayImg from '../assets/bugspray.png'
import swatterImg from '../assets/swatter.png'

function PauseOverlay({ onResume, onRestart, onExit }) {
  return (
    <div className="fs-pause-backdrop" role="dialog" aria-modal="true">
      <div className="fs-pause-card">
        <h2 className="fs-pause-title">Tạm dừng</h2>
        <p className="fs-pause-desc">Nghỉ tay một chút trước khi tiếp tục giao đơn nhé!</p>
        <div className="fs-pause-actions">
          <button type="button" className="fs-btn-primary full-width" onClick={onResume}>
            <PlayIcon size={16} />
            <span>Tiếp tục chơi</span>
          </button>
          <button type="button" className="fs-btn-secondary full-width" onClick={onRestart}>
            Chơi lại từ đầu
          </button>
          <button type="button" className="fs-btn-outline full-width" onClick={onExit}>
            Về màn hình chính
          </button>
        </div>
      </div>
    </div>
  )
}

export default function GameScreen({ onExit, onOpenShop }) {
  const sessionRef = useRef(null)
  const finishPromiseRef = useRef(Promise.resolve())
  const [finishResult, setFinishResult] = useState(null)
  const fieldRef = useRef(null)
  const [mousePos, setMousePos] = useState({ x: -100, y: -100, visible: false })
  const [isAttacking, setIsAttacking] = useState(false)

  const handleEvent = useCallback((type, payload) => {
    if (type === 'start') {
      setFinishResult(null)
      gameApi.startSession().then((id) => {
        if (id) sessionRef.current = id
      })
    } else if (type === 'contaminate') {
      gameApi.contaminate(sessionRef.current)
    } else if (type === 'finish') {
      finishPromiseRef.current = (gameApi.finish(sessionRef.current, payload) || Promise.resolve())
        .then((data) => {
          if (data) setFinishResult(data)
          return data
        })
    }
  }, [])

  const engine = useGameEngine(handleEvent)
  const { bugs, effects, status, banner } = engine

  const hasGround = bugs.some((b) => b.type === 'ground')
  const hasFlying = bugs.some((b) => b.type === 'flying')
  const running = status === 'running'

  const engineStart = engine.start
  useEffect(() => {
    sound.preload()
    sound.play('enter')
    engineStart()
  }, [engineStart])

  const handleRestart = useCallback(() => {
    engine.start()
  }, [engine])

  const handleResume = useCallback(() => {
    engine.resume()
  }, [engine])

  const handlePointerMove = (e) => {
    if (!fieldRef.current) return
    const rect = fieldRef.current.getBoundingClientRect()
    setMousePos({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
      visible: true,
    })
  }

  const handlePointerLeave = () => {
    setMousePos((prev) => ({ ...prev, visible: false }))
  }

  const handleFieldPointerDown = () => {
    if (engine.selectedTool) {
      setIsAttacking(true)
      setTimeout(() => setIsAttacking(false), 160)
    }
  }

  const handleAttackBug = useCallback((bugId) => {
    if (engine.selectedTool) sound.play(engine.selectedTool)
    setIsAttacking(true)
    setTimeout(() => setIsAttacking(false), 160)
    engine.attack(bugId)
  }, [engine])

  return (
    <div className="fs-gameplay-wrapper">
      {/* 1. Focused Game HUD */}
      <GameHUD
        score={engine.score}
        combo={engine.combo}
        elapsed={engine.elapsed}
        lives={engine.lives}
        maxLives={engine.maxLives}
        paused={status === 'paused'}
        onTogglePause={engine.togglePause}
        onClose={onExit}
      />

      {/* Main Game Stage */}
      <main className="fs-gameplay-main">
        {/* Top/Side Mission Order Panel */}
        <section className="fs-mission-panel">
          <div className="fs-mission-badge">
            <span className="fs-mission-badge__dot" />
            <span>NHIỆM VỤ · BẢO VỆ MÓN ĂN</span>
          </div>

          <div className="fs-mission-info">
            <h3 className="fs-mission-title">Five Star: Food Defender</h3>
            <p className="fs-mission-desc">
              Côn trùng đang tiến về đĩa thức ăn nóng hổi! Dùng <b>Bình xịt</b> diệt bọ bò và <b>Vợt đập</b> bắt ruồi bay. Bảo vệ thức ăn đến khi hết mạng!
            </p>
          </div>
        </section>

        {/* Stage: thanh Power Up dọc ở bên trái + bàn chơi ở giữa */}
        <div className="fs-gameplay-stage">
          {/* Power Up Bar beside the game (not inside game field) */}
          <aside className="fs-side-rail fs-side-rail--left">
            <PowerUpBar gauge={engine.powerUp} isActive={engine.isPowerUpActive} />
          </aside>

          {/* Central Game Board with Restaurant Dining Environment */}
          <div className="fs-board-wrapper">
          {/* Interactive Game Field with bg_gameplayy */}
          <div
            ref={fieldRef}
            className={`fd-field fs-game-field ${engine.selectedTool ? `has-tool-${engine.selectedTool}` : ''} ${engine.isPowerUpActive ? 'is-power-active' : ''}`}
            onPointerMove={handlePointerMove}
            onPointerLeave={handlePointerLeave}
            onPointerDown={handleFieldPointerDown}
          >
            {/* Center Dish / Burger Stack */}
            <FoodArea foodType={engine.foodType} foodHitKey={engine.foodHitKey} />

            {/* Bugs layer */}
            <div className="fd-bugs">
              {bugs.map((bug) => (
                <Bug
                  key={bug.id}
                  bug={bug}
                  onAttack={handleAttackBug}
                  registerEl={engine.registerBugEl}
                />
              ))}
            </div>

            {/* Effects layer */}
            <div className="fd-effects" aria-hidden="true">
              {effects.map((effect) => (
                <div
                  key={effect.id}
                  className={`fx fx--${effect.kind}`}
                  style={{
                    left: `${(effect.x / FIELD.W) * 100}%`,
                    top: `${(effect.y / FIELD.H) * 100}%`,
                  }}
                >
                  {effect.text || ''}
                </div>
              ))}
            </div>

            {banner && (
              <div key={banner.id} className={`fd-banner fd-banner--${banner.kind}`}>
                {banner.text}
              </div>
            )}

            {/* Custom Tool Cursor following pointer */}
            {engine.selectedTool && mousePos.visible && (
              <div
                className={`tool-cursor tool-cursor--${engine.selectedTool} ${isAttacking ? 'is-attacking' : ''} ${engine.isPowerUpActive ? 'is-powered' : ''}`}
                style={{
                  left: `${mousePos.x}px`,
                  top: `${mousePos.y}px`,
                }}
                aria-hidden="true"
              >
                <img
                  src={engine.selectedTool === 'spray' ? bugsprayImg : swatterImg}
                  alt=""
                  draggable={false}
                />
              </div>
            )}
          </div>
          </div>

          {/* Rail phải rỗng để bàn chơi luôn nằm giữa màn hình */}
          <div className="fs-side-rail fs-side-rail--right" aria-hidden="true" />
        </div>

        {/* Tool Panel: Bình xịt, Vợt đập, Remaining quantities */}
        <ToolBar
          selectedTool={engine.selectedTool}
          onSelect={engine.selectTool}
          hasGround={hasGround}
          hasFlying={hasFlying}
          disabled={!running}
        />

        {/* Small gameplay tip below the board */}
        <div className="fs-gameplay-tip">
          <LightbulbIcon size={16} />
          <span>
            <b>Mẹo:</b> Chọn <b>Bình xịt</b> diệt bọ bò, <b>Vợt đập</b> bắt ruồi bay. Duy trì combo để x2 điểm và tích thêm nhiều FiveCoin!
          </span>
        </div>
      </main>

      {/* Pause Overlay */}
      {status === 'paused' && (
        <PauseOverlay onResume={handleResume} onRestart={handleRestart} onExit={onExit} />
      )}

      {/* Result Screen */}
      {status === 'result' && (
        <ResultScreen
          result={engine.result}
          onRestart={handleRestart}
          onExit={onExit}
          onOpenShop={onOpenShop}
          finishPromise={finishPromiseRef.current}
          finishResult={finishResult}
        />
      )}
    </div>
  )
}
