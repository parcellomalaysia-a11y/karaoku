'use client'

import { useState, useEffect } from 'react'
import { useLang } from '@/lib/i18n/LangProvider'
import { supabase } from '@/lib/supabase/client'
import { s, PlayHistoryEntry } from '@/types'

export default function HistoryPage() {
  const { t, lang } = useLang()
  const [history, setHistory] = useState<PlayHistoryEntry[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const load = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      const { data } = await supabase
        .from('play_history')
        .select('*')
        .eq('user_id', user.id)
        .order('played_at', { ascending: false })
        .limit(100)
      setHistory(data || [])
      setLoading(false)
    }
    load()
  }, [])

  // Group by day
  const groups: Record<string, PlayHistoryEntry[]> = {}
  const now = new Date()
  const today = now.toDateString()
  const yesterday = new Date(now.getTime() - 86400000).toDateString()

  history.forEach(h => {
    const d = new Date(h.played_at).toDateString()
    const key = d === today ? t.history_today : d === yesterday ? t.history_yesterday : d
    if (!groups[key]) groups[key] = []
    groups[key].push(h)
  })

  return (
    <div style={{ padding: 24, maxWidth: 900, margin: '0 auto' }}>
      <h1 style={{ fontSize: 24, fontWeight: 900, marginBottom: 14, letterSpacing: -0.5 }}>
        {t.nav_history}
      </h1>

      {loading ? (
        <div style={{ padding: 40, textAlign: 'center', color: '#666' }}>{t.loading}</div>
      ) : history.length === 0 ? (
        <div
          style={{
            background: s.dark,
            borderRadius: 14,
            padding: 50,
            textAlign: 'center',
            border: `1px dashed ${s.gray}`,
          }}
        >
          <div style={{ fontSize: 44, marginBottom: 8 }}>⟲</div>
          <div style={{ fontSize: 14, color: '#999' }}>No history yet</div>
        </div>
      ) : (
        Object.entries(groups).map(([day, entries]) => (
          <div key={day} style={{ marginBottom: 18 }}>
            <div
              style={{
                fontSize: 11,
                color: 'rgba(255,255,255,0.5)',
                letterSpacing: 2,
                fontWeight: 700,
                marginBottom: 6,
              }}
            >
              {day}
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              {entries.map(h => (
                <div
                  key={h.id}
                  style={{
                    background: s.dark,
                    borderRadius: 10,
                    padding: 10,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 10,
                  }}
                >
                  {h.thumb_url && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={h.thumb_url} alt="" style={{ width: 48, height: 28, borderRadius: 3, objectFit: 'cover' }} />
                  )}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 13, fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {h.title}
                    </div>
                    <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)' }}>
                      {h.artist} ·{' '}
                      {new Date(h.played_at).toLocaleTimeString(lang === 'bm' ? 'ms-MY' : 'en-US', {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))
      )}
    </div>
  )
}
