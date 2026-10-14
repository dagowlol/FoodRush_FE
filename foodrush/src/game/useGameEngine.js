import { useCallback, useEffect, useRef, useState } from 'react'
import {
  BUG_TYPES,
  COUPON_TIERS,
  FIELD,
  FOOD,
  FOOD_TYPES,
  LIVES,
  SCORE,
  TOOLS,
  flyingSpawn,
  getDifficulty,
  groundSpawn,
  rand,
} from './config'
import { tierForScore } from './coupons'

const GROUND_R = 42
const FLYING_R = 40
const POWER_UP_DRAIN_PER_HIT = 10

function toDescriptor(bug) {
  return {
    id: bug.id,
    type: bug.type,
    hp: bug.hp,
    maxHp: bug.maxHp,
    x: bug.x,
    y: bug.y,
    r: bug.r,
  }
}

/**
 * Owns the whole simulation. Bug positions live in refs and are written straight
 * to the DOM through requestAnimationFrame; React state is only updated when
 * something meaningful changes (spawn, kill, hit, score) to avoid a
 * re-render on every frame.
 *
 * Gameplay is endless and scales smoothly based on current score:
 * bugs are generated randomly with increasing speed, frequency, flying mix,
 * and toughness as the player scores higher.
 */
export function useGameEngine(onEvent) {
  const [status, setStatus] = useState('idle') // idle | running | paused | result
  const [bugs, setBugs] = useState([])
  const [score, setScore] = useState(0)
  const [combo, setCombo] = useState(0)
  const [bugsKilled, setBugsKilled] = useState(0)
  const [lives, setLives] = useState(LIVES)
  const [elapsed, setElapsed] = useState(0)
  const [foodType, setFoodType] = useState(FOOD_TYPES[0])
  const [foodHitKey, setFoodHitKey] = useState(0)
  const [selectedTool, setSelectedTool] = useState(null)
  const [effects, setEffects] = useState([])
  const [banner, setBanner] = useState(null)
  const [result, setResult] = useState(null)
  const [powerUp, setPowerUp] = useState(0)
  const [isPowerUpActive, setIsPowerUpActive] = useState(false)

  // ---- mutable game data (never triggers a render by itself) ----
  const statusRef = useRef('idle')
  const bugsRef = useRef([])
  const bugElsRef = useRef(new Map())
  const idRef = useRef(0)
  const scoreRef = useRef(0)
  const comboRef = useRef(0)
  const bugsKilledRef = useRef(0)
  const livesRef = useRef(LIVES)
  const powerUpRef = useRef(0)
  const isPowerUpActiveRef = useRef(false)
  const foodTypeRef = useRef(FOOD_TYPES[0])
  const foodHitKeyRef = useRef(0)
  const contaminatedOnceRef = useRef(false)
  const selectedToolRef = useRef(null)
  const lastToolUseRef = useRef(0)
  const elapsedRef = useRef(0)
  const spawnTimerRef = useRef(0.4)
  const unlockedTiersRef = useRef(new Set())
  const effectIdRef = useRef(0)
  const bannerIdRef = useRef(0)
  const effectTimersRef = useRef([])
  const bannerTimerRef = useRef(null)
  const onEventRef = useRef(onEvent)

  useEffect(() => {
    onEventRef.current = onEvent
  }, [onEvent])

  useEffect(() => () => {
    effectTimersRef.current.forEach(clearTimeout)
    if (bannerTimerRef.current) clearTimeout(bannerTimerRef.current)
  }, [])

  const addEffect = useCallback((kind, x, y, text) => {
    const id = (effectIdRef.current += 1)
    setEffects((prev) => [...prev, { id, kind, x, y, text: text ?? null }])
    const timer = setTimeout(() => {
      setEffects((prev) => prev.filter((e) => e.id !== id))
    }, 900)
    effectTimersRef.current.push(timer)
  }, [])

  const pushBanner = useCallback((text, kind) => {
    const id = (bannerIdRef.current += 1)
    setBanner({ id, text, kind })
    if (bannerTimerRef.current) clearTimeout(bannerTimerRef.current)
    bannerTimerRef.current = setTimeout(() => setBanner(null), 1600)
  }, [])

  const flashBug = useCallback((id, className) => {
    const el = bugElsRef.current.get(id)
    if (!el) return
    el.classList.remove(className)
    void el.offsetWidth
    el.classList.add(className)
    setTimeout(() => el.classList.remove(className), 280)
  }, [])

  const registerBugEl = useCallback((id, el) => {
    if (el) bugElsRef.current.set(id, el)
    else bugElsRef.current.delete(id)
  }, [])

  const syncBugs = useCallback(() => {
    setBugs(bugsRef.current.map(toDescriptor))
  }, [])

  const updateBugHp = useCallback((bug) => {
    setBugs((prev) => prev.map((b) => (b.id === bug.id ? { ...b, hp: bug.hp } : b)))
  }, [])

  const removeBug = useCallback((bug) => {
    const idx = bugsRef.current.indexOf(bug)
    if (idx >= 0) bugsRef.current.splice(idx, 1)
    syncBugs()
  }, [syncBugs])

  const finishGame = useCallback(() => {
    if (statusRef.current === 'result') return
    statusRef.current = 'result'
    setStatus('result')
    const remaining = Math.max(0, livesRef.current)
    const tier = tierForScore(scoreRef.current)
    const won = Boolean(tier)
    const finalResult = {
      score: scoreRef.current,
      bugsKilled: bugsKilledRef.current,
      wavesCompleted: tier ? (tier.percent === 15 ? 3 : tier.percent === 10 ? 2 : 1) : Math.min(10, Math.floor(scoreRef.current / 100)),
      discountPercent: tier ? tier.percent : 0,
      lives: remaining,
      maxLives: LIVES,
      lost: LIVES - remaining,
      victory: won,
    }
    setResult(finalResult)
    onEventRef.current?.('finish', finalResult)
  }, [])

  // A bug reached the dish: lose a life and instantly swap in a fresh, safe dish.
  const contaminateFood = useCallback(() => {
    addEffect('splat', FOOD.x, FOOD.y - 30, null)
    if (!contaminatedOnceRef.current) {
      contaminatedOnceRef.current = true
      onEventRef.current?.('contaminate')
    }
    livesRef.current -= 1
    setLives(livesRef.current)
    if (livesRef.current <= 0) {
      finishGame()
      return
    }
    const options = FOOD_TYPES.filter((t) => t !== foodTypeRef.current)
    const next = options[Math.floor(Math.random() * options.length)] || FOOD_TYPES[0]
    foodTypeRef.current = next
    setFoodType(next)
    foodHitKeyRef.current += 1
    setFoodHitKey(foodHitKeyRef.current)
  }, [addEffect, finishGame])

  const spawnBug = useCallback(() => {
    const diff = getDifficulty(scoreRef.current)
    const isFlying = Math.random() < diff.flyingProb
    const type = isFlying ? BUG_TYPES.FLYING : BUG_TYPES.GROUND
    const pos = isFlying ? flyingSpawn() : groundSpawn()
    const bug = {
      id: (idRef.current += 1),
      type,
      hp: diff.hp,
      maxHp: diff.hp,
      x: pos.x,
      y: pos.y,
      r: isFlying ? FLYING_R : GROUND_R,
      speed: isFlying ? diff.flyingSpeed : diff.groundSpeed,
      seed: Math.random() * 1000,
      angle: 0,
      targetX: FOOD.x + rand(-24, 24),
      targetY: FOOD.y + rand(-18, 18),
      points: isFlying ? SCORE.flying : SCORE.ground,
    }
    bugsRef.current.push(bug)
    syncBugs()
  }, [syncBugs])

  const killBug = useCallback((bug) => {
    comboRef.current += 1
    setCombo(comboRef.current)
    let gained = bug.points
    if (comboRef.current % SCORE.comboSpan === 0) gained += SCORE.comboBonus
    scoreRef.current += gained
    const currentScore = scoreRef.current
    setScore(currentScore)
    bugsKilledRef.current += 1
    setBugsKilled(bugsKilledRef.current)
    addEffect('kill', bug.x, bug.y, `+${gained}`)
    removeBug(bug)

    // Check for discount milestones unlocking in real-time
    for (const tier of COUPON_TIERS) {
      if (currentScore >= tier.minScore && !unlockedTiersRef.current.has(tier.percent)) {
        unlockedTiersRef.current.add(tier.percent)
        break
      }
    }
  }, [addEffect, removeBug])

  const resetAll = useCallback(() => {
    bugsRef.current = []
    bugElsRef.current.clear()
    idRef.current = 0
    scoreRef.current = 0
    comboRef.current = 0
    bugsKilledRef.current = 0
    livesRef.current = LIVES
    foodTypeRef.current = FOOD_TYPES[0]
    foodHitKeyRef.current = 0
    contaminatedOnceRef.current = false
    selectedToolRef.current = null
    lastToolUseRef.current = 0
    elapsedRef.current = 0
    spawnTimerRef.current = 0.4
    unlockedTiersRef.current.clear()
    powerUpRef.current = 0
    isPowerUpActiveRef.current = false
    effectTimersRef.current.forEach(clearTimeout)
    effectTimersRef.current = []
    if (bannerTimerRef.current) clearTimeout(bannerTimerRef.current)
    setBugs([])
    setScore(0)
    setCombo(0)
    setBugsKilled(0)
    setLives(LIVES)
    setElapsed(0)
    setPowerUp(0)
    setIsPowerUpActive(false)
    setFoodType(FOOD_TYPES[0])
    setFoodHitKey(0)
    setSelectedTool(null)
    setEffects([])
    setBanner(null)
    setResult(null)
  }, [])

  const start = useCallback(() => {
    resetAll()
    statusRef.current = 'running'
    setStatus('running')
    pushBanner('Báº¯t Ä‘áº§u! ', 'milestone')
    // Optional backend session (no-op when API/auth is not configured).
    onEventRef.current?.('start')
  }, [pushBanner, resetAll])

  const pause = useCallback(() => {
    if (statusRef.current !== 'running') return
    statusRef.current = 'paused'
    setStatus('paused')
  }, [])

  const resume = useCallback(() => {
    if (statusRef.current !== 'paused') return
    statusRef.current = 'running'
    setStatus('running')
  }, [])

  const selectTool = useCallback((toolId) => {
    selectedToolRef.current = toolId
    setSelectedTool(toolId)
  }, [])

  const attack = useCallback((bugId) => {
    if (statusRef.current !== 'running') return
    const bug = bugsRef.current.find((b) => b.id === bugId)
    if (!bug) return
    const toolId = selectedToolRef.current
    if (!toolId) {
      addEffect('info', bug.x, bug.y, 'Chá»n cÃ´ng cá»¥ trÆ°á»›c nhÃ©!')
      return
    }
    const tool = TOOLS[toolId]
    if (tool.bugType !== bug.type) {
      addEffect('wrong', bug.x, bug.y, 'Chá»n cÃ´ng cá»¥ khÃ¡c nhÃ©!')
      flashBug(bug.id, 'bug--blocked')
      comboRef.current = 0
      setCombo(0)
      return
    }
    const now = performance.now()
    if (now - lastToolUseRef.current < tool.cooldownMs) return
    lastToolUseRef.current = now

    const isPowered = isPowerUpActiveRef.current
    const damage = isPowered ? tool.damage * 2 : tool.damage
    bug.hp -= damage

    if (isPowered) {
      addEffect('crit', bug.x, bug.y - 12)
      const nextVal = Math.max(0, powerUpRef.current - POWER_UP_DRAIN_PER_HIT)
      powerUpRef.current = nextVal
      setPowerUp(nextVal)
      if (nextVal <= 0) {
        isPowerUpActiveRef.current = false
        setIsPowerUpActive(false)
      }
    }

    // Charge power up gauge if not currently active
    if (!isPowered) {
      const gain = (bug.hp <= 0) ? 14 : 8
      const nextVal = Math.min(100, powerUpRef.current + gain)
      powerUpRef.current = nextVal
      setPowerUp(nextVal)
      if (nextVal >= 100) {
        isPowerUpActiveRef.current = true
        setIsPowerUpActive(true)
        addEffect('crit', FOOD.x, FOOD.y - 70, 'âš¡ 2X DAMAGE!')
      }
    }

    if (bug.hp <= 0) {
      killBug(bug)
    } else {
      flashBug(bug.id, 'bug--hit')
      addEffect('hit', bug.x, bug.y, null)
      updateBugHp(bug)
    }
  }, [addEffect, flashBug, killBug, updateBugHp])

  const simulate = useCallback((dt) => {
    elapsedRef.current += dt
    const elapsed = elapsedRef.current
    // Update elapsed time display (every second)
    const elapsedSec = Math.floor(elapsed)
    setElapsed(elapsedSec)

    // 1. dynamic continuous random spawn scaling with current score
    spawnTimerRef.current -= dt
    if (spawnTimerRef.current <= 0) {
      const diff = getDifficulty(scoreRef.current)
      if (bugsRef.current.length < diff.maxBugs) {
        spawnBug()
        const jitter = 0.76 + Math.random() * 0.45
        spawnTimerRef.current = (diff.spawnMs / 1000) * jitter
      } else {
        // Delay slightly when screen reached bug ceiling
        spawnTimerRef.current = 0.35
      }
    }

    // 2. movement + collisions
    const list = bugsRef.current
    for (let i = 0; i < list.length; i += 1) {
      const bug = list[i]
      const dx = bug.targetX - bug.x
      const dy = bug.targetY - bug.y
      const base = Math.atan2(dy, dx)
      const wiggle = bug.type === BUG_TYPES.GROUND
        ? Math.sin((elapsed + bug.seed) * 2.3) * 0.2
        : Math.sin((elapsed + bug.seed) * 5.4) * 0.55
      const angle = base + wiggle
      bug.x += Math.cos(angle) * bug.speed * dt
      bug.y += Math.sin(angle) * bug.speed * dt
      bug.angle = (angle * 180) / Math.PI
    }

    for (let i = list.length - 1; i >= 0; i -= 1) {
      const bug = list[i]
      const reach = FOOD.r * 0.6 + bug.r
      const fx = bug.x - FOOD.x
      const fy = bug.y - FOOD.y
      if (fx * fx + fy * fy < reach * reach) {
        removeBug(bug)
        contaminateFood()
        if (statusRef.current === 'result') return
      }
    }

    // 3. write positions straight to the DOM
    for (let i = 0; i < bugsRef.current.length; i += 1) {
      const bug = bugsRef.current[i]
      const el = bugElsRef.current.get(bug.id)
      if (!el) continue
      el.style.left = `${(bug.x / FIELD.W) * 100}%`
      el.style.top = `${(bug.y / FIELD.H) * 100}%`
      el.style.setProperty('--angle', `${bug.angle}deg`)
      if (bug.type === BUG_TYPES.FLYING) {
        el.style.setProperty('--bank', `${Math.sin((elapsed + bug.seed) * 4) * 9}deg`)
      }
    }
  }, [contaminateFood, finishGame, removeBug, spawnBug])

  useEffect(() => {
    if (status !== 'running') return undefined
    let raf = 0
    let last = performance.now()
    const step = (now) => {
      const dt = Math.min((now - last) / 1000, 0.05)
      last = now
      simulate(dt)
      raf = requestAnimationFrame(step)
    }
    raf = requestAnimationFrame(step)
    return () => cancelAnimationFrame(raf)
  }, [status, simulate])

  const currentTier = tierForScore(score)
  const discountPercent = currentTier ? currentTier.percent : 0

  return {
    status,
    bugs,
    score,
    combo,
    bugsKilled,
    discountPercent,
    wave: Math.floor(score / 100) + 1,
    lives,
    maxLives: LIVES,
    elapsed,
    powerUp,
    isPowerUpActive,
    foodType,
    foodHitKey,
    selectedTool,
    effects,
    banner,
    result,
    totalWaves: COUPON_TIERS.length,
    start,
    pause,
    resume,
    togglePause: () => (statusRef.current === 'paused' ? resume() : pause()),
    attack,
    selectTool,
    registerBugEl,
  }
}

