'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import Button from '@/components/ui/Button'
import { useLang } from '@/lib/i18n/LangProvider'
import { supabase } from '@/lib/supabase/client'
import { s, Party } from '@/types'

export default function DashboardHome() {
  const { t, lang } = useLang()
  const router = useRouter()
  const [stats, setStats] = useState({ parties: 0, songs: 0, minutes: 0 })
  const [parties, setParties] = useState<Party[]>([])
  const [name, setName] = useState('')

  useEffect(() => {
    const load = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      const { data: profile } = await supabase.from('profiles').select('name').eq('id', user.id).single()
      setName(profile?.name || user.email?.split('@')[0] || '')

      const [{ data: partyList }, { count: songCount }] = await Promise.all([
        supabase
          .from('parties')
          .select('*')
          .eq('host_id', user.id)
          .order('created_at', { ascending: false })
          .limit(5),
        supabase
          .from('queue_items')
          .select('id', { count: 'exact', head: true })
          .eq('played', true),
      ])

      setParties(partyList || [])
      setStats({
        parties: partyList?.length || 0,
        songs: songCount || 0,
        minutes: (songCount || 0) * 4, // rough estimate
      })
    }
    load()
  }, [])

  const today = new Date().toLocaleDateString(lang === 'bm' ? 'ms-MY' : 'en-US', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  })

  return (
    <div style={{ padding: 24, maxWidth: 1100, margin: '0 auto' }}>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-end',
          flexWrap: 'wrap',
          gap: 12,
          marginBottom: 20,
        }}
      >
        <div>
          <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)' }}>{today}</div>
          <h1 style={{ fontSize: 26, fontWeight: 900, marginTop: 4, letterSpacing: -0.5 }}>
            {t.dash_welcome(name)} 👋
          </h1>
        </div>
        <Button variant="primary" onClick={() => router.push('/dashboard/parties/new')}>
          + {t.dash_new_party}
        </Button>
      </div>

      {/* Stats */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
          gap: 12,
          marginBottom: 20,
        }}
      >
        <StatCard label={t.dash_parties_hosted} value={stats.parties} color={s.red} />
        <StatCard label={t.dash_songs_sung} value={stats.songs} />
        <StatCard label={t.dash_mic_minutes} value={stats.minutes} />
      </div>

      <div style={{ fontSize: 12, color: s.redLight, letterSpacing: 2, fontWeight: 800, marginBottom: 10 }}>
        {t.dash_recent.toUpperCase()}
      </div>

      {parties.length === 0 ? (
        <div
          style={{
            background: s.dark,
            borderRadius: 14,
            padding: 40,
            textAlign: 'center',
            border: `1px dashed ${s.gray}`,
          }}
        >
          <div style={{ fontSize: 48, marginBottom: 8 }}>🎤</div>
          <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 4 }}>{t.dash_no_parties}</div>
          <div style={{ fontSize: 13, color: '#999', marginBottom: 16 }}>{t.dash_start_first}</div>
          <Button variant="primary" size="sm" onClick={() => router.push('/dashboard/parties/new')}>
            + {t.dash_new_party}
          </Button>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {parties.map((p) => (
            <Link key={p.id} href={`/party/${p.code}`}>
              <div
                style={{
                  background: s.dark,
                  borderRadius: 12,
                  padding: 14,
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  cursor: 'pointer',
                  border: `1px solid ${p.is_active ? s.red + '55' : s.gray}`,
                  gap: 10,
                }}
              >
                <div style={{ minWidth: 0, flex: 1 }}>
                  <div style={{ fontSize: 14, fontWeight: 700, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {p.name}
                  </div>
                  <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)', marginTop: 2 }}>
                    {new Date(p.created_at).toLocaleDateString()} · {p.code}
                  </div>
                </div>
                <span
                  style={{
                    padding: '3px 9px',
                    borderRadius: 100,
                    fontSize: 10,
                    fontWeight: 800,
                    letterSpacing: 1,
                    background: p.is_active ? 'rgba(34,197,94,0.2)' : s.gray,
                    color: p.is_active ? s.green : 'rgba(255,255,255,0.5)',
                  }}
                >
                  {p.is_active ? t.parties_live : t.parties_ended}
                </span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}

function StatCard({ label, value, color }: { label: string; value: number; color?: string }) {
  return (
    <div style={{ background: s.dark, padding: 14, borderRadius: 12 }}>
      <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)' }}>{label}</div>
      <div style={{ fontSize: 24, fontWeight: 900, color: color || 'white', marginTop: 2 }}>{value}</div>
    </div>
  )
}
