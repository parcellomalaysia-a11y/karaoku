'use client'

import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Logo from '@/components/ui/Logo'
import Button from '@/components/ui/Button'
import LangToggle from '@/components/ui/LangToggle'
import { useLang } from '@/lib/i18n/LangProvider'
import { s } from '@/types'

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
            fontSize: 11,
            letterSpacing: 3,
            color: s.redLight,
            fontWeight: 800,
            marginBottom: 12,
          }}
        >
          {lang === 'bm' ? 'PLATFORM PENGURUSAN SESI' : 'SESSION MANAGEMENT PLATFORM'}
        </div>
        <h1
          style={{
            fontSize: 'clamp(32px, 5vw, 56px)',
            fontWeight: 900,
            lineHeight: 1.05,
            marginBottom: 14,
            letterSpacing: -1,
          }}
        >
          {lang === 'bm' ? (
            <>Barisan gilir.<br />Sesi tersusun.<br /><span style={{ color: s.redLight }}>Secara serentak.</span></>
          ) : (
            <>Organize queues.<br />Run sessions.<br /><span style={{ color: s.redLight }}>Together, live.</span></>
          )}
        </h1>
        <p style={{ fontSize: 17, color: '#bbb', maxWidth: 580, margin: '0 auto 28px', lineHeight: 1.5 }}>
          {lang === 'bm'
            ? 'Host bilik, peserta scan QR untuk join. Cadang video YouTube, vote queue, sync realtime untuk semua.'
            : 'Host a room. Guests scan QR to join. Suggest YouTube links, vote on queue, everyone stays in sync.'}
        </p>
        <div style={{ display: 'flex', gap: 10, justifyContent: 'center', flexWrap: 'wrap' }}>
          <Link href="/login">
            <Button variant="primary" size="lg">
              {lang === 'bm' ? 'Mula Free →' : 'Start Free →'}
            </Button>
          </Link>
          <Link href="/join">
            <Button variant="ghost" size="lg">
              {lang === 'bm' ? 'Join Bilik' : 'Join Room'}
            </Button>
          </Link>
        </div>

        <p style={{ marginTop: 22, fontSize: 11, color: '#666' }}>
          {lang === 'bm'
            ? 'No muat turun. Browser sahaja. Peserta perlukan YouTube link.'
            : 'No download. Works in browser. Participants bring their own YouTube links.'}
        </p>
      </section>

      {/* WHAT IT DOES */}
      <section style={{ padding: '40px 32px', background: s.dark }}>
        <div style={{ maxWidth: 900, margin: '0 auto' }}>
          <div style={{ fontSize: 11, color: s.redLight, letterSpacing: 2, fontWeight: 800, marginBottom: 8, textAlign: 'center' }}>
            {lang === 'bm' ? 'APA YANG PLATFORM INI BUAT' : 'WHAT THIS PLATFORM DOES'}
          </div>
          <h2 style={{ fontSize: 28, fontWeight: 900, textAlign: 'center', marginBottom: 36, letterSpacing: -0.5 }}>
            {lang === 'bm' ? 'Alat koordinasi untuk kumpulan.' : 'A coordination tool for groups.'}
          </h2>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 14 }}>
            <FeatureCard
              label="01"
              title={lang === 'bm' ? 'Host bilik' : 'Host a room'}
              desc={lang === 'bm'
                ? 'Dapat kod unik. Kongsi dengan kumpulan anda.'
                : 'Get a unique code. Share it with your group.'}
            />
            <FeatureCard
              label="02"
              title={lang === 'bm' ? 'Peserta join' : 'Guests join'}
              desc={lang === 'bm'
                ? 'Scan QR atau enter kod. Tiada sign-up.'
                : 'Scan QR or enter code. No signup needed.'}
            />
            <FeatureCard
              label="03"
              title={lang === 'bm' ? 'Cadang video' : 'Suggest videos'}
              desc={lang === 'bm'
                ? 'Cari video YouTube. Add ke queue bersama.'
                : 'Search YouTube videos. Add to the shared queue.'}
            />
            <FeatureCard
              label="04"
              title={lang === 'bm' ? 'Vote queue' : 'Vote on queue'}
              desc={lang === 'bm'
                ? 'Ahli kumpulan vote video mana next.'
                : 'Members vote which video goes next.'}
            />
            <FeatureCard
              label="05"
              title={lang === 'bm' ? 'Play sync' : 'Play in sync'}
              desc={lang === 'bm'
                ? 'Semua tengok status sama, realtime.'
                : 'Everyone sees the same current status, live.'}
            />
            <FeatureCard
              label="06"
              title={lang === 'bm' ? 'Habis sesi' : 'End session'}
              desc={lang === 'bm'
                ? 'Tutup bilik atau habis tempoh. Selesai.'
                : 'Close room or let it expire. Done.'}
            />
          </div>
        </div>
      </section>

      {/* IMPORTANT — WHAT THIS IS NOT */}
      <section style={{ padding: '40px 32px' }}>
        <div
          style={{
            maxWidth: 780,
            margin: '0 auto',
            background: s.dark,
            borderRadius: 14,
            padding: 24,
            border: `1px solid ${s.gray}`,
          }}
        >
          <div style={{ fontSize: 11, color: s.redLight, letterSpacing: 2, fontWeight: 800, marginBottom: 8 }}>
            {lang === 'bm' ? 'PENTING — APA INI BUKAN' : 'IMPORTANT — WHAT THIS IS NOT'}
          </div>
          <h3 style={{ fontSize: 19, fontWeight: 800, marginBottom: 10, letterSpacing: -0.3 }}>
            {lang === 'bm'
              ? 'Kami tidak edar, jual, atau lesen muzik.'
              : 'We do not distribute, sell, or license music.'}
          </h3>
          <p style={{ fontSize: 13, color: '#bbb', lineHeight: 1.7, marginBottom: 8 }}>
            {lang === 'bm'
              ? 'Karaoku ialah platform pengurusan sesi dan koordinasi barisan gilir sahaja. Semua kandungan video/audio dimainkan melalui pemain benam penyedia pihak ketiga (YouTube) di bawah terma perkhidmatan mereka.'
              : 'Karaoku is solely a session management and queue coordination platform. All video/audio content is played via third-party streaming providers (YouTube) using their embedded players under their terms of service.'}
          </p>
          <p style={{ fontSize: 13, color: '#bbb', lineHeight: 1.7, marginBottom: 0 }}>
            {lang === 'bm'
              ? 'Yuran langganan adalah untuk ciri platform (hosting bilik, pengurusan queue, penyelarasan) sahaja — bukan untuk akses muzik.'
              : 'Subscription fees are for platform features (room hosting, queue management, coordination) only — not for music access.'}
          </p>
        </div>
      </section>

      {/* PRICING PREVIEW */}
      <section style={{ padding: '40px 32px', background: s.dark }}>
        <div style={{ maxWidth: 900, margin: '0 auto', textAlign: 'center' }}>
          <div style={{ fontSize: 11, color: s.redLight, letterSpacing: 2, fontWeight: 800, marginBottom: 8 }}>
            {lang === 'bm' ? 'HARGA PLATFORM' : 'PLATFORM PRICING'}
          </div>
          <h2 style={{ fontSize: 26, fontWeight: 900, marginBottom: 8, letterSpacing: -0.5 }}>
            {lang === 'bm' ? 'Bayar untuk akses platform.' : 'Pay for platform access.'}
          </h2>
          <p style={{ color: '#999', fontSize: 14, marginBottom: 28 }}>
            {lang === 'bm'
              ? 'Yuran untuk hosting & pengurusan sesi. Tiada yuran untuk video.'
              : 'Fees for hosting & session management. No fees for video content.'}
          </p>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 12, maxWidth: 700, margin: '0 auto' }}>
            <PlanCard tier={lang === 'bm' ? 'Sesi Harian' : 'Day Access'} price="RM9" duration={lang === 'bm' ? '24 jam' : '24 hours'} />
            <PlanCard tier={lang === 'bm' ? 'Bulanan' : 'Monthly'} price="RM39" duration={lang === 'bm' ? '30 hari' : '30 days'} highlight />
            <PlanCard tier={lang === 'bm' ? 'Tahunan' : 'Yearly'} price="RM199" duration={lang === 'bm' ? '365 hari' : '365 days'} />
          </div>

          <div style={{ marginTop: 22 }}>
            <Link href="/pricing">
              <Button variant="ghost" size="sm">{lang === 'bm' ? 'Lihat detail harga →' : 'See pricing details →'}</Button>
            </Link>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer
        style={{
          padding: '28px 32px 20px',
          borderTop: `1px solid ${s.gray}`,
          background: '#0a0a0a',
        }}
      >
        <div
          style={{
            maxWidth: 900,
            margin: '0 auto',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
            flexWrap: 'wrap',
            gap: 20,
          }}
        >
          <div style={{ maxWidth: 440 }}>
            <Logo size={28} />
            <p style={{ fontSize: 11, color: '#777', marginTop: 8, lineHeight: 1.6 }}>
              {lang === 'bm'
                ? 'Platform pengurusan sesi & koordinasi queue untuk kumpulan. Kandungan video dimainkan melalui penyedia pihak ketiga (YouTube).'
                : 'Session management & queue coordination platform for groups. Video content plays via third-party providers (YouTube).'}
            </p>
          </div>
          <div style={{ display: 'flex', gap: 18, flexWrap: 'wrap', fontSize: 12 }}>
            <Link href="/terms"><span style={{ color: '#aaa', cursor: 'pointer' }}>{lang === 'bm' ? 'Terma' : 'Terms'}</span></Link>
            <Link href="/privacy"><span style={{ color: '#aaa', cursor: 'pointer' }}>{lang === 'bm' ? 'Privasi' : 'Privacy'}</span></Link>
            <Link href="/pricing"><span style={{ color: '#aaa', cursor: 'pointer' }}>{lang === 'bm' ? 'Harga' : 'Pricing'}</span></Link>
            <a href="mailto:support@karaoku.my" style={{ color: '#aaa' }}>Support</a>
          </div>
        </div>
        <div
          style={{
            maxWidth: 900,
            margin: '20px auto 0',
            paddingTop: 14,
            borderTop: `1px solid ${s.gray}`,
            fontSize: 10,
            color: '#555',
            lineHeight: 1.6,
          }}
        >
          © {new Date().getFullYear()} Karaoku. {lang === 'bm'
            ? 'Karaoku ialah platform pengurusan sesi. Kami tidak edar, jual, atau lesen muzik atau apa-apa kandungan berhak cipta. Pengguna bertanggungjawab terhadap penggunaan kandungan pihak ketiga mengikut undang-undang hak cipta yang berkenaan dan terma perkhidmatan penyedia tersebut.'
            : 'Karaoku is a session management platform. We do not distribute, sell, or license music or any copyrighted content. Users are responsible for their use of third-party content in accordance with applicable copyright laws and the terms of service of those providers.'}
        </div>
      </footer>
    </div>
  )
}

