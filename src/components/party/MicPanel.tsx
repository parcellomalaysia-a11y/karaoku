'use client'

import { useState, useEffect, useRef } from 'react'
import { useLang } from '@/lib/i18n/LangProvider'
import { supabase } from '@/lib/supabase/client'
import { s } from '@/types'

export const FREE_MIC_SECONDS = 600

interface Props {
  plan?: string
  hostPlan?: string
  partyId?: string
  initialSecondsUsed?: number
  partyLocked?: boolean
  musicVolume?: number
  onMusicVolumeChange?: (v: number) => void
  onTimeLimitHit?: () => void
  onSecondsUpdate?: (totalSeconds: number) => void
  onNeedUpgrade?: () => void
  // Old compat props
  freeLimit?: number
  songsUsed?: number
}

// Self-contained mic class
class BasicMic {
  private ctx: AudioContext | null = null
  private stream: MediaStream | null = null
  private gain: GainNode | null = null
  private analyser: AnalyserNode | null = null
  public active = false

  async start() {
    if (this.active) return
    this.stream = await navigator.mediaDevices.getUserMedia({
      audio: {
        echoCancellation: true,
        noiseSuppression: true,
        autoGainControl: true,
      },
    })
    this.ctx = new AudioContext({ latencyHint: 'interactive' })
    const source = this.ctx.createMediaStreamSource(this.stream)
    this.gain = this.ctx.createGain()
    this.gain.gain.value = 1.0
    this.analyser = this.ctx.createAnalyser()
    this.analyser.fftSize = 64
    source.connect(this.gain)
    this.gain.connect(this.analyser)
    this.gain.connect(this.ctx.destination)
    this.active = true
  }

