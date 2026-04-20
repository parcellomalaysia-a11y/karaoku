'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Logo from '@/components/ui/Logo'
import Button from '@/components/ui/Button'
import LangToggle from '@/components/ui/LangToggle'
import { useLang } from '@/lib/i18n/LangProvider'
import { s, PLANS } from '@/types'

export default function LandingPage() {
  const { t, lang } = useLang()
  const router = useRouter()

  return (
    <div style={{ minHeight: '100vh', background: s.black }}>
      {/* HEADER */}
      <header
        style={{
          padding: '20px 32px',
          borderBottom: `1px solid ${s.gray}`,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: 12,
        }}
      >
        <Logo size={44} />
        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          <LangToggle />
          <Link href="/pricing">
            <Button variant="ghost" size="sm">
              {t.nav_pricing}
            </Button>
          </Link>
          <Link href="/login">
            <Button variant="primary" size="sm">
              {t.nav_login}
            </Button>
          </Link>
        </div>
      </header>

      {/* HERO */}
      <section
        style={{
          position: 'relative',
          padding: '60px 32px 80px',
          textAlign: 'center',
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            position: 'absolute',
            top: -100,
            right: -100,
            width: 400,
            height: 400,
            borderRadius: '50%',
            background: s.red,
            opacity: 0.15,
            filter: 'blur(60px)',
          }}
        />
        <div
          style={{
            position: 'absolute',
            bottom: -150,
            left: -150,
            width: 500,
            height: 500,
            borderRadius: '50%',
            background: s.red,
            opacity: 0.1,
            filter: 'blur(80px)',
          }}
        />

        <div style={{ position: 'relative', maxWidth: 900, margin: '0 auto' }}>
          <div
            className="anim-slide-up"
            style={{
              display: 'inline-block',
              padding: '6px 14px',
              background: 'rgba(230,0,18,0.15)',
              border: `1px solid ${s.red}`,
              borderRadius: 20,
              fontSize: 12,
              color: s.redLight,
              fontWeight: 700,
              letterSpacing: 2,
              marginBottom: 24,
            }}
          >
            🎮 {t.hero_badge}
          </div>
          <h1
            className="anim-slide-up"
            style={{
              fontSize: 'clamp(44px, 7vw, 80px)',
              fontWeight: 900,
              lineHeight: 1.05,
              letterSpacing: '-2px',
              marginBottom: 20,
              animationDelay: '0.1s',
            }}
          >
            {t.hero_line1}
            <br />
            <span style={{ color: s.red }}>{t.hero_line2}</span>
          </h1>
          <p
            className="anim-slide-up"
            style={{
              fontSize: 18,
              color: '#aaa',
              maxWidth: 560,
              margin: '0 auto 40px',
              lineHeight: 1.6,
              animationDelay: '0.2s',
            }}
          >
            {t.hero_desc}
          </p>
          <div
            className="anim-slide-up"
            style={{
              display: 'flex',
              gap: 16,
              justifyContent: 'center',
              flexWrap: 'wrap',
              animationDelay: '0.3s',
            }}
          >
            <Button variant="primary" size="lg" onClick={() => router.push('/login?next=/dashboard/parties/new')}>
              🎤 {t.start_party}
            </Button>
            <Button variant="ghost" size="lg" onClick={() => router.push('/join')}>
              📱 {t.join_party}
            </Button>
          </div>
        </div>
      </section>

      {/* FEATURES */}
      <section style={{ padding: '60px 32px', background: s.dark }}>
        <div style={{ maxWidth: 1100, margin: '0 auto' }}>
          <h2
            style={{
              fontSize: 36,
              fontWeight: 900,
              textAlign: 'center',
              marginBottom: 48,
              letterSpacing: -1,
            }}
          >
            {t.features_title}
            <span style={{ color: s.red }}>{t.features_title2}</span>
          </h2>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
              gap: 16,
            }}
          >
            {[
              { icon: '🎵', title: t.feature_queue, desc: t.feature_queue_desc },
              { icon: '📺', title: t.feature_youtube, desc: t.feature_youtube_desc },
              { icon: '🎤', title: t.feature_mic, desc: t.feature_mic_desc },
              { icon: '👥', title: t.feature_party, desc: t.feature_party_desc },
            ].map((f, i) => (
              <div
                key={i}
                style={{
                  background: s.gray,
                  padding: 24,
                  borderRadius: 16,
                  border: '1px solid #333',
                  transition: 'all 0.2s',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = s.red
                  e.currentTarget.style.transform = 'translateY(-4px)'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = '#333'
                  e.currentTarget.style.transform = 'none'
                }}
              >
                <div style={{ fontSize: 36, marginBottom: 12 }}>{f.icon}</div>
                <h3 style={{ fontSize: 18, fontWeight: 800, marginBottom: 6 }}>{f.title}</h3>
                <p style={{ color: '#999', fontSize: 14, lineHeight: 1.5 }}>{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* STEPS */}
      <section style={{ padding: '60px 32px' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 40 }}>
            <div style={{ fontSize: 12, color: s.redLight, letterSpacing: 2, fontWeight: 800 }}>
              {t.steps_badge}
            </div>
            <h2 style={{ fontSize: 32, fontWeight: 900, marginTop: 8, letterSpacing: -1 }}>
              {t.steps_title}
            </h2>
          </div>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
              gap: 16,
            }}
          >
            {[
              { n: 1, title: t.step1, desc: t.step1_desc },
              { n: 2, title: t.step2, desc: t.step2_desc },
              { n: 3, title: t.step3, desc: t.step3_desc },
            ].map((st) => (
              <div key={st.n} style={{ textAlign: 'center', padding: 24 }}>
                <div
                  style={{
                    width: 60,
                    height: 60,
                    borderRadius: '50%',
                    background: s.red,
                    margin: '0 auto 16px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: 24,
                    fontWeight: 900,
                    boxShadow: `0 6px 0 ${s.redDark}`,
                  }}
                >
                  {st.n}
                </div>
                <h3 style={{ fontSize: 18, fontWeight: 800, marginBottom: 6 }}>{st.title}</h3>
                <p style={{ color: '#999', fontSize: 14 }}>{st.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* PRICING TEASER */}
      <section style={{ padding: '60px 32px', background: s.dark }}>
        <div style={{ maxWidth: 1100, margin: '0 auto', textAlign: 'center' }}>
          <h2 style={{ fontSize: 32, fontWeight: 900, marginBottom: 8 }}>{t.pricing_title}</h2>
          <p style={{ color: '#999', fontSize: 15, marginBottom: 32 }}>{t.pricing_sub}</p>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
              gap: 12,
              textAlign: 'left',
              marginBottom: 24,
            }}
          >
            {(['free', 'day', 'month', 'year'] as const).map((pid) => {
              const p = PLANS[pid]
              const isPop = pid === 'day'
              const colors: any = { free: '#888', day: s.red, month: s.purple, year: s.gold }
              return (
                <div
                  key={pid}
                  style={{
                    background: s.gray,
                    borderRadius: 16,
                    padding: 24,
                    border: isPop ? `2px solid ${colors[pid]}` : '2px solid transparent',
                    position: 'relative',
                  }}
                >
                  {isPop && (
                    <div
                      style={{
                        position: 'absolute',
                        top: -12,
                        left: 20,
                        background: colors[pid],
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
                  <div style={{ fontSize: 14, color: '#999' }}>
                    {lang === 'bm' && 'labelBm' in p ? (p as any).labelBm : p.label}
                  </div>
                  <div style={{ fontSize: 36, fontWeight: 900, color: colors[pid], margin: '4px 0' }}>
                    {p.price}
                  </div>
                  <div style={{ fontSize: 13, color: '#999', marginBottom: 16 }}>
                    {lang === 'bm' && 'periodBm' in p ? (p as any).periodBm : p.period}
                  </div>
                  <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                    {(lang === 'bm' ? p.featuresBm : p.features).map((f: string, i: number) => (
                      <li key={i} style={{ fontSize: 13, padding: '4px 0', color: '#ccc' }}>
                        ✓ {f}
                      </li>
                    ))}
                  </ul>
                </div>
              )
            })}
          </div>
          <Link href="/pricing">
            <Button variant="primary" size="lg">
              {t.pricing_title} →
            </Button>
          </Link>
        </div>
      </section>

      {/* FOOTER */}
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
