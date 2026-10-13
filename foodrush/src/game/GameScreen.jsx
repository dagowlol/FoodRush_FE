import { useCallback, useEffect, useRef, useState } from 'react'
import { FIELD } from './config'
import { gameApi } from './gameApi'
import { useGameEngine } from './useGameEngine'
import { playToolSound, preloadToolSounds } from './sound'
import Bug from './Bug'
import FoodArea from './FoodArea'
import ToolBar from './ToolBar'
import GameHUD from './GameHUD'
import DiscountProgressBar from './DiscountProgressBar'
import PowerUpBar from './PowerUpBar'
import ResultScreen from './ResultScreen'
import backgroundMain from '../assets/background_main.png'
import bugsprayImg from '../assets/bugspray.png'
import swatterImg from '../assets/swatter.png'

function PauseOverlay({ onResume, onRestart, onExit }) {
  return (
    <div className="overlay" role="dialog" aria-modal="true">
      <div className="pause-card">
        <h2>Tạm dừng</h2>
        <p>Nghỉ tay một chút nhé!</p>
        <div className="pause-actions">
          <button type="button" className="btn btn--primary" onClick={onResume}>
            ▶ Tiếp tục
          </button>
          <button type="button" className="btn" onClick={onRestart}>
            ↻ Chơi lại
          </button>
          <button type="button" className="btn btn--ghost" onClick={onExit}>
            Về menu
          </button>
        </div>
      </div>
    </div>
  )
}

export default function GameScreen({ onExit }) {
  const sessionRef = useRef(null)
  const fieldRef = useRef(null)
  const [mousePos, setMousePos] = useState({ x: -100, y: -100, visible: false })
  const [isAttacking, setIsAttacking] = useState(false)

  const handleEvent = useCallback((type, payload) => {
    if (type === 'start') {
      gameApi.startSession().then((id) => {
        if (id) sessionRef.current = id
      })
    } else if (type === 'contaminate') {
      gameApi.contaminate(sessionRef.current)
    } else if (type === 'finish') {
      gameApi.finish(sessionRef.current, payload)
    }
  }, [])

  const engine = useGameEngine(handleEvent)
  const { bugs, effects, status, banner } = engine

  const hasGround = bugs.some((b) => b.type === 'ground')
  const hasFlying = bugs.some((b) => b.type === 'flying')
  const running = status === 'running'

  const engineStart = engine.start
  useEffect(() => {
    preloadToolSounds()
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
    if (engine.selectedTool) playToolSound(engine.selectedTool)
    setIsAttacking(true)
    setTimeout(() => setIsAttacking(false), 160)
    engine.attack(bugId)
  }, [engine])

  return (
    <div
      className="fd-app"
      style={{
        backgroundImage: `linear-gradient(rgba(255, 248, 236, 0.35), rgba(255, 236, 200, 0.62)), url(${backgroundMain})`,
      }}
    >
      <GameHUD
        score={engine.score}
        discountPercent={engine.discountPercent}
        combo={engine.combo}
        lives={engine.lives}
        maxLives={engine.maxLives}
        paused={status === 'paused'}
        onTogglePause={() => (status === 'paused' ? engine.resume() : engine.pause())}
      />

      <DiscountProgressBar score={engine.score} />

      <main className="fd-main">
        <div className="fd-scene">
          {/* Power Up Bar on the Left */}
          <PowerUpBar gauge={engine.powerUp} isActive={engine.isPowerUpActive} />

          <div
            ref={fieldRef}
            className={`fd-field ${engine.selectedTool ? `has-tool-${engine.selectedTool}` : ''} ${engine.isPowerUpActive ? 'is-power-active' : ''}`}
            onPointerMove={handlePointerMove}
            onPointerLeave={handlePointerLeave}
            onPointerDown={handleFieldPointerDown}
          >
            <FoodArea foodType={engine.foodType} foodHitKey={engine.foodHitKey} />

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
      </main>

      <ToolBar
        selectedTool={engine.selectedTool}
        onSelect={engine.selectTool}
        hasGround={hasGround}
        hasFlying={hasFlying}
        disabled={!running}
      />

      {status === 'paused' && (
        <PauseOverlay onResume={handleResume} onRestart={handleRestart} onExit={onExit} />
      )}

      {status === 'result' && (
        <ResultScreen result={engine.result} onRestart={handleRestart} onExit={onExit} />
      )}
    </div>
  )
}
