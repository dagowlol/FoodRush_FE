import spraySound from '../assets/bugspray_sound.mp3'
import swatterSound from '../assets/swatter_sound.mp3'

const TOOL_VOLUME = 0.65
const UI_VOLUME = 0.4

const TOOL_SOUNDS = {
  spray: spraySound,
  swatter: swatterSound,
}

const audioCache = new Map()
let audioCtx = null

function getAudio(src) {
  let audio = audioCache.get(src)
  if (!audio) {
    audio = new Audio(src)
    audio.preload = 'auto'
    audioCache.set(src, audio)
  }
  return audio
}

function getCtx() {
  if (typeof window === 'undefined') return null
  if (!audioCtx) {
    const Ctx = window.AudioContext || window.webkitAudioContext
    if (!Ctx) return null
    audioCtx = new Ctx()
  }
  if (audioCtx.state === 'suspended') audioCtx.resume().catch(() => {})
  return audioCtx
}

function tone(freq, { startAt = 0, duration = 0.09, type = 'triangle', gain = 0.5, slideTo } = {}) {
  const ctx = getCtx()
  if (!ctx) return
  const t0 = ctx.currentTime + startAt
  const osc = ctx.createOscillator()
  const amp = ctx.createGain()
  osc.type = type
  osc.frequency.setValueAtTime(freq, t0)
  if (slideTo) osc.frequency.exponentialRampToValueAtTime(slideTo, t0 + duration)
  amp.gain.setValueAtTime(0.0001, t0)
  amp.gain.exponentialRampToValueAtTime(gain * UI_VOLUME, t0 + 0.012)
  amp.gain.exponentialRampToValueAtTime(0.0001, t0 + duration)
  osc.connect(amp).connect(ctx.destination)
  osc.start(t0)
  osc.stop(t0 + duration + 0.03)
}

function playMp3(src, volume = TOOL_VOLUME) {
  if (!src) return
  const cached = getAudio(src)
  const audio = cached.paused ? cached : cached.cloneNode(true)
  audio.volume = volume
  try {
    audio.currentTime = 0
  } catch {
    // ignore
  }
  const played = audio.play()
  if (played && typeof played.catch === 'function') played.catch(() => {})
}

const UI_SOUNDS = {
  click: () => tone(760, { type: 'triangle', duration: 0.07, slideTo: 1040 }),
  wrong: () => {
    tone(240, { type: 'sawtooth', duration: 0.18, gain: 0.45, slideTo: 140 })
    tone(170, { type: 'square', duration: 0.2, gain: 0.3, startAt: 0.1 })
  },
  enter: () => {
    ;[523.25, 659.25, 783.99].forEach((freq, i) =>
      tone(freq, { type: 'triangle', duration: 0.16, startAt: i * 0.075 }),
    )
  },
  start: () => {
    ;[392, 523.25, 659.25, 880].forEach((freq, i) =>
      tone(freq, { type: 'square', duration: 0.13, gain: 0.35, startAt: i * 0.06 }),
    )
  },
}

export const sound = {
  play(name) {
    if (TOOL_SOUNDS[name]) {
      playMp3(TOOL_SOUNDS[name])
      return
    }
    const preset = UI_SOUNDS[name]
    if (preset) preset()
  },
  preload() {
    Object.values(TOOL_SOUNDS).forEach((src) => {
      getAudio(src).load()
    })
  },
}