function FeatureCard({ label, title, desc }: { label: string; title: string; desc: string }) {
  return (
    <div
      style={{
        background: '#0a0a0a',
        borderRadius: 12,
        padding: 18,
        border: `1px solid ${s.gray}`,
      }}
    >
      <div style={{ fontSize: 10, color: s.redLight, letterSpacing: 2, fontWeight: 800, marginBottom: 6, fontFamily: 'monospace' }}>
        {label}
      </div>
      <div style={{ fontSize: 15, fontWeight: 800, marginBottom: 4, letterSpacing: -0.2 }}>
        {title}
      </div>
      <div style={{ fontSize: 12, color: '#aaa', lineHeight: 1.5 }}>
        {desc}
      </div>
    </div>
  )
}

function PlanCard({ tier, price, duration, highlight }: { tier: string; price: string; duration: string; highlight?: boolean }) {
  return (
    <div
      style={{
        background: highlight ? '#1a0a0d' : '#0a0a0a',
        borderRadius: 12,
        padding: '18px 14px',
        border: highlight ? `2px solid ${s.red}` : `1px solid ${s.gray}`,
        textAlign: 'left',
        position: 'relative',
      }}
    >
      {highlight && (
        <div
          style={{
            position: 'absolute',
            top: -10,
            left: 14,
            background: s.red,
            color: 'white',
            fontSize: 9,
            fontWeight: 800,
            padding: '3px 10px',
            borderRadius: 100,
            letterSpacing: 1.2,
          }}
        >
          POPULAR
        </div>
      )}
      <div style={{ fontSize: 10, color: s.redLight, letterSpacing: 2, fontWeight: 800, marginBottom: 6 }}>
        {tier.toUpperCase()}
      </div>
      <div style={{ fontSize: 28, fontWeight: 900, letterSpacing: -1 }}>{price}</div>
      <div style={{ fontSize: 11, color: '#888', marginTop: 2 }}>{duration}</div>
    </div>
  )
}
