// Tiny Web Audio helper so the game has feedback sounds without external assets.
// Fail-safe: if the browser blocks or lacks AudioContext everything becomes a no-op.
import bugspraySound from '../assets/bugspray_sound.mp3'
import swatterSound from '../assets/swatter_sound.mp3'

let ctx = null
let muted = false

// One-shot sample clips (tool sounds). Decoded lazily into AudioBuffers so they
// can overlap and start with minimal latency.
const SAMPLE_URLS = {
  spray: bugspraySound,
  swatter: swatterSound,
}
const buffers = {}
const loading = {}

function ensureContext() {
  if (ctx) return ctx
  try {
    const AC = window.AudioContext || window.webkitAudioContext
    if (!AC) return null
    ctx = new AC()
  } catch {
    ctx = null
  }
  return ctx
}

function blip(freq, duration, type = 'sine', volume = 0.14, delay = 0) {
  const ac = ensureContext()
  if (!ac || muted) return
  try {
    const start = ac.currentTime + delay
    const osc = ac.createOscillator()
    const gain = ac.createGain()
    osc.type = type
    osc.frequency.setValueAtTime(freq, start)
    gain.gain.setValueAtTime(0.0001, start)
    gain.gain.linearRampToValueAtTime(volume, start + 0.01)
    gain.gain.exponentialRampToValueAtTime(0.0001, start + duration)
    osc.connect(gain).connect(ac.destination)
    osc.start(start)
    osc.stop(start + duration + 0.03)
  } catch {
    // ignore audio failures
  }
}

function loadSample(name) {
  const ac = ensureContext()
  const url = SAMPLE_URLS[name]
  if (!ac || !url || buffers[name] || loading[name]) return
  loading[name] = true
  fetch(url)
    .then((res) => res.arrayBuffer())
    .then((data) => ac.decodeAudioData(data))
    .then((buffer) => {
      buffers[name] = buffer
    })
    .catch(() => {})
    .finally(() => {
      loading[name] = false
    })
}

function playSample(name, volume = 0.6) {
  const ac = ensureContext()
  if (!ac || muted) return
  const buffer = buffers[name]
  if (!buffer) {
    loadSample(name)
    return
  }
  try {
    const src = ac.createBufferSource()
    const gain = ac.createGain()
    src.buffer = buffer
    gain.gain.value = volume
    src.connect(gain).connect(ac.destination)
    src.start()
  } catch {
    // ignore audio failures
  }
}

export const sound = {
  get muted() {
    return muted
  },
  setMuted(value) {
    muted = value
  },
  unlock() {
    const ac = ensureContext()
    if (ac && ac.state === 'suspended') ac.resume().catch(() => {})
    loadSample('spray')
    loadSample('swatter')
  },
  play(name) {
    switch (name) {
      case 'click':
        blip(520, 0.07, 'triangle', 0.1)
        break
      case 'hit':
        blip(300, 0.07, 'square', 0.07)
        break
      case 'spray':
        playSample('spray')
        break
      case 'swatter':
        playSample('swatter')
        break
      case 'kill':
        blip(660, 0.08, 'square', 0.1)
        blip(900, 0.12, 'sine', 0.1, 0.05)
        break
      case 'wrong':
        blip(190, 0.18, 'sawtooth', 0.09)
        break
      case 'contaminate':
        blip(160, 0.28, 'sawtooth', 0.12)
        blip(110, 0.3, 'square', 0.09, 0.05)
        break
      case 'wave':
        blip(523, 0.12, 'sine', 0.11)
        blip(659, 0.12, 'sine', 0.11, 0.12)
        blip(784, 0.2, 'sine', 0.11, 0.24)
        break
      case 'win':
        ;[523, 659, 784, 1046].forEach((f, i) => blip(f, 0.18, 'sine', 0.12, i * 0.12))
        break
      case 'lose':
        ;[440, 349, 262, 196].forEach((f, i) => blip(f, 0.22, 'triangle', 0.12, i * 0.16))
        break
      default:
        break
    }
  },
}
