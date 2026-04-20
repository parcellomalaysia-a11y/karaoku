'use client'

import { useState, useEffect, ReactNode } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import Link from 'next/link'
import Logo from '@/components/ui/Logo'
import LangToggle from '@/components/ui/LangToggle'
import { useLang } from '@/lib/i18n/LangProvider'
import { supabase } from '@/lib/supabase/client'
import { s, Profile, ADMIN_EMAILS, PLANS } from '@/types'

interface NavItem {
  href: string
  icon: string
  labelKey: keyof ReturnType<typeof useLang>['t']
  admin?: boolean
}

const NAV: NavItem[] = [
  { href: '/dashboard', icon: '▣', labelKey: 'nav_home' },
  { href: '/dashboard/parties', icon: '♪', labelKey: 'nav_parties' },
  { href: '/dashboard/songs', icon: '♥', labelKey: 'nav_songs' },
  { href: '/dashboard/history', icon: '⟲', labelKey: 'nav_history' },
  { href: '/dashboard/settings', icon: '⚙', labelKey: 'nav_settings' },
]

const ADMIN_NAV: NavItem[] = [
  { href: '/dashboard/admin/promo', icon: '◈', labelKey: 'nav_admin_promo', admin: true },
]

export default function DashboardShell({ children }: { children: ReactNode }) {
  const { t, lang } = useLang()
  const router = useRouter()
  const pathname = usePathname()
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth <= 768)
    check()
    window.addEventListener('resize', check)
    return () => window.removeEventListener('resize', check)
  }, [])

  useEffect(() => {
    let mounted = true
    const load = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        router.push('/login')
        return
      }
      const { data } = await supabase.from('profiles').select('*').eq('id', session.user.id).single()
      if (mounted) {
        setProfile(data)
        setLoading(false)
      }
    }
    load()
    return () => { mounted = false }
  }, [router])

  useEffect(() => { setDrawerOpen(false) }, [pathname])

  const logout = async () => {
    await supabase.auth.signOut()
    router.push('/')
  }

  const isAdmin = profile?.email && ADMIN_EMAILS.includes(profile.email)
  const allNav = [...NAV, ...(isAdmin ? ADMIN_NAV : [])]
  const currentPlan = profile?.plan || 'free'
  const planLabel = lang === 'bm' && 'labelBm' in PLANS[currentPlan]
    ? (PLANS[currentPlan] as any).labelBm
    : PLANS[currentPlan].label

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', background: s.black, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#666' }}>
        {t.loading}
      </div>
    )
  }

  // ========================= DESKTOP =========================
  if (!isMobile) {
    return (
      <div style={{ display: 'flex', minHeight: '100vh', background: s.black }}>
        {/* Sidebar */}
        <aside
          style={{
            width: 210,
            background: '#111',
            display: 'flex',
            flexDirection: 'column',
            padding: '16px 10px',
            borderRight: `1px solid ${s.gray}`,
            position: 'sticky',
            top: 0,
            height: '100vh',
          }}
        >
          <Link href="/dashboard">
            <div style={{ padding: '4px 10px 14px', borderBottom: `1px solid ${s.gray}`, marginBottom: 10 }}>
              <Logo size={30} showSubtitle={false} />
            </div>
          </Link>
          <nav style={{ display: 'flex', flexDirection: 'column', gap: 3, flex: 1 }}>
            {allNav.map((item) => {
              const active = pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href))
              return (
                <Link key={item.href} href={item.href}>
                  <div
                    style={{
                      padding: '9px 12px',
                      borderRadius: 8,
                      fontSize: 13,
                      fontWeight: active ? 700 : 500,
                      color: active ? 'white' : 'rgba(255,255,255,0.7)',
                      background: active ? s.red : 'transparent',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 10,
                      cursor: 'pointer',
                      boxShadow: active ? `0 3px 0 ${s.redDark}` : undefined,
                    }}
                  >
                    <span style={{ fontSize: 14 }}>{item.icon}</span>
                    {t[item.labelKey] as string}
                  </div>
                </Link>
              )
            })}
          </nav>

          {/* Plan card */}
          <div
            style={{
              padding: 12,
              background: `linear-gradient(135deg, ${s.redDark}, ${s.red})`,
              borderRadius: 10,
              marginBottom: 10,
            }}
          >
            <div style={{ fontSize: 10, opacity: 0.85, letterSpacing: 1 }}>PLAN</div>
            <div style={{ fontSize: 13, fontWeight: 800 }}>{planLabel}</div>
            {currentPlan === 'free' && (
              <Link href="/pricing">
                <div style={{ fontSize: 11, marginTop: 6, textDecoration: 'underline', cursor: 'pointer' }}>
                  {t.upgrade} →
                </div>
              </Link>
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
                fontSize: 11,
                padding: '6px 10px',
                borderRadius: 7,
                cursor: 'pointer',
                flex: 1,
              }}
            >
              ↩ {t.nav_logout}
            </button>
          </div>
        </aside>

        <main style={{ flex: 1, minWidth: 0 }}>{children}</main>
      </div>
    )
  }

  // ========================= MOBILE =========================
  return (
    <div style={{ minHeight: '100vh', background: s.black, paddingBottom: 72 }}>
      {/* Top bar */}
      <header
        style={{
          position: 'sticky',
          top: 0,
          zIndex: 20,
          padding: '10px 14px',
          background: s.dark,
          borderBottom: `1px solid ${s.gray}`,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <Link href="/dashboard"><Logo size={28} showSubtitle={false} /></Link>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <div
            style={{
              background: s.gray,
              padding: '4px 8px 4px 4px',
              borderRadius: 100,
              fontSize: 10,
              display: 'flex',
              gap: 6,
              alignItems: 'center',
            }}
          >
            <div
              style={{
                width: 20,
                height: 20,
                borderRadius: '50%',
                background: s.red,
                color: 'white',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 800,
                fontSize: 10,
              }}
            >
              {(profile?.name || profile?.email || 'U')[0].toUpperCase()}
            </div>
            <span style={{ fontWeight: 600 }}>{planLabel}</span>
          </div>
          <button
            onClick={() => setDrawerOpen(true)}
            style={{
              background: 'transparent',
              border: 'none',
              color: 'white',
              fontSize: 20,
              cursor: 'pointer',
              padding: 4,
            }}
            aria-label="Menu"
          >
            ☰
          </button>
        </div>
      </header>

      {/* Drawer */}
      {drawerOpen && (
        <div
          onClick={() => setDrawerOpen(false)}
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.6)',
            zIndex: 30,
          }}
        >
          <aside
            onClick={(e) => e.stopPropagation()}
            className="anim-slide-up"
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              bottom: 0,
              width: '80%',
              maxWidth: 300,
              background: s.dark,
              padding: 16,
              overflowY: 'auto',
              display: 'flex',
              flexDirection: 'column',
            }}
          >
            {/* User card */}
            <div
              style={{
                background: `linear-gradient(135deg, ${s.redDark}, ${s.red})`,
                padding: 14,
                borderRadius: 12,
                marginBottom: 16,
              }}
            >
              <div style={{ display: 'flex', gap: 10, alignItems: 'center', marginBottom: 6 }}>
                <div
                  style={{
                    width: 36,
                    height: 36,
                    borderRadius: '50%',
                    background: 'white',
                    color: s.red,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: 800,
                    fontSize: 15,
                  }}
                >
                  {(profile?.name || profile?.email || 'U')[0].toUpperCase()}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13, fontWeight: 700, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {profile?.name || profile?.email?.split('@')[0]}
                  </div>
                  <div style={{ fontSize: 10, opacity: 0.85, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {profile?.email}
                  </div>
                </div>
              </div>
              <div style={{ fontSize: 11, opacity: 0.9, fontWeight: 600 }}>{planLabel}</div>
            </div>

            <nav style={{ display: 'flex', flexDirection: 'column', gap: 2, flex: 1 }}>
              {allNav.map((item) => {
                const active = pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href))
                return (
                  <Link key={item.href} href={item.href}>
                    <div
                      style={{
                        padding: '12px 10px',
                        borderRadius: 8,
                        fontSize: 14,
                        fontWeight: active ? 700 : 500,
                        color: active ? 'white' : 'rgba(255,255,255,0.75)',
                        background: active ? s.red : 'transparent',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 12,
                      }}
                    >
                      <span style={{ fontSize: 16 }}>{item.icon}</span>
                      {t[item.labelKey] as string}
                    </div>
                  </Link>
                )
              })}
            </nav>

            <div style={{ marginTop: 20, paddingTop: 16, borderTop: `1px solid ${s.gray}`, display: 'flex', flexDirection: 'column', gap: 10 }}>
              <LangToggle />
              <button
                onClick={logout}
                style={{
                  background: 'transparent',
                  border: `1px solid ${s.gray}`,
                  color: 'rgba(255,255,255,0.7)',
                  fontSize: 13,
                  padding: 10,
                  borderRadius: 8,
                  cursor: 'pointer',
                  textAlign: 'left',
                }}
              >
                ↩ {t.nav_logout}
              </button>
            </div>
          </aside>
        </div>
      )}

      <main>{children}</main>

      {/* Bottom nav (always visible on mobile) */}
      <nav
        style={{
          position: 'fixed',
          bottom: 0,
          left: 0,
          right: 0,
          background: s.dark,
          borderTop: `1px solid ${s.gray}`,
          display: 'flex',
          zIndex: 15,
          paddingBottom: 'env(safe-area-inset-bottom)',
        }}
      >
        {NAV.map((item) => {
          const active = pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href))
          return (
            <Link key={item.href} href={item.href} style={{ flex: 1 }}>
              <div
                style={{
                  padding: '10px 4px',
                  textAlign: 'center',
                  fontSize: 10,
                  color: active ? s.red : 'rgba(255,255,255,0.5)',
                  fontWeight: active ? 700 : 500,
                  position: 'relative',
                }}
              >
                {active && (
                  <div
                    style={{
                      position: 'absolute',
                      top: 0,
                      left: '25%',
                      right: '25%',
                      height: 2,
                      background: s.red,
                      borderRadius: 2,
                    }}
                  />
                )}
                <div style={{ fontSize: 18, marginBottom: 2 }}>{item.icon}</div>
                {t[item.labelKey] as string}
              </div>
            </Link>
          )
        })}
      </nav>
    </div>
  )
}
