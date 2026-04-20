'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Logo from '@/components/ui/Logo'
import Button from '@/components/ui/Button'
import LangToggle from '@/components/ui/LangToggle'
import { useLang } from '@/lib/i18n/LangProvider'
import { supabase } from '@/lib/supabase/client'
import { s, Party } from '@/types'

function getFingerprint(): string {
  if (typeof window === 'undefined') return ''
  let fp = localStorage.getItem('karaoku_fp')
  if (!fp) {
    fp = 'g_' + Math.random().toString(36).slice(2, 12) + '_' + Date.now().toString(36)
    localStorage.setItem('karaoku_fp', fp)
  }
  return fp
}

export default function GuestJoin({ code }: { code: string }) {
  const { t } = useLang()
  const router = useRouter()
  const [party, setParty] = useState<Party | null>(null)
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)
  const [name, setName] = useState('')
  const [joining, setJoining] = useState(false)

  useEffect(() => {
    const load = async () => {
      const { data } = await supabase
        .from('parties')
        .select('*')
        .eq('code', code)
        .eq('is_active', true)
        .single()
      if (!data) setNotFound(true)
      else setParty(data)
      setLoading(false)
    }

    // Pre-fill name if returning guest
    if (typeof window !== 'undefined') {
      setName(localStorage.getItem('karaoku_guest_name') || '')
    }
    load()
  }, [code])

  const join = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!party || !name.trim()) return
    setJoining(true)
    const fp = getFingerprint()
    localStorage.setItem('karaoku_guest_name', name.trim())

    await supabase.from('party_guests').upsert(
      {
        party_id: party.id,
        name: name.trim(),
        fingerprint: fp,
      },
      { onConflict: 'party_id,fingerprint' }
    )

    router.push(`/e/${code}`)
  }

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', background: s.black, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#666' }}>
        {t.loading}
      </div>
    )
  }

  if (notFound) {
    return (
      <div style={{ minHeight: '100vh', background: s.black, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 20, textAlign: 'center' }}>
        <div style={{ fontSize: 48, marginBottom: 12 }}>🔒</div>
        <h1 style={{ fontSize: 22, fontWeight: 900, marginBottom: 8 }}>Party not found</h1>
        <p style={{ color: '#999', fontSize: 14, marginBottom: 20 }}>
          Code {code} doesn&apos;t exist or has ended.
        </p>
        <Button variant="primary" onClick={() => router.push('/join')}>Try again</Button>
      </div>
    )
  }

  return (
    <div
      style={{
        minHeight: '100vh',
        background: s.black,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 20,
        position: 'relative',
      }}
    >
      <div style={{ position: 'absolute', top: 20, right: 20 }}>
        <LangToggle />
      </div>

      <form onSubmit={join} style={{ maxWidth: 400, width: '100%', textAlign: 'center' }}>
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 24 }}>
          <Logo size={48} />
        </div>

        <div
          style={{
            fontSize: 11,
            letterSpacing: 3,
            color: s.redLight,
            fontWeight: 800,
            marginBottom: 6,
          }}
        >
          {t.joining_party}
        </div>
        <div style={{ fontSize: 28, fontWeight: 900, marginBottom: 2, letterSpacing: 6 }}>{code}</div>
        <div style={{ fontSize: 14, color: '#999', marginBottom: 20 }}>
          {party?.name} · <span style={{ color: s.green }}>● LIVE</span>
        </div>

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
            {t.join_name_label.toUpperCase()}
          </div>
          <input
            autoFocus
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Ali"
            maxLength={30}
          />
        </div>

        <Button type="submit" variant="primary" size="lg" fullWidth disabled={joining || !name.trim()}>
          {joining ? t.loading : t.join_party_btn}
        </Button>
      </form>
    </div>
  )
}
