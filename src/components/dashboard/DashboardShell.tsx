'use client'

import { useState, useEffect } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import Link from 'next/link'
import Logo from '@/components/ui/Logo'
import LangToggle from '@/components/ui/LangToggle'
import UpgradeButton from '@/components/ui/UpgradeButton'
import { useLang } from '@/lib/i18n/LangProvider'
import { supabase } from '@/lib/supabase/client'
import { s, PLANS, Profile, ADMIN_EMAILS } from '@/types'

const NAV = [
  { href: '/dashboard', icon: '🏠', key: 'nav_home' as const },
  { href: '/dashboard/parties', icon: '🎤', key: 'nav_parties' as const },
  { href: '/dashboard/songs', icon: '♪', key: 'nav_songs' as const },
  { href: '/dashboard/history', icon: '📜', key: 'nav_history' as const },
  { href: '/dashboard/settings', icon: '⚙️', key: 'nav_settings' as const },
]

export default function DashboardShell({ children }: { children: React.ReactNode }) {
  const { t, lang } = useLang()
  const path = usePathname()
  const router = useRouter()
  const [profile, setProfile] = useState<Profile | null>(null)
  const [drawerOpen, setDrawerOpen] = useState(false)

  useEffect(() => {
    const load = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/login')
        return
      }
      const { data } = await supabase.from('profiles').select('*').eq('id', user.id).single()
      setProfile(data)
    }
    load()
  }, [router])

  // Close drawer when route changes
  useEffect(() => {
    setDrawerOpen(false)
  }, [path])

  const logout = async () => {
    await supabase.auth.signOut()
    router.push('/')
  }

  const isAdmin = profile?.email && ADMIN_EMAILS.includes(profile.email)
  const currentPlan = profile?.plan || 'free'
  const planLabel = lang === 'bm' && 'labelBm' in PLANS[currentPlan]
    ? (PLANS[currentPlan] as any).labelBm
    : PLANS[currentPlan].label

  const SidebarContent = () => (
    <>
      <div style={{ padding: 18, borderBottom: `1px solid ${s.gray}` }}>
        <Logo size={32} />
      </div>

      <nav style={{ padding: 10, flex: 1 }}>
        {NAV.map((item) => {
          const active = path === item.href
          return (
            <Link key={item.href} href={item.href}>
              <div
                className={active ? '' : 'kr-nav-hover'}
                style={{
                  padding: '10px 12px',
                  borderRadius: 10,
                  marginBottom: 4,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12,
                  fontSize: 14,
                  fontWeight: active ? 800 : 600,
                  background: active ? s.red : 'transparent',
                  color: active ? 'white' : 'rgba(255,255,255,0.75)',
                  cursor: 'pointer',
                  transition: 'background 0.15s',
                }}
              >
                <span style={{ fontSize: 16 }}>{item.icon}</span>
                {t[item.key]}
              </div>
            </Link>
          )
        })}
        {isAdmin && (
          <Link href="/dashboard/admin/promo">
            <div
              style={{
                padding: '10px 12px',
                borderRadius: 10,
                marginBottom: 4,
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                fontSize: 14,
                fontWeight: path === '/dashboard/admin/promo' ? 800 : 600,
                background: path === '/dashboard/admin/promo' ? s.red : 'transparent',
                color: path === '/dashboard/admin/promo' ? 'white' : s.redLight,
                cursor: 'pointer',
              }}
            >
              <span style={{ fontSize: 16 }}>🔑</span>
              Admin
            </div>
          </Link>
        )}
      </nav>

      <style>{`
        .kr-nav-hover:hover { background: ${s.gray} !important; color: white !important; }
      `}</style>

      <div style={{ padding: 10, borderTop: `1px solid ${s.gray}` }}>
        {profile && (
          <div
            style={{
              padding: 10,
              borderRadius: 10,
              background: s.dark,
              marginBottom: 10,
              fontSize: 12,
            }}
          >
            <div style={{ fontWeight: 700, color: 'white' }}>
              {profile.name || profile.email?.split('@')[0]}
            </div>
            <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: 10 }}>
              {profile.email}
            </div>
          </div>
        )}
        <div
          style={{
            padding: 12,
            background: `linear-gradient(135deg, ${s.redDark}, ${s.red})`,
            borderRadius: 10,
            marginBottom: 10,
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            gap: 8,
          }}
        >
          <div>
            <div style={{ fontSize: 10, opacity: 0.85, letterSpacing: 1 }}>PLAN</div>
            <div style={{ fontSize: 13, fontWeight: 800 }}>{planLabel}</div>
          </div>
          {currentPlan === 'free' && (
            <UpgradeButton
              currentPlan={currentPlan}
              label="Upgrade"
              style={{
                background: 'rgba(255,255,255,0.15)',
                color: 'white',
                borderColor: 'rgba(255,255,255,0.4)',
              }}
            />
          )}
        </div>

        {/* Footer controls */}
        <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
          <LangToggle compact />
          <button
            onClick={logout}
            style={{
              background: 'transparent',
              border: `1px solid ${s.gray}`,
              color: 'rgba(255,255,255,0.6)',
              padding: '6px 10px',
              borderRadius: 7,
              fontSize: 11,
              cursor: 'pointer',
              fontWeight: 600,
              flex: 1,
            }}
          >
            {t.logout}
          </button>
        </div>
      </div>
    </>
  )

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: s.black }}>
      {/* DESKTOP SIDEBAR */}
      <aside
        className="kr-sidebar"
        style={{
          width: 240,
          background: '#0F0F0F',
          borderRight: `1px solid ${s.gray}`,
          display: 'flex',
          flexDirection: 'column',
          position: 'sticky',
          top: 0,
          height: '100vh',
        }}
      >
        <SidebarContent />
      </aside>

      {/* MOBILE DRAWER */}
      {drawerOpen && (
        <>
          <div
            onClick={() => setDrawerOpen(false)}
            style={{
              position: 'fixed',
              inset: 0,
              background: 'rgba(0,0,0,0.6)',
              zIndex: 50,
            }}
          />
          <aside
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              bottom: 0,
              width: 260,
              background: '#0F0F0F',
              zIndex: 51,
              display: 'flex',
              flexDirection: 'column',
            }}
          >
            <SidebarContent />
          </aside>
        </>
      )}

      {/* MAIN */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
        {/* Mobile top bar */}
        <header
          className="kr-mobile-header"
          style={{
            display: 'none',
            padding: '12px 16px',
            background: '#0F0F0F',
            borderBottom: `1px solid ${s.gray}`,
            alignItems: 'center',
            justifyContent: 'space-between',
            position: 'sticky',
            top: 0,
            zIndex: 40,
          }}
        >
          <button
            onClick={() => setDrawerOpen(true)}
            aria-label="Menu"
            style={{
              background: 'transparent',
              border: 'none',
              color: 'white',
              fontSize: 22,
              cursor: 'pointer',
              padding: 0,
            }}
          >
            ☰
          </button>
          <Logo size={26} showSubtitle={false} />
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            {currentPlan === 'free' && <UpgradeButton currentPlan={currentPlan} />}
            <LangToggle compact />
          </div>
        </header>

        <main style={{ flex: 1 }}>{children}</main>

        {/* Bottom tab nav — mobile only */}
        <nav
          className="kr-bottom-nav"
          style={{
            display: 'none',
            background: '#0F0F0F',
            borderTop: `1px solid ${s.gray}`,
            padding: '6px 4px',
            position: 'sticky',
            bottom: 0,
            justifyContent: 'space-around',
            zIndex: 40,
          }}
        >
          {NAV.map((item) => {
            const active = path === item.href
            return (
              <Link key={item.href} href={item.href}>
                <div
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    padding: '6px 10px',
                    color: active ? s.red : 'rgba(255,255,255,0.5)',
                    fontSize: 18,
                    gap: 2,
                    cursor: 'pointer',
                    borderRadius: 8,
                  }}
                >
                  <span>{item.icon}</span>
                  <span style={{ fontSize: 9, fontWeight: 700, letterSpacing: 0.5 }}>
                    {t[item.key]}
                  </span>
                </div>
              </Link>
            )
          })}
        </nav>

        <style>{`
          @media (max-width: 900px) {
            .kr-sidebar { display: none !important; }
            .kr-mobile-header { display: flex !important; }
            .kr-bottom-nav { display: flex !important; }
          }
        `}</style>
      </div>
    </div>
  )
}
