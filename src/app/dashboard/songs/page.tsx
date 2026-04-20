'use client'

import { useState, useEffect } from 'react'
import Button from '@/components/ui/Button'
import { useLang } from '@/lib/i18n/LangProvider'
import { supabase } from '@/lib/supabase/client'
import { s, Favorite, Party } from '@/types'
import { KARAOKE_LIBRARY, KaraokeSong } from '@/lib/karaoke-library'

export default function SongsPage() {
  const { t } = useLang()
  const [favs, setFavs] = useState<Favorite[]>([])
  const [q, setQ] = useState('')
  const [results, setResults] = useState<KaraokeSong[]>([])
  const [searching, setSearching] = useState(false)
  const [useApi, setUseApi] = useState(false)
  const [loading, setLoading] = useState(true)
  const [parties, setParties] = useState<Party[]>([])
  const [userId, setUserId] = useState<string>('')
  const [openPartyFor, setOpenPartyFor] = useState<string | null>(null)
  const [preview, setPreview] = useState<KaraokeSong | null>(null)
  const [showClearConfirm, setShowClearConfirm] = useState(false)
  const [toast, setToast] = useState<string>('')

  useEffect(() => {
    const load = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      setUserId(user.id)
      const [{ data: favData }, { data: partyData }] = await Promise.all([
        supabase.from('favorites').select('*').eq('user_id', user.id).order('added_at', { ascending: false }),
        supabase.from('parties').select('*').eq('host_id', user.id).eq('is_active', true).order('created_at', { ascending: false }),
      ])
      setFavs(favData || [])
      setParties(partyData || [])
      setLoading(false)
    }
    load()

    fetch('/api/youtube/search?probe=1').then(async r => {
      const d = await r.json()
      setUseApi(!!d.enabled)
    }).catch(() => {})
  }, [])

  useEffect(() => {
    if (!q.trim()) { setResults([]); return }
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

  const showToast = (msg: string) => {
    setToast(msg)
    setTimeout(() => setToast(''), 2500)
  }

  const isFavorited = (videoId: string) => favs.some(f => f.video_id === videoId)

  const toggleFav = async (song: KaraokeSong) => {
    if (!userId) return
    const existing = favs.find(f => f.video_id === song.id)
    if (existing) {
      await supabase.from('favorites').delete().eq('id', existing.id)
      setFavs(favs.filter(f => f.id !== existing.id))
      showToast('Removed from favorites')
    } else {
      const { data } = await supabase.from('favorites').insert({
        user_id: userId,
        video_id: song.id,
        title: song.title,
        artist: song.artist,
        thumb_url: song.thumb,
      }).select().single()
      if (data) {
        setFavs([data as Favorite, ...favs])
        showToast('Added to favorites ❤️')
      }
    }
  }

  const clearAllFavs = async () => {
    if (!userId) return
    await supabase.from('favorites').delete().eq('user_id', userId)
    setFavs([])
    setShowClearConfirm(false)
    showToast('All favorites cleared')
  }

  const addToParty = async (song: KaraokeSong, partyId: string) => {
    const p = parties.find(x => x.id === partyId)
    if (!p) return
    const { count } = await supabase
      .from('queue_items')
      .select('id', { count: 'exact', head: true })
      .eq('party_id', partyId)
      .eq('played', false)

    await supabase.from('queue_items').insert({
      party_id: partyId,
      video_id: song.id,
      title: song.title,
      artist: song.artist,
      thumb_url: song.thumb,
      added_by_name: 'Host',
      added_by_id: userId,
      position: count || 0,
    })
    setOpenPartyFor(null)
    showToast(`Added to "${p.name}" ✓`)
  }

  const favToSong = (f: Favorite): KaraokeSong => ({
    id: f.video_id,
    title: f.title,
    artist: f.artist || '',
    duration: '',
    thumb: f.thumb_url || '',
  })

  const SongRow = ({ song }: { song: KaraokeSong }) => {
    const favd = isFavorited(song.id)
    return (
      <div
        style={{
          background: s.dark,
          padding: 10,
          borderRadius: 10,
          display: 'flex',
          gap: 10,
          alignItems: 'center',
          border: `1px solid ${s.gray}`,
          position: 'relative',
        }}
      >
        <div
          onClick={() => setPreview(song)}
          style={{ position: 'relative', cursor: 'pointer', flexShrink: 0 }}
        >
          {song.thumb && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={song.thumb} alt="" style={{ width: 80, height: 45, borderRadius: 4, objectFit: 'cover' }} />
          )}
        </div>

        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 13, fontWeight: 700, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {song.title}
          </div>
          <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)' }}>{song.artist}</div>
        </div>

        <button
          onClick={() => toggleFav(song)}
          title={favd ? 'Remove from favorites' : 'Add to favorites'}
          style={{
            background: 'transparent',
            border: 'none',
            color: favd ? s.red : 'rgba(255,255,255,0.3)',
            fontSize: 20,
            cursor: 'pointer',
            padding: 4,
          }}
        >
          {favd ? '♥' : '♡'}
        </button>

        {parties.length > 0 && (
          <div style={{ position: 'relative' }}>
            <button
              onClick={() => setOpenPartyFor(openPartyFor === song.id ? null : song.id)}
              style={{
                background: s.red,
                color: 'white',
                border: 'none',
                borderRadius: 6,
                padding: '5px 10px',
                fontSize: 11,
                fontWeight: 700,
                cursor: 'pointer',
                boxShadow: `0 3px 0 ${s.redDark}`,
              }}
            >
              + Add
            </button>
            {openPartyFor === song.id && (
              <div
                style={{
                  position: 'absolute',
                  right: 0,
                  top: 'calc(100% + 6px)',
                  background: s.dark,
                  border: `1px solid ${s.gray}`,
                  borderRadius: 10,
                  padding: 6,
                  zIndex: 10,
                  minWidth: 180,
                  boxShadow: '0 6px 20px rgba(0,0,0,0.6)',
                }}
              >
                <div style={{ fontSize: 10, color: '#999', padding: '4px 8px', letterSpacing: 1 }}>ADD TO PARTY</div>
                {parties.map(p => (
                  <button
                    key={p.id}
                    onClick={() => addToParty(song, p.id)}
                    style={{
                      display: 'block',
                      width: '100%',
                      textAlign: 'left',
                      background: 'transparent',
                      color: 'white',
                      border: 'none',
                      borderRadius: 6,
                      padding: '8px 10px',
                      fontSize: 12,
                      cursor: 'pointer',
                    }}
                  >
                    <div style={{ fontWeight: 700 }}>{p.name}</div>
                    <div style={{ fontSize: 10, color: '#999' }}>{p.code}</div>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    )
  }

  const favsFiltered = q.trim()
    ? favs.filter(f =>
        f.title.toLowerCase().includes(q.toLowerCase()) ||
        (f.artist || '').toLowerCase().includes(q.toLowerCase())
      )
    : favs

  return (
    <div style={{ padding: 24, maxWidth: 900, margin: '0 auto', position: 'relative' }}>
      <h1 style={{ fontSize: 24, fontWeight: 900, marginBottom: 14, letterSpacing: -0.5 }}>
        ♪ Songs
      </h1>
      <input
        placeholder="🔍  Search YouTube for any song..."
        value={q}
        onChange={e => setQ(e.target.value)}
        style={{ marginBottom: 14 }}
      />

      {q.trim() && (
        <div style={{ marginBottom: 24 }}>
          <div style={{ fontSize: 11, color: s.redLight, letterSpacing: 2, fontWeight: 800, marginBottom: 8 }}>
            🔍 SEARCH RESULTS {searching && '(searching...)'}
          </div>
          {results.length === 0 && !searching ? (
            <div style={{ background: s.dark, padding: 30, textAlign: 'center', borderRadius: 12, color: '#666', fontSize: 13 }}>
              No songs found
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {results.map(r => <SongRow key={r.id} song={r} />)}
            </div>
          )}
        </div>
      )}

      {loading ? (
        <div style={{ padding: 40, textAlign: 'center', color: '#666' }}>{t.loading}</div>
      ) : (
        <>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
            <div style={{ fontSize: 11, color: s.redLight, letterSpacing: 2, fontWeight: 800 }}>
              ♥ YOUR FAVORITES ({favs.length})
            </div>
            {favs.length > 0 && (
              <button
                onClick={() => setShowClearConfirm(true)}
                style={{
                  background: 'transparent',
                  border: `1px solid ${s.gray}`,
                  color: 'rgba(255,255,255,0.6)',
                  borderRadius: 6,
                  padding: '4px 10px',
                  fontSize: 11,
                  cursor: 'pointer',
                }}
              >
                Clear all
              </button>
            )}
          </div>
          {favsFiltered.length === 0 ? (
            <div
              style={{
                background: s.dark,
                borderRadius: 12,
                padding: 40,
                textAlign: 'center',
                border: `1px dashed ${s.gray}`,
              }}
            >
              <div style={{ fontSize: 40, marginBottom: 6 }}>♡</div>
              <div style={{ fontSize: 13, color: '#999' }}>
                {q.trim() ? 'No favorites match your search' : 'No favorites yet. Search a song and tap ♡ to save it.'}
              </div>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {favsFiltered.map(f => <SongRow key={f.id} song={favToSong(f)} />)}
            </div>
          )}
        </>
      )}

      {preview && (
        <div
          onClick={() => setPreview(null)}
          style={{
            position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.9)',
            zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20,
          }}
        >
          <div
            onClick={e => e.stopPropagation()}
            style={{
              background: s.dark, borderRadius: 16, padding: 16, maxWidth: 720, width: '100%',
              border: `1px solid ${s.gray}`,
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
              <div>
                <div style={{ fontSize: 14, fontWeight: 700 }}>{preview.title}</div>
                <div style={{ fontSize: 11, color: '#999' }}>{preview.artist}</div>
              </div>
              <button
                onClick={() => setPreview(null)}
                style={{ background: 'none', border: 'none', color: 'white', fontSize: 24, cursor: 'pointer' }}
              >×</button>
            </div>
            <div style={{ aspectRatio: '16/9', background: '#000', borderRadius: 8, overflow: 'hidden' }}>
              <iframe
                src={`https://www.youtube.com/embed/${preview.id}?autoplay=1`}
                style={{ width: '100%', height: '100%', border: 'none' }}
                allow="autoplay; encrypted-media"
                allowFullScreen
              />
            </div>
          </div>
        </div>
      )}

      {showClearConfirm && (
        <div
          onClick={() => setShowClearConfirm(false)}
          style={{
            position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.9)',
            zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20,
          }}
        >
          <div
            onClick={e => e.stopPropagation()}
            style={{
              background: s.dark, borderRadius: 16, padding: 24, maxWidth: 360, width: '100%', textAlign: 'center',
              border: `1px solid ${s.gray}`,
            }}
          >
            <div style={{ fontSize: 40, marginBottom: 10 }}>⚠️</div>
            <h2 style={{ fontSize: 18, fontWeight: 800, marginBottom: 8 }}>Clear all favorites?</h2>
            <p style={{ color: '#999', fontSize: 13, marginBottom: 20 }}>
              This will remove all {favs.length} favorites. Can&apos;t be undone.
            </p>
            <div style={{ display: 'flex', gap: 8 }}>
              <Button variant="ghost" fullWidth onClick={() => setShowClearConfirm(false)}>Cancel</Button>
              <Button variant="danger" fullWidth onClick={clearAllFavs}>Clear all</Button>
            </div>
          </div>
        </div>
      )}

      {toast && (
        <div
          style={{
            position: 'fixed',
            bottom: 80,
            left: '50%',
            transform: 'translateX(-50%)',
            background: s.dark,
            border: `1px solid ${s.red}`,
            color: 'white',
            padding: '10px 18px',
            borderRadius: 100,
            fontSize: 13,
            fontWeight: 600,
            boxShadow: '0 6px 20px rgba(0,0,0,0.6)',
            zIndex: 100,
          }}
        >
          {toast}
        </div>
      )}
    </div>
  )
}