  stop() {
    if (!this.active) return
    if (this.stream) this.stream.getTracks().forEach((t) => t.stop())
    if (this.ctx) { try { this.ctx.close() } catch {} }
    this.ctx = null
    this.stream = null
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

export default function MicPanel(props: Props) {
  const {
    hostPlan = 'free',
    partyId,
    initialSecondsUsed = 0,
    partyLocked = false,
    onTimeLimitHit,
    onSecondsUpdate,
    onNeedUpgrade,
  } = props

  const { t } = useLang()
  const micRef = useRef<BasicMic>(new BasicMic())
  const [on, setOn] = useState(false)
  const [level, setLevel] = useState(0)
  const [vol, setVol] = useState(1)
  const [secondsUsed, setSecondsUsed] = useState(initialSecondsUsed)

  const tickRef = useRef<NodeJS.Timeout | null>(null)
  const saveTimerRef = useRef<NodeJS.Timeout | null>(null)
  const lastSavedRef = useRef<number>(initialSecondsUsed)

  const isHostFree = hostPlan === 'free'
  const timeExceeded = isHostFree && secondsUsed >= FREE_MIC_SECONDS
  const locked = partyLocked || timeExceeded

  useEffect(() => {
    setSecondsUsed(initialSecondsUsed)
    lastSavedRef.current = initialSecondsUsed
  }, [initialSecondsUsed])

  const saveToSupabase = async (totalSeconds: number) => {
    if (!partyId || totalSeconds === lastSavedRef.current) return
    try {
      await supabase.from('parties').update({ mic_seconds_used: totalSeconds }).eq('id', partyId)
      lastSavedRef.current = totalSeconds
    } catch {}
  }

  const stopMic = () => {
    try { micRef.current.stop() } catch {}
    setOn(false)
    if (tickRef.current) { clearInterval(tickRef.current); tickRef.current = null }
    if (saveTimerRef.current) { clearInterval(saveTimerRef.current); saveTimerRef.current = null }
    saveToSupabase(secondsUsed)
  }

  const toggle = async () => {
    if (on) { stopMic(); return }
    if (locked) { if (onNeedUpgrade) onNeedUpgrade(); return }
    try {
      await micRef.current.start()
      setOn(true)
      tickRef.current = setInterval(() => {
        setSecondsUsed((prev) => {
          const next = prev + 1
          if (onSecondsUpdate) onSecondsUpdate(next)
          if (isHostFree && prev < FREE_MIC_SECONDS && next >= FREE_MIC_SECONDS) {
            setTimeout(() => { stopMic(); if (onTimeLimitHit) onTimeLimitHit() }, 0)
          }
          return next
        })
      }, 1000)
      saveTimerRef.current = setInterval(() => {
        setSecondsUsed((c) => { saveToSupabase(c); return c })
      }, 10000)
    } catch {
      alert(t.mic_denied || 'Mic permission denied')
    }
  }

  useEffect(() => {
    if (!on) { setLevel(0); return }
    const id = setInterval(() => {
      try { setLevel(micRef.current.getLevel()) } catch {}
    }, 80)
    return () => clearInterval(id)
  }, [on])

  useEffect(() => {
    try { micRef.current.setVolume(vol) } catch {}
  }, [vol])

  useEffect(() => {
    return () => {
      try { micRef.current.stop() } catch {}
      if (tickRef.current) clearInterval(tickRef.current)
      if (saveTimerRef.current) clearInterval(saveTimerRef.current)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60)
    const sec = secs % 60
    return `${m}:${sec.toString().padStart(2, '0')}`
  }

  return (
    <div
      style={{
        background: on ? `linear-gradient(135deg, ${s.redDark}, ${s.red})` : s.dark,
        borderRadius: 16,
        padding: 16,
        border: `1px solid ${on ? s.redLight : s.gray}`,
        transition: 'background 0.3s',
        opacity: locked && !on ? 0.6 : 1,
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
        <div>
          <div style={{ fontSize: 10, letterSpacing: 2, fontWeight: 800, opacity: 0.85 }}>
            🎤 {t.phone_mic}
          </div>
          <div style={{ fontSize: 18, fontWeight: 800, marginTop: 2 }}>
            {locked ? '🔒 LOCKED' : on ? t.mic_live : t.mic_off}
          </div>
          {isHostFree && !locked && (
            <div style={{ fontSize: 10, marginTop: 3, opacity: 0.85, fontFamily: 'monospace' }}>
              ⏱ {formatTime(secondsUsed)} / {formatTime(FREE_MIC_SECONDS)}
            </div>
          )}
          {isHostFree && locked && (
            <div style={{ fontSize: 10, marginTop: 3, opacity: 0.9 }}>
              Free voice chat limit reached
            </div>
          )}
        </div>
        <button
          onClick={toggle}
          disabled={locked && !on}
          style={{
            borderRadius: '50%',
            width: 64,
            height: 64,
            padding: 0,
            fontSize: 24,
            background: locked && !on ? '#444' : on ? 'white' : s.red,
            color: locked && !on ? '#888' : on ? s.red : 'white',
            border: '2px solid rgba(255,255,255,0.25)',
            boxShadow: locked && !on ? 'none' : on ? '0 6px 0 #ccc' : `0 6px 0 ${s.redDark}`,
            cursor: locked && !on ? 'not-allowed' : 'pointer',
            fontWeight: 800,
            animation: on ? 'pulse-red 1.5s infinite' : 'none',
          }}
          aria-label={on ? 'Stop mic' : 'Start mic'}
        >
          {locked && !on ? '🔒' : on ? '⏹' : '🎤'}
        </button>
      </div>

      {isHostFree && (
        <div style={{ height: 3, background: 'rgba(255,255,255,0.15)', borderRadius: 100, marginBottom: 10, overflow: 'hidden' }}>
          <div style={{
            height: '100%',
            width: `${Math.min(100, (secondsUsed / FREE_MIC_SECONDS) * 100)}%`,
            background: locked ? '#ff6b6b' : 'rgba(255,255,255,0.85)',
            transition: 'width 0.3s',
            borderRadius: 100,
          }} />
        </div>
      )}

      <div style={{ display: 'flex', gap: 2, alignItems: 'flex-end', height: 26, marginBottom: 12 }}>
        {Array.from({ length: 32 }).map((_, i) => {
          const active = level > (i + 1) / 32 * 0.5
          return (
            <div
              key={i}
              style={{
                flex: 1,
                height: active ? `${Math.min(100, level * 100 + i * 2)}%` : '10%',
                background: active
                  ? i > 24 ? '#ffeb3b' : i > 16 ? '#fff' : 'rgba(255,255,255,0.8)'
                  : 'rgba(255,255,255,0.2)',
                borderRadius: 2,
                transition: 'height 80ms',
              }}
            />
          )
        })}
      </div>

      {on && (
        <div>
          <div style={{ fontSize: 10, marginBottom: 4, opacity: 0.9, display: 'flex', justifyContent: 'space-between', fontWeight: 700 }}>
            <span>🎤 Mic volume</span>
            <span>{Math.round(vol * 100)}%</span>
          </div>
          <input
            type="range"
            min="0"
            max="2"
            step="0.01"
            value={vol}
            onChange={(e) => setVol(+e.target.value)}
            style={{ width: '100%', accentColor: 'white' }}
          />
        </div>
      )}
    </div>
  )
}
