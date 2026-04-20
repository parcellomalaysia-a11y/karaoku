'use client'

import { useState, useEffect, useRef } from 'react'
import { useLang } from '@/lib/i18n/LangProvider'
import { s } from '@/types'
import { MicManager } from '@/lib/mic'

interface Props {
  plan: string
  freeLimit: number
  songsUsed: number
  onNeedUpgrade: () => void
}

export default function MicPanel({ plan, freeLimit, songsUsed, onNeedUpgrade }: Props) {
  const { t } = useLang()
  const micRef = useRef<MicManager>(new MicManager())
  const [on, setOn] = useState(false)
  const [level, setLevel] = useState(0)
  const [vol, setVol] = useState(1)

  const toggle = async () => {
    if (on) {
      micRef.current.stop()
      setOn(false)
      return
    }
    if (plan === 'free' && songsUsed >= freeLimit) {
      onNeedUpgrade()
      return
    }
    try {
      const echo = typeof window !== 'undefined' ? localStorage.getItem('karaoku_echo') !== 'false' : true
      const noise = typeof window !== 'undefined' ? localStorage.getItem('karaoku_noise') !== 'false' : true
      await micRef.current.start({ echo, noise })
      setOn(true)
    } catch {
      alert(t.mic_denied)
    }
  }

  useEffect(() => {
    if (!on) { setLevel(0); return }
    const id = setInterval(() => setLevel(micRef.current.getLevel()), 80)
    return () => clearInterval(id)
  }, [on])

  useEffect(() => { micRef.current.setVolume(vol) }, [vol])

  // Stop on unmount
  useEffect(() => {
    return () => { micRef.current.stop() }
  }, [])

  return (
    <div
      style={{
        background: on ? `linear-gradient(135deg, ${s.redDark}, ${s.red})` : s.dark,
        borderRadius: 16,
        padding: 16,
        border: `1px solid ${on ? s.redLight : s.gray}`,
        transition: 'background 0.3s',
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
        <div>
          <div style={{ fontSize: 11, letterSpacing: 2, fontWeight: 800, opacity: 0.85 }}>
            🎤 {t.phone_mic}
          </div>
          <div style={{ fontSize: 18, fontWeight: 800, marginTop: 2 }}>
            {on ? t.mic_live : t.mic_off}
          </div>
          {plan === 'free' && (
            <div style={{ fontSize: 11, marginTop: 4, opacity: 0.85 }}>
              {t.mic_free_used(songsUsed, freeLimit)}
            </div>
          )}
        </div>
        <button
          onClick={toggle}
          style={{
            borderRadius: '50%',
            width: 64,
            height: 64,
            padding: 0,
            fontSize: 24,
            background: on ? 'white' : s.red,
            color: on ? s.red : 'white',
            border: '2px solid rgba(255,255,255,0.25)',
            boxShadow: on ? '0 6px 0 #ccc' : `0 6px 0 ${s.redDark}`,
            cursor: 'pointer',
            fontWeight: 800,
            animation: on ? 'pulse-red 1.5s infinite' : 'none',
          }}
          aria-label={on ? 'Stop mic' : 'Start mic'}
        >
          {on ? '⏹' : '🎤'}
        </button>
      </div>

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
