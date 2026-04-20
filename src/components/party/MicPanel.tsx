'use client'

import { useState, useEffect, useRef } from 'react'
import { useLang } from '@/lib/i18n/LangProvider'
import { supabase } from '@/lib/supabase/client'
import { s } from '@/types'
import { MicManager, detectDeviceType, smartEchoDefault } from '@/lib/mic'

export const FREE_MIC_SECONDS = 600

interface Props {
  plan: string
  hostPlan: string
  partyId?: string
  initialSecondsUsed?: number
  partyLocked: boolean
  onTimeLimitHit: () => void
  onSecondsUpdate?: (totalSeconds: number) => void
  onNeedUpgrade: () => void
}

export default function MicPanel({
  plan,
  hostPlan,
  partyId,
  initialSecondsUsed = 0,
  partyLocked,
  onTimeLimitHit,
  onSecondsUpdate,
  onNeedUpgrade,
}: Props) {
  const { t } = useLang()
  const micRef = useRef<MicManager>(new MicManager())
  const [on, setOn] = useState(false)
  const [level, setLevel] = useState(0)
  const [vol, setVol] = useState(1)
  const [boost, setBoost] = useState(1.5) // default slight boost
  const [karaokeMode, setKaraokeMode] = useState(false) // overrides auto settings
  const [showAdvanced, setShowAdvanced] = useState(false)
  const [secondsUsed, setSecondsUsed] = useState(initialSecondsUsed)
  const [micType, setMicType] = useState<string>('builtin')
  const [showFeedbackWarning, setShowFeedbackWarning] = useState(false)

  const tickRef = useRef<NodeJS.Timeout | null>(null)
  const saveTimerRef = useRef<NodeJS.Timeout | null>(null)
  const lastSavedRef = useRef<number>(initialSecondsUsed)

  const isHostFree = hostPlan === 'free'
  const timeExceeded = isHostFree && secondsUsed >= FREE_MIC_SECONDS
  const locked = partyLocked || timeExceeded

  // Load saved boost preference
  useEffect(() => {
    if (typeof window === 'undefined') return
    const savedBoost = localStorage.getItem('karaoku_boost')
    if (savedBoost) setBoost(parseFloat(savedBoost))
    const savedKaraoke = localStorage.getItem('karaoku_karaoke_mode')
    if (savedKaraoke) setKaraokeMode(savedKaraoke === 'true')
  }, [])

  // Detect mic type from saved device
  useEffect(() => {
    const loadDeviceType = async () => {
      try {
        const saved = typeof window !== 'undefined' ? localStorage.getItem('karaoku_mic_id') : null
        if (!saved) return
        const devices = await navigator.mediaDevices.enumerateDevices()
        const mic = devices.find((d) => d.deviceId === saved && d.kind === 'audioinput')
        if (mic) {
          setMicType(detectDeviceType(mic.label))
          // Show feedback warning: phone speaker + phone mic combo
          const type = detectDeviceType(mic.label)
          setShowFeedbackWarning(type === 'builtin' || type === 'default')
        }
      } catch {}
    }
    loadDeviceType()
  }, [])

  useEffect(() => {
    setSecondsUsed(initialSecondsUsed)
    lastSavedRef.current = initialSecondsUsed
  }, [initialSecondsUsed])

  const saveToSupabase = async (totalSeconds: number) => {
    if (!partyId || totalSeconds === lastSavedRef.current) return
    try {
      await supabase
        .from('parties')
        .update({ mic_seconds_used: totalSeconds })
        .eq('id', partyId)
      lastSavedRef.current = totalSeconds
    } catch (err) {
      console.error('[mic] save failed', err)
    }
  }

  const stopMic = () => {
    micRef.current.stop()
    setOn(false)
    if (tickRef.current) { clearInterval(tickRef.current); tickRef.current = null }
    if (saveTimerRef.current) { clearInterval(saveTimerRef.current); saveTimerRef.current = null }
    saveToSupabase(secondsUsed)
  }

  const toggle = async () => {
    if (on) { stopMic(); return }
    if (locked) { onNeedUpgrade(); return }

    try {
      const savedDeviceId = typeof window !== 'undefined' ? localStorage.getItem('karaoku_mic_id') : null

      // Smart echo/noise defaults, OR overridden by karaoke mode
      let echo: boolean, noise: boolean, autoGain: boolean
      if (karaokeMode) {
        // Karaoke mode: turn OFF echo cancellation (user has good setup)
        // Keep noise suppression, turn OFF auto-gain (we handle with boost)
        echo = false
        noise = true
        autoGain = false
      } else {
        // Auto mode: smart per device type
        echo = smartEchoDefault(micType)
        noise = typeof window !== 'undefined' ? localStorage.getItem('karaoku_noise') !== 'false' : true
        autoGain = true
      }

      await micRef.current.start({
        echo,
        noise,
        autoGain,
        deviceId: savedDeviceId || undefined,
        boost,
      })
      setOn(true)

      tickRef.current = setInterval(() => {
        setSecondsUsed((prev) => {
          const next = prev + 1
          onSecondsUpdate?.(next)
          if (isHostFree && prev < FREE_MIC_SECONDS && next >= FREE_MIC_SECONDS) {
            setTimeout(() => { stopMic(); onTimeLimitHit() }, 0)
          }
          return next
        })
      }, 1000)

      saveTimerRef.current = setInterval(() => {
        setSecondsUsed((c) => { saveToSupabase(c); return c })
      }, 10000)
    } catch (err: any) {
      if (err.name === 'OverconstrainedError') {
        alert('Selected mic not available. Switch in Settings → Audio Devices.')
      } else {
        alert(t.mic_denied || 'Mic access denied. Please grant permission.')
      }
    }
  }

  useEffect(() => {
    if (!on) { setLevel(0); return }
    const id = setInterval(() => setLevel(micRef.current.getLevel()), 80)
    return () => clearInterval(id)
  }, [on])

  useEffect(() => { micRef.current.setVolume(vol) }, [vol])
  useEffect(() => {
    micRef.current.setBoost(boost)
    if (typeof window !== 'undefined') localStorage.setItem('karaoku_boost', boost.toString())
  }, [boost])
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('karaoku_karaoke_mode', karaokeMode.toString())
    }
  }, [karaokeMode])

  useEffect(() => {
    return () => {
      micRef.current.stop()
      if (tickRef.current) clearInterval(tickRef.current)
      if (saveTimerRef.current) clearInterval(saveTimerRef.current)
      saveToSupabase(secondsUsed)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60)
    const s = secs % 60
    return `${m}:${s.toString().padStart(2, '0')}`
  }

  const micTypeLabel = {
    bluetooth: '🎙️ Bluetooth',
    usb: '🔌 USB',
    wired: '🎧 Wired',
    builtin: '📱 Phone',
    default: '📱 Default',
  }[micType] || '📱 Mic'

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
          <div style={{ fontSize: 10, opacity: 0.7, marginTop: 2 }}>{micTypeLabel}</div>
          {isHostFree && !locked && (
            <div style={{ fontSize: 10, marginTop: 3, opacity: 0.85, fontFamily: 'monospace' }}>
              ⏱ {formatTime(secondsUsed)} / {formatTime(FREE_MIC_SECONDS)}
            </div>
          )}
          {isHostFree && locked && (
            <div style={{ fontSize: 10, marginTop: 3, opacity: 0.9 }}>
              Free mic limit (10 min)
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

      {/* Feedback warning — only shown when off + phone mic detected */}
      {!on && showFeedbackWarning && !locked && (
        <div
          style={{
            background: 'rgba(251, 191, 36, 0.15)',
            border: '1px solid rgba(251, 191, 36, 0.3)',
            borderRadius: 8,
            padding: 8,
            marginBottom: 10,
            fontSize: 10,
            color: '#fde68a',
            lineHeight: 1.5,
          }}
        >
          ⚠️ <b>Phone mic + phone speaker:</b> May cause echo/feedback. For best results, connect Bluetooth speaker via phone Settings, OR use wired headphones.
        </div>
      )}

      {/* Time progress bar */}
      {isHostFree && (
        <div style={{
          height: 3, background: 'rgba(255,255,255,0.15)', borderRadius: 100,
          marginBottom: 10, overflow: 'hidden',
        }}>
          <div style={{
            height: '100%',
            width: `${Math.min(100, (secondsUsed / FREE_MIC_SECONDS) * 100)}%`,
            background: locked ? '#ff6b6b' : 'rgba(255,255,255,0.85)',
            transition: 'width 0.3s', borderRadius: 100,
          }} />
        </div>
      )}

      {/* Level visualizer */}
      <div style={{ display: 'flex', gap: 2, alignItems: 'flex-end', height: 26, marginBottom: 10 }}>
        {Array.from({ length: 32 }).map((_, i) => {
          const threshold = (i + 1) / 32
          const active = level > threshold * 0.5
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

      {/* Volume + Boost sliders (when on) */}
      {on && (
        <div>
          <div style={{ fontSize: 10, marginBottom: 4, opacity: 0.85, display: 'flex', justifyContent: 'space-between' }}>
            <span>🔊 Volume</span>
            <span>{Math.round(vol * 100)}%</span>
          </div>
          <input
            type="range"
            min="0" max="2" step="0.01"
            value={vol}
            onChange={(e) => setVol(+e.target.value)}
            style={{ width: '100%', accentColor: 'white', background: 'transparent', border: 'none', padding: 0, marginBottom: 8 }}
          />

          <div style={{ fontSize: 10, marginBottom: 4, opacity: 0.85, display: 'flex', justifyContent: 'space-between' }}>
            <span>⚡ Boost {boost > 2 ? '(high)' : ''}</span>
            <span>{Math.round(boost * 100)}%</span>
          </div>
          <input
            type="range"
            min="0.5" max="3" step="0.1"
            value={boost}
            onChange={(e) => setBoost(+e.target.value)}
            style={{ width: '100%', accentColor: 'white', background: 'transparent', border: 'none', padding: 0 }}
          />
        </div>
      )}

      {/* Advanced toggle */}
      <button
        onClick={() => setShowAdvanced(!showAdvanced)}
        style={{
          marginTop: 10,
          background: 'transparent',
          border: 'none',
          color: 'rgba(255,255,255,0.6)',
          fontSize: 10,
          cursor: 'pointer',
          padding: 4,
          fontFamily: 'inherit',
          width: '100%',
          textAlign: 'left',
        }}
      >
        {showAdvanced ? '▼' : '▶'} Advanced audio settings
      </button>

      {showAdvanced && (
        <div style={{
          marginTop: 8,
          padding: 10,
          background: 'rgba(0,0,0,0.2)',
          borderRadius: 8,
          fontSize: 11,
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
            <span style={{ opacity: 0.9 }}>🎤 Karaoke mode</span>
            <button
              onClick={() => setKaraokeMode(!karaokeMode)}
              style={{
                background: karaokeMode ? '#4ade80' : '#444',
                color: 'white',
                border: 'none',
                borderRadius: 100,
                padding: '3px 10px',
                fontSize: 9,
                fontWeight: 800,
                cursor: 'pointer',
                letterSpacing: 0.5,
              }}
            >
              {karaokeMode ? 'ON' : 'OFF'}
            </button>
          </div>
          <div style={{ fontSize: 9, opacity: 0.6, lineHeight: 1.5 }}>
            Karaoke mode disables echo cancellation & auto-gain.
            Use only with <b>external mic</b> (wired or BT), NOT phone built-in.
            Turn OFF if you get echo/feedback.
          </div>
        </div>
      )}
    </div>
  )
}
