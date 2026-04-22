'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { useRouter } from 'next/navigation'
import Logo from '@/components/ui/Logo'
import Button from '@/components/ui/Button'
import LangToggle from '@/components/ui/LangToggle'
import UpgradeButton from '@/components/ui/UpgradeButton'
import UpgradeModal from '@/components/ui/UpgradeModal'
import YTPlayer from './YTPlayer'
import MicPanel, { FREE_MIC_SECONDS } from './MicPanel'
import AddSongModal from './AddSongModal'
import QRModal from './QRModal'
import { useLang } from '@/lib/i18n/LangProvider'
import { supabase } from '@/lib/supabase/client'
import { s, PLANS, Party, QueueItem, Profile } from '@/types'
import { KaraokeSong } from '@/lib/karaoke-library'

const FREE_PLAYED_LIMIT = 3

export default function PartyRoom({ code }: { code: string }) {
  const { t, lang } = useLang()
  const router = useRouter()

  const [party, setParty] = useState<Party | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [hostPlan, setHostPlan] = useState<string>('free')
  const [queue, setQueue] = useState<QueueItem[]>([])
  const [current, setCurrent] = useState<QueueItem | null>(null)
  const [playedCount, setPlayedCount] = useState(0)
  const [micSecondsUsed, setMicSecondsUsed] = useState(0)
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)

  const [showAdd, setShowAdd] = useState(false)
  const [showQR, setShowQR] = useState(false)
  const [showUpgrade, setShowUpgrade] = useState(false)

  const [playing, setPlaying] = useState(true)
  const [musicVolume, setMusicVolume] = useState(100)

  const currentPlan = profile?.plan || 'free'
  const planLimits = PLANS[currentPlan]
  const canParty = planLimits.party

  const isHostFree = hostPlan === 'free'
  const songLimitHit = isHostFree && playedCount >= FREE_PLAYED_LIMIT
  const micLimitHit = isHostFree && micSecondsUsed >= FREE_MIC_SECONDS
  const partyLocked = songLimitHit || micLimitHit

  const queueFullForPlan = isHostFree
    ? (queue.length + (current ? 1 : 0) + playedCount) >= FREE_PLAYED_LIMIT
    : false
  const disableAdd = partyLocked || queueFullForPlan

  useEffect(() => {
    if (typeof window === 'undefined') return
    const saved = localStorage.getItem('karaoku_music_volume')
    if (saved) setMusicVolume(parseInt(saved, 10))
  }, [])

  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('karaoku_music_volume', musicVolume.toString())
    }
  }, [musicVolume])

  useEffect(() => {
    let mounted = true
    const load = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push(`/login?next=/party/${code}`)
        return
      }

      const [{ data: partyData }, { data: profileData }] = await Promise.all([
        supabase.from('parties').select('*').eq('code', code).single(),
        supabase.from('profiles').select('*').eq('id', user.id).single(),
      ])

      if (!mounted) return
      if (!partyData) {
        setNotFound(true)
        setLoading(false)
        return
      }

      setParty(partyData)
      setProfile(profileData)
      setMicSecondsUsed(partyData.mic_seconds_used || 0)

      const { data: hostProfile } = await supabase
        .from('profiles')
        .select('plan')
        .eq('id', partyData.host_id)
        .single()
      setHostPlan(hostProfile?.plan || 'free')

      const [{ data: activeQueue }, { count: playedC }] = await Promise.all([
        supabase
          .from('queue_items')
          .select('*')
          .eq('party_id', partyData.id)
          .eq('played', false)
          .order('position', { ascending: true }),
        supabase
          .from('queue_items')
          .select('id', { count: 'exact', head: true })
          .eq('party_id', partyData.id)
          .eq('played', true),
      ])

      const items = activeQueue || []
      setPlayedCount(playedC || 0)
      if (items.length > 0) {
        setCurrent(items[0])
        setQueue(items.slice(1))
      } else {
        setCurrent(null)
        setQueue([])
      }
      setLoading(false)
    }
    load()
    return () => { mounted = false }
  }, [code, router])

  useEffect(() => {
    if (!party) return
    const channel = supabase
      .channel(`party:${party.id}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'queue_items', filter: `party_id=eq.${party.id}` },
        async () => {
          const [{ data: activeQueue }, { count: playedC }] = await Promise.all([
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
          ])
          const items = activeQueue || []
          setPlayedCount(playedC || 0)
          if (items.length > 0) {
            setCurrent((cur) => {
              if (!cur) return items[0]
              const stillPlaying = items.find((i) => i.id === cur.id)
              return stillPlaying || items[0]
            })
            setQueue(items.slice(1))
          } else {
            setCurrent(null)
            setQueue([])
          }
        }
      )
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'parties', filter: `id=eq.${party.id}` },
        (payload: any) => {
          if (payload.new.mic_seconds_used !== undefined) {
            setMicSecondsUsed(payload.new.mic_seconds_used)
          }
        }
      )
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [party])

  const addSong = async (song: KaraokeSong) => {
    if (!party || disableAdd) return
    const position = (current ? 1 : 0) + queue.length
    await supabase.from('queue_items').insert({
      party_id: party.id,
      video_id: song.id,
      title: song.title,
      artist: song.artist,
      duration: song.duration,
      thumb_url: song.thumb,
      added_by_name: profile?.name || profile?.email?.split('@')[0] || 'Host',
      added_by_id: profile?.id,
      position,
    })
  }

  const handleEnded = useCallback(async () => {
    if (!current || !party) return
    await supabase.from('queue_items').update({ played: true }).eq('id', current.id)

    if (profile) {
      await supabase.from('play_history').insert({
        user_id: profile.id,
        party_id: party.id,
        video_id: current.video_id,
        title: current.title,
        artist: current.artist,
        thumb_url: current.thumb_url,
      })
    }
  }, [current, party, profile])

  const skip = () => handleEnded()
  const removeFromQueue = async (id: string) => {
    await supabase.from('queue_items').delete().eq('id', id)
  }

  const vote = async (id: string) => {
    const { data: item } = await supabase.from('queue_items').select('vote_count').eq('id', id).single()
    if (item) await supabase.from('queue_items').update({ vote_count: (item.vote_count || 0) + 1 }).eq('id', id)
  }

  const openQR = () => {
    if (!canParty) {
      setShowUpgrade(true)
      return
    }
    setShowQR(true)
  }

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', background: s.black, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#666' }}>
        {t.loading}
      </div>
    )
  }

  if (notFound) {
    return (
      <div style={{ minHeight: '100vh', background: s.black, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 20, textAlign: 'center' }}>
        <div style={{ fontSize: 48, marginBottom: 12 }}>🔒</div>
        <h1 style={{ fontSize: 22, fontWeight: 900, marginBottom: 8 }}>Room not found</h1>
        <p style={{ color: '#999', fontSize: 14, marginBottom: 20 }}>Code {code} doesn&apos;t exist.</p>
        <Button variant="primary" onClick={() => router.push('/dashboard')}>← Dashboard</Button>
      </div>
    )
  }

  const planLabel = lang === 'bm' && 'labelBm' in PLANS[currentPlan]
    ? (PLANS[currentPlan] as any).labelBm
    : PLANS[currentPlan].label

  let lockReason: string | null = null
  if (songLimitHit && micLimitHit) {
    lockReason = '🔒 Room ended — track limit and voice chat limit both reached'
  } else if (songLimitHit) {
    lockReason = '🔒 Room ended — 3 tracks played (free tier limit)'
  } else if (micLimitHit) {
    lockReason = '🔒 Room ended — 10 min voice chat used (free tier limit)'
  }

  return (
    <div style={{ minHeight: '100vh', background: s.black, display: 'flex', flexDirection: 'column' }}>
      <header
        style={{
          padding: '12px 16px',
          background: s.dark,
          borderBottom: `2px solid ${s.red}`,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: 10,
          position: 'sticky',
          top: 0,
          zIndex: 10,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <Button variant="ghost" size="sm" onClick={() => router.push('/dashboard')}>
            {t.exit}
          </Button>
          <Logo size={28} showSubtitle={false} />
          <span style={{ fontSize: 12, letterSpacing: 3, fontWeight: 800, color: 'rgba(255,255,255,0.7)' }}>
            {code}
          </span>
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
          <LangToggle compact />
          <div
            style={{
              padding: '5px 10px',
              background: currentPlan === 'free' ? s.gray : s.red,
              borderRadius: 100,
              fontSize: 10,
              fontWeight: 800,
              letterSpacing: 1,
            }}
          >
            {planLabel.toUpperCase()}
          </div>
          <Button variant="ghost" size="sm" onClick={openQR}>
            📱 {t.invite}
          </Button>
          {currentPlan === 'free' && <UpgradeButton currentPlan={currentPlan} />}
        </div>
      </header>

      {lockReason && (
        <div
          style={{
            background: `linear-gradient(135deg, ${s.redDark}, ${s.red})`,
            padding: '14px 20px',
            textAlign: 'center',
            fontSize: 14,
            fontWeight: 700,
          }}
        >
          {lockReason}.{' '}
          <span
            onClick={() => setShowUpgrade(true)}
            style={{ textDecoration: 'underline', color: 'white', cursor: 'pointer' }}
          >
            Upgrade for unlimited →
          </span>
        </div>
      )}

      <div
        style={{
          flex: 1,
          display: 'grid',
          gridTemplateColumns: '1fr 340px',
          gap: 14,
          padding: 14,
        }}
        className="kr-main"
      >
        <style>{`@media (max-width: 900px) { .kr-main { grid-template-columns: 1fr !important; } }`}</style>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <div
            style={{
              background: '#000',
              borderRadius: 14,
              overflow: 'hidden',
              aspectRatio: '16/9',
              position: 'relative',
              border: `1px solid ${s.gray}`,
            }}
          >
            {current ? (
              <YTPlayer
                videoId={current.video_id}
                playing={playing}
                volume={musicVolume}
                onEnded={handleEnded}
              />
            ) : (
              <div
                style={{
                  width: '100%',
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 14,
                  color: '#666',
                }}
              >
                <div style={{ fontSize: 80 }}>🎵</div>
                <div style={{ fontSize: 18, fontWeight: 700 }}>{t.empty_queue_big}</div>
                <div style={{ fontSize: 13 }}>{t.empty_queue_sub}</div>
              </div>
            )}
          </div>

          {current && (
            <div style={{ background: s.dark, borderRadius: 14, padding: 14, border: `1px solid ${s.gray}` }}>
              <div style={{ fontSize: 11, color: s.redLight, letterSpacing: 2, fontWeight: 800, marginBottom: 4 }}>
                ▶ {t.now_singing}
              </div>
              <div style={{ fontSize: 17, fontWeight: 800, marginBottom: 2 }}>{current.title}</div>
              <div style={{ fontSize: 12, color: '#999', marginBottom: 10 }}>{current.artist}</div>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                <Button variant="primary" size="sm" onClick={() => setPlaying((p) => !p)}>
                  {playing ? '⏸ ' + t.pause : '▶ ' + t.play}
                </Button>
                <Button variant="ghost" size="sm" onClick={skip}>
                  ⏭ {t.skip}
                </Button>
              </div>
            </div>
          )}

          <MicPanel
            plan={currentPlan}
            hostPlan={hostPlan}
            partyId={party?.id}
            initialSecondsUsed={micSecondsUsed}
            partyLocked={partyLocked}
            musicVolume={musicVolume}
            onMusicVolumeChange={setMusicVolume}
            onSecondsUpdate={setMicSecondsUsed}
            onTimeLimitHit={() => setShowUpgrade(true)}
            onNeedUpgrade={() => setShowUpgrade(true)}
          />
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, minHeight: 0 }}>
          <div
            style={{
              background: s.dark,
              borderRadius: 14,
              padding: 14,
              border: `1px solid ${s.gray}`,
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              minHeight: 300,
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
              <div>
                <div style={{ fontSize: 11, color: s.redLight, letterSpacing: 2, fontWeight: 800 }}>
                  🎵 {t.up_next}
                </div>
                <div style={{ fontSize: 17, fontWeight: 800 }}>{t.songs_count(queue.length)}</div>
                {isHostFree && (
                  <div style={{ fontSize: 10, color: '#999', marginTop: 2 }}>
                    {playedCount}/{FREE_PLAYED_LIMIT} tracks · {Math.floor(micSecondsUsed / 60)}:{(micSecondsUsed % 60).toString().padStart(2, '0')}/10:00 voice
                  </div>
                )}
              </div>
              <Button
                variant="primary"
                size="sm"
                onClick={() => setShowAdd(true)}
                disabled={disableAdd}
              >
                + {t.add}
              </Button>
            </div>
            <div style={{ flex: 1, overflowY: 'auto', minHeight: 0 }}>
              {queue.length === 0 ? (
                <div style={{ textAlign: 'center', color: '#666', padding: 30, fontSize: 13 }}>
                  {t.empty_queue_small}
                  <br />
                  {t.empty_queue_desc}
                </div>
              ) : (
                queue.map((item, idx) => (
                  <div
                    key={item.id}
                    className="anim-slide-up"
                    style={{
                      display: 'flex',
                      gap: 10,
                      padding: 8,
                      marginBottom: 6,
                      background: s.gray,
                      borderRadius: 10,
                      alignItems: 'center',
                    }}
                  >
                    <div
                      style={{
                        width: 24,
                        height: 24,
                        borderRadius: '50%',
                        background: s.red,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: 11,
                        fontWeight: 800,
                        flexShrink: 0,
                      }}
                    >
                      {idx + 1}
                    </div>
                    {item.thumb_url && (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={item.thumb_url}
                        alt=""
                        style={{ width: 60, height: 34, borderRadius: 4, objectFit: 'cover' }}
                      />
                    )}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div
                        style={{
                          fontSize: 12,
                          fontWeight: 700,
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {item.title}
                      </div>
                      <div style={{ fontSize: 10, color: '#999' }}>{item.artist}</div>
                    </div>
                    <button
                      onClick={() => vote(item.id)}
                      title={t.vote_up}
                      style={{
                        background: 'transparent',
                        border: `1px solid ${s.grayLight}`,
                        color: '#ccc',
                        borderRadius: 6,
                        padding: '4px 8px',
                        fontSize: 11,
                        cursor: 'pointer',
                      }}
                    >
                      👍 {item.vote_count || 0}
                    </button>
                    <button
                      onClick={() => removeFromQueue(item.id)}
                      title={t.remove}
                      style={{
                        background: 'transparent',
                        border: 'none',
                        color: '#888',
                        fontSize: 16,
                        cursor: 'pointer',
                        padding: 4,
                      }}
                    >
                      ×
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>

          <div
            style={{
              background: `linear-gradient(135deg, ${s.redDark}, ${s.red})`,
              padding: 14,
              borderRadius: 14,
            }}
          >
            <div style={{ fontSize: 11, letterSpacing: 2, fontWeight: 800, opacity: 0.9 }}>
              {t.party_code}
            </div>
            <div style={{ fontSize: 26, fontWeight: 900, letterSpacing: 6, marginTop: 2 }}>{code}</div>
            <div style={{ fontSize: 11, opacity: 0.85, marginTop: 4 }}>{t.party_code_desc}</div>
          </div>
        </div>
      </div>

      {showAdd && (
        <AddSongModal
          onAdd={addSong}
          onClose={() => setShowAdd(false)}
          onUpgrade={() => { setShowAdd(false); setShowUpgrade(true) }}
          atLimit={disableAdd}
          queueLimit={isHostFree ? FREE_PLAYED_LIMIT : 999}
        />
      )}

      {showQR && <QRModal code={code} onClose={() => setShowQR(false)} />}

      {showUpgrade && <UpgradeModal onClose={() => setShowUpgrade(false)} />}
    </div>
  )
}
