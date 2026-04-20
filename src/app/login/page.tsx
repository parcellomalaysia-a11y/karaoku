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

export default function LoginPage() {
  const { t } = useLang()
  const params = useSearchParams()
  const nextPath = params.get('next') || '/dashboard'
  const [email, setEmail] = useState('')
  const [sent, setSent] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleLogin = async (e: React.FormEvent) => {
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
          <form onSubmit={handleLogin}>
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
                autoFocus
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
        )}
      </div>
    </div>
  )
}
