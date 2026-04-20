'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Logo from '@/components/ui/Logo'
import Button from '@/components/ui/Button'
import LangToggle from '@/components/ui/LangToggle'
import { useLang } from '@/lib/i18n/LangProvider'
import { supabase } from '@/lib/supabase/client'
import { s, Party } from '@/types'

const FREE_GUEST_LIMIT = 1

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
  const [hostPlan, setHostPlan] = useState<string>('free')
  const [guestCount, setGuestCount] = useState(0)
  const [alreadyJoined, setAlreadyJoined] = useState(false)
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

      if (!data) {
        setNotFound(true)
        setLoading(false)
        return
      }

      setParty(data)

      // Check host's plan + current guest count + if this device already joined
      const fp = getFingerprint()
      const [{ data: hostProfile }, { count }, { data: existingGuest }] = await Promise.all([
        supabase.from('profiles').select('plan').eq('id', data.host_id).single(),
        supabase
          .from('party_guests')
          .select('id', { count: 'exact', head: true })
          .eq('party_id', data.id),
        supabase
          .from('party_guests')
          .select('id')
          .eq('party_id', data.id)
          .eq('fingerprint', fp)
          .maybeSingle(),
      ])

      setHostPlan(hostProfile?.plan || 'free')
      setGuestCount(count || 0)
      setAlreadyJoined(!!existingGuest)
      setLoading(false)
    }

    if (typeof window !== 'undefined') {
      setName(localStorage.getItem('karaoku_guest_name') || '')
    }
    load()
  }, [code])

  const isHostFree = hostPlan === 'free'
  const partyFull = isHostFree && !alreadyJoined && guestCount >= FREE_GUEST_LIMIT

  const join = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!party || !name.trim() || partyFull) return
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
      <div style={{
        minHeight: '100vh', background: s.black, display: 'flex',
        alignItems: 'center', justifyContent: 'center', color: '#666',
      }}>
        {t.loading}
      </div>
    )
  }

  if (notFound) {
    return (
      <div style={{
        minHeight: '100vh', background: s.black, display: 'flex',
        flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
        padding: 20, textAlign: 'center',
      }}>
        <div style={{ fontSize: 48, marginBottom: 12 }}>🔒</div>
        <h1 style={{ fontSize: 22, fontWeight: 900, marginBottom: 8 }}>Party not found</h1>
        <p style={{ color: '#999', fontSize: 14, marginBottom: 20 }}>
          Code {code} doesn&apos;t exist or has ended.
        </p>
        <Button variant="primary" onClick={() => router.push('/join')}>Try again</Button>
      </div>
    )
  }

  // Party full for free host — block 2nd+ guest
  if (partyFull) {
    return (
      <div style={{
        minHeight: '100vh', background: s.black, display: 'flex',
        flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
        padding: 20, textAlign: 'center', position: 'relative',
      }}>
        <div style={{ position: 'absolute', top: 20, right: 20 }}>
          <LangToggle />
        </div>
        <div style={{ maxWidth: 380, width: '100%' }}>
          <div style={{ fontSize: 60, marginBottom: 16 }}>🔒</div>
          <div style={{
            fontSize: 11, letterSpacing: 3, color: s.redLight,
            fontWeight: 800, marginBottom: 8,
          }}>
            PARTY FULL
          </div>
          <h1 style={{ fontSize: 24, fontWeight: 900, marginBottom: 12, letterSpacing: -0.5 }}>
            This party is at the guest limit
          </h1>
          <p style={{ color: '#aaa', fontSize: 14, marginBottom: 8, lineHeight: 1.6 }}>
            The host is on the Free plan, which allows only {FREE_GUEST_LIMIT} guest per party.
          </p>
          <p style={{ color: '#666', fontSize: 12, marginBottom: 24, lineHeight: 1.6 }}>
            Ask the host to upgrade to unlock unlimited guests, songs, and mic time.
          </p>

          <div style={{
            background: s.dark, borderRadius: 12, padding: 16, marginBottom: 14,
            border: `1px solid ${s.gray}`,
          }}>
            <div style={{ fontSize: 11, color: s.redLight, letterSpacing: 2, fontWeight: 800, marginBottom: 4 }}>
              PARTY INFO
            </div>
            <div style={{ fontSize: 14, fontWeight: 700 }}>{party?.name}</div>
            <div style={{ fontSize: 11, color: '#888', marginTop: 2 }}>
              Code: {code} · {guestCount} guest joined
            </div>
          </div>

          <Button variant="ghost" fullWidth onClick={() => router.push('/join')}>
            ← Join another party
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div style={{
      minHeight: '100vh', background: s.black, display: 'flex',
      alignItems: 'center', justifyContent: 'center',
      padding: 20, position: 'relative',
    }}>
      <div style={{ position: 'absolute', top: 20, right: 20 }}>
        <LangToggle />
      </div>

      <form onSubmit={join} style={{ maxWidth: 400, width: '100%', textAlign: 'center' }}>
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 24 }}>
          <Logo size={48} />
        </div>

        <div style={{
          fontSize: 11, letterSpacing: 3, color: s.redLight,
          fontWeight: 800, marginBottom: 6,
        }}>
          {t.joining_party}
        </div>
        <div style={{ fontSize: 28, fontWeight: 900, marginBottom: 2, letterSpacing: 6 }}>
          {code}
        </div>
        <div style={{ fontSize: 14, color: '#999', marginBottom: 20 }}>
          {party?.name} · <span style={{ color: s.green }}>● LIVE</span>
        </div>

        {/* Free demo notice for 1st guest */}
        {isHostFree && !alreadyJoined && (
          <div style={{
            background: 'rgba(251,191,36,0.1)',
            border: '1px solid rgba(251,191,36,0.3)',
            borderRadius: 10,
            padding: 10,
            marginBottom: 16,
            fontSize: 11,
            color: '#fde68a',
            lineHeight: 1.5,
          }}>
            ⚡ <b>Free demo:</b> You can add 1 song to try out Karaoku.
            Host can upgrade for unlimited guests & songs.
          </div>
        )}

        <div style={{ textAlign: 'left', marginBottom: 14 }}>
          <div style={{
            fontSize: 10, color: 'rgba(255,255,255,0.5)',
            letterSpacing: 1.5, marginBottom: 6, fontWeight: 700,
          }}>
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
