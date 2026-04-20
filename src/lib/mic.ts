// ============================================================
// MIC MANAGER
// Enhanced with:
//  - Boost gain (up to 3x amplification via GainNode)
//  - Smart echo/noise defaults per device type (BT vs built-in)
//  - Device selection (Bluetooth, USB, specific mic)
//  - Output device selection (where setSinkId supported)
// ============================================================

export interface MicStartOpts {
  echo?: boolean
  noise?: boolean
  autoGain?: boolean
  deviceId?: string
  boost?: number // 1.0 = normal, up to 3.0 = 300%
  outputDeviceId?: string // for setSinkId (desktop Chrome only)
}

export class MicManager {
  private ctx: AudioContext | null = null
  private stream: MediaStream | null = null
  private source: MediaStreamAudioSourceNode | null = null
  private gain: GainNode | null = null
  private boostGain: GainNode | null = null
  private analyser: AnalyserNode | null = null
  private destination: MediaStreamAudioDestinationNode | null = null
  private outputAudio: HTMLAudioElement | null = null
  public active = false

  async start(opts: MicStartOpts = {}) {
    if (this.active) return
    const {
      echo = true,
      noise = true,
      autoGain = true,
      deviceId,
      boost = 1.0,
      outputDeviceId,
    } = opts

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

    // Boost gain (0.5 to 3.0, for loudness boost on weak mics)
    this.boostGain = this.ctx.createGain()
    this.boostGain.gain.value = Math.max(0.5, Math.min(3.0, boost))

    // Analyser for visualizer
    this.analyser = this.ctx.createAnalyser()
    this.analyser.fftSize = 64

    // Signal chain: source → gain → boost → analyser → destination
    this.source.connect(this.gain)
    this.gain.connect(this.boostGain)
    this.boostGain.connect(this.analyser)

    // If output device specified AND setSinkId supported → route via Audio element
    if (outputDeviceId && typeof (HTMLMediaElement.prototype as any).setSinkId === 'function') {
      try {
        this.destination = this.ctx.createMediaStreamDestination()
        this.boostGain.connect(this.destination)
        this.outputAudio = new Audio()
        this.outputAudio.srcObject = this.destination.stream
        await (this.outputAudio as any).setSinkId(outputDeviceId)
        await this.outputAudio.play()
      } catch (err) {
        console.warn('[mic] setSinkId failed, using default output', err)
        this.boostGain.connect(this.ctx.destination)
      }
    } else {
      // Default: route to OS default output
      this.boostGain.connect(this.ctx.destination)
    }

    this.active = true
  }

  stop() {
    if (!this.active) return
    if (this.outputAudio) {
      this.outputAudio.pause()
      this.outputAudio.srcObject = null
      this.outputAudio = null
    }
    if (this.stream) this.stream.getTracks().forEach((t) => t.stop())
    if (this.ctx) this.ctx.close()
    this.ctx = null
    this.stream = null
    this.source = null
    this.gain = null
    this.boostGain = null
    this.analyser = null
    this.destination = null
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

  // Detect if setSinkId is supported (desktop Chrome mainly)
  static isOutputSelectionSupported(): boolean {
    return typeof (HTMLMediaElement.prototype as any).setSinkId === 'function'
  }
}

// Helper to detect device type from label
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

// Smart echo defaults: true for Bluetooth (risk feedback), configurable for others
export function smartEchoDefault(deviceType: string): boolean {
  return deviceType === 'bluetooth' || deviceType === 'builtin' || deviceType === 'default'
}
