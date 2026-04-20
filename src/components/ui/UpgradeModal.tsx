'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { s } from '@/types'

interface Props {
  onClose: () => void
}

type PlanId = 'day' | 'month' | 'year'

interface PlanCard {
  id: PlanId
  name: string
  price: string
  priceNum: string
  duration: string
  accent: string
  accentDark: string
  accentLight: string
  buttonBg: string
  buttonColor: string
  buttonShadow: string
  badge?: string
  saveLabel?: string
  bg: string
  border: string
  divider: string
}

const CARDS: PlanCard[] = [
  {
    id: 'day',
    name: 'DAY PASS',
    price: 'RM9',
    priceNum: '9',
    duration: '/24hr',
    accent: '#E60012',
    accentDark: '#B50010',
    accentLight: '#ff4757',
    buttonBg: '#E60012',
    buttonColor: 'white',
    buttonShadow: '#B50010',
    badge: 'POPULAR',
    bg: '#1a1010',
    border: '#E60012',
    divider: '#2a1515',
  },
  {
    id: 'month',
    name: 'MONTHLY',
    price: 'RM39',
    priceNum: '39',
    duration: '/30 days',
    accent: '#aaaaaa',
    accentDark: '#888',
    accentLight: '#ccc',
    buttonBg: 'white',
    buttonColor: '#0A0A0A',
    buttonShadow: '#888',
    bg: '#1a1a1a',
    border: '#2a2a2a',
    divider: '#2a2a2a',
  },
  {
    id: 'year',
    name: 'YEARLY',
    price: 'RM199',
    priceNum: '199',
    duration: '/365 days',
    accent: '#8888ff',
    accentDark: '#5555cc',
    accentLight: '#aaaaff',
    buttonBg: '#8888ff',
    buttonColor: '#1A1A2A',
    buttonShadow: '#5555cc',
    badge: 'BEST VALUE',
    saveLabel: 'Save RM269',
    bg: '#12121a',
    border: '#4040aa',
    divider: '#1a1a2a',
  },
]

