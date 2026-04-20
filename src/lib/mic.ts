// ============================================================
// MIC MANAGER
// Uses exact spec from requirements:
//   - navigator.mediaDevices.getUserMedia with echoCancellation/noiseSuppression/autoGainControl
//   - AudioContext with latencyHint: "interactive" (<50ms latency)
//   - GainNode for volume control
//   - AnalyserNode for live level visualization
// ============================================================

export class MicManager {
  private ctx: AudioContext | null = null
  private stream: MediaStream | null = null
  private source: MediaStreamAudioSourceNode | null = null
  private gain: GainNode | null = null
  private analyser: AnalyserNode | null = null
  public active = false

  async start(opts: { echo?: boolean; noise?: boolean; autoGain?: boolean } = {}) {
    if (this.active) return
    const { echo = true, noise = true, autoGain = true } = opts

    this.stream = await navigator.mediaDevices.getUserMedia({
      audio: {
        echoCancellation: echo,
        noiseSuppression: noise,
        autoGainControl: autoGain,
      },
    })

    this.ctx = new AudioContext({ latencyHint: 'interactive' })
    this.source = this.ctx.createMediaStreamSource(this.stream)

    this.gain = this.ctx.createGain()
    this.gain.gain.value = 1.0

    this.analyser = this.ctx.createAnalyser()
    this.analyser.fftSize = 64

    this.source.connect(this.gain)
    this.gain.connect(this.analyser)
    this.gain.connect(this.ctx.destination)

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
    this.analyser = null
    this.active = false
  }

  setVolume(v: number) {
    if (this.gain) this.gain.gain.value = Math.max(0, Math.min(2, v))
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
