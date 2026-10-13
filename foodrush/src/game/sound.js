import spraySound from '../assets/bugspray_sound.mp3'
import swatterSound from '../assets/swatter_sound.mp3'

const VOLUME = 0.65

const TOOL_SOUNDS = {
  spray: spraySound,
  swatter: swatterSound,
}

const audioCache = new Map()

function getAudio(src) {
  let audio = audioCache.get(src)
  if (!audio) {
    audio = new Audio(src)
    audio.preload = 'auto'
    audioCache.set(src, audio)
  }
  return audio
}

export function preloadToolSounds() {
  Object.values(TOOL_SOUNDS).forEach((src) => {
    getAudio(src).load()
  })
}

export function playToolSound(toolId) {
  const src = TOOL_SOUNDS[toolId]
  if (!src) return
  const cached = getAudio(src)
  const audio = cached.paused ? cached : cached.cloneNode(true)
  audio.volume = VOLUME
  try {
    audio.currentTime = 0
  } catch {
    // ignore
  }
  const played = audio.play()
  if (played && typeof played.catch === 'function') played.catch(() => {})
}
