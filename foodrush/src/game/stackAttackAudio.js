// Synthesized Web Audio API sound effects for Stack Attack
// Lightweight, instant, 0-latency, no external audio files required.

class StackAttackAudio {
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
    osc.frequency.setValueAtTime(480, now)
    osc.frequency.exponentialRampToValueAtTime(180, now + 0.05)
    gain.gain.setValueAtTime(0.18, now)
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.05)
    osc.connect(gain)
    gain.connect(this.ctx.destination)
    osc.start(now)
    osc.stop(now + 0.05)
  }

  playDrop() {
    if (!this.enabled) return
    this.init()
    if (!this.ctx) return
    const now = this.ctx.currentTime
    const osc = this.ctx.createOscillator()
    const gain = this.ctx.createGain()
    osc.type = 'sine'
    osc.frequency.setValueAtTime(260, now)
    osc.frequency.exponentialRampToValueAtTime(90, now + 0.08)
    gain.gain.setValueAtTime(0.25, now)
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.08)
    osc.connect(gain)
    gain.connect(this.ctx.destination)
    osc.start(now)
    osc.stop(now + 0.08)
  }

  playPerfect(combo = 1) {
    if (!this.enabled) return
    this.init()
    if (!this.ctx) return
    const now = this.ctx.currentTime
    const baseFreq = 523.25 * Math.min(2.0, 1 + (combo - 1) * 0.1) // C5 + pitch up with combo

    // 2-tone melodic chime
    ;[0, 0.08].forEach((delay, idx) => {
      const osc = this.ctx.createOscillator()
      const gain = this.ctx.createGain()
      osc.type = 'sine'
      const freq = idx === 0 ? baseFreq : baseFreq * 1.25 // Major 3rd
      osc.frequency.setValueAtTime(freq, now + delay)
      gain.gain.setValueAtTime(0.22, now + delay)
      gain.gain.exponentialRampToValueAtTime(0.001, now + delay + 0.22)
      osc.connect(gain)
      gain.connect(this.ctx.destination)
      osc.start(now + delay)
      osc.stop(now + delay + 0.24)
    })
  }

  playSlice() {
    if (!this.enabled) return
    this.init()
    if (!this.ctx) return
    const now = this.ctx.currentTime
    // White noise swoosh / chop
    const bufferSize = this.ctx.sampleRate * 0.09
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate)
    const data = buffer.getChannelData(0)
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (bufferSize * 0.25))
    }
    const noise = this.ctx.createBufferSource()
    noise.buffer = buffer

    const filter = this.ctx.createBiquadFilter()
    filter.type = 'bandpass'
    filter.frequency.setValueAtTime(1200, now)
    filter.Q.setValueAtTime(2, now)

    const gain = this.ctx.createGain()
    gain.gain.setValueAtTime(0.3, now)
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.09)

    noise.connect(filter)
    filter.connect(gain)
    gain.connect(this.ctx.destination)
    noise.start(now)
  }

  playMiss() {
    if (!this.enabled) return
    this.init()
    if (!this.ctx) return
    const now = this.ctx.currentTime
    const osc = this.ctx.createOscillator()
    const gain = this.ctx.createGain()
    osc.type = 'sawtooth'
    osc.frequency.setValueAtTime(320, now)
    osc.frequency.exponentialRampToValueAtTime(70, now + 0.35)

    const filter = this.ctx.createBiquadFilter()
    filter.type = 'lowpass'
    filter.frequency.setValueAtTime(600, now)

    gain.gain.setValueAtTime(0.25, now)
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35)

    osc.connect(filter)
    filter.connect(gain)
    gain.connect(this.ctx.destination)
    osc.start(now)
    osc.stop(now + 0.36)
  }

  playGameOver() {
    if (!this.enabled) return
    this.init()
    if (!this.ctx) return
    const now = this.ctx.currentTime
    const notes = [293.66, 277.18, 261.63, 220] // D4, C#4, C4, A3
    notes.forEach((freq, idx) => {
      const osc = this.ctx.createOscillator()
      const gain = this.ctx.createGain()
      osc.type = 'triangle'
      osc.frequency.setValueAtTime(freq, now + idx * 0.12)
      gain.gain.setValueAtTime(0.2, now + idx * 0.12)
      gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.12 + 0.22)
      osc.connect(gain)
      gain.connect(this.ctx.destination)
      osc.start(now + idx * 0.12)
      osc.stop(now + idx * 0.12 + 0.23)
    })
  }

  toggleSound() {
    this.enabled = !this.enabled
    return this.enabled
  }
}

export const stackAudio = new StackAttackAudio()

