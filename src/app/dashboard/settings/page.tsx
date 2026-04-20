'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Button from '@/components/ui/Button'
import LangToggle from '@/components/ui/LangToggle'
import { useLang } from '@/lib/i18n/LangProvider'
import { supabase } from '@/lib/supabase/client'
import { s, Profile, PLANS } from '@/types'

export default function SettingsPage() {
  const { t, lang } = useLang()
  const router = useRouter()
  const [profile, setProfile] = useState<Profile | null>(null)
  const [name, setName] = useState('')
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [echo, setEcho] = useState(true)
  const [noise, setNoise] = useState(true)

  useEffect(() => {
    const load = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      const { data } = await supabase.from('profiles').select('*').eq('id', user.id).single()
      setProfile(data)
      setName(data?.name || '')
    }
    load()
    if (typeof window !== 'undefined') {
      setEcho(localStorage.getItem('karaoku_echo') !== 'false')
      setNoise(localStorage.getItem('karaoku_noise') !== 'false')
    }
  }, [])

  const saveName = async () => {
    if (!profile) return
    setSaving(true)
    await supabase.from('profiles').update({ name: name.trim() }).eq('id', profile.id)
    setSaving(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  const toggleAudio = (key: 'echo' | 'noise', val: boolean) => {
    if (key === 'echo') { setEcho(val); localStorage.setItem('karaoku_echo', String(val)) }
    if (key === 'noise') { setNoise(val); localStorage.setItem('karaoku_noise', String(val)) }
  }

  if (!profile) return <div style={{ padding: 40, textAlign: 'center', color: '#666' }}>{t.loading}</div>

  const planLabel = lang === 'bm' && 'labelBm' in PLANS[profile.plan]
    ? (PLANS[profile.plan] as any).labelBm
    : PLANS[profile.plan].label

  return (
    <div style={{ padding: 24, maxWidth: 700, margin: '0 auto' }}>
      <h1 style={{ fontSize: 24, fontWeight: 900, marginBottom: 20, letterSpacing: -0.5 }}>
        {t.nav_settings}
      </h1>

      {/* ACCOUNT */}
      <SectionLabel text={t.settings_account} />
      <div style={{ background: s.dark, borderRadius: 12, padding: 16, marginBottom: 16 }}>
        <Row label={t.settings_name}>
          <input value={name} onChange={(e) => setName(e.target.value)} style={{ padding: '8px 12px', fontSize: 13 }} />
          <Button variant="ghost" size="sm" onClick={saveName} disabled={saving}>
            {saving ? '...' : saved ? t.saved : '✓'}
          </Button>
        </Row>
        <Row label={t.settings_email}>
          <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.7)' }}>{profile.email}</span>
        </Row>
        <Row label={t.settings_language} noBorder>
          <LangToggle />
        </Row>
      </div>

      {/* BILLING */}
      <SectionLabel text={t.settings_billing} />
      <div
        style={{
          background: s.dark,
          borderRadius: 12,
          padding: 16,
          marginBottom: 16,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: 12,
        }}
      >
        <div>
          <div style={{ fontSize: 14, fontWeight: 700 }}>{planLabel}</div>
          {profile.plan_expires_at && (
            <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)' }}>
              Expires: {new Date(profile.plan_expires_at).toLocaleDateString()}
            </div>
          )}
          {profile.plan === 'free' && (
            <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)' }}>
              Upgrade for unlimited queue, mic, and party mode
            </div>
          )}
        </div>
        <Link href="/pricing">
          <Button variant="primary" size="sm">{t.settings_upgrade}</Button>
        </Link>
      </div>

      {/* AUDIO */}
      <SectionLabel text={t.settings_audio} />
      <div style={{ background: s.dark, borderRadius: 12, padding: 16 }}>
        <Row label={t.settings_echo}>
          <Toggle on={echo} onChange={(v) => toggleAudio('echo', v)} />
        </Row>
        <Row label={t.settings_noise} noBorder>
          <Toggle on={noise} onChange={(v) => toggleAudio('noise', v)} />
        </Row>
      </div>
    </div>
  )
}

function SectionLabel({ text }: { text: string }) {
  return (
    <div
      style={{
        fontSize: 11,
        color: s.redLight,
        letterSpacing: 2,
        fontWeight: 800,
        marginBottom: 6,
      }}
    >
      {text}
    </div>
  )
}

function Row({ label, children, noBorder }: { label: string; children: React.ReactNode; noBorder?: boolean }) {
  return (
    <div
      style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '10px 0',
        borderBottom: noBorder ? 'none' : `1px solid ${s.gray}`,
        gap: 12,
      }}
    >
      <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.7)' }}>{label}</span>
      <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>{children}</div>
    </div>
  )
}

function Toggle({ on, onChange }: { on: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      onClick={() => onChange(!on)}
      style={{
        background: on ? s.red : s.gray,
        color: 'white',
        border: 'none',
        borderRadius: 100,
        padding: '5px 14px',
        fontSize: 10,
        fontWeight: 800,
        letterSpacing: 1,
        cursor: 'pointer',
      }}
    >
      {on ? 'ON' : 'OFF'}
    </button>
  )
}
