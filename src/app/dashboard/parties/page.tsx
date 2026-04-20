'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import Button from '@/components/ui/Button'
import { useLang } from '@/lib/i18n/LangProvider'
import { supabase } from '@/lib/supabase/client'
import { s, Party } from '@/types'

export default function PartiesPage() {
  const { t } = useLang()
  const router = useRouter()
  const [parties, setParties] = useState<Party[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const load = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      const { data } = await supabase
        .from('parties')
        .select('*')
        .eq('host_id', user.id)
        .order('created_at', { ascending: false })
      setParties(data || [])
      setLoading(false)
    }
    load()
  }, [])

  return (
    <div style={{ padding: 24, maxWidth: 1100, margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 }}>
        <h1 style={{ fontSize: 24, fontWeight: 900, letterSpacing: -0.5 }}>{t.parties_title}</h1>
        <Button variant="primary" size="sm" onClick={() => router.push('/dashboard/parties/new')}>
          + {t.parties_new}
        </Button>
      </div>

      {loading ? (
        <div style={{ padding: 40, textAlign: 'center', color: '#666' }}>{t.loading}</div>
      ) : parties.length === 0 ? (
        <div
          style={{
            background: s.dark,
            borderRadius: 14,
            padding: 60,
            textAlign: 'center',
            border: `1px dashed ${s.gray}`,
          }}
        >
          <div style={{ fontSize: 56, marginBottom: 10 }}>🎤</div>
          <div style={{ fontSize: 16, fontWeight: 700, marginBottom: 4 }}>{t.dash_no_parties}</div>
          <div style={{ fontSize: 13, color: '#999', marginBottom: 18 }}>{t.dash_start_first}</div>
          <Button variant="primary" onClick={() => router.push('/dashboard/parties/new')}>
            + {t.parties_new}
          </Button>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {parties.map((p) => (
            <div
              key={p.id}
              style={{
                background: s.dark,
                borderRadius: 12,
                padding: 14,
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                border: `1px solid ${p.is_active ? s.red + '55' : s.gray}`,
              }}
            >
              <div
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: 10,
                  background: p.is_active
                    ? `linear-gradient(135deg, ${s.redDark}, ${s.red})`
                    : s.gray,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 20,
                  flexShrink: 0,
                }}
              >
                ♪
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 14, fontWeight: 700, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {p.name}
                </div>
                <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)', marginTop: 2 }}>
                  {t.parties_code(p.code)} · {new Date(p.created_at).toLocaleDateString()}
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
              <Link href={`/party/${p.code}`}>
                <Button variant="ghost" size="sm">{t.parties_open}</Button>
              </Link>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
