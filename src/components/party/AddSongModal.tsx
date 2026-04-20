'use client'

import { useState, useEffect } from 'react'
import Button from '@/components/ui/Button'
import { useLang } from '@/lib/i18n/LangProvider'
import { supabase } from '@/lib/supabase/client'
import { s, Favorite } from '@/types'
import { KARAOKE_LIBRARY, KaraokeSong } from '@/lib/karaoke-library'

interface Props {
  onAdd: (song: KaraokeSong) => void
  onClose: () => void
  onUpgrade: () => void
  atLimit: boolean
  queueLimit: number
}

type Tab = 'search' | 'favorites'

export default function AddSongModal({ onAdd, onClose, onUpgrade, atLimit, queueLimit }: Props) {
  const { t } = useLang()
  const [q, setQ] = useState('')
  const [results, setResults] = useState<KaraokeSong[]>(KARAOKE_LIBRARY)
  const [searching, setSearching] = useState(false)
  const [useApi, setUseApi] = useState(false)
  const [favs, setFavs] = useState<Favorite[]>([])
  const [tab, setTab] = useState<Tab>('search')

  useEffect(() => {
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (!user) return
      const { data } = await supabase
        .from('favorites')
        .select('*')
        .eq('user_id', user.id)
        .order('added_at', { ascending: false })
      const list = data || []
      setFavs(list)
      if (list.length > 0) setTab('favorites')
    })
    fetch('/api/youtube/search?q=test&probe=1').then(async r => {
      const d = await r.json()
      setUseApi(!!d.enabled)
    }).catch(() => setUseApi(false))
  }, [])

  useEffect(() => {
    if (!q.trim()) { setResults(KARAOKE_LIBRARY); return }
    if (useApi) {
      const id = setTimeout(async () => {
        setSearching(true)
        try {
          const r = await fetch(`/api/youtube/search?q=${encodeURIComponent(q + ' karaoke')}`)
          const d = await r.json()
          if (d.items) setResults(d.items)
        } catch {}
        setSearching(false)
      }, 300)
      return () => clearTimeout(id)
    } else {
      setResults(KARAOKE_LIBRARY.filter(s =>
        s.title.toLowerCase().includes(q.toLowerCase()) ||
        s.artist.toLowerCase().includes(q.toLowerCase())
      ))
    }
  }, [q, useApi])

  const favSongs: KaraokeSong[] = favs.map(f => ({
    id: f.video_id,
    title: f.title,
    artist: f.artist || '',
    duration: '',
    thumb: f.thumb_url || '',
  }))

  const filteredFavs = q.trim()
    ? favSongs.filter(s =>
        s.title.toLowerCase().includes(q.toLowerCase()) ||
        s.artist.toLowerCase().includes(q.toLowerCase())
      )
    : favSongs

  const displayList = tab === 'favorites' ? filteredFavs : results

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.92)', zIndex: 100,
        display: 'flex', alignItems: 'flex-start', justifyContent: 'center', padding: 20, overflowY: 'auto',
      }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          background: s.dark, borderRadius: 20, padding: 20, maxWidth: 700, width: '100%',
          marginTop: 40, border: `1px solid ${s.gray}`,
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
          <h2 style={{ fontSize: 20, fontWeight: 900 }}>🎵 {t.add_song}</h2>
          <button
            onClick={onClose}
            style={{ background: 'none', border: 'none', color: 'white', fontSize: 28, cursor: 'pointer' }}
            aria-label="Close"
          >×</button>
        </div>

        <input
          autoFocus
          placeholder={`🔍  ${tab === 'favorites' ? 'Search your favorites...' : t.search_placeholder}`}
          value={q}
          onChange={e => setQ(e.target.value)}
          style={{ marginBottom: 12 }}
        />

        <div style={{ display: 'flex', gap: 6, marginBottom: 12 }}>
          <button
            onClick={() => setTab('search')}
            style={{
              flex: 1,
              padding: '10px 14px',
              background: tab === 'search' ? s.red : s.gray,
              color: 'white',
              border: 'none',
              borderRadius: 10,
              fontSize: 13,
              fontWeight: 700,
              cursor: 'pointer',
              boxShadow: tab === 'search' ? `0 3px 0 ${s.redDark}` : 'none',
            }}
          >
            🔍 YouTube
          </button>
          <button
            onClick={() => setTab('favorites')}
            style={{
              flex: 1,
              padding: '10px 14px',
              background: tab === 'favorites' ? s.red : s.gray,
              color: 'white',
              border: 'none',
              borderRadius: 10,
              fontSize: 13,
              fontWeight: 700,
              cursor: 'pointer',
              boxShadow: tab === 'favorites' ? `0 3px 0 ${s.redDark}` : 'none',
            }}
          >
            ♥ Favorites ({favs.length})
          </button>
        </div>

        {atLimit && (
          <div
            style={{
              background: 'rgba(230,0,18,0.15)',
              border: `1px solid ${s.red}`,
              padding: 12,
              borderRadius: 10,
              marginBottom: 12,
              fontSize: 13,
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              gap: 10,
            }}
          >
            <span>🔒 {t.queue_limit(queueLimit)}</span>
            <Button variant="primary" size="sm" onClick={onUpgrade}>
              {t.upgrade}
            </Button>
          </div>
        )}

        {searching && (
          <div style={{ textAlign: 'center', padding: 20, color: '#999', fontSize: 13 }}>
            {t.loading}
          </div>
        )}

        <div style={{ maxHeight: '55vh', overflowY: 'auto' }}>
          {displayList.length === 0 ? (
            <div style={{ padding: 40, textAlign: 'center', color: '#666', fontSize: 13 }}>
              {tab === 'favorites'
                ? 'No favorites yet. Save songs from /dashboard/songs by tapping ♡'
                : t.no_songs}
            </div>
          ) : (
            displayList.map(song => (
              <div
                key={song.id}
                style={{
                  display: 'flex',
                  gap: 12,
                  padding: 10,
                  borderRadius: 10,
                  marginBottom: 6,
                  background: s.gray,
                  alignItems: 'center',
                  opacity: atLimit ? 0.5 : 1,
                }}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={song.thumb}
                  alt=""
                  style={{ width: 80, height: 45, borderRadius: 6, objectFit: 'cover', flexShrink: 0 }}
                />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div
                    style={{
                      fontWeight: 700,
                      fontSize: 14,
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {song.title}
                  </div>
                  <div style={{ fontSize: 12, color: '#999' }}>
                    {song.artist}{song.duration ? ` · ${song.duration}` : ''}
                  </div>
                </div>
                <Button
                  variant="primary"
                  size="sm"
                  disabled={atLimit}
                  onClick={() => {
                    onAdd(song)
                    onClose()
                  }}
                >
                  + {t.add}
                </Button>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}
