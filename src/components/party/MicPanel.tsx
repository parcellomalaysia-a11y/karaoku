'use client'

import { useState, useEffect, useRef } from 'react'
import { useLang } from '@/lib/i18n/LangProvider'
import { supabase } from '@/lib/supabase/client'
import { s } from '@/types'
import { MicManager, detectDeviceType } from '@/lib/mic'

export const FREE_MIC_SECONDS = 600

interface Props {
  plan: string
  hostPlan: string
  partyId?: string
  initialSecondsUsed?: number
  partyLocked: boolean
  musicVolume: number              // 0-100, controlled by parent (PartyRoom)
  onMusicVolumeChange: (v: number) => void
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
  musicVolume,
  onMusicVolumeChange,
  onTimeLimitHit,
  onSecondsUpdate,
  onNeedUpgrade,
}: Props) {
  const { t } = useLang()
  const micRef = useRef<MicManager>(new MicManager())
  const [on, setOn] = useState(false)
  const [level, setLevel] = useState(0)
  const [vol, setVol] = useState(1)
  const [boost, setBoost] = useState(1.5)
  const [perfMode, setPerfMode] = useState(true)   // default ON — best quality, no ducking
  const [showAdvanced, setShowAdvanced] = useState(false)
  const [secondsUsed, setSecondsUsed] = useState(initialSecondsUsed)
  const [micType, setMicType] = useState<string>('builtin')

  const tickRef = useRef<NodeJS.Timeout | null>(null)
  const saveTimerRef = useRef<NodeJS.Timeout | null>(null)
  const lastSavedRef = useRef<number>(initialSecondsUsed)

  const isHostFree = hostPlan === 'free'
  const timeExceeded = isHostFree && secondsUsed >= FREE_MIC_SECONDS
  const locked = partyLocked || timeExceeded

  // Load saved prefs
  useEffect(() => {
    if (typeof window === 'undefined') return
    const b = localStorage.getItem('karaoku_boost')
    if (b) setBoost(parseFloat(b))
    const p = localStorage.getItem('karaoku_perf_mode')
    if (p !== null) setPerfMode(p === 'true')
  }, [])

  // Detect mic type from saved device
  useEffect(() => {
    const load = async () => {
      try {
        const saved = typeof window !== 'undefined' ? localStorage.getItem('karaoku_mic_id') : null
        if (!saved) return
        const devices = await navigator.mediaDevices.enumerateDevices()
        const mic = devices.find((d) => d.deviceId === saved && d.kind === 'audioinput')
        if (mic) setMicType(detectDeviceType(mic.label))
      } catch {}
    }
    load()
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

      await micRef.current.start({
        performanceMode: perfMode,
        // Fallback settings if perf mode is OFF
        echo: micType === 'bluetooth' || micType === 'builtin',
        noise: true,
        autoGain: false,   // always disable — we handle gain via boost
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
        alert('Selected mic unavailable. Switch in Settings → Audio.')
      } else {
        alert(t.mic_denied || 'Mic permission denied. Grant microphone access.')
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
    if (typeof window !== 'undefined') localStorage.setItem('karaoku_perf_mode', perfMode.toString())
  }, [perfMode])

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

  const showPhoneWarning = !on && (micType === 'builtin' || micType === 'default')

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
          <div style={{ fontSize: 10, opacity: 0.7, marginTop: 2 }}>
            {micTypeLabel}{perfMode && on ? ' · PERF MODE' : ''}
          </div>
          {isHostFree && !locked && (
            <div style={{ fontSize: 10, marginTop: 3, opacity: 0.85, fontFamily: 'monospace' }}>
              ⏱ {formatTime(secondsUsed)} / {formatTime(FREE_MIC_SECONDS)}
            </div>
          )}
          {isHostFree && locked && (
            <div style={{ fontSize: 10, marginTop: 3, opacity: 0.9 }}>
              Free voice chat limit (10 min)
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

      {/* Phone-mic warning */}
      {showPhoneWarning && !locked && (
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
          ⚠️ <b>Using phone mic:</b> For louder voice & no music ducking, use external mic + Bluetooth speaker.
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
      <div style={{ display: 'flex', gap: 2, alignItems: 'flex-end', height: 26, marginBottom: 12 }}>
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

      {/* === AUDIO CONTROLS === */}
      <div style={{
        background: 'rgba(0,0,0,0.25)',
        borderRadius: 10,
        padding: 10,
        marginBottom: 8,
      }}>
        {/* Music Volume — always visible (most important for users) */}
        <div style={{ marginBottom: 10 }}>
          <div style={{ fontSize: 10, marginBottom: 4, opacity: 0.9, display: 'flex', justifyContent: 'space-between', fontWeight: 700 }}>
            <span>🎵 Music volume</span>
            <span>{musicVolume}%</span>
          </div>
          <input
            type="range"
            min="0" max="100" step="1"
            value={musicVolume}
            onChange={(e) => onMusicVolumeChange(+e.target.value)}
            style={{
              width: '100%',
              accentColor: on ? 'white' : s.red,
              background: 'transparent',
              border: 'none',
              padding: 0,
              cursor: 'pointer',
            }}
          />
        </div>

        {/* Mic Volume — only when on */}
        {on && (
          <>
            <div style={{ marginBottom: 10 }}>
              <div style={{ fontSize: 10, marginBottom: 4, opacity: 0.9, display: 'flex', justifyContent: 'space-between', fontWeight: 700 }}>
                <span>🎤 Mic volume</span>
                <span>{Math.round(vol * 100)}%</span>
              </div>
              <input
                type="range"
                min="0" max="2" step="0.01"
                value={vol}
                onChange={(e) => setVol(+e.target.value)}
                style={{ width: '100%', accentColor: 'white', background: 'transparent', border: 'none', padding: 0 }}
              />
            </div>

            <div>
              <div style={{ fontSize: 10, marginBottom: 4, opacity: 0.9, display: 'flex', justifyContent: 'space-between', fontWeight: 700 }}>
                <span>⚡ Mic boost {boost > 2 ? '(high)' : ''}</span>
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
          </>
        )}
      </div>

      {/* Advanced toggle */}
      <button
        onClick={() => setShowAdvanced(!showAdvanced)}
        style={{
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
          marginTop: 6,
          padding: 10,
          background: 'rgba(0,0,0,0.3)',
          borderRadius: 8,
          fontSize: 11,
        }}>
          {/* Performance Mode */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
            <div>
              <div style={{ opacity: 0.95, fontWeight: 700 }}>⚡ Performance Mode</div>
              <div style={{ fontSize: 9, opacity: 0.55, marginTop: 2 }}>Disables echo cancel + auto-gain</div>
            </div>
            <button
              onClick={() => setPerfMode(!perfMode)}
              disabled={on}
              style={{
                background: perfMode ? '#4ade80' : '#444',
                color: 'white',
                border: 'none',
                borderRadius: 100,
                padding: '4px 12px',
                fontSize: 9,
                fontWeight: 800,
                cursor: on ? 'not-allowed' : 'pointer',
                letterSpacing: 0.5,
                opacity: on ? 0.5 : 1,
              }}
            >
              {perfMode ? 'ON' : 'OFF'}
            </button>
          </div>

          {/* Explainer */}
          <div style={{
            fontSize: 9,
            opacity: 0.7,
            lineHeight: 1.6,
            padding: '8px 10px',
            background: 'rgba(0,0,0,0.3)',
            borderRadius: 6,
            marginBottom: 6,
          }}>
            <b style={{ color: '#4ade80' }}>Perf ON</b> = music stays loud, raw mic (best with external mic).<br />
            <b style={{ color: '#fbbf24' }}>Perf OFF</b> = browser filters on (may reduce music volume when singing).
          </div>

          {on && (
            <div style={{ fontSize: 9, opacity: 0.6, textAlign: 'center' }}>
              Turn mic OFF to change Performance Mode
            </div>
          )}
        </div>
      )}
    </div>
  )
}
