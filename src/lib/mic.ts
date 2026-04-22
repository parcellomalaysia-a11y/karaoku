// ============================================================
// MIC MANAGER
// Enhanced with:
//  - Performance mode (disables all browser audio processing for max quality)
//  - Boost gain (up to 3x amplification via GainNode)
//  - Device selection (Bluetooth, USB, specific mic)
//  - Auto-detect device type helpers
// ============================================================

export interface MicStartOpts {
  echo?: boolean           // echo cancellation
  noise?: boolean          // noise suppression
  autoGain?: boolean       // browser automatic gain control
  deviceId?: string        // specific mic device
  boost?: number           // 1.0 = normal, up to 3.0 = 300%
  performanceMode?: boolean  // disable ALL processing (best quality, no ducking)
}

export class MicManager {
  private ctx: AudioContext | null = null
  private stream: MediaStream | null = null
  private source: MediaStreamAudioSourceNode | null = null
  private gain: GainNode | null = null
  private boostGain: GainNode | null = null
  private analyser: AnalyserNode | null = null
  public active = false

  async start(opts: MicStartOpts = {}) {
    if (this.active) return

    // Performance mode overrides all individual settings → max quality, raw pass-through
    const perfMode = opts.performanceMode === true

    const echo = perfMode ? false : (opts.echo ?? true)
    const noise = perfMode ? false : (opts.noise ?? true)
    const autoGain = perfMode ? false : (opts.autoGain ?? true)
    const { deviceId, boost = 1.0 } = opts

    const audioConstraints: MediaTrackConstraints = {
      echoCancellation: echo,
      noiseSuppression: noise,
      autoGainControl: autoGain,
    }

    if (deviceId) {
      audioConstraints.deviceId = { exact: deviceId }
    }

    try {
      this.stream = await navigator.mediaDevices.getUserMedia({ audio: audioConstraints })
    } catch (err: any) {
      if (err.name === 'OverconstrainedError' && deviceId) {
        console.warn('[mic] specific device unavailable, fallback to default')
        this.stream = await navigator.mediaDevices.getUserMedia({
          audio: { echoCancellation: echo, noiseSuppression: noise, autoGainControl: autoGain },
        })
      } else {
        throw err
      }
    }

    this.ctx = new AudioContext({ latencyHint: 'interactive' })
    this.source = this.ctx.createMediaStreamSource(this.stream)

    // Normal gain (user-adjustable 0 to 2)
    this.gain = this.ctx.createGain()
    this.gain.gain.value = 1.0

    // Boost gain (0.5 to 3.0)
    this.boostGain = this.ctx.createGain()
    this.boostGain.gain.value = Math.max(0.5, Math.min(3.0, boost))

    // Analyser for level visualizer
    this.analyser = this.ctx.createAnalyser()
    this.analyser.fftSize = 64

    // Chain: source → gain → boost → analyser → destination
    this.source.connect(this.gain)
    this.gain.connect(this.boostGain)
    this.boostGain.connect(this.analyser)
    this.boostGain.connect(this.ctx.destination)

    this.active = true
  }

  stop() {
    if (!this.active) return
    if (this.stream) this.stream.getTracks().forEach((t) => t.stop())
    if (this.ctx) this.ctx.close()
    this.ctx = null
    this.stream = null
    this.source = null
    this.gain = null
    this.boostGain = null
    this.analyser = null
    this.active = false
  }

  setVolume(v: number) {
    if (this.gain) this.gain.gain.value = Math.max(0, Math.min(2, v))
  }

  setBoost(b: number) {
    if (this.boostGain) this.boostGain.gain.value = Math.max(0.5, Math.min(3.0, b))
  }

  getLevel(): number {
    if (!this.analyser) return 0
    const arr = new Uint8Array(this.analyser.frequencyBinCount)
    this.analyser.getByteFrequencyData(arr)
    let sum = 0
    for (let i = 0; i < arr.length; i++) sum += arr[i]
    return sum / arr.length / 255
  }
}

// Helper: detect device type from label
export function detectDeviceType(label: string): 'bluetooth' | 'usb' | 'wired' | 'builtin' | 'default' {
  const l = label.toLowerCase()
  if (l.includes('bluetooth') || l.includes('airpod') || l.includes('boya') ||
      l.includes('rode') || l.includes('buds') || l.includes('bt ')) return 'bluetooth'
  if (l.includes('usb')) return 'usb'
  if (l.includes('headset') || l.includes('earphone') || l.includes('headphone') ||
      l.includes('earbud')) return 'wired'
  if (l.includes('default') || l.includes('communications')) return 'default'
  return 'builtin'
}
