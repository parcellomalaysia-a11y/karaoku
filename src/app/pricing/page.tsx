'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import Logo from '@/components/ui/Logo'
import Button from '@/components/ui/Button'
import LangToggle from '@/components/ui/LangToggle'
import { useLang } from '@/lib/i18n/LangProvider'
import { supabase } from '@/lib/supabase/client'
import { s, PLANS } from '@/types'

export default function PricingPage() {
  const { t, lang } = useLang()
  const router = useRouter()
  const [loading, setLoading] = useState<string | null>(null)

  const pick = async (planId: 'free' | 'day' | 'month' | 'year') => {
    if (planId === 'free') {
      router.push('/dashboard')
      return
    }
    setLoading(planId)
    // Check auth first
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) {
      router.push(`/login?next=/checkout?plan=${planId}`)
      return
    }
    router.push(`/checkout?plan=${planId}`)
  }

  const plans = [
    { id: 'free' as const, accent: '#888' },
    { id: 'day' as const, accent: s.red, popular: true },
    { id: 'month' as const, accent: s.purple },
    { id: 'year' as const, accent: s.gold },
  ]

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
        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          <LangToggle />
          <Link href="/login">
            <Button variant="ghost" size="sm">{t.nav_login}</Button>
          </Link>
        </div>
      </header>

      <section style={{ padding: '60px 32px' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto', textAlign: 'center' }}>
          <h1 style={{ fontSize: 42, fontWeight: 900, letterSpacing: -1, marginBottom: 12 }}>
            {t.pricing_title}
          </h1>
          <p style={{ color: '#999', fontSize: 16, marginBottom: 40, maxWidth: 560, margin: '0 auto 40px' }}>
            {t.pricing_sub}
          </p>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
              gap: 16,
              textAlign: 'left',
            }}
          >
            {plans.map(({ id, accent, popular }) => {
              const p = PLANS[id]
              const label = lang === 'bm' && 'labelBm' in p ? (p as any).labelBm : p.label
              const period = lang === 'bm' && 'periodBm' in p ? (p as any).periodBm : p.period
              const features = lang === 'bm' ? p.featuresBm : p.features

              return (
                <div
                  key={id}
                  style={{
                    background: s.dark,
                    borderRadius: 16,
                    padding: 24,
                    border: popular ? `2px solid ${accent}` : '2px solid transparent',
                    position: 'relative',
                  }}
                >
                  {popular && (
                    <div
                      style={{
                        position: 'absolute',
                        top: -12,
                        left: 20,
                        background: accent,
                        color: 'white',
                        fontSize: 11,
                        fontWeight: 800,
                        padding: '4px 10px',
                        borderRadius: 20,
                        letterSpacing: 1,
                      }}
                    >
                      🔥 {t.popular}
                    </div>
                  )}
                  <div style={{ fontSize: 14, color: '#999', marginBottom: 4 }}>{label}</div>
                  <div style={{ fontSize: 40, fontWeight: 900, color: accent, marginBottom: 2 }}>
                    {p.price}
                  </div>
                  <div style={{ fontSize: 13, color: '#999', marginBottom: 20 }}>{period}</div>
                  <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 20px' }}>
                    {features.map((f, i) => (
                      <li key={i} style={{ fontSize: 13, padding: '6px 0', color: '#ccc' }}>
                        ✓ {f}
                      </li>
                    ))}
                  </ul>
                  <Button
                    variant={popular ? 'primary' : 'ghost'}
                    fullWidth
                    size="sm"
                    onClick={() => pick(id)}
                    disabled={loading === id}
                  >
                    {loading === id ? t.loading : id === 'free' ? t.current : t.get_plan(label)}
                  </Button>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      <footer
        style={{
          padding: '40px 32px',
          textAlign: 'center',
          color: '#666',
          fontSize: 13,
          borderTop: `1px solid ${s.gray}`,
        }}
      >
        {t.footer} 🇲🇾
      </footer>
    </div>
  )
}
