'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Button from '@/components/ui/Button'
import { useLang } from '@/lib/i18n/LangProvider'
import { supabase } from '@/lib/supabase/client'
import { s, PLANS } from '@/types'

const FREE_PARTY_LIMIT = 2

function randomCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  let out = ''
  for (let i = 0; i < 6; i++) out += chars[Math.floor(Math.random() * chars.length)]
  return out
}

export default function NewPartyPage() {
  const { t } = useLang()
  const router = useRouter()
  const [name, setName] = useState('')
  const [type, setType] = useState('birthday')
  const [creating, setCreating] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)
  const [plan, setPlan] = useState<string>('free')
  const [partyCount, setPartyCount] = useState(0)

  useEffect(() => {
    const load = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/login')
        return
      }
      const [{ data: profile }, { count }] = await Promise.all([
        supabase.from('profiles').select('plan').eq('id', user.id).single(),
        supabase
          .from('parties')
          .select('id', { count: 'exact', head: true })
          .eq('host_id', user.id),
      ])
      setPlan(profile?.plan || 'free')
      setPartyCount(count || 0)
      setLoading(false)
    }
    load()
  }, [router])

  const types = [
    { id: 'birthday', label: t.new_party_type_birthday },
    { id: 'office', label: t.new_party_type_office },
    { id: 'reunion', label: t.new_party_type_reunion },
    { id: 'wedding', label: t.new_party_type_wedding },
    { id: 'other', label: t.new_party_type_other },
  ]

  const isFree = plan === 'free'
  const blocked = isFree && partyCount >= FREE_PARTY_LIMIT

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim() || blocked) return
    setCreating(true)
    setError('')
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      router.push('/login')
      return
    }

    let code = ''
    for (let i = 0; i < 5; i++) {
      code = randomCode()
      const { data: existing } = await supabase.from('parties').select('id').eq('code', code).single()
      if (!existing) break
    }

    const { data, error: insertError } = await supabase
      .from('parties')
      .insert({
        host_id: user.id,
        code,
        name: name.trim(),
        party_type: type,
        is_active: true,
      })
      .select()
      .single()

    if (insertError || !data) {
      setError(insertError?.message || 'Failed to create')
      setCreating(false)
      return
    }

    router.push(`/party/${code}`)
  }

  if (loading) {
    return <div style={{ padding: 40, textAlign: 'center', color: '#666' }}>{t.loading}</div>
  }

  // BLOCKED: free user hit 2-party limit
  if (blocked) {
    return (
      <div style={{ padding: 24, maxWidth: 500, margin: '40px auto', textAlign: 'center' }}>
        <div style={{ fontSize: 64, marginBottom: 16 }}>🔒</div>
        <div
          style={{
            fontSize: 11,
            color: s.redLight,
            letterSpacing: 2,
            fontWeight: 800,
            marginBottom: 6,
          }}
        >
          LIMIT REACHED
        </div>
        <h1 style={{ fontSize: 26, fontWeight: 900, marginBottom: 10, letterSpacing: -0.5 }}>
          You've used your {FREE_PARTY_LIMIT} free parties
        </h1>
        <p style={{ color: '#aaa', fontSize: 15, marginBottom: 24, lineHeight: 1.6 }}>
          Free accounts can create up to {FREE_PARTY_LIMIT} parties. Upgrade to unlock unlimited
          parties, unlimited mic, party mode, and QR invites.
        </p>
        <Link href="/pricing">
          <Button variant="primary" size="lg" fullWidth>
            ⚡ Upgrade now →
          </Button>
        </Link>
        <div style={{ marginTop: 10 }}>
          <Link href="/dashboard">
            <Button variant="ghost" fullWidth>
              ← Back to dashboard
            </Button>
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div style={{ padding: 24, maxWidth: 560, margin: '0 auto' }}>
      <div
        style={{
          fontSize: 11,
          color: s.redLight,
          letterSpacing: 2,
          fontWeight: 800,
          marginBottom: 6,
        }}
      >
        {t.new_party_badge}
      </div>
      <h1 style={{ fontSize: 28, fontWeight: 900, marginBottom: 20, letterSpacing: -0.5 }}>
        {t.new_party_title}
      </h1>

      {/* Free tier banner */}
      {isFree && (
        <div
          style={{
            background: 'rgba(230,0,18,0.1)',
            border: `1px solid ${s.red}55`,
            borderRadius: 10,
            padding: 12,
            marginBottom: 14,
            fontSize: 13,
          }}
        >
          <strong>Free plan:</strong> {partyCount} of {FREE_PARTY_LIMIT} parties used ·
          Each party limited to 3 songs. <Link href="/pricing" style={{ color: s.redLight, textDecoration: 'underline' }}>Upgrade for unlimited</Link>
        </div>
      )}

      <form onSubmit={handleCreate}>
        <div style={{ background: s.dark, borderRadius: 12, padding: 14, marginBottom: 10 }}>
          <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.5)', letterSpacing: 1.5, marginBottom: 6, fontWeight: 700 }}>
            {t.new_party_name}
          </div>
          <input
            autoFocus
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder={t.new_party_name_ph}
          />
        </div>

        <div style={{ background: s.dark, borderRadius: 12, padding: 14, marginBottom: 10 }}>
          <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.5)', letterSpacing: 1.5, marginBottom: 8, fontWeight: 700 }}>
            {t.new_party_type}
          </div>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            {types.map((tp) => (
              <button
                key={tp.id}
                type="button"
                onClick={() => setType(tp.id)}
                style={{
                  padding: '8px 14px',
                  background: type === tp.id ? s.red : s.gray,
                  color: 'white',
                  borderRadius: 100,
                  fontSize: 12,
                  fontWeight: 700,
                  border: 'none',
                  cursor: 'pointer',
                  boxShadow: type === tp.id ? `0 3px 0 ${s.redDark}` : 'none',
                }}
              >
                {tp.label}
              </button>
            ))}
          </div>
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

        <Button type="submit" variant="primary" size="lg" fullWidth disabled={creating}>
          {creating ? t.loading : t.new_party_submit}
        </Button>
      </form>
    </div>
  )
}