'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import Logo from '@/components/ui/Logo'
import Button from '@/components/ui/Button'
import LangToggle from '@/components/ui/LangToggle'
import { useLang } from '@/lib/i18n/LangProvider'
import { supabase } from '@/lib/supabase/client'
import { s, PLANS, Plan } from '@/types'

export default function CheckoutClient() {
  const { t, lang } = useLang()
  const router = useRouter()
  const params = useSearchParams()
  const planId = (params.get('plan') || 'day') as Plan
  const [promo, setPromo] = useState('')
  const [discount, setDiscount] = useState(0)
  const [promoMsg, setPromoMsg] = useState('')
  const [applying, setApplying] = useState(false)
  const [paying, setPaying] = useState(false)

  const plan = PLANS[planId as Exclude<Plan, 'free'>]
  if (!plan || planId === 'free') {
    if (typeof window !== 'undefined') router.push('/pricing')
    return null
  }

  const planLabel = lang === 'bm' && 'labelBm' in plan ? (plan as any).labelBm : plan.label
  const total = Math.max(0, plan.priceNum * (1 - discount / 100))

  const applyPromo = async () => {
    if (!promo.trim()) return
    setApplying(true)
    setPromoMsg('')
    const { data } = await supabase
      .from('promo_codes')
      .select('discount_percent, max_uses, used_count, expires_at, is_active')
      .eq('code', promo.trim().toUpperCase())
      .single()

    if (
      data &&
      data.is_active &&
      data.used_count < data.max_uses &&
      (!data.expires_at || new Date(data.expires_at) > new Date())
    ) {
      setDiscount(data.discount_percent)
      setPromoMsg(t.checkout_promo_applied(data.discount_percent))
    } else {
      setDiscount(0)
      setPromoMsg(t.checkout_promo_invalid)
    }
    setApplying(false)
  }

  const pay = async () => {
    setPaying(true)
    const res = await fetch('/api/checkout', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        plan: planId,
        promoCode: discount > 0 ? promo.trim().toUpperCase() : null,
      }),
    })
    const data = await res.json()
    if (data.url) {
      window.location.href = data.url
    } else {
      alert(data.error || t.login_error)
      setPaying(false)
    }
  }

  return (
    <div style={{ minHeight: '100vh', background: s.black }}>
      <header
        style={{
          padding: '20px 32px',
          borderBottom: `1px solid ${s.gray}`,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <Link href="/"><Logo size={38} /></Link>
        <LangToggle />
      </header>

      <div style={{ maxWidth: 480, margin: '0 auto', padding: '40px 20px' }}>
        <div
          style={{
            fontSize: 11,
            color: s.redLight,
            letterSpacing: 2,
            fontWeight: 800,
            marginBottom: 8,
          }}
        >
          {t.checkout_badge}
        </div>
        <h1 style={{ fontSize: 28, fontWeight: 900, marginBottom: 24, letterSpacing: -1 }}>
          {t.checkout_title}
          {planLabel}
        </h1>

        <div
          style={{
            background: s.dark,
            borderRadius: 14,
            padding: 18,
            marginBottom: 12,
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <div>
            <div style={{ fontSize: 15, fontWeight: 700 }}>{planLabel}</div>
            <div style={{ fontSize: 12, color: '#999' }}>
              {lang === 'bm' && 'periodBm' in plan ? (plan as any).periodBm : plan.period}
            </div>
          </div>
          <div style={{ fontSize: 22, fontWeight: 900, color: s.red }}>{plan.price}</div>
        </div>

        <div
          style={{
            background: s.dark,
            borderRadius: 14,
            padding: 16,
            marginBottom: 12,
          }}
        >
          <div
            style={{
              fontSize: 11,
              color: '#999',
              letterSpacing: 1,
              marginBottom: 8,
              fontWeight: 700,
            }}
          >
            {t.checkout_promo_label}
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <input
              value={promo}
              onChange={(e) => setPromo(e.target.value.toUpperCase())}
              placeholder="PARTY50"
              style={{ flex: 1, padding: '10px 14px', fontSize: 14 }}
            />
            <Button variant="ghost" size="sm" onClick={applyPromo} disabled={applying}>
              {applying ? '...' : t.checkout_promo_apply}
            </Button>
          </div>
          {promoMsg && (
            <div
              style={{
                marginTop: 8,
                fontSize: 12,
                color: discount > 0 ? s.green : s.redLight,
              }}
            >
              {promoMsg}
            </div>
          )}
        </div>

        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: '14px 4px',
            borderTop: `1px solid ${s.gray}`,
            marginBottom: 16,
          }}
        >
          <span style={{ fontSize: 15 }}>{t.checkout_total}</span>
          <span style={{ fontSize: 22, fontWeight: 900, color: s.red }}>
            RM{total.toFixed(2)}
          </span>
        </div>

        <Button variant="primary" size="lg" fullWidth onClick={pay} disabled={paying}>
          {paying ? t.loading : t.checkout_pay}
        </Button>
        <div
          style={{
            fontSize: 11,
            color: 'rgba(255,255,255,0.4)',
            textAlign: 'center',
            marginTop: 12,
          }}
        >
          🔒 {t.checkout_secure}
        </div>
      </div>
    </div>
  )
}
