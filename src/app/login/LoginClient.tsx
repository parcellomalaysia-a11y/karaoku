'use client'

import { useState } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import Logo from '@/components/ui/Logo'
import Button from '@/components/ui/Button'
import LangToggle from '@/components/ui/LangToggle'
import { useLang } from '@/lib/i18n/LangProvider'
import { supabase } from '@/lib/supabase/client'
import { s } from '@/types'

export default function LoginClient() {
  const { t } = useLang()
  const params = useSearchParams()
  const nextPath = params.get('next') || '/dashboard'
  const [email, setEmail] = useState('')
  const [sent, setSent] = useState(false)
  const [loading, setLoading] = useState(false)
  const [googleLoading, setGoogleLoading] = useState(false)
  const [error, setError] = useState('')

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email.trim()) return
    setLoading(true)
    setError('')
    const { error: authError } = await supabase.auth.signInWithOtp({
      email: email.trim(),
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(nextPath)}`,
      },
    })
    setLoading(false)
    if (authError) setError(t.login_error)
    else setSent(true)
  }

  const handleGoogleLogin = async () => {
    setGoogleLoading(true)
    setError('')
    const { error: authError } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(nextPath)}`,
      },
    })
    if (authError) {
      setError(t.login_error)
      setGoogleLoading(false)
    }
  }

  return (
    <div
      style={{
        minHeight: '100vh',
        background: s.black,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 20,
        position: 'relative',
      }}
    >
      <div style={{ position: 'absolute', top: 20, right: 20 }}>
        <LangToggle />
      </div>

      <div style={{ maxWidth: 440, width: '100%', textAlign: 'center' }}>
        <Link href="/">
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 28 }}>
            <Logo size={56} />
          </div>
        </Link>

        <div
          style={{
            fontSize: 11,
            color: s.redLight,
            letterSpacing: 3,
            fontWeight: 800,
            marginBottom: 4,
          }}
        >
          {t.login_welcome}
        </div>
        <h1 style={{ fontSize: 28, fontWeight: 900, marginBottom: 24, letterSpacing: -1 }}>
          {t.login_title}
        </h1>

        {sent ? (
          <div
            style={{
              background: 'rgba(34,197,94,0.15)',
              border: `1px solid ${s.green}`,
              borderRadius: 12,
              padding: 20,
              fontSize: 14,
              color: '#a7f3d0',
            }}
          >
            ✉️ {t.login_sent}
          </div>
        ) : (
          <>
            {/* Google button — chunky white variant */}
            <button
              onClick={handleGoogleLogin}
              disabled={googleLoading}
              style={{
                width: '100%',
                padding: '14px 20px',
                background: 'white',
                color: '#1a1a1a',
                border: '2px solid rgba(0,0,0,0.08)',
                borderRadius: 12,
                fontWeight: 700,
                fontSize: 15,
                cursor: googleLoading ? 'not-allowed' : 'pointer',
                opacity: googleLoading ? 0.6 : 1,
                boxShadow: '0 6px 0 #ccc',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 10,
                transition: 'transform 0.1s, box-shadow 0.1s',
                fontFamily: 'inherit',
                marginBottom: 16,
              }}
              onMouseDown={(e) => {
                if (googleLoading) return
                e.currentTarget.style.transform = 'translateY(4px)'
                e.currentTarget.style.boxShadow = '0 2px 0 #ccc'
              }}
              onMouseUp={(e) => {
                if (googleLoading) return
                e.currentTarget.style.transform = 'translateY(0)'
                e.currentTarget.style.boxShadow = '0 6px 0 #ccc'
              }}
              onMouseLeave={(e) => {
                if (googleLoading) return
                e.currentTarget.style.transform = 'translateY(0)'
                e.currentTarget.style.boxShadow = '0 6px 0 #ccc'
              }}
            >
              <svg width="18" height="18" viewBox="0 0 48 48">
                <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
                <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
                <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
                <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
              </svg>
              {googleLoading ? t.loading : 'Continue with Google'}
            </button>

            {/* Divider */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                margin: '18px 0',
                color: 'rgba(255,255,255,0.4)',
                fontSize: 11,
                letterSpacing: 1.5,
                fontWeight: 700,
              }}
            >
              <div style={{ flex: 1, height: 1, background: s.gray }} />
              OR
              <div style={{ flex: 1, height: 1, background: s.gray }} />
            </div>

            <form onSubmit={handleEmailLogin}>
              <div style={{ textAlign: 'left', marginBottom: 14 }}>
                <div
                  style={{
                    fontSize: 10,
                    color: 'rgba(255,255,255,0.5)',
                    letterSpacing: 1.5,
                    marginBottom: 6,
                    fontWeight: 700,
                  }}
                >
                  {t.login_email.toUpperCase()}
                </div>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@email.com"
                />
              </div>
              {error && (
                <div
                  style={{
                    background: 'rgba(230,0,18,0.15)',
                    border: `1px solid ${s.red}`,
                    borderRadius: 8,
                    padding: 10,
                    fontSize: 13,
                    marginBottom: 12,
                    color: s.redLight,
                  }}
                >
                  {error}
                </div>
              )}
              <Button type="submit" variant="primary" size="lg" fullWidth disabled={loading}>
                {loading ? t.loading : t.login_send}
              </Button>
              <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', marginTop: 14 }}>
                {t.login_hint}
              </div>
            </form>
          </>
        )}
      </div>
    </div>
  )
}