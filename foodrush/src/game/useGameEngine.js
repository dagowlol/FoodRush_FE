import { useCallback, useEffect, useRef, useState } from 'react'
import {
  BUG_TYPES,
  FIELD,
  FOOD,
  FOOD_TYPES,
  LIVES,
  SCORE,
  TOOLS,
  TOTAL_WAVES,
  WAVES,
  buildWaveQueue,
  flyingSpawn,
  groundSpawn,
  rand,
} from './config'
import { sound } from './sound'

const GROUND_R = 42
const FLYING_R = 40

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
 * something meaningful changes (spawn, kill, hit, wave, score) to avoid a
 * re-render on every frame.
 */
export function useGameEngine(onEvent) {
  const [status, setStatus] = useState('idle') // idle | running | paused | result
  const [bugs, setBugs] = useState([])
  const [score, setScore] = useState(0)
  const [combo, setCombo] = useState(0)
  const [bugsKilled, setBugsKilled] = useState(0)
  const [wavesCompleted, setWavesCompleted] = useState(0)
  const [wave, setWave] = useState(0)
  const [lives, setLives] = useState(LIVES)
  const [foodType, setFoodType] = useState(FOOD_TYPES[0])
  const [foodHitKey, setFoodHitKey] = useState(0)
  const [selectedTool, setSelectedTool] = useState(null)
  const [effects, setEffects] = useState([])
  const [banner, setBanner] = useState(null)
  const [result, setResult] = useState(null)
  const [muted, setMuted] = useState(sound.muted)

  // ---- mutable game data (never triggers a render by itself) ----
  const statusRef = useRef('idle')
  const bugsRef = useRef([])
  const bugElsRef = useRef(new Map())
  const idRef = useRef(0)
  const scoreRef = useRef(0)
  const comboRef = useRef(0)
  const bugsKilledRef = useRef(0)
  const wavesCompletedRef = useRef(0)
  const waveIndexRef = useRef(0)
  const livesRef = useRef(LIVES)
  const foodTypeRef = useRef(FOOD_TYPES[0])
  const foodHitKeyRef = useRef(0)
  const contaminatedOnceRef = useRef(false)
  const selectedToolRef = useRef(null)
  const lastToolUseRef = useRef(0)
  const elapsedRef = useRef(0)
  const phaseRef = useRef('spawning') // spawning | clearing | break
  const spawnQueueRef = useRef([])
  const spawnTimerRef = useRef(0)
  const breakTimerRef = useRef(0)
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

  const finishGame = useCallback((victory) => {
    if (statusRef.current === 'result') return
    statusRef.current = 'result'
    setStatus('result')
    const remaining = Math.max(0, livesRef.current)
    const finalResult = {
      score: scoreRef.current,
      bugsKilled: bugsKilledRef.current,
      wavesCompleted: wavesCompletedRef.current,
      totalWaves: TOTAL_WAVES,
      lives: remaining,
      maxLives: LIVES,
      lost: LIVES - remaining,
      victory: Boolean(victory),
    }
    setResult(finalResult)
    sound.play(victory ? 'win' : 'lose')
    onEventRef.current?.('finish', finalResult)
  }, [])

  // A bug reached the dish: lose a life and instantly swap in a fresh, safe dish.
  const contaminateFood = useCallback(() => {
    addEffect('splat', FOOD.x, FOOD.y - 30, null)
    sound.play('contaminate')
    if (!contaminatedOnceRef.current) {
      contaminatedOnceRef.current = true
      onEventRef.current?.('contaminate')
    }
    livesRef.current -= 1
    setLives(livesRef.current)
    if (livesRef.current <= 0) {
      finishGame(false)
      return
    }
    const options = FOOD_TYPES.filter((t) => t !== foodTypeRef.current)
    const next = options[Math.floor(Math.random() * options.length)] || FOOD_TYPES[0]
    foodTypeRef.current = next
    setFoodType(next)
    foodHitKeyRef.current += 1
    setFoodHitKey(foodHitKeyRef.current)
  }, [addEffect, finishGame])

  const spawnBug = useCallback((type) => {
    const cfg = WAVES[waveIndexRef.current]
    const pos = type === BUG_TYPES.GROUND ? groundSpawn() : flyingSpawn()
    const bug = {
      id: (idRef.current += 1),
      type,
      hp: cfg.hp,
      maxHp: cfg.hp,
      x: pos.x,
      y: pos.y,
      r: type === BUG_TYPES.GROUND ? GROUND_R : FLYING_R,
      speed: type === BUG_TYPES.GROUND ? cfg.groundSpeed : cfg.flyingSpeed,
      seed: Math.random() * 1000,
      angle: 0,
      targetX: FOOD.x + rand(-24, 24),
      targetY: FOOD.y + rand(-18, 18),
      points: type === BUG_TYPES.GROUND ? SCORE.ground : SCORE.flying,
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
    setScore(scoreRef.current)
    bugsKilledRef.current += 1
    setBugsKilled(bugsKilledRef.current)
    addEffect('kill', bug.x, bug.y, `+${gained}`)
    removeBug(bug)
  }, [addEffect, removeBug])

  const startWave = useCallback((index) => {
    waveIndexRef.current = index
    spawnQueueRef.current = buildWaveQueue(WAVES[index])
    spawnTimerRef.current = 0
    phaseRef.current = 'spawning'
    setWave(index + 1)
    pushBanner(`Wave ${index + 1}`, 'wave')
    sound.play('wave')
  }, [pushBanner])

  const resetAll = useCallback(() => {
    bugsRef.current = []
    bugElsRef.current.clear()
    idRef.current = 0
    scoreRef.current = 0
    comboRef.current = 0
    bugsKilledRef.current = 0
    wavesCompletedRef.current = 0
    waveIndexRef.current = 0
    livesRef.current = LIVES
    foodTypeRef.current = FOOD_TYPES[0]
    foodHitKeyRef.current = 0
    contaminatedOnceRef.current = false
    selectedToolRef.current = null
    lastToolUseRef.current = 0
    elapsedRef.current = 0
    phaseRef.current = 'spawning'
    spawnQueueRef.current = []
    spawnTimerRef.current = 0
    breakTimerRef.current = 0
    effectTimersRef.current.forEach(clearTimeout)
    effectTimersRef.current = []
    if (bannerTimerRef.current) clearTimeout(bannerTimerRef.current)
    setBugs([])
    setScore(0)
    setCombo(0)
    setBugsKilled(0)
    setWavesCompleted(0)
    setWave(0)
    setLives(LIVES)
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
    startWave(0)
    // Optional backend session (no-op when API/auth is not configured).
    onEventRef.current?.('start')
  }, [resetAll, startWave])

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
      addEffect('info', bug.x, bug.y, 'Chọn công cụ trước nhé!')
      sound.play('wrong')
      return
    }
    const tool = TOOLS[toolId]
    if (tool.bugType !== bug.type) {
      addEffect('wrong', bug.x, bug.y, 'Chọn công cụ khác nhé!')
      flashBug(bug.id, 'bug--blocked')
      comboRef.current = 0
      setCombo(0)
      sound.play('wrong')
      return
    }
    const now = performance.now()
    if (now - lastToolUseRef.current < tool.cooldownMs) return
    lastToolUseRef.current = now

    bug.hp -= tool.damage
    sound.play(toolId === 'swatter' ? 'swatter' : 'spray')
    if (bug.hp <= 0) {
      killBug(bug)
    } else {
      flashBug(bug.id, 'bug--hit')
      addEffect('hit', bug.x, bug.y, null)
      updateBugHp(bug)
    }
  }, [addEffect, flashBug, killBug, updateBugHp])

  const toggleMute = useCallback(() => {
    setMuted((prev) => {
      const next = !prev
      sound.setMuted(next)
      return next
    })
  }, [])

  const simulate = useCallback((dt) => {
    elapsedRef.current += dt
    const elapsed = elapsedRef.current

    // 1. spawn phase
    if (phaseRef.current === 'spawning') {
      spawnTimerRef.current -= dt
      if (spawnTimerRef.current <= 0 && spawnQueueRef.current.length) {
        spawnBug(spawnQueueRef.current.shift())
        const jitter = 0.75 + Math.random() * 0.5
        spawnTimerRef.current = (WAVES[waveIndexRef.current].spawnMs / 1000) * jitter
      }
      if (!spawnQueueRef.current.length) phaseRef.current = 'clearing'
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

    // 4. phase progression
    if (phaseRef.current === 'clearing' && bugsRef.current.length === 0) {
      wavesCompletedRef.current = waveIndexRef.current + 1
      setWavesCompleted(wavesCompletedRef.current)
      if (waveIndexRef.current + 1 >= TOTAL_WAVES) {
        finishGame(true)
        return
      }
      phaseRef.current = 'break'
      breakTimerRef.current = 2
      pushBanner(`Xong Wave ${waveIndexRef.current + 1}!`, 'wave')
      sound.play('wave')
    }

    if (phaseRef.current === 'break') {
      breakTimerRef.current -= dt
      if (breakTimerRef.current <= 0) startWave(waveIndexRef.current + 1)
    }
  }, [contaminateFood, finishGame, pushBanner, removeBug, spawnBug, startWave])

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

  return {
    status,
    bugs,
    score,
    combo,
    bugsKilled,
    wavesCompleted,
    wave,
    lives,
    maxLives: LIVES,
    foodType,
    foodHitKey,
    selectedTool,
    effects,
    banner,
    result,
    muted,
    totalWaves: TOTAL_WAVES,
    start,
    pause,
    resume,
    attack,
    selectTool,
    registerBugEl,
    toggleMute,
  }
}
