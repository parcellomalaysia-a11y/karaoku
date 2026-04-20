'use client'

import { useState, useEffect, useRef } from 'react'
import { useLang } from '@/lib/i18n/LangProvider'
import { supabase } from '@/lib/supabase/client'
import { s } from '@/types'
import { MicManager } from '@/lib/mic'

// Free tier: 10 minutes of mic time per party
export const FREE_MIC_SECONDS = 600

interface Props {
  plan: string
  hostPlan: string           // party host's plan (limits apply if host is free)
  partyId?: string           // for saving mic_seconds_used to Supabase
  initialSecondsUsed?: number  // loaded from party.mic_seconds_used
  partyLocked: boolean       // if true (3 songs OR mic limit hit), mic disabled
  onTimeLimitHit: () => void // called when 10 min reached
  onSecondsUpdate?: (totalSeconds: number) => void // parent can track
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
  const [secondsUsed, setSecondsUsed] = useState(initialSecondsUsed)

  const tickRef = useRef<NodeJS.Timeout | null>(null)
  const saveTimerRef = useRef<NodeJS.Timeout | null>(null)
  const lastSavedRef = useRef<number>(initialSecondsUsed)

  const isHostFree = hostPlan === 'free'
  const timeExceeded = isHostFree && secondsUsed >= FREE_MIC_SECONDS
  const locked = partyLocked || timeExceeded
  const remainingSeconds = Math.max(0, FREE_MIC_SECONDS - secondsUsed)

  // Sync prop changes
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
    if (tickRef.current) {
      clearInterval(tickRef.current)
      tickRef.current = null
    }
    if (saveTimerRef.current) {
      clearInterval(saveTimerRef.current)
      saveTimerRef.current = null
    }
    // Final save on stop
    saveToSupabase(secondsUsed)
  }

  const toggle = async () => {
    if (on) {
      stopMic()
      return
    }
    if (locked) {
      onNeedUpgrade()
      return
    }
    try {
      const echo = typeof window !== 'undefined' ? localStorage.getItem('karaoku_echo') !== 'false' : true
      const noise = typeof window !== 'undefined' ? localStorage.getItem('karaoku_noise') !== 'false' : true
      const savedDeviceId = typeof window !== 'undefined' ? localStorage.getItem('karaoku_mic_id') : null

      await micRef.current.start({ echo, noise, deviceId: savedDeviceId || undefined })
      setOn(true)

      // Start counter — increment every second while ON
      tickRef.current = setInterval(() => {
        setSecondsUsed((prev) => {
          const next = prev + 1
          onSecondsUpdate?.(next)
          // Trigger limit hit exactly once when threshold crossed
          if (isHostFree && prev < FREE_MIC_SECONDS && next >= FREE_MIC_SECONDS) {
            // Auto-stop mic + notify parent
            setTimeout(() => {
              stopMic()
              onTimeLimitHit()
            }, 0)
          }
          return next
        })
      }, 1000)

      // Save to Supabase every 10 seconds while on
      saveTimerRef.current = setInterval(() => {
        setSecondsUsed((current) => {
          saveToSupabase(current)
          return current
        })
      }, 10000)
    } catch (err: any) {
      if (err.name === 'OverconstrainedError') {
        alert('Selected mic not available. Switch in Settings → Audio Devices.')
      } else {
        alert(t.mic_denied)
      }
    }
  }

  useEffect(() => {
    if (!on) { setLevel(0); return }
    const id = setInterval(() => setLevel(micRef.current.getLevel()), 80)
    return () => clearInterval(id)
  }, [on])

  useEffect(() => { micRef.current.setVolume(vol) }, [vol])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      micRef.current.stop()
      if (tickRef.current) clearInterval(tickRef.current)
      if (saveTimerRef.current) clearInterval(saveTimerRef.current)
      saveToSupabase(secondsUsed)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Format seconds as MM:SS
  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60)
    const s = secs % 60
    return `${m}:${s.toString().padStart(2, '0')}`
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
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
        <div>
          <div style={{ fontSize: 11, letterSpacing: 2, fontWeight: 800, opacity: 0.85 }}>
            🎤 {t.phone_mic}
          </div>
          <div style={{ fontSize: 18, fontWeight: 800, marginTop: 2 }}>
            {locked ? '🔒 LOCKED' : on ? t.mic_live : t.mic_off}
          </div>
          {isHostFree && !locked && (
            <div style={{ fontSize: 11, marginTop: 4, opacity: 0.85, fontFamily: 'monospace' }}>
              ⏱ {formatTime(secondsUsed)} / {formatTime(FREE_MIC_SECONDS)}
            </div>
          )}
          {isHostFree && locked && (
            <div style={{ fontSize: 11, marginTop: 4, opacity: 0.9 }}>
              Free mic limit reached (10 min)
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

      {/* Progress bar for free users showing time used */}
      {isHostFree && (
        <div
          style={{
            height: 4,
            background: 'rgba(255,255,255,0.15)',
            borderRadius: 100,
            marginBottom: 12,
            overflow: 'hidden',
          }}
        >
          <div
            style={{
              height: '100%',
              width: `${Math.min(100, (secondsUsed / FREE_MIC_SECONDS) * 100)}%`,
              background: locked ? '#ff6b6b' : 'rgba(255,255,255,0.85)',
              transition: 'width 0.3s',
              borderRadius: 100,
            }}
          />
        </div>
      )}

      {/* Level visualizer */}
      <div style={{ display: 'flex', gap: 2, alignItems: 'flex-end', height: 30, marginBottom: 12 }}>
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
                  ? i > 24
                    ? '#ffeb3b'
                    : i > 16
                      ? '#fff'
                      : 'rgba(255,255,255,0.8)'
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
          <div style={{ fontSize: 11, marginBottom: 6, opacity: 0.9 }}>
            {t.mic_volume}: {Math.round(vol * 100)}%
          </div>
          <input
            type="range"
            min="0"
            max="2"
            step="0.01"
            value={vol}
            onChange={(e) => setVol(+e.target.value)}
            style={{ width: '100%', accentColor: 'white', background: 'transparent', border: 'none', padding: 0 }}
          />
        </div>
      )}
    </div>
  )
}
