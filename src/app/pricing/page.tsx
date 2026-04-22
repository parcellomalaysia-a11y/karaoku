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
          <div style={{
            fontSize: 11,
            letterSpacing: 3,
            color: s.redLight,
            fontWeight: 800,
            marginBottom: 10,
          }}>
            {lang === 'bm' ? 'HARGA PLATFORM' : 'PLATFORM PRICING'}
          </div>
          <h1 style={{ fontSize: 42, fontWeight: 900, letterSpacing: -1, marginBottom: 12 }}>
            {t.pricing_title}
          </h1>
          <p style={{ color: '#999', fontSize: 15, marginBottom: 12, maxWidth: 620, margin: '0 auto 12px', lineHeight: 1.6 }}>
            {t.pricing_sub}
          </p>
          <p style={{ color: '#666', fontSize: 12, maxWidth: 620, margin: '0 auto 40px', lineHeight: 1.5 }}>
            {lang === 'bm'
              ? 'Ciri perisian sahaja. Kandungan dimainkan melalui pemain benam YouTube.'
              : 'Software features only. Content plays via YouTube\'s embedded player.'}
          </p>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(230px, 1fr))',
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
                  <div style={{ fontSize: 14, color: '#999', marginBottom: 4, fontWeight: 700 }}>{label}</div>
                  <div style={{ fontSize: 40, fontWeight: 900, color: accent, marginBottom: 2, letterSpacing: -1 }}>
                    {p.price}
                  </div>
                  <div style={{ fontSize: 13, color: '#999', marginBottom: 20 }}>{period}</div>
                  <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 20px' }}>
                    {features.map((f, i) => (
                      <li key={i} style={{ fontSize: 13, padding: '6px 0', color: '#ccc', display: 'flex', gap: 8, alignItems: 'flex-start' }}>
                        <span style={{ color: accent, fontWeight: 800, flexShrink: 0 }}>✓</span>
                        <span>{f}</span>
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

          {/* LEGAL CLARITY BOX */}
          <div style={{
            maxWidth: 720,
            margin: '50px auto 0',
            background: s.dark,
            border: `1px solid ${s.gray}`,
            borderRadius: 12,
            padding: 20,
            textAlign: 'left',
          }}>
            <div style={{ fontSize: 10, color: s.redLight, letterSpacing: 2, fontWeight: 800, marginBottom: 8 }}>
              {lang === 'bm' ? 'APA YANG ANDA BAYAR' : 'WHAT YOU\'RE PAYING FOR'}
            </div>
            <div style={{ fontSize: 14, color: '#ccc', lineHeight: 1.7, marginBottom: 10 }}>
              {lang === 'bm'
                ? 'Anda bayar untuk akses ciri platform — hosting bilik, pengurusan queue, penyelarasan realtime, dan sokongan teknikal.'
                : 'You\'re paying for platform feature access — room hosting, queue management, real-time coordination, and technical support.'}
            </div>
            <div style={{ fontSize: 13, color: '#999', lineHeight: 1.7 }}>
              {lang === 'bm'
                ? 'Anda TIDAK bayar untuk muzik, video, atau apa-apa kandungan berhak cipta. Semua kandungan dimainkan melalui pemain benam YouTube di bawah terma YouTube. Pengguna bertanggungjawab untuk pematuhan hak cipta penggunaan kandungan pihak ketiga.'
                : 'You are NOT paying for music, video, or any copyrighted content. All content plays via YouTube\'s embedded player under YouTube\'s terms. Users are responsible for copyright compliance when using third-party content.'}
            </div>
          </div>
        </div>
      </section>

      <footer
        style={{
          padding: '40px 32px 24px',
          color: '#666',
          fontSize: 12,
          borderTop: `1px solid ${s.gray}`,
          background: '#0a0a0a',
        }}
      >
        <div style={{
          maxWidth: 900,
          margin: '0 auto',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          flexWrap: 'wrap',
          gap: 20,
        }}>
          <div>
            <Logo size={28} />
            <div style={{ fontSize: 11, color: '#555', marginTop: 8 }}>
              {lang === 'bm' ? '© 2026 Karaoku · Platform pengurusan sesi' : '© 2026 Karaoku · Session management platform'}
            </div>
          </div>
          <div style={{ display: 'flex', gap: 18, flexWrap: 'wrap' }}>
            <Link href="/terms"><span style={{ color: '#aaa', cursor: 'pointer' }}>{lang === 'bm' ? 'Terma' : 'Terms'}</span></Link>
            <Link href="/privacy"><span style={{ color: '#aaa', cursor: 'pointer' }}>{lang === 'bm' ? 'Privasi' : 'Privacy'}</span></Link>
            <a href="mailto:support@karaoku.my" style={{ color: '#aaa' }}>Support</a>
          </div>
        </div>
      </footer>
    </div>
  )
}
