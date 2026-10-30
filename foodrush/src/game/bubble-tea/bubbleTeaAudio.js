// Web Audio API synthesized sound generator for Bubble Tea Catch
// Self-contained, lightweight, zero-latency, 100% reliable across browsers.

class BubbleTeaAudio {
  constructor() {
    this.ctx = null
    this.enabled = true
  }

  init() {
    if (!this.ctx && typeof window !== 'undefined') {
      const AudioCtx = window.AudioContext || window.webkitAudioContext
      if (AudioCtx) {
        this.ctx = new AudioCtx()
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {})
    }
  }

  playClick() {
    if (!this.enabled) return
    this.init()
    if (!this.ctx) return
    const now = this.ctx.currentTime
    const osc = this.ctx.createOscillator()
    const gain = this.ctx.createGain()
    osc.type = 'triangle'
    osc.frequency.setValueAtTime(520, now)
    osc.frequency.exponentialRampToValueAtTime(260, now + 0.05)
    gain.gain.setValueAtTime(0.2, now)
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.05)
    osc.connect(gain)
    gain.connect(this.ctx.destination)
    osc.start(now)
    osc.stop(now + 0.05)
  }

  playCatchSuccess(combo = 1) {
    if (!this.enabled) return
    this.init()
    if (!this.ctx) return
    const now = this.ctx.currentTime

    // Calculate base frequency scaled gently with combo (up to 1.6x)
    const comboBoost = Math.min(1.6, 1 + (combo - 1) * 0.08)
    const baseFreq = 587.33 * comboBoost // D5

    // Multi-tone sweet bubble pop chime (primary + harmony fifth)
    const notes = [
      { freq: baseFreq, delay: 0, dur: 0.14, vol: 0.22 },
      { freq: baseFreq * 1.5, delay: 0.04, dur: 0.18, vol: 0.2 },
    ]

    notes.forEach(({ freq, delay, dur, vol }) => {
      const osc = this.ctx.createOscillator()
      const gain = this.ctx.createGain()
      osc.type = 'sine'
      osc.frequency.setValueAtTime(freq * 0.9, now + delay)
      osc.frequency.exponentialRampToValueAtTime(freq, now + delay + 0.03)
      gain.gain.setValueAtTime(vol, now + delay)
      gain.gain.exponentialRampToValueAtTime(0.001, now + delay + dur)
      osc.connect(gain)
      gain.connect(this.ctx.destination)
      osc.start(now + delay)
      osc.stop(now + delay + dur)
    })
  }

  playOrderComplete() {
    if (!this.enabled) return
    this.init()
    if (!this.ctx) return
    const now = this.ctx.currentTime

    // Joyful 3-tone arpeggio (C5 -> E5 -> G5 -> C6 fanfare)
    const chords = [523.25, 659.25, 783.99, 1046.5]
    chords.forEach((freq, idx) => {
      const osc = this.ctx.createOscillator()
      const gain = this.ctx.createGain()
      osc.type = 'sine'
      const start = now + idx * 0.07
      osc.frequency.setValueAtTime(freq, start)
      gain.gain.setValueAtTime(0.24, start)
      gain.gain.exponentialRampToValueAtTime(0.001, start + 0.25)
      osc.connect(gain)
      gain.connect(this.ctx.destination)
      osc.start(start)
      osc.stop(start + 0.26)
    })
  }

  playCatchWrong() {
    if (!this.enabled) return
    this.init()
    if (!this.ctx) return
    const now = this.ctx.currentTime

    // Gentle "bonk" sound
    const osc = this.ctx.createOscillator()
    const gain = this.ctx.createGain()
    osc.type = 'triangle'
    osc.frequency.setValueAtTime(240, now)
    osc.frequency.exponentialRampToValueAtTime(95, now + 0.22)

    gain.gain.setValueAtTime(0.28, now)
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.22)

    osc.connect(gain)
    gain.connect(this.ctx.destination)
    osc.start(now)
    osc.stop(now + 0.24)
  }

  playMiss() {
    if (!this.enabled) return
    this.init()
    if (!this.ctx) return
    const now = this.ctx.currentTime

    // Descending failure buzz / whoosh when required topping falls past
    const osc = this.ctx.createOscillator()
    const gain = this.ctx.createGain()
    osc.type = 'sawtooth'
    osc.frequency.setValueAtTime(280, now)
    osc.frequency.exponentialRampToValueAtTime(80, now + 0.2)

    gain.gain.setValueAtTime(0.22, now)
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.2)

    osc.connect(gain)
    gain.connect(this.ctx.destination)
    osc.start(now)
    osc.stop(now + 0.21)
  }

  playHeart() {
    if (!this.enabled) return
    this.init()
    if (!this.ctx) return
    const now = this.ctx.currentTime

    // Uplifting sparkling chime for life recovery
    const notes = [440, 554.37, 659.25, 880]
    notes.forEach((freq, idx) => {
      const osc = this.ctx.createOscillator()
      const gain = this.ctx.createGain()
      osc.type = 'sine'
      const start = now + idx * 0.05
      osc.frequency.setValueAtTime(freq, start)
      gain.gain.setValueAtTime(0.2, start)
      gain.gain.exponentialRampToValueAtTime(0.001, start + 0.22)
      osc.connect(gain)
      gain.connect(this.ctx.destination)
      osc.start(start)
      osc.stop(start + 0.24)
    })
  }

  playSpeedUp(isMax = false) {
    if (!this.enabled) return
    this.init()
    if (!this.ctx) return
    const now = this.ctx.currentTime

    if (isMax) {
      // Energetic fanfare for reaching max speed
      const notes = [587.33, 739.99, 880, 1174.66]
      notes.forEach((freq, idx) => {
        const osc = this.ctx.createOscillator()
        const gain = this.ctx.createGain()
        osc.type = 'triangle'
        const start = now + idx * 0.05
        osc.frequency.setValueAtTime(freq, start)
        gain.gain.setValueAtTime(0.2, start)
        gain.gain.exponentialRampToValueAtTime(0.001, start + 0.18)
        osc.connect(gain)
        gain.connect(this.ctx.destination)
        osc.start(start)
        osc.stop(start + 0.2)
      })
    } else {
      // Quick bright ascending sweep
      const osc = this.ctx.createOscillator()
      const gain = this.ctx.createGain()
      osc.type = 'sine'
      osc.frequency.setValueAtTime(520, now)
      osc.frequency.exponentialRampToValueAtTime(987.77, now + 0.12)
      gain.gain.setValueAtTime(0.18, now)
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.14)
      osc.connect(gain)
      gain.connect(this.ctx.destination)
      osc.start(now)
      osc.stop(now + 0.15)
    }
  }

  playTargetChange() {
    if (!this.enabled) return
    this.init()
    if (!this.ctx) return
    const now = this.ctx.currentTime

    // Cheerful bubbly ding
    const osc = this.ctx.createOscillator()
    const gain = this.ctx.createGain()
    osc.type = 'sine'
    osc.frequency.setValueAtTime(880, now)
    osc.frequency.exponentialRampToValueAtTime(1174.66, now + 0.08) // A5 -> D6
    gain.gain.setValueAtTime(0.18, now)
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.16)

    osc.connect(gain)
    gain.connect(this.ctx.destination)
    osc.start(now)
    osc.stop(now + 0.18)
  }

  playCountdown(isGo = false) {
    if (!this.enabled) return
    this.init()
    if (!this.ctx) return
    const now = this.ctx.currentTime

    const osc = this.ctx.createOscillator()
    const gain = this.ctx.createGain()
    osc.type = 'triangle'

    if (isGo) {
      osc.frequency.setValueAtTime(659.25, now)
      osc.frequency.exponentialRampToValueAtTime(880, now + 0.1)
      gain.gain.setValueAtTime(0.25, now)
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.25)
      osc.connect(gain)
      gain.connect(this.ctx.destination)
      osc.start(now)
      osc.stop(now + 0.26)
    } else {
      osc.frequency.setValueAtTime(440, now)
      gain.gain.setValueAtTime(0.18, now)
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.09)
      osc.connect(gain)
      gain.connect(this.ctx.destination)
      osc.start(now)
      osc.stop(now + 0.1)
    }
  }

  playGameOver() {
    if (!this.enabled) return
    this.init()
    if (!this.ctx) return
    const now = this.ctx.currentTime

    // Descending gentle bubble sequence
    const notes = [659.25, 523.25, 440, 329.63] // E5, C5, A4, E4
    notes.forEach((freq, idx) => {
      const osc = this.ctx.createOscillator()
      const gain = this.ctx.createGain()
      osc.type = 'sine'
      const start = now + idx * 0.12
      osc.frequency.setValueAtTime(freq, start)
      gain.gain.setValueAtTime(0.18, start)
      gain.gain.exponentialRampToValueAtTime(0.001, start + 0.22)
      osc.connect(gain)
      gain.connect(this.ctx.destination)
      osc.start(start)
      osc.stop(start + 0.24)
    })
  }

  toggleSound() {
    this.enabled = !this.enabled
    return this.enabled
  }
}

export const bubbleAudio = new BubbleTeaAudio()
