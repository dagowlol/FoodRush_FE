import { useState, useEffect, useRef, useCallback, useMemo } from 'react'
import bottomBunImg from '../assets/bottom-bun-removebg-preview.png'
import chickenPattyImg from '../assets/chicken-patty-removebg-preview.png'
import cheeseImg from '../assets/cheese.png'
import lettuceImg from '../assets/lettuce-removebg-preview.png'
import tomatoImg from '../assets/tomato-removebg-preview.png'
import baconImg from '../assets/bacon-removebg-preview.png'
import topBunImg from '../assets/top-bun-removebg-preview.png'
import stackAttackHomeImg from '../assets/stack-attack-home-img.png'
import { stackAudio } from './stackAttackAudio'
import './stackAttack.css'

// 7 Burger Ingredients sequence (using updated asset images)
const INGREDIENTS_CONFIG = [
  { name: 'Bánh burger dưới', img: bottomBunImg, height: 38, isBase: true },
  { name: 'Gà chiên giòn', img: chickenPattyImg, height: 34 },
  { name: 'Phô mai', img: cheeseImg, height: 24 },
  { name: 'Rau xà lách', img: lettuceImg, height: 26 },
  { name: 'Cà chua', img: tomatoImg, height: 22 },
  { name: 'Thịt xông khói', img: baconImg, height: 24 },
  { name: 'Bánh burger trên', img: topBunImg, height: 48, isTop: true },
]

const FRAME_WIDTH = 390
const INITIAL_WIDTH = 220
const MIN_WIDTH = 24
const TOLERANCE = 4
const LAYER_STEP = 28 // Vertical spacing between stacked layers
const BASE_BOTTOM = 80 // Base bottom bun bottom px
const STORAGE_BEST_KEY = 'stack_attack_best_score'