export default function UpgradeModal({ onClose }: Props) {
  const router = useRouter()
  const [mounted, setMounted] = useState(false)
  const [i, setI] = useState(0)
  const [loading, setLoading] = useState<PlanId | null>(null)
  const trackRef = useRef<HTMLDivElement>(null)
  const startX = useRef(0)
  const dx = useRef(0)

  useEffect(() => {
    // Slide up animation on mount
    setTimeout(() => setMounted(true), 20)
  }, [])

  const close = () => {
    setMounted(false)
    setTimeout(onClose, 300)
  }

  const go = (n: number) => {
    const next = Math.max(0, Math.min(CARDS.length - 1, n))
    setI(next)
  }

  const handleBuy = async (planId: PlanId) => {
    setLoading(planId)
    try {
      const res = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plan: planId }),
      })
      const data = await res.json()
      if (data.url) {
        window.location.href = data.url
      } else {
        alert(data.error || 'Checkout failed. Please try again.')
        setLoading(null)
      }
    } catch (err) {
      alert('Something went wrong. Please try again.')
      setLoading(null)
    }
  }

  const onTouchStart = (e: React.TouchEvent) => {
    startX.current = e.touches[0].clientX
    dx.current = 0
  }
  const onTouchMove = (e: React.TouchEvent) => {
    dx.current = e.touches[0].clientX - startX.current
  }
  const onTouchEnd = () => {
    if (Math.abs(dx.current) > 40) go(i + (dx.current < 0 ? 1 : -1))
  }

  return (
    <div
      onClick={close}
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0,0,0,0.85)',
        display: 'flex',
        alignItems: 'flex-end',
        justifyContent: 'center',
        zIndex: 1000,
        padding: 14,
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: '#0A0A0A',
          borderRadius: '18px 18px 0 0',
          padding: '18px 14px 20px',
          width: '100%',
          maxWidth: 340,
          borderTop: `2px solid ${s.red}`,
          transform: mounted ? 'translateY(0)' : 'translateY(100%)',
          transition: 'transform 0.3s cubic-bezier(0.2, 0.8, 0.2, 1)',
        }}
      >
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
            marginBottom: 14,
          }}
        >
          <div>
            <div
              style={{
                fontSize: 9,
                color: s.redLight,
                letterSpacing: 2.5,
                fontWeight: 800,
              }}
            >
              CHOOSE YOUR PLAN
            </div>
            <div style={{ fontSize: 16, fontWeight: 800, marginTop: 1 }}>
              Unlock unlimited parties
            </div>
            <div
              style={{
                fontSize: 9,
                color: 'rgba(255,255,255,0.4)',
                marginTop: 2,
              }}
            >
              Same features. Different duration.
            </div>
          </div>
          <button
            onClick={close}
            style={{
              background: 'transparent',
              border: 'none',
              color: '#666',
              fontSize: 22,
              cursor: 'pointer',
              padding: 0,
              lineHeight: 1,
            }}
            aria-label="Close"
          >
            ×
          </button>
        </div>

        <div
          style={{
            position: 'relative',
            maxWidth: 260,
            margin: '0 auto 10px',
          }}
        >
          <div style={{ overflow: 'hidden', borderRadius: 12 }}>
            <div
              ref={trackRef}
              onTouchStart={onTouchStart}
              onTouchMove={onTouchMove}
              onTouchEnd={onTouchEnd}
              style={{
                display: 'flex',
                transition: 'transform 0.35s cubic-bezier(0.2, 0.8, 0.2, 1)',
                transform: `translateX(-${i * 100}%)`,
                touchAction: 'pan-y',
              }}
            >
              {CARDS.map((card) => (
                <div key={card.id} style={{ minWidth: '100%', padding: 2 }}>
                  <div
                    style={{
                      background: card.bg,
                      borderRadius: 10,
                      padding: '14px 14px 12px',
                      border: card.badge ? `1.5px solid ${card.border}` : `1px solid ${card.border}`,
                      position: 'relative',
                    }}
                  >
                    {card.badge && (
                      <div
                        style={{
                          position: 'absolute',
                          top: -8,
                          left: 14,
                          background: card.accent,
                          color: card.id === 'year' ? '#1A1A2A' : 'white',
                          fontSize: 9,
                          fontWeight: 800,
                          padding: '2px 8px',
                          borderRadius: 100,
                          letterSpacing: 1,
                        }}
                      >
                        {card.badge}
                      </div>
                    )}
                    <div
                      style={{
                        fontSize: 9,
                        color: card.accentLight,
                        letterSpacing: 2,
                        fontWeight: 700,
                        marginTop: card.badge ? 2 : 0,
                        marginBottom: 2,
                      }}
                    >
                      {card.name}
                    </div>
                    <div
                      style={{
                        fontSize: 24,
                        fontWeight: 900,
                        letterSpacing: -0.5,
                      }}
                    >
                      {card.price}
                      <span
                        style={{
                          fontSize: 10,
                          color: 'rgba(255,255,255,0.5)',
                          fontWeight: 400,
                          letterSpacing: 0,
                        }}
                      >
                        {' '}
                        {card.duration}
                      </span>
                    </div>
                    {card.saveLabel && (
                      <div
                        style={{
                          fontSize: 9,
                          color: card.accentLight,
                          fontWeight: 700,
                          marginTop: -2,
                        }}
                      >
                        {card.saveLabel}
                      </div>
                    )}
                    <div
                      style={{
                        height: 1,
                        background: card.divider,
                        margin: '10px 0',
                      }}
                    />
                    <div
                      style={{
                        fontSize: 10.5,
                        color: 'rgba(255,255,255,0.8)',
                        lineHeight: 1.75,
                        marginBottom: 12,
                      }}
                    >
                      ✓ Unlimited songs & mic
                      <br />
                      ✓ Phone / Bluetooth / Radio
                      <br />
                      ✓ QR invites · Party mode
                    </div>
                    <button
                      onClick={() => handleBuy(card.id)}
                      disabled={loading !== null}
                      style={{
                        width: '100%',
                        padding: 9,
                        background: card.buttonBg,
                        color: card.buttonColor,
                        border: 'none',
                        borderRadius: 8,
                        fontSize: 12,
                        fontWeight: 800,
                        cursor: loading ? 'not-allowed' : 'pointer',
                        boxShadow: `0 3px 0 ${card.buttonShadow}`,
                        letterSpacing: 0.8,
                        opacity: loading && loading !== card.id ? 0.4 : 1,
                        fontFamily: 'inherit',
                      }}
                    >
                      {loading === card.id ? 'Loading...' : 'BUY NOW →'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <button
            onClick={() => go(i - 1)}
            style={{
              position: 'absolute',
              left: -28,
              top: '50%',
              transform: 'translateY(-50%)',
              background: 'rgba(20,20,20,0.7)',
              color: '#888',
              border: '1px solid #2a2a2a',
              width: 24,
              height: 24,
              borderRadius: '50%',
              fontSize: 12,
              cursor: 'pointer',
              fontFamily: 'inherit',
            }}
          >
            ‹
          </button>
          <button
            onClick={() => go(i + 1)}
            style={{
              position: 'absolute',
              right: -28,
              top: '50%',
              transform: 'translateY(-50%)',
              background: 'rgba(20,20,20,0.7)',
              color: '#888',
              border: '1px solid #2a2a2a',
              width: 24,
              height: 24,
              borderRadius: '50%',
              fontSize: 12,
              cursor: 'pointer',
              fontFamily: 'inherit',
            }}
          >
            ›
          </button>
        </div>

        <div
          style={{
            display: 'flex',
            justifyContent: 'center',
            gap: 5,
            marginBottom: 8,
          }}
        >
          {CARDS.map((_, idx) => (
            <div
              key={idx}
              onClick={() => go(idx)}
              style={{
                width: idx === i ? 14 : 3,
                height: 3,
                borderRadius: 100,
                background: idx === i ? s.red : '#333',
                cursor: 'pointer',
                transition: 'all 0.2s',
              }}
            />
          ))}
        </div>

        <div
          style={{
            textAlign: 'center',
            fontSize: 8,
            color: 'rgba(255,255,255,0.3)',
            letterSpacing: 1,
          }}
        >
          💳 CARD · 🏦 FPX · 📱 GRABPAY
        </div>
      </div>
    </div>
  )
}
