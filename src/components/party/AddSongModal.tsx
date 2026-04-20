'use client'

import { useState, useEffect } from 'react'
import Button from '@/components/ui/Button'
import { useLang } from '@/lib/i18n/LangProvider'
import { s } from '@/types'
import { KARAOKE_LIBRARY, KaraokeSong } from '@/lib/karaoke-library'

interface Props {
  onAdd: (song: KaraokeSong) => void
  onClose: () => void
  onUpgrade: () => void
  atLimit: boolean
  queueLimit: number
}

export default function AddSongModal({ onAdd, onClose, onUpgrade, atLimit, queueLimit }: Props) {
  const { t } = useLang()
  const [q, setQ] = useState('')
  const [results, setResults] = useState<KaraokeSong[]>(KARAOKE_LIBRARY)
  const [searching, setSearching] = useState(false)
  const [useApi, setUseApi] = useState(false)

  useEffect(() => {
    // Check if real YouTube API search is available
    fetch('/api/youtube/search?q=test&probe=1').then(async (r) => {
      const data = await r.json()
      setUseApi(!!data.enabled)
    }).catch(() => setUseApi(false))
  }, [])

  useEffect(() => {
    if (!q.trim()) {
      setResults(KARAOKE_LIBRARY)
      return
    }

    if (useApi) {
      const id = setTimeout(async () => {
        setSearching(true)
        try {
          const r = await fetch(`/api/youtube/search?q=${encodeURIComponent(q + ' karaoke')}`)
          const data = await r.json()
          if (data.items) setResults(data.items)
        } catch {}
        setSearching(false)
      }, 300)
      return () => clearTimeout(id)
    } else {
      // Local filter
      setResults(
        KARAOKE_LIBRARY.filter(
          (s) =>
            s.title.toLowerCase().includes(q.toLowerCase()) ||
            s.artist.toLowerCase().includes(q.toLowerCase())
        )
      )
    }
  }, [q, useApi])

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0,0,0,0.92)',
        zIndex: 100,
        display: 'flex',
        alignItems: 'flex-start',
        justifyContent: 'center',
        padding: 20,
        overflowY: 'auto',
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: s.dark,
          borderRadius: 20,
          padding: 20,
          maxWidth: 700,
          width: '100%',
          marginTop: 40,
          border: `1px solid ${s.gray}`,
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
          <h2 style={{ fontSize: 20, fontWeight: 900 }}>🎵 {t.add_song}</h2>
          <button
            onClick={onClose}
            style={{ background: 'none', border: 'none', color: 'white', fontSize: 28, cursor: 'pointer' }}
            aria-label="Close"
          >
            ×
          </button>
        </div>

        <input
          autoFocus
          placeholder={`🔍  ${t.search_placeholder}`}
          value={q}
          onChange={(e) => setQ(e.target.value)}
          style={{ marginBottom: 12 }}
        />

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
          {results.map((song) => (
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
                  {song.artist} · {song.duration}
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
          ))}
          {!searching && results.length === 0 && (
            <div style={{ padding: 40, textAlign: 'center', color: '#666' }}>{t.no_songs}</div>
          )}
        </div>
      </div>
    </div>
  )
}
