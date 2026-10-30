import { useState, useEffect, useRef, useCallback } from 'react'
import {
  TOPPING_DEFINITIONS,
  getAvailablePool,
  generateNewOrder,
  getSpeedTier,
  getFallingSpeed,
  isMaxSpeed,
  getSpawnInterval,
  BASE_SPEED,
  SPEED_INCREMENT,
  MAX_SPEED,
  SPEED_STEP_PTS,
} from './bubbleTeaAssets'
import { bubbleAudio } from './bubbleTeaAudio'
import StartScreen from './StartScreen'
import GameScreen from './GameScreen'
import './bubbleTea.css'

const STORAGE_BEST_KEY = 'bubble_tea_catch_best_score'
const CUP_WIDTH = 76
const CUP_HEIGHT = 84

export {
  getSpeedTier,
  getFallingSpeed,
  isMaxSpeed,
  getSpawnInterval,
  BASE_SPEED,
  SPEED_INCREMENT,
  MAX_SPEED,
  SPEED_STEP_PTS,
}

export default function BubbleTeaCatchGame({ onExit }) {
  // Screen states: 'start' | 'countdown' | 'playing' | 'gameover'
  const [screen, setScreen] = useState('start')
  const [score, setScore] = useState(0)
  const [bestScore, setBestScore] = useState(() => {
    try {
      return parseInt(localStorage.getItem(STORAGE_BEST_KEY) || '0', 10)
    } catch {
      return 0
    }
  })
  const [lives, setLives] = useState(3) // Cap is 5
  const [combo, setCombo] = useState(0)
  const [soundOn, setSoundOn] = useState(true)
  const [isNewBest, setIsNewBest] = useState(false)

  // Multi-item order state
  const [order, setOrder] = useState(() => generateNewOrder(0))
  const [orderChangeKey, setOrderChangeKey] = useState(0)
  const [countdown, setCountdown] = useState(null)
  const [isPaused, setIsPaused] = useState(false)

  // Visual feedback states
  const [reactionState, setReactionState] = useState('idle') // 'idle' | 'happy' | 'wrong'
  const [cupParticles, setCupParticles] = useState([])
  const [popups, setPopups] = useState([])
  const [missMarkers, setMissMarkers] = useState([])
  const [screenFlash, setScreenFlash] = useState(false)
  const [livesShaking, setLivesShaking] = useState(false)

  // Physical coordinates
  const [cupX, setCupX] = useState(150)
  const [cupY, setCupY] = useState(480)
  const [playfieldSize, setPlayfieldSize] = useState({ width: 380, height: 600 })
  const [toppings, setToppings] = useState([])

  // Mutable refs for 60fps delta-time RAF loop
  const screenRef = useRef(screen)
  const scoreRef = useRef(score)
  const bestScoreRef = useRef(bestScore)
  const livesRef = useRef(lives)
  const comboRef = useRef(combo)
  const orderRef = useRef(order)
  const cupXRef = useRef(cupX)
  const cupYRef = useRef(cupY)
  const toppingsRef = useRef([])
  const playfieldRef = useRef(null)
  const playfieldSizeRef = useRef(playfieldSize)
  const keysPressedRef = useRef({ left: false, right: false })
  const lastTimeRef = useRef(0)
  const spawnTimerRef = useRef(0)
  const heartCooldownTimerRef = useRef(20) // Cooldown for heart spawning
  const lastSpawnXRef = useRef(150)
  const nextToppingIdRef = useRef(1)
  const animFrameIdRef = useRef(null)
  const isDraggingRef = useRef(false)
  const isPausedRef = useRef(false)

  // Synchronize state to refs
  screenRef.current = screen
  scoreRef.current = score
  bestScoreRef.current = bestScore
  livesRef.current = lives
  comboRef.current = combo
  orderRef.current = order
  cupXRef.current = cupX
  cupYRef.current = cupY
  playfieldSizeRef.current = playfieldSize
  isPausedRef.current = isPaused

  // Measure playfield size
  const updatePlayfieldSize = useCallback(() => {
    if (!playfieldRef.current) return
    const rect = playfieldRef.current.getBoundingClientRect()
    const playArea = playfieldRef.current.querySelector('.btc-playfield-area')
    if (playArea) {
      const areaRect = playArea.getBoundingClientRect()
      const w = areaRect.width || rect.width || 380
      const h = areaRect.height || 540
      setPlayfieldSize({ width: w, height: h })
      playfieldSizeRef.current = { width: w, height: h }
      const newCupY = Math.max(100, h - CUP_HEIGHT - 16)
      setCupY(newCupY)
      cupYRef.current = newCupY
    }
  }, [])

  useEffect(() => {
    updatePlayfieldSize()
    window.addEventListener('resize', updatePlayfieldSize)
    return () => window.removeEventListener('resize', updatePlayfieldSize)
  }, [updatePlayfieldSize, screen])

  // Sound toggle handler
  const handleToggleSound = useCallback(() => {
    const newState = bubbleAudio.toggleSound()
    setSoundOn(newState)
  }, [])

  // Pause toggle handler
  const handleTogglePause = useCallback(() => {
    if (screenRef.current !== 'playing') return
    bubbleAudio.playClick()
    setIsPaused((prev) => {
      const next = !prev
      isPausedRef.current = next
      if (!next) {
        lastTimeRef.current = performance.now()
      }
      return next
    })
  }, [])

  const handleResume = useCallback(() => {
    bubbleAudio.playClick()
    setIsPaused(false)
    isPausedRef.current = false
    lastTimeRef.current = performance.now()
  }, [])

  // Add floating popup
  const addPopup = useCallback((text, type, x, y) => {
    const id = Date.now() + Math.random()
    setPopups((prev) => [...prev, { id, text, type, x, y }])
    setTimeout(() => {
      setPopups((prev) => prev.filter((p) => p.id !== id))
    }, 850)
  }, [])

  // Add red X miss marker at exact miss position
  const addMissMarker = useCallback((x, y) => {
    const id = Date.now() + Math.random()
    setMissMarkers((prev) => [...prev, { id, x, y }])
    setTimeout(() => {
      setMissMarkers((prev) => prev.filter((m) => m.id !== id))
    }, 650)
  }, [])

  // Trigger cup reaction
  const triggerCupReaction = useCallback((type) => {
    setReactionState(type)
    setTimeout(() => {
      setReactionState('idle')
    }, 350)
  }, [])

  // Trigger particle burst on catch
  const emitParticles = useCallback((color, isHeart = false) => {
    const chars = isHeart ? ['💖', '✨', '❤️', '🌟'] : ['✨', '⭐', '🌟', '💫']
    const newParticles = Array.from({ length: 5 }, (_, i) => ({
      id: Date.now() + i,
      char: chars[i % chars.length],
      dx: (Math.random() - 0.5) * 60,
      dy: -30 - Math.random() * 40,
      color,
    }))
    setCupParticles(newParticles)
    setTimeout(() => {
      setCupParticles([])
    }, 450)
  }, [])

  // Handle Game Over
  const triggerGameOver = useCallback((finalScore) => {
    setScreen('gameover')
    screenRef.current = 'gameover'
    toppingsRef.current = []
    setToppings([])

    let newRecord = false
    try {
      const stored = parseInt(localStorage.getItem(STORAGE_BEST_KEY) || '0', 10)
      if (finalScore > stored) {
        localStorage.setItem(STORAGE_BEST_KEY, String(finalScore))
        setBestScore(finalScore)
        bestScoreRef.current = finalScore
        newRecord = true
      }
    } catch {
      // ignore storage failure
    }
    setIsNewBest(newRecord)
    bubbleAudio.playGameOver()
  }, [])

  // Spawn a new falling topping or heart power-up
  const spawnTopping = useCallback(() => {
    const { width: pWidth } = playfieldSizeRef.current
    const currentScore = scoreRef.current
    const currentLives = livesRef.current
    const curOrder = orderRef.current
    const baseVy = getFallingSpeed(currentScore)

    // Check if Heart Item should spawn:
    // Only if lives < 5 and cooldown has passed
    const heartCooldownOver = heartCooldownTimerRef.current <= 0
    let shouldSpawnHeart = false
    if (heartCooldownOver && currentLives < 5) {
      // Higher chance if player is low on lives
      const heartChance = currentLives <= 2 ? 0.22 : 0.1
      if (Math.random() < heartChance) {
        shouldSpawnHeart = true
      }
    }

    if (shouldSpawnHeart) {
      heartCooldownTimerRef.current = 28 // Reset heart cooldown to 28 seconds

      const heartWidth = 44
      const heartHeight = 44
      const minX = 16
      const maxX = Math.max(minX + 10, pWidth - heartWidth - 16)
      const spawnX = minX + Math.random() * (maxX - minX)

      const heartItem = {
        id: nextToppingIdRef.current++,
        isHeart: true,
        toppingType: {
          id: 'heart-powerup',
          name: 'Extra Life',
          nameVi: 'Trái Tim Hồi Mạng',
        },
        x: spawnX,
        y: -heartHeight,
        width: heartWidth,
        height: heartHeight,
        vy: baseVy * 0.9, // Falls slightly gentler
        rotation: 0,
        rotSpeed: 0,
        hasCollided: false,
        missHandled: false,
      }

      toppingsRef.current.push(heartItem)
      return
    }

    // Normal topping spawn:
    // Select from uncompleted items or the available pool
    const pool = getAvailablePool(currentScore)
    const uncompletedItems = curOrder.items.filter((i) => !i.completed)

    let chosenType
    // 42% chance to spawn an uncompleted required topping to keep gameplay fair
    if (uncompletedItems.length > 0 && Math.random() < 0.42) {
      const randomUncompleted =
        uncompletedItems[Math.floor(Math.random() * uncompletedItems.length)]
      chosenType = randomUncompleted.topping
    } else {
      chosenType = pool[Math.floor(Math.random() * pool.length)]
    }

    const toppingWidth = chosenType.width || 44
    const toppingHeight = chosenType.height || 44

    const minX = 12
    const maxX = Math.max(minX + 10, pWidth - toppingWidth - 12)
    let spawnX = minX + Math.random() * (maxX - minX)

    if (Math.abs(spawnX - lastSpawnXRef.current) < 50 && maxX - minX > 100) {
      spawnX = ((spawnX + (maxX - minX) / 2) % (maxX - minX)) + minX
    }
    lastSpawnXRef.current = spawnX

    const vy = baseVy * (0.92 + Math.random() * 0.16)

    const newTopping = {
      id: nextToppingIdRef.current++,
      isHeart: false,
      toppingType: chosenType,
      x: spawnX,
      y: -toppingHeight,
      width: toppingWidth,
      height: toppingHeight,
      vy,
      rotation: (Math.random() - 0.5) * 20,
      rotSpeed: (Math.random() - 0.5) * 35,
      hasCollided: false,
      missHandled: false,
    }

    toppingsRef.current.push(newTopping)
  }, [])

  // Main 60fps Game Loop
  useEffect(() => {
    if (screen !== 'playing') {
      if (animFrameIdRef.current) {
        cancelAnimationFrame(animFrameIdRef.current)
        animFrameIdRef.current = null
      }
      return
    }

    lastTimeRef.current = performance.now()
    spawnTimerRef.current = 0

    const loop = (now) => {
      if (isPausedRef.current) {
        lastTimeRef.current = now
        animFrameIdRef.current = requestAnimationFrame(loop)
        return
      }

      const dt = Math.min((now - lastTimeRef.current) / 1000, 0.1)
      lastTimeRef.current = now

      const { width: pWidth, height: pHeight } = playfieldSizeRef.current
      const currentCupY = cupYRef.current

      // 1. Process keyboard horizontal movement
      const KEYBOARD_SPEED = 480
      if (keysPressedRef.current.left) {
        const nextX = Math.max(0, cupXRef.current - KEYBOARD_SPEED * dt)
        cupXRef.current = nextX
        setCupX(nextX)
      } else if (keysPressedRef.current.right) {
        const nextX = Math.min(pWidth - CUP_WIDTH, cupXRef.current + KEYBOARD_SPEED * dt)
        cupXRef.current = nextX
        setCupX(nextX)
      }

      // 2. Cooldown & Spawn timer updates
      heartCooldownTimerRef.current -= dt
      spawnTimerRef.current += dt
      const curScore = scoreRef.current
      const curInterval = getSpawnInterval(curScore)
      if (spawnTimerRef.current >= curInterval) {
        spawnTimerRef.current = 0
        spawnTopping()
      }

      // 3. Update falling toppings, detect collision & miss
      const remainingToppings = []
      const curCupX = cupXRef.current
      const curOrder = orderRef.current

      for (let i = 0; i < toppingsRef.current.length; i++) {
        const t = toppingsRef.current[i]

        t.y += t.vy * dt
        t.rotation += t.rotSpeed * dt

        const toppingBottom = t.y + t.height
        const cupTop = currentCupY

        // Catch window near mouth of cup: y from cupTop + 8 to cupTop + 48
        const inVerticalCatchZone =
          toppingBottom >= cupTop + 8 && toppingBottom <= cupTop + 48

        // Horizontal catch overlap (inner 80% of cup width)
        const toppingCenterX = t.x + t.width / 2
        const cupCatchLeft = curCupX + CUP_WIDTH * 0.1
        const cupCatchRight = curCupX + CUP_WIDTH * 0.9

        const inHorizontalCatchZone =
          toppingCenterX >= cupCatchLeft && toppingCenterX <= cupCatchRight

        // === A. COLLISION CHECK ===
        if (!t.hasCollided && inVerticalCatchZone && inHorizontalCatchZone) {
          t.hasCollided = true

          // Case 1: Caught Heart Power-Up
          if (t.isHeart) {
            const currentLivesVal = livesRef.current
            const newLives = Math.min(5, currentLivesVal + 1)
            livesRef.current = newLives
            setLives(newLives)

            bubbleAudio.playHeart()
            triggerCupReaction('happy')
            emitParticles('#FF4D6D', true)
            addPopup('+1 ❤️', 'heart', curCupX + CUP_WIDTH / 2 - 18, currentCupY - 18)
            continue
          }

          // Case 2: Caught Normal Topping
          // Check if it matches an uncompleted item in active order
          const matchItem = curOrder.items.find(
            (item) => item.id === t.toppingType.id && !item.completed
          )

          if (matchItem) {
            // === CORRECT CATCH ===
            matchItem.completed = true

            const prevScore = scoreRef.current
            const newScore = prevScore + 10
            const newCombo = comboRef.current + 1
            scoreRef.current = newScore
            comboRef.current = newCombo
            setScore(newScore)
            setCombo(newCombo)

            if (newScore > bestScoreRef.current) {
              setBestScore(newScore)
              bestScoreRef.current = newScore
            }

            bubbleAudio.playCatchSuccess(newCombo)
            triggerCupReaction('happy')
            emitParticles(t.toppingType.accentColor || '#FFBE0B')
            addPopup('+10', 'success', curCupX + CUP_WIDTH / 2 - 16, currentCupY - 14)

            if (newCombo >= 2) {
              addPopup(`COMBO x${newCombo}!`, 'combo', curCupX + CUP_WIDTH / 2 - 30, currentCupY - 38)
            }

            // Check if speed tier increased (every 30 points)
            const prevTier = getSpeedTier(prevScore)
            const newTier = getSpeedTier(newScore)
            let speedIncreased = false

            if (newTier > prevTier) {
              const wasMax = isMaxSpeed(prevScore)
              const nowMax = isMaxSpeed(newScore)

              if (nowMax && !wasMax) {
                bubbleAudio.playSpeedUp(true)
                // addPopup('⚡ TỐC ĐỘ TỐI ĐA! ⚡', 'speed-max', curCupX + CUP_WIDTH / 2 - 50, currentCupY - 60)
                speedIncreased = true
              } else if (!nowMax) {
                bubbleAudio.playSpeedUp(false)
                // addPopup(`⚡ TĂNG TỐC! (Cấp ${newTier})`, 'speed-up', curCupX + CUP_WIDTH / 2 - 40, currentCupY - 60)
                speedIncreased = true
              }

              // Update any existing active toppings to the new speed
              const newBaseSpeed = getFallingSpeed(newScore)
              for (let j = 0; j < toppingsRef.current.length; j++) {
                const top = toppingsRef.current[j]
                if (!top.isHeart && !top.hasCollided) {
                  top.vy = Math.max(top.vy, newBaseSpeed * (0.92 + Math.random() * 0.16))
                }
              }
            }

            // Check if all items in active order are completed
            const isOrderComplete = curOrder.items.every((it) => it.completed)
            if (isOrderComplete) {
              bubbleAudio.playOrderComplete()
              addPopup('XONG ĐƠN! ✨', 'order-done', curCupX + CUP_WIDTH / 2 - 40, currentCupY - (speedIncreased ? 84 : 58))

              // Immediately generate the next order!
              const nextOrder = generateNewOrder(
                newScore,
                curOrder.items.map((it) => it.id)
              )
              setOrder(nextOrder)
              orderRef.current = nextOrder
              setOrderChangeKey((k) => k + 1)
            } else {
              // Update order completion state
              setOrder({ ...curOrder, items: [...curOrder.items] })
              orderRef.current = curOrder
            }
          } else {
            // === WRONG CATCH (Not in order, or already completed) ===
            const newLives = livesRef.current - 1
            livesRef.current = newLives
            comboRef.current = 0
            setLives(newLives)
            setCombo(0)

            bubbleAudio.playCatchWrong()
            triggerCupReaction('wrong')
            setScreenFlash(true)
            setLivesShaking(true)
            setTimeout(() => setScreenFlash(false), 240)
            setTimeout(() => setLivesShaking(false), 380)

            addPopup('-1 ❤️', 'wrong', curCupX + CUP_WIDTH / 2 - 18, currentCupY - 18)

            if (newLives <= 0) {
              triggerGameOver(scoreRef.current)
              return
            }
          }

          continue
        }

        // === B. MISSED TOPPING CHECK ===
        // When topping falls past the catch height without colliding
        const passedCatchHeight = toppingBottom > cupTop + 48

        if (!t.hasCollided && !t.missHandled && passedCatchHeight) {
          t.missHandled = true

          // If it's a Heart: missing heart does NOT deduct life!
          if (!t.isHeart) {
            // Check if this missed topping is required by the active order
            const isRequired = curOrder.items.some(
              (it) => it.id === t.toppingType.id && !it.completed
            )

            if (isRequired) {
              // Deduct 1 life for missing a required order item
              const newLives = livesRef.current - 1
              livesRef.current = newLives
              comboRef.current = 0
              setLives(newLives)
              setCombo(0)

              bubbleAudio.playMiss()
              setLivesShaking(true)
              setTimeout(() => setLivesShaking(false), 380)

              // Show red X at the exact miss location near the bottom of playfield!
              const missX = t.x + t.width / 2
              const missY = currentCupY + 20
              addMissMarker(missX, missY)
              addPopup('-1 ❤️', 'wrong', missX - 18, missY - 24)

              if (newLives <= 0) {
                triggerGameOver(scoreRef.current)
                return
              }
            }
          }
        }

        // Clean removal when completely off-screen past playfield bottom
        if (t.y > pHeight + 20) {
          continue
        }

        remainingToppings.push(t)
      }

      toppingsRef.current = remainingToppings
      setToppings([...remainingToppings])

      animFrameIdRef.current = requestAnimationFrame(loop)
    }

    animFrameIdRef.current = requestAnimationFrame(loop)

    return () => {
      if (animFrameIdRef.current) {
        cancelAnimationFrame(animFrameIdRef.current)
        animFrameIdRef.current = null
      }
    }
  }, [
    screen,
    spawnTopping,
    triggerCupReaction,
    emitParticles,
    addPopup,
    addMissMarker,
    triggerGameOver,
  ])

  // Desktop keyboard event handlers
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (screenRef.current !== 'playing' && screenRef.current !== 'countdown') return

      if (e.key === 'p' || e.key === 'P' || e.key === 'Escape') {
        e.preventDefault()
        handleTogglePause()
        return
      }

      if (isPausedRef.current) return

      if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') {
        e.preventDefault()
        keysPressedRef.current.left = true
      } else if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') {
        e.preventDefault()
        keysPressedRef.current.right = true
      }
    }

    const handleKeyUp = (e) => {
      if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') {
        keysPressedRef.current.left = false
      } else if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') {
        keysPressedRef.current.right = false
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    window.addEventListener('keyup', handleKeyUp)
    return () => {
      window.removeEventListener('keydown', handleKeyDown)
      window.removeEventListener('keyup', handleKeyUp)
    }
  }, [handleTogglePause])

  // Pointer dragging handlers for mobile touch and desktop mouse
  const handlePointerDown = useCallback((e) => {
    if (isPausedRef.current) return
    isDraggingRef.current = true
    if (!playfieldRef.current) return
    const rect = playfieldRef.current.getBoundingClientRect()
    const playArea = playfieldRef.current.querySelector('.btc-playfield-area')
    const areaRect = playArea ? playArea.getBoundingClientRect() : rect
    const pointerX = e.clientX - areaRect.left
    const { width: pWidth } = playfieldSizeRef.current
    const targetX = Math.max(0, Math.min(pWidth - CUP_WIDTH, pointerX - CUP_WIDTH / 2))
    cupXRef.current = targetX
    setCupX(targetX)
  }, [])

  const handlePointerMove = useCallback((e) => {
    if (isPausedRef.current) return
    if (!isDraggingRef.current && e.buttons === 0 && e.pointerType === 'mouse') {
      return
    }
    if (!playfieldRef.current) return
    const rect = playfieldRef.current.getBoundingClientRect()
    const playArea = playfieldRef.current.querySelector('.btc-playfield-area')
    const areaRect = playArea ? playArea.getBoundingClientRect() : rect
    const pointerX = e.clientX - areaRect.left
    const { width: pWidth } = playfieldSizeRef.current
    const targetX = Math.max(0, Math.min(pWidth - CUP_WIDTH, pointerX - CUP_WIDTH / 2))
    cupXRef.current = targetX
    setCupX(targetX)
  }, [])

  const handlePointerUp = useCallback(() => {
    isDraggingRef.current = false
  }, [])

  // Start new game session
  const startNewGame = useCallback(() => {
    setScore(0)
    scoreRef.current = 0
    setLives(3)
    livesRef.current = 3
    setCombo(0)
    comboRef.current = 0
    toppingsRef.current = []
    setToppings([])
    setPopups([])
    setMissMarkers([])
    setReactionState('idle')
    setIsNewBest(false)
    setIsPaused(false)
    isPausedRef.current = false
    heartCooldownTimerRef.current = 20

    // Center cup
    const { width: pWidth } = playfieldSizeRef.current
    const initialCupX = Math.max(0, (pWidth - CUP_WIDTH) / 2)
    setCupX(initialCupX)
    cupXRef.current = initialCupX

    // Select initial order (1 item at score 0)
    const initialOrder = generateNewOrder(0)
    setOrder(initialOrder)
    orderRef.current = initialOrder
    setOrderChangeKey((k) => k + 1)

    // Start short countdown
    setScreen('countdown')
    screenRef.current = 'countdown'
    setCountdown(3)
    bubbleAudio.playCountdown(false)

    setTimeout(() => {
      setCountdown(2)
      bubbleAudio.playCountdown(false)
    }, 700)

    setTimeout(() => {
      setCountdown(1)
      bubbleAudio.playCountdown(false)
    }, 1400)

    setTimeout(() => {
      setCountdown('BẮT ĐẦU!')
      bubbleAudio.playCountdown(true)
    }, 2100)

    setTimeout(() => {
      setCountdown(null)
      setScreen('playing')
      screenRef.current = 'playing'
      lastTimeRef.current = performance.now()
    }, 2700)
  }, [])

  // Return to start screen
  const handleBackToMenu = useCallback(() => {
    setScreen('start')
    screenRef.current = 'start'
    setIsPaused(false)
    isPausedRef.current = false
    toppingsRef.current = []
    setToppings([])
    setMissMarkers([])
    setCountdown(null)
  }, [])

  return (
    <div className="btc-desktop-wrapper">
      {/* Desktop Left Flank: Guide & Info */}
      <aside className="btc-desktop-flank btc-desktop-flank--left" aria-hidden="true">
        <h2 className="btc-desktop-brand">BUBBLE TEA CATCH</h2>
        <p className="btc-desktop-tagline">
          Trò chơi hứng topping trà sữa theo <strong>ĐƠN HÀNG</strong>! Hứng trọn đủ các món để thăng hoa combo và giành kỷ lục!
        </p>

        <div className="btc-desktop-card">
          <h4>DANH SÁCH TOPPING</h4>
          <ul className="btc-desktop-topping-list">
            {TOPPING_DEFINITIONS.map((top) => (
              <li key={top.id} className="btc-desktop-topping-item">
                <img src={top.img} alt="" className="btc-desktop-topping-img" />
                <div className="btc-desktop-topping-info">
                  <strong>{top.nameVi}</strong>
                  <span>{top.name}</span>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </aside>

      {/* Center Phone Container */}
      <main className="btc-game-container">
        {screen === 'start' && (
          <StartScreen
            onPlay={startNewGame}
            bestScore={bestScore}
            soundOn={soundOn}
            onToggleSound={handleToggleSound}
            onExit={onExit}
          />
        )}

        {(screen === 'playing' || screen === 'countdown' || screen === 'gameover') && (
          <GameScreen
            playfieldRef={playfieldRef}
            score={score}
            bestScore={bestScore}
            lives={lives}
            combo={combo}
            order={order}
            orderChangeKey={orderChangeKey}
            toppings={toppings}
            cupX={cupX}
            cupY={cupY}
            cupWidth={CUP_WIDTH}
            cupHeight={CUP_HEIGHT}
            reactionState={reactionState}
            cupParticles={cupParticles}
            popups={popups}
            missMarkers={missMarkers}
            screenFlash={screenFlash}
            livesShaking={livesShaking}
            countdown={countdown}
            isPaused={isPaused}
            onTogglePause={handleTogglePause}
            onResume={handleResume}
            isGameOver={screen === 'gameover'}
            isNewBest={isNewBest}
            soundOn={soundOn}
            onToggleSound={handleToggleSound}
            onExit={onExit}
            onPlayAgain={startNewGame}
            onBackToMenu={handleBackToMenu}
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
          />
        )}
      </main>

      {/* Desktop Right Flank: Pro Tips & Score */}
      <aside className="btc-desktop-flank btc-desktop-flank--right" aria-hidden="true">
        <div className="btc-desktop-card">
          <h4>KỶ LỤC CỦA BẠN</h4>
          <div className="btc-desktop-best-val">
            {bestScore > 0 ? `${bestScore} điểm` : 'Chưa có kỷ lục'}
          </div>
        </div>

        <div className="btc-desktop-card">
          <h4>LUẬT CHƠI & MẸO</h4>
          <p>
            <strong>ĐƠN HÀNG đa món:</strong> Độ khó tăng dần từ 1, 2 đến tối đa 3 món cần hứng cùng lúc.
          </p>
          <p>
            <strong>Không bỏ lỡ:</strong> Bỏ lỡ món trong đơn hàng sẽ bị mất ngay 1 mạng (dấu ✕ đỏ).
          </p>
          <p>
            <strong>Trái Tim hồi mạng:</strong> Bắt tim rơi để hồi thêm 1 mạng (tối đa 5 mạng).
          </p>
          <p>
            <strong>Thanh đỏ bắt bóng:</strong> Căn đúng độ cao thanh đỏ tại miệng cốc để bắt chuẩn xác.
          </p>
          <p>
            <strong>Tốc độ tăng dần:</strong> Cứ mỗi 30 điểm tốc độ rơi sẽ tăng lên và giữ nguyên khi đạt tốc độ tối đa!
          </p>
        </div>

        <div className="btc-desktop-footer">
          <span>Five Star Arcade · Mobile First</span>
        </div>
      </aside>
    </div>
  )
}