export default function StackAttackGame({ onExit }) {
  // Screen state: 'start' | 'playing' | 'paused' | 'gameover'
  const [screen, setScreen] = useState('start')
  const [score, setScore] = useState(0)
  const [bestScore, setBestScore] = useState(() => {
    try {
      return parseInt(localStorage.getItem(STORAGE_BEST_KEY) || '0', 10)
    } catch {
      return 0
    }
  })
  const [layerCount, setLayerCount] = useState(1)
  const [combo, setCombo] = useState(0)
  const [isNewRecord, setIsNewRecord] = useState(false)
  const [soundOn, setSoundOn] = useState(true)
  const [feedback, setFeedback] = useState(null)
  const [debrisList, setDebrisList] = useState([])
  const [missedItem, setMissedItem] = useState(null)
  const [gameOverLocked, setGameOverLocked] = useState(false)

  // Responsive frame width tracking (adapts accurately on mobile e.g. 354px, up to 390px)
  const [frameWidth, setFrameWidth] = useState(() => {
    if (typeof window === 'undefined') return 390
    return Math.min(390, window.innerWidth || 390)
  })
  const frameWidthRef = useRef(frameWidth)

  useEffect(() => {
    const onResize = () => {
      const w = Math.min(390, window.innerWidth || 390)
      setFrameWidth(w)
      frameWidthRef.current = w
    }
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [])

  // Stacking state: array of { id, left, width, img, name, height }
  const [stack, setStack] = useState(() => [
    {
      id: 0,
      left: Math.max(0, (Math.min(390, typeof window !== 'undefined' ? window.innerWidth : 390) - INITIAL_WIDTH) / 2),
      width: INITIAL_WIDTH,
      img: bottomBunImg,
      name: 'Bánh burger dưới',
      height: 38,
    },
  ])

  // Moving piece state - moves horizontally snug right above previous layer!
  const [movingPiece, setMovingPiece] = useState({
    x: 20,
    width: INITIAL_WIDTH,
    dir: 1, // 1 = right, -1 = left
    ingredientIdx: 1,
    img: chickenPattyImg,
    name: 'Gà chiên giòn',
    height: 32,
  })

  const [isDropping, setIsDropping] = useState(false)

  // Ref holders for 60fps requestAnimationFrame loop & debounce
  const animRef = useRef(null)
  const movingPieceRef = useRef(movingPiece)
  const stackRef = useRef(stack)
  const isDroppingRef = useRef(isDropping)
  const screenRef = useRef(screen)
  const gameOverLockedRef = useRef(gameOverLocked)
  const lastDropTimeRef = useRef(0)

  // Sync refs
  useEffect(() => {
    movingPieceRef.current = movingPiece
  }, [movingPiece])
  useEffect(() => {
    stackRef.current = stack
  }, [stack])
  useEffect(() => {
    isDroppingRef.current = isDropping
  }, [isDropping])
  useEffect(() => {
    screenRef.current = screen
  }, [screen])
  useEffect(() => {
    gameOverLockedRef.current = gameOverLocked
  }, [gameOverLocked])

  // Cooldown lock for Result Card (1.5s delay to prevent accidental restart click)
  useEffect(() => {
    if (screen === 'gameover') {
      setGameOverLocked(true)
      gameOverLockedRef.current = true
      const timer = setTimeout(() => {
        setGameOverLocked(false)
        gameOverLockedRef.current = false
      }, 1500)
      return () => clearTimeout(timer)
    } else {
      setGameOverLocked(false)
      gameOverLockedRef.current = false
    }
  }, [screen])

  // Sound toggle helper
  const handleToggleSound = useCallback((e) => {
    e.stopPropagation()
    const active = stackAudio.toggleSound()
    setSoundOn(active)
  }, [])

  // Start fresh game
  const handleStartGame = useCallback(() => {
    if (screenRef.current === 'gameover' && gameOverLockedRef.current) return
    stackAudio.playClick()
    const curW = frameWidthRef.current
    const baseLayer = {
      id: 0,
      left: Math.max(0, (curW - INITIAL_WIDTH) / 2),
      width: INITIAL_WIDTH,
      img: bottomBunImg,
      name: 'Bánh burger dưới',
      height: 38,
    }
    setStack([baseLayer])
    stackRef.current = [baseLayer]

    setMovingPiece({
      x: 10,
      width: INITIAL_WIDTH,
      dir: 1,
      ingredientIdx: 1,
      img: INGREDIENTS_CONFIG[1].img,
      name: INGREDIENTS_CONFIG[1].name,
      height: INGREDIENTS_CONFIG[1].height,
    })

    setScore(0)
    setLayerCount(1)
    setCombo(0)
    setIsNewRecord(false)
    setFeedback(null)
    setDebrisList([])
    setMissedItem(null)
    setIsDropping(false)
    setScreen('playing')
  }, [])

  // Resume game
  const handleResume = useCallback(() => {
    stackAudio.playClick()
    setScreen('playing')
  }, [])

  // Pause game (stop propagation to avoid placing ingredient)
  const handlePause = useCallback((e) => {
    e?.stopPropagation()
    stackAudio.playClick()
    setScreen('paused')
  }, [])

  // Home / Exit
  const handleGoHome = useCallback(() => {
    stackAudio.playClick()
    if (onExit) {
      onExit()
    } else {
      window.history.pushState({}, '', '/')
      window.dispatchEvent(new PopStateEvent('popstate'))
      setScreen('start')
    }
  }, [onExit])

  // Performance message in Vietnamese
  const performanceMessage = useMemo(() => {
    if (layerCount >= 30) return 'Bậc thầy xếp burger!'
    if (layerCount >= 20) return 'Siêu đầu bếp Five Star!'
    if (layerCount >= 12) return 'Tay nghề rất khéo léo!'
    if (layerCount >= 6) return 'Đầu bếp đầy triển vọng!'
    return 'Cần luyện tập thêm!'
  }, [layerCount])

  // Feedback popup trigger
  const triggerFeedback = useCallback((text, type) => {
    setFeedback({ text, type, id: Date.now() })
    setTimeout(() => {
      setFeedback((prev) => (prev?.id === feedback?.id ? null : prev))
    }, 800)
  }, [feedback?.id])

  // Core Drop / Stack Action: places the moving ingredient snug right onto the layer below
  const handleDrop = useCallback(() => {
    const now = Date.now()
    if (
      screenRef.current !== 'playing' ||
      isDroppingRef.current ||
      now - lastDropTimeRef.current < 280
    ) {
      return
    }

    lastDropTimeRef.current = now
    setIsDropping(true)
    isDroppingRef.current = true
    stackAudio.playDrop()

    const currentStack = stackRef.current
    const topLayer = currentStack[currentStack.length - 1]
    const moving = movingPieceRef.current

    const movingLeft = moving.x
    const movingWidth = moving.width
    const targetLeft = topLayer.left
    const targetWidth = topLayer.width

    const diff = movingLeft - targetLeft

    // CASE 1: HOÀN HẢO / CHUẨN (Perfect match)
    if (Math.abs(diff) <= TOLERANCE) {
      const newCombo = combo + 1
      setCombo(newCombo)

      // Width bonus when combo streak >= 3
      let newWidth = targetWidth
      if (newCombo >= 3 && targetWidth < INITIAL_WIDTH) {
        newWidth = Math.min(INITIAL_WIDTH, targetWidth + 6)
      }

      const pointsEarned = 100 + newCombo * 50
      setScore((s) => s + pointsEarned)
      stackAudio.playPerfect(newCombo)

      triggerFeedback(newCombo > 1 ? 'HOÀN HẢO!' : 'CHUẨN!', 'perfect')

      // Add new layer snapped to target
      const newLayer = {
        id: currentStack.length,
        left: targetLeft,
        width: newWidth,
        img: moving.img,
        name: moving.name,
        height: moving.height,
      }

      const nextStack = [...currentStack, newLayer]
      setStack(nextStack)
      stackRef.current = nextStack
      setLayerCount(nextStack.length)

      // Prepare next moving piece (gliding immediately above the new top layer)
      const nextIdx = (moving.ingredientIdx + 1) % (INGREDIENTS_CONFIG.length - 1) + 1
      const nextIngredient = INGREDIENTS_CONFIG[nextIdx]

      setTimeout(() => {
        const curW = frameWidthRef.current
        setMovingPiece({
          x: nextIdx % 2 === 0 ? 10 : Math.max(10, curW - newWidth - 10),
          width: newWidth,
          dir: nextIdx % 2 === 0 ? 1 : -1,
          ingredientIdx: nextIdx,
          img: nextIngredient.img,
          name: nextIngredient.name,
          height: nextIngredient.height,
        })
        setIsDropping(false)
        isDroppingRef.current = false
      }, 90)

      return
    }

    // CASE 2: HƠI LỆCH (Partial overlap, slice overhang piece immediately)
    const movingRight = movingLeft + movingWidth
    const targetRight = targetLeft + targetWidth

    const overlapLeft = Math.max(movingLeft, targetLeft)
    const overlapRight = Math.min(movingRight, targetRight)
    const overlapWidth = overlapRight - overlapLeft

    if (overlapWidth > MIN_WIDTH) {
      setCombo(0)
      const pointsEarned = 50
      setScore((s) => s + pointsEarned)
      stackAudio.playSlice()
      triggerFeedback('HƠI LỆCH!', 'slice')

      // Cut overhang debris right from the contact plane
      const isCutOnRight = movingRight > targetRight
      const cutWidth = isCutOnRight ? movingRight - targetRight : targetLeft - movingLeft
      const cutLeft = isCutOnRight ? targetRight : movingLeft

      const debrisItem = {
        id: Date.now(),
        left: cutLeft,
        width: cutWidth,
        img: moving.img,
        height: moving.height,
        bottomPx: BASE_BOTTOM + currentStack.length * LAYER_STEP,
        dx: isCutOnRight ? 45 : -45,
        rot: isCutOnRight ? 45 : -45,
      }

      setDebrisList((prev) => [...prev, debrisItem])
      setTimeout(() => {
        setDebrisList((prev) => prev.filter((d) => d.id !== debrisItem.id))
      }, 850)

      // Add truncated layer
      const newLayer = {
        id: currentStack.length,
        left: overlapLeft,
        width: overlapWidth,
        img: moving.img,
        name: moving.name,
        height: moving.height,
      }

      const nextStack = [...currentStack, newLayer]
      setStack(nextStack)
      stackRef.current = nextStack
      setLayerCount(nextStack.length)

      // Prepare next moving piece
      const nextIdx = (moving.ingredientIdx + 1) % (INGREDIENTS_CONFIG.length - 1) + 1
      const nextIngredient = INGREDIENTS_CONFIG[nextIdx]

      setTimeout(() => {
        const curW = frameWidthRef.current
        setMovingPiece({
          x: nextIdx % 2 === 0 ? 10 : Math.max(10, curW - overlapWidth - 10),
          width: overlapWidth,
          dir: nextIdx % 2 === 0 ? 1 : -1,
          ingredientIdx: nextIdx,
          img: nextIngredient.img,
          name: nextIngredient.name,
          height: nextIngredient.height,
        })
        setIsDropping(false)
        isDroppingRef.current = false
      }, 90)

      return
    }

    // CASE 3: MISS (Complete miss -> Game Over)
    stackAudio.playMiss()
    const missedDx = diff > 0 ? 60 : -60
    const missedRot = diff > 0 ? 60 : -60

    setMissedItem({
      left: movingLeft,
      width: movingWidth,
      img: moving.img,
      height: moving.height,
      bottomPx: BASE_BOTTOM + currentStack.length * LAYER_STEP,
      dx: missedDx,
      rot: missedRot,
    })

    setTimeout(() => {
      // Check high score
      const finalScore = score
      if (finalScore > bestScore) {
        setIsNewRecord(true)
        setBestScore(finalScore)
        try {
          localStorage.setItem(STORAGE_BEST_KEY, finalScore.toString())
        } catch {
          // ignore storage fail
        }
      }
      stackAudio.playGameOver()
      setScreen('gameover')
      setIsDropping(false)
      isDroppingRef.current = false
    }, 700)
  }, [combo, score, bestScore, triggerFeedback])

  // Horizontal Oscillation Loop
  useEffect(() => {
    if (screen !== 'playing') {
      if (animRef.current) cancelAnimationFrame(animRef.current)
      return
    }

    let lastTime = performance.now()

    const loop = (time) => {
      const dt = Math.min((time - lastTime) / 1000, 0.1)
      lastTime = time

      if (!isDroppingRef.current) {
        const speed = 190 + Math.min(stackRef.current.length * 6, 260) // Pixels per second
        const p = movingPieceRef.current

        let nextX = p.x + p.dir * speed * dt
        let nextDir = p.dir

        const curW = frameWidthRef.current
        if (nextX <= 8) {
          nextX = 8
          nextDir = 1
        } else if (nextX + p.width >= curW - 8) {
          nextX = Math.max(8, curW - 8 - p.width)
          nextDir = -1
        }

        const updated = { ...p, x: nextX, dir: nextDir }
        movingPieceRef.current = updated
        setMovingPiece(updated)
      }

      animRef.current = requestAnimationFrame(loop)
    }

    animRef.current = requestAnimationFrame(loop)

    return () => {
      if (animRef.current) cancelAnimationFrame(animRef.current)
    }
  }, [screen])

  // Desktop Keyboard Listener (Space to stack, P to pause)
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.code === 'Space') {
        e.preventDefault()
        if (screen === 'playing') {
          handleDrop()
        } else if (screen === 'start') {
          handleStartGame()
        } else if (screen === 'gameover') {
          if (!gameOverLockedRef.current) {
            handleStartGame()
          }
        }
      } else if (e.code === 'KeyP') {
        if (screen === 'playing') handlePause()
        else if (screen === 'paused') handleResume()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [screen, handleDrop, handleStartGame, handlePause, handleResume])

  // Smooth Camera Panning: keeps the active stacking layer in the comfortable middle zone
  const cameraOffsetY = useMemo(() => {
    const totalStacked = stack.length
    if (totalStacked <= 4) return 0
    return (totalStacked - 4) * LAYER_STEP
  }, [stack.length])

  // Active moving layer bottom position inside sa-stack-container:
  // Glides directly right above the current top layer (+2px snug hover clearance)
  const activeMovingBottomPx = useMemo(() => {
    return BASE_BOTTOM + stack.length * LAYER_STEP + 2
  }, [stack.length])

  return (
    <div className="sa-desktop-wrapper">
      {/* Flanking Left Panel (Desktop Arcade Experience) */}
      <aside className="sa-desktop-flank sa-desktop-flank--left" aria-hidden="true">
        <div className="sa-desktop-tips-card">
          <h4>💡 Bí quyết xếp chuẩn</h4>
          <p>Quan sát mép nguyên liệu ngay sát bên dưới để căn chuỗi <b>HOÀN HẢO!</b> và phục hồi độ rộng!</p>
        </div>
      </aside>

      {/* Main Mobile Frame (390 × 844 px) */}
      <main className="sa-phone-frame" role="region" aria-label="Trò chơi Stack Attack Five Star">
        <div className="sa-bg-pattern" />

        {/* ------------------------------------------------------------------
            A. MÀN HÌNH BẮT ĐẦU (START SCREEN)
            ------------------------------------------------------------------ */}
        {screen === 'start' && (
          <div className="sa-start-screen">
            <div className="sa-start-top-bar">
              
              <div className="sa-brand-badge">⭐ FIVE STAR</div>
            </div>

            <header className="sa-start-header">
              <h1 className="sa-game-title">STACK ATTACK</h1>
              <p className="sa-tagline">Xếp burger thật chuẩn, đừng để tháp đổ!</p>
            </header>

            <div className="sa-hero-art">
              <div className="sa-hero-plate" />
              <img
                src={stackAttackHomeImg}
                alt="Burger gà giòn Five Star xếp tầng hấp dẫn"
                className="sa-hero-burger-img"
              />
            </div>

            <footer className="sa-start-footer">
              <div className="sa-highscore-pill">
                🏆 KỶ LỤC CAO NHẤT: <b>{bestScore.toLocaleString('vi-VN')}</b>
              </div>
              <div className="sa-start-actions">
                <button
                  type="button"
                  className="sa-btn sa-btn--primary"
                  onClick={handleStartGame}
                >
                  BẮT ĐẦU
                </button>
                <button
                  type="button"
                  className="sa-btn sa-btn--outline"
                  onClick={handleGoHome}
                >
                  VỀ TRANG CHỦ
                </button>
              </div>
            </footer>
          </div>
        )}

        {/* ------------------------------------------------------------------
            B. MÀN HÌNH CHƠI (GAMEPLAY SCREEN)
            ------------------------------------------------------------------ */}
        {(screen === 'playing' || screen === 'paused') && (
          <div className="sa-game-screen">
            {/* Top HUD */}
            <header className="sa-hud-bar">
              <div className="sa-hud-left">
                <div className="sa-hud-pill sa-hud-pill--score">
                  <span className="sa-hud-label">ĐIỂM</span>
                  <span className="sa-hud-value">{score.toLocaleString('vi-VN')}</span>
                </div>
                <div className="sa-hud-pill">
                  <span className="sa-hud-label">KỶ LỤC</span>
                  <span className="sa-hud-value">{bestScore.toLocaleString('vi-VN')}</span>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '6px' }}>
                <button
                  type="button"
                  className="sa-btn--sound"
                  onClick={handleToggleSound}
                  title="Bật / Tắt âm thanh"
                  aria-label="Bật hoặc tắt âm thanh"
                >
                  {soundOn ? '🔊' : '🔇'}
                </button>
                <button
                  type="button"
                  className="sa-btn--pause"
                  onClick={handlePause}
                  aria-label="Tạm dừng trò chơi"
                >
                  ⏸ TẠM DỪNG
                </button>
              </div>
            </header>

            {/* Stage Layer Indicator */}
            <div className="sa-stage-indicator">
              <div className="sa-layer-badge">
                TẦNG: {layerCount}
              </div>
              {combo > 1 && (
                <div className="sa-streak-badge">
                  🔥 CHUỖI X{combo}!
                </div>
              )}
            </div>

            {/* Active Play Area */}
            <div
              className="sa-stage-area"
              onPointerDown={(e) => {
                // Chỉ nhận nút chuột chính (left click) hoặc chạm ngón tay
                if (e.button !== undefined && e.button !== 0) return
                handleDrop()
              }}
              role="button"
              tabIndex={0}
              aria-label="Chạm để xếp nguyên liệu"
            >
              {/* Tap instruction */}
              {layerCount <= 3 && (
                <div className="sa-tap-instruction">
                  CHẠM ĐỂ XẾP
                </div>
              )}

              {/* Stacked Layers & Moving Ingredient Container (pans downward smoothly) */}
              <div
                className="sa-stack-container"
                style={{
                  transform: `translateY(${cameraOffsetY}px)`,
                }}
              >
                {/* Tray & Paper foundation */}
                <div className="sa-serving-board" />
                <div className="sa-serving-paper" />

                {/* Floating Feedback Badge (appears directly above the active stack) */}
                {feedback && (
                  <div
                    key={feedback.id}
                    className={`sa-feedback-popup sa-feedback-popup--${feedback.type}`}
                    style={{
                      bottom: `${BASE_BOTTOM + stack.length * LAYER_STEP + 38}px`,
                    }}
                  >
                    {feedback.text}
                  </div>
                )}

                {/* Placed layers */}
                {stack.map((item, idx) => {
                  const bottomPx = BASE_BOTTOM + idx * LAYER_STEP
                  const isTopLayer = idx === stack.length - 1
                  return (
                    <div
                      key={item.id}
                      className="sa-layer"
                      style={{
                        left: `${item.left}px`,
                        bottom: `${bottomPx}px`,
                        width: `${item.width}px`,
                        height: `${item.height}px`,
                        zIndex: 10 + idx,
                      }}
                    >
                      <img
                        src={item.img}
                        alt={item.name}
                        className="sa-layer-img"
                        draggable={false}
                      />
                      {/* Landing edge target indicators on top layer */}
                      {isTopLayer && (
                        <>
                          <div className="sa-target-edge sa-target-edge--left" title="Mép căn trái" />
                          <div className="sa-target-edge sa-target-edge--right" title="Mép căn phải" />
                        </>
                      )}
                    </div>
                  )
                })}

                {/* Moving Ingredient Layer: glides snug right on top of the burger stack */}
                {!isDropping && (
                  <div
                    className="sa-layer sa-layer--moving"
                    style={{
                      left: `${movingPiece.x}px`,
                      bottom: `${activeMovingBottomPx}px`,
                      width: `${movingPiece.width}px`,
                      height: `${movingPiece.height}px`,
                    }}
                  >
                    <img
                      src={movingPiece.img}
                      alt={movingPiece.name}
                      className="sa-layer-img"
                      draggable={false}
                    />
                  </div>
                )}

                {/* Sliced Debris (shears off from contact plane) */}
                {debrisList.map((debris) => {
                  return (
                    <div
                      key={debris.id}
                      className="sa-debris"
                      style={{
                        left: `${debris.left}px`,
                        bottom: `${debris.bottomPx}px`,
                        width: `${debris.width}px`,
                        height: `${debris.height}px`,
                        '--debris-dx': `${debris.dx}px`,
                        '--debris-rot': `${debris.rot}deg`,
                      }}
                    >
                      <img
                        src={debris.img}
                        alt="Mảnh cắt nguyên liệu"
                        className="sa-layer-img"
                        draggable={false}
                      />
                    </div>
                  )
                })}

                {/* Missed piece (falling past stack edge) */}
                {missedItem && (
                  <div
                    className="sa-missed-ingredient"
                    style={{
                      left: `${missedItem.left}px`,
                      bottom: `${missedItem.bottomPx}px`,
                      width: `${missedItem.width}px`,
                      height: `${missedItem.height}px`,
                      '--miss-dx': `${missedItem.dx}px`,
                      '--miss-rot': `${missedItem.rot}deg`,
                    }}
                  >
                    <img
                      src={missedItem.img}
                      alt="Nguyên liệu trượt"
                      className="sa-layer-img"
                      draggable={false}
                    />
                  </div>
                )}
              </div>
            </div>

            {/* --------------------------------------------------------------
                C. MÀN HÌNH TẠM DỪNG (PAUSE SCREEN OVERLAY)
                -------------------------------------------------------------- */}
            {screen === 'paused' && (
              <div className="sa-pause-overlay" role="dialog" aria-modal="true">
                <div className="sa-pause-panel">
                  <h2 className="sa-pause-title">TẠM NGHỈ</h2>
                  <div className="sa-pause-actions">
                    <button
                      type="button"
                      className="sa-btn sa-btn--primary"
                      onClick={handleResume}
                    >
                      TIẾP TỤC
                    </button>
                    <button
                      type="button"
                      className="sa-btn sa-btn--secondary"
                      onClick={handleStartGame}
                    >
                      CHƠI LẠI
                    </button>
                    <button
                      type="button"
                      className="sa-btn sa-btn--outline"
                      onClick={handleGoHome}
                    >
                      VỀ TRANG CHỦ
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ------------------------------------------------------------------
            D. MÀN HÌNH KẾT THÚC (GAME OVER SCREEN)
            ------------------------------------------------------------------ */}
        {screen === 'gameover' && (
          <div className="sa-gameover-screen">
            <header className="sa-gameover-header">
              <h2 className="sa-gameover-title">TRÒ CHƠI KẾT THÚC</h2>
              {isNewRecord && (
                <div className="sa-new-record-badge">
                  ⭐ KỶ LỤC MỚI! ⭐
                </div>
              )}
            </header>

            {/* Final Stack Presentation */}
            <div className="sa-gameover-burger-stage">
              <img
                src={stackAttackHomeImg}
                alt="Tháp burger hoàn thành"
                className="sa-gameover-burger-img"
              />
            </div>

            {/* Results Card */}
            <div className="sa-results-card">
              <div className="sa-score-row sa-score-row--main">
                <span className="sa-score-label">ĐIỂM CỦA BẠN</span>
                <span className="sa-score-number sa-score-number--highlight">
                  {score.toLocaleString('vi-VN')}
                </span>
              </div>

              <div className="sa-score-row">
                <span className="sa-score-label">KỶ LỤC CAO NHẤT</span>
                <span className="sa-score-number">
                  {bestScore.toLocaleString('vi-VN')}
                </span>
              </div>

              <div className="sa-score-row">
                <span className="sa-score-label">SỐ TẦNG ĐÃ XẾP</span>
                <span className="sa-score-number">
                  {layerCount}
                </span>
              </div>

              <div className="sa-performance-banner">
                {performanceMessage}
              </div>
            </div>

            <footer className="sa-gameover-actions">
              <button
                type="button"
                className={`sa-btn sa-btn--primary ${gameOverLocked ? 'sa-btn--disabled' : ''}`}
                onClick={() => {
                  if (!gameOverLocked) handleStartGame()
                }}
                disabled={gameOverLocked}
                title={gameOverLocked ? 'Đang hiển thị kết quả...' : 'Chơi lại'}
              >
                CHƠI LẠI
              </button>
              <button
                type="button"
                className={`sa-btn sa-btn--outline ${gameOverLocked ? 'sa-btn--disabled' : ''}`}
                onClick={() => {
                  if (!gameOverLocked) handleGoHome()
                }}
                disabled={gameOverLocked}
              >
                VỀ TRANG CHỦ
              </button>
            </footer>
          </div>
        )}
      </main>

      {/* Flanking Right Panel (Desktop Controls Guide) */}
      <aside className="sa-desktop-flank sa-desktop-flank--right" aria-hidden="true">
        <div className="sa-desktop-badge">ĐIỀU KHIỂN</div>
        <h3 className="sa-desktop-brand" style={{ fontSize: '18px' }}>Thao tác máy tính</h3>
        <p className="sa-desktop-tagline" style={{ marginBottom: '10px' }}>
          Bạn có thể chơi trực tiếp bằng bàn phím hoặc chuột:
        </p>

        <div className="sa-desktop-key-hint">
          <span className="sa-key-badge">Space</span>
          <span>Xếp nguyên liệu</span>
        </div>

        <div className="sa-desktop-key-hint">
          <span className="sa-key-badge">P</span>
          <span>Tạm nghỉ / Tiếp tục</span>
        </div>

        <div className="sa-desktop-tips-card" style={{ marginTop: '16px' }}>
          <h4>🍔 7 Nguyên liệu chuẩn</h4>
          <p>Bánh burger dưới, gà chiên giòn, phô mai béo, xà lách tươi, cà chua mọng, thịt xông khói & bánh burger trên!</p>
        </div>
      </aside>
    </div>
  )
}
