'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Button from '@/components/ui/Button'
import LangToggle from '@/components/ui/LangToggle'
import AddSongModal from '@/components/party/AddSongModal'
import { useLang } from '@/lib/i18n/LangProvider'
import { supabase } from '@/lib/supabase/client'
import { s, Party, QueueItem } from '@/types'
import { KaraokeSong } from '@/lib/karaoke-library'

const FREE_PLAYED_LIMIT = 3
const FREE_GUEST_SONGS = 1

function getFingerprint(): string {
  if (typeof window === 'undefined') return ''
  let fp = localStorage.getItem('karaoku_fp')
  if (!fp) {
    fp = 'g_' + Math.random().toString(36).slice(2, 12) + '_' + Date.now().toString(36)
    localStorage.setItem('karaoku_fp', fp)
  }
  return fp
}

export default function GuestParty({ code }: { code: string }) {
  const { t } = useLang()
  const router = useRouter()
  const [party, setParty] = useState<Party | null>(null)
  const [hostPlan, setHostPlan] = useState<string>('free')
  const [queue, setQueue] = useState<QueueItem[]>([])
  const [current, setCurrent] = useState<QueueItem | null>(null)
  const [playedCount, setPlayedCount] = useState(0)
  const [myAddedCount, setMyAddedCount] = useState(0)
  const [loading, setLoading] = useState(true)
  const [showAdd, setShowAdd] = useState(false)
  const [guestCount, setGuestCount] = useState(0)
  const [guestName, setGuestName] = useState('')
  const [myVotes, setMyVotes] = useState<Set<string>>(new Set())
  const [toast, setToast] = useState('')

  useEffect(() => {
    setGuestName(
      typeof window !== 'undefined'
        ? localStorage.getItem('karaoku_guest_name') || 'Guest'
        : 'Guest'
    )

    const load = async () => {
      const { data: p } = await supabase
        .from('parties')
        .select('*')
        .eq('code', code)
        .eq('is_active', true)
        .single()

      if (!p) {
        router.push(`/join/${code}`)
        return
      }

      setParty(p)

      const fp = getFingerprint()
      const [
        { data: hostProfile },
        { data: q },
        { count: gc },
        { count: playedC },
        { count: myCount },
      ] = await Promise.all([
        supabase.from('profiles').select('plan').eq('id', p.host_id).single(),
        supabase
          .from('queue_items')
          .select('*')
          .eq('party_id', p.id)
          .eq('played', false)
          .order('vote_count', { ascending: false })
          .order('position', { ascending: true }),
        supabase
          .from('party_guests')
          .select('id', { count: 'exact', head: true })
          .eq('party_id', p.id),
        supabase
          .from('queue_items')
          .select('id', { count: 'exact', head: true })
          .eq('party_id', p.id)
          .eq('played', true),
        supabase
          .from('queue_items')
          .select('id', { count: 'exact', head: true })
          .eq('party_id', p.id)
          .eq('added_by_fingerprint', fp),
      ])

      setHostPlan(hostProfile?.plan || 'free')

      const items = q || []
      setCurrent(items[0] || null)
      setQueue(items.slice(1))
      setGuestCount(gc || 0)
      setPlayedCount(playedC || 0)
      setMyAddedCount(myCount || 0)
      setLoading(false)
    }
    load()
  }, [code, router])

  useEffect(() => {
    if (!party) return
    const channel = supabase
      .channel(`guest:${party.id}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'queue_items', filter: `party_id=eq.${party.id}` },
        async () => {
          const fp = getFingerprint()
          const [{ data }, { count: playedC }, { count: myCount }] = await Promise.all([
            supabase
              .from('queue_items')
              .select('*')
              .eq('party_id', party.id)
              .eq('played', false)
              .order('vote_count', { ascending: false })
              .order('position', { ascending: true }),
            supabase
              .from('queue_items')
              .select('id', { count: 'exact', head: true })
              .eq('party_id', party.id)
              .eq('played', true),
            supabase
              .from('queue_items')
              .select('id', { count: 'exact', head: true })
              .eq('party_id', party.id)
              .eq('added_by_fingerprint', fp),
          ])
          const items = data || []
          setCurrent(items[0] || null)
          setQueue(items.slice(1))
          setPlayedCount(playedC || 0)
          setMyAddedCount(myCount || 0)
        }
      )
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'party_guests', filter: `party_id=eq.${party.id}` },
        () => setGuestCount((c) => c + 1)
      )
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [party])

  const isHostFree = hostPlan === 'free'
  const partyLocked = isHostFree && playedCount >= FREE_PLAYED_LIMIT
  const guestLimitHit = isHostFree && myAddedCount >= FREE_GUEST_SONGS
  const cantAdd = partyLocked || guestLimitHit

  const showToast = (msg: string) => {
    setToast(msg)
    setTimeout(() => setToast(''), 3000)
  }

  const addSong = async (song: KaraokeSong) => {
    if (!party || cantAdd) {
      if (guestLimitHit) {
        showToast(`🔒 Free demo: 1 song limit. Ask host to upgrade!`)
      } else if (partyLocked) {
        showToast(`🔒 Party is locked (3 songs played)`)
      }
      return
    }

    const fp = getFingerprint()
    const position = (current ? 1 : 0) + queue.length
    const { error } = await supabase.from('queue_items').insert({
      party_id: party.id,
      video_id: song.id,
      title: song.title,
      artist: song.artist,
      duration: song.duration,
      thumb_url: song.thumb,
      added_by_name: guestName,
      added_by_fingerprint: fp,
      position,
    })

    if (error) {
      showToast('Failed to add song. Try again.')
    } else {
      showToast(`✓ "${song.title}" added!`)
      setMyAddedCount((n) => n + 1)
    }
  }

  const vote = async (itemId: string) => {
    if (myVotes.has(itemId)) return
    const fp = getFingerprint()
    const { error } = await supabase
      .from('queue_votes')
      .insert({ queue_item_id: itemId, voter_fingerprint: fp })

    if (!error) {
      const { data: item } = await supabase
        .from('queue_items')
        .select('vote_count')
        .eq('id', itemId)
        .single()
      if (item) {
        await supabase
          .from('queue_items')
          .update({ vote_count: (item.vote_count || 0) + 1 })
          .eq('id', itemId)
      }
      setMyVotes(new Set([...myVotes, itemId]))
    }
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

  if (!party) {
    return (
      <div style={{
        minHeight: '100vh', background: s.black, display: 'flex',
        flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
        padding: 20, textAlign: 'center',
      }}>
        <div style={{ fontSize: 48, marginBottom: 12 }}>🔒</div>
        <h1 style={{ fontSize: 22, fontWeight: 900 }}>Party ended</h1>
        <Button variant="primary" onClick={() => router.push('/join')}>Join another</Button>
      </div>
    )
  }

  return (
    <div style={{ minHeight: '100vh', background: s.black, paddingBottom: 80, position: 'relative' }}>
      <header style={{
        padding: '12px 16px', background: s.dark, borderBottom: `2px solid ${s.red}`,
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        position: 'sticky', top: 0, zIndex: 10, gap: 10,
      }}>
        <div>
          <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.5)', letterSpacing: 2 }}>
            ← {code}
          </div>
          <div style={{ fontSize: 13, fontWeight: 700 }}>{party.name}</div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{
            fontSize: 10, color: 'rgba(255,255,255,0.6)',
            padding: '3px 8px', background: s.gray, borderRadius: 100,
          }}>
            👥 {guestCount}
          </span>
          <span style={{
            padding: '3px 9px', borderRadius: 100, fontSize: 10,
            fontWeight: 800, letterSpacing: 1,
            background: 'rgba(34,197,94,0.2)', color: s.green,
          }}>
            ● {t.parties_live}
          </span>
          <LangToggle compact />
        </div>
      </header>

      {/* Free demo notice for guest */}
      {isHostFree && (
        <div style={{
          background: guestLimitHit || partyLocked
            ? `linear-gradient(135deg, ${s.redDark}, ${s.red})`
            : 'rgba(251,191,36,0.12)',
          padding: '10px 16px',
          textAlign: 'center',
          fontSize: 12,
          fontWeight: 600,
          color: guestLimitHit || partyLocked ? 'white' : '#fde68a',
          borderBottom: guestLimitHit || partyLocked ? 'none' : '1px solid rgba(251,191,36,0.3)',
        }}>
          {partyLocked ? (
            <>🔒 Party locked — 3 songs played (free limit)</>
          ) : guestLimitHit ? (
            <>🔒 You&apos;ve added {myAddedCount}/{FREE_GUEST_SONGS} song. Ask host to upgrade for unlimited!</>
          ) : (
            <>⚡ <b>Free demo:</b> Add {FREE_GUEST_SONGS - myAddedCount} song to try Karaoku</>
          )}
        </div>
      )}

      {/* NOW PLAYING */}
      <div style={{ padding: 14 }}>
        {current ? (
          <div style={{
            background: `linear-gradient(135deg, ${s.redDark}, ${s.red})`,
            borderRadius: 14, padding: 14, marginBottom: 12,
            display: 'flex', gap: 12, alignItems: 'center',
          }}>
            {current.thumb_url && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={current.thumb_url}
                alt=""
                style={{ width: 70, height: 40, borderRadius: 4, objectFit: 'cover', flexShrink: 0 }}
              />
            )}
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 10, letterSpacing: 2, fontWeight: 800, opacity: 0.9 }}>
                ▶ {t.now_singing}
              </div>
              <div style={{
                fontSize: 14, fontWeight: 800, overflow: 'hidden',
                textOverflow: 'ellipsis', whiteSpace: 'nowrap',
              }}>
                {current.title}
              </div>
              <div style={{ fontSize: 12, opacity: 0.85 }}>{current.artist}</div>
            </div>
          </div>
        ) : (
          <div style={{
            background: s.dark, borderRadius: 14, padding: 20,
            marginBottom: 12, textAlign: 'center', color: '#666',
          }}>
            <div style={{ fontSize: 36, marginBottom: 6 }}>🎤</div>
            <div style={{ fontSize: 13 }}>{t.empty_queue_big}</div>
          </div>
        )}

        {/* QUEUE */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
          <div>
            <div style={{ fontSize: 11, color: s.redLight, letterSpacing: 2, fontWeight: 800 }}>
              🎵 {t.up_next}
            </div>
            <div style={{ fontSize: 15, fontWeight: 800 }}>{t.songs_count(queue.length)}</div>
            {isHostFree && (
              <div style={{ fontSize: 9, color: '#666', marginTop: 2 }}>
                You: {myAddedCount}/{FREE_GUEST_SONGS} song
              </div>
            )}
          </div>
          <Button
            variant="primary"
            size="sm"
            onClick={() => {
              if (cantAdd) {
                if (guestLimitHit) showToast('🔒 Free demo: 1 song limit. Ask host to upgrade!')
                else if (partyLocked) showToast('🔒 Party locked (3 songs played)')
                return
              }
              setShowAdd(true)
            }}
            disabled={cantAdd}
          >
            {cantAdd ? '🔒' : `+ ${t.add}`}
          </Button>
        </div>

        {queue.length === 0 ? (
          <div style={{
            background: s.dark, borderRadius: 12, padding: 30,
            textAlign: 'center', color: '#666', fontSize: 13,
          }}>
            {t.empty_queue_small}
            <br />
            Tap + {t.add} to pick a song
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {queue.map((item, idx) => {
              const voted = myVotes.has(item.id)
              return (
                <div
                  key={item.id}
                  className="anim-slide-up"
                  style={{
                    display: 'flex', gap: 10, padding: 10,
                    background: s.dark, borderRadius: 10, alignItems: 'center',
                  }}
                >
                  <div style={{
                    width: 22, height: 22, borderRadius: '50%', background: s.red,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 11, fontWeight: 800, flexShrink: 0,
                  }}>
                    {idx + 1}
                  </div>
                  {item.thumb_url && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={item.thumb_url}
                      alt=""
                      style={{ width: 50, height: 28, borderRadius: 3, objectFit: 'cover' }}
                    />
                  )}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{
                      fontSize: 12, fontWeight: 700, overflow: 'hidden',
                      textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                    }}>
                      {item.title}
                    </div>
                    <div style={{ fontSize: 10, color: '#999' }}>
                      added by {item.added_by_name || 'someone'}
                    </div>
                  </div>
                  <button
                    onClick={() => vote(item.id)}
                    disabled={voted}
                    style={{
                      background: voted ? s.red : 'transparent',
                      color: voted ? 'white' : '#ccc',
                      border: `1px solid ${voted ? s.red : s.grayLight}`,
                      borderRadius: 7, padding: '5px 10px', fontSize: 11,
                      fontWeight: 700, cursor: voted ? 'default' : 'pointer',
                    }}
                  >
                    ▲ {item.vote_count || 0}
                  </button>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {showAdd && (
        <AddSongModal
          onAdd={addSong}
          onClose={() => setShowAdd(false)}
          onUpgrade={() => setShowAdd(false)}
          atLimit={cantAdd}
          queueLimit={isHostFree ? FREE_GUEST_SONGS : 999}
        />
      )}

      {toast && (
        <div style={{
          position: 'fixed', bottom: 20, left: '50%',
          transform: 'translateX(-50%)', background: s.dark,
          border: `1px solid ${s.red}`, color: 'white',
          padding: '10px 18px', borderRadius: 100, fontSize: 12,
          fontWeight: 600, zIndex: 100,
          boxShadow: '0 6px 20px rgba(0,0,0,0.6)',
          maxWidth: 'calc(100% - 40px)',
          textAlign: 'center',
        }}>
          {toast}
        </div>
      )}
    </div>
  )
}
