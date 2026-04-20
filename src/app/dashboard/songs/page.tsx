'use client'

import { useState, useEffect } from 'react'
import { useLang } from '@/lib/i18n/LangProvider'
import { supabase } from '@/lib/supabase/client'
import { s, Favorite } from '@/types'

export default function SongsPage() {
  const { t } = useLang()
  const [favs, setFavs] = useState<Favorite[]>([])
  const [q, setQ] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const load = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      const { data } = await supabase
        .from('favorites')
        .select('*')
        .eq('user_id', user.id)
        .order('added_at', { ascending: false })
      setFavs(data || [])
      setLoading(false)
    }
    load()
  }, [])

  const unfav = async (id: string) => {
    await supabase.from('favorites').delete().eq('id', id)
    setFavs(favs.filter(f => f.id !== id))
  }

  const filtered = favs.filter(
    f => !q || f.title.toLowerCase().includes(q.toLowerCase()) || (f.artist || '').toLowerCase().includes(q.toLowerCase())
  )

  return (
    <div style={{ padding: 24, maxWidth: 900, margin: '0 auto' }}>
      <h1 style={{ fontSize: 24, fontWeight: 900, marginBottom: 14, letterSpacing: -0.5 }}>
        {t.nav_songs}
      </h1>
      <input
        placeholder={`🔍  ${t.fav_search}`}
        value={q}
        onChange={(e) => setQ(e.target.value)}
        style={{ marginBottom: 14 }}
      />

      {loading ? (
        <div style={{ padding: 40, textAlign: 'center', color: '#666' }}>{t.loading}</div>
      ) : filtered.length === 0 ? (
        <div
          style={{
            background: s.dark,
            borderRadius: 14,
            padding: 50,
            textAlign: 'center',
            border: `1px dashed ${s.gray}`,
          }}
        >
          <div style={{ fontSize: 44, marginBottom: 8 }}>♥</div>
          <div style={{ fontSize: 14, color: '#999' }}>{t.fav_empty}</div>
        </div>
      ) : (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
            gap: 8,
          }}
        >
          {filtered.map((f) => (
            <div
              key={f.id}
              style={{
                background: s.dark,
                padding: 10,
                borderRadius: 10,
                display: 'flex',
                gap: 10,
                alignItems: 'center',
              }}
            >
              {f.thumb_url && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={f.thumb_url} alt="" style={{ width: 60, height: 34, borderRadius: 4, objectFit: 'cover' }} />
              )}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 13, fontWeight: 700, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {f.title}
                </div>
                <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)' }}>{f.artist}</div>
              </div>
              <button
                onClick={() => unfav(f.id)}
                title={t.remove}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: s.red,
                  fontSize: 18,
                  cursor: 'pointer',
                  padding: 4,
                }}
              >
                ♥
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
