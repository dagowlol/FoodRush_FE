import { useCallback, useEffect, useRef } from 'react'
import { FIELD } from './config'
import { gameApi } from './gameApi'
import { sound } from './sound'
import { useGameEngine } from './useGameEngine'
import Bug from './Bug'
import FoodArea from './FoodArea'
import ToolBar from './ToolBar'
import GameHUD from './GameHUD'
import ResultScreen from './ResultScreen'
import backgroundMain from '../assets/background_main.png'

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
    sound.unlock()
    engineStart()
  }, [engineStart])

  const handleRestart = useCallback(() => {
    sound.unlock()
    engine.start()
  }, [engine])

  const handleResume = useCallback(() => {
    engine.resume()
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
        wave={engine.wave}
        totalWaves={engine.totalWaves}
        combo={engine.combo}
        lives={engine.lives}
        maxLives={engine.maxLives}
        muted={engine.muted}
        paused={status === 'paused'}
        onTogglePause={() => (status === 'paused' ? engine.resume() : engine.pause())}
        onToggleMute={engine.toggleMute}
      />

      <main className="fd-main">
        <div className="fd-scene">
          <div className="fd-field">
            <FoodArea foodType={engine.foodType} foodHitKey={engine.foodHitKey} />

            <div className="fd-bugs">
              {bugs.map((bug) => (
                <Bug key={bug.id} bug={bug} onAttack={engine.attack} registerEl={engine.registerBugEl} />
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
