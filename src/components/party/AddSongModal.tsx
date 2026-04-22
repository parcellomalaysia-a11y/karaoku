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
  const [results, setResults] = useState<KaraokeSong[]>([])
  const [searching, setSearching] = useState(false)
  const [useApi, setUseApi] = useState(false)
  const [apiError, setApiError] = useState(false)

  useEffect(() => {
    fetch('/api/youtube/search?q=test&probe=1').then(async (r) => {
      const data = await r.json()
      setUseApi(!!data.enabled)
    }).catch(() => setUseApi(false))
  }, [])

  useEffect(() => {
    if (!q.trim()) {
      setResults([])
      setApiError(false)
      return
    }

    if (useApi) {
      const id = setTimeout(async () => {
        setSearching(true)
        setApiError(false)
        try {
          // Pass user's query VERBATIM. No keyword injection.
          const r = await fetch(`/api/youtube/search?q=${encodeURIComponent(q)}`)
          const data = await r.json()
          if (data.items) {
            setResults(data.items)
          } else {
            setResults([])
          }
        } catch {
          setApiError(true)
          setResults([])
        }
        setSearching(false)
      }, 300)
      return () => clearTimeout(id)
    } else {
      // No local fallback — platform doesn't ship a content library
      setResults([])
      setApiError(true)
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
          {/* Empty state — no search query entered */}
          {!q.trim() && !searching && (
            <div
              style={{
                padding: '40px 20px',
                textAlign: 'center',
                color: '#888',
                background: '#0a0a0a',
                borderRadius: 12,
                border: `1px dashed ${s.gray}`,
              }}
            >
              <div style={{ fontSize: 36, marginBottom: 10 }}>🔍</div>
              <div style={{ fontSize: 14, fontWeight: 700, color: '#ccc', marginBottom: 6 }}>
                Search YouTube
              </div>
              <div style={{ fontSize: 12, lineHeight: 1.6, maxWidth: 340, margin: '0 auto' }}>
                Type a title, artist, or any keyword to search YouTube. Results come directly from YouTube&apos;s search.
              </div>
            </div>
          )}

          {/* API error state */}
          {apiError && !searching && q.trim() && (
            <div
              style={{
                padding: '30px 20px',
                textAlign: 'center',
                color: '#888',
                background: '#0a0a0a',
                borderRadius: 12,
                border: `1px dashed ${s.gray}`,
              }}
            >
              <div style={{ fontSize: 30, marginBottom: 8 }}>⚠️</div>
              <div style={{ fontSize: 13, color: '#ccc', marginBottom: 4 }}>
                YouTube search unavailable
              </div>
              <div style={{ fontSize: 11 }}>
                Please try again later.
              </div>
            </div>
          )}

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
          ))}

          {!searching && !apiError && q.trim() && results.length === 0 && (
            <div style={{ padding: 40, textAlign: 'center', color: '#666' }}>{t.no_songs}</div>
          )}
        </div>
      </div>
    </div>
  )
}
