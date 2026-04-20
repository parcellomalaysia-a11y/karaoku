'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Button from '@/components/ui/Button'
import { useLang } from '@/lib/i18n/LangProvider'
import { supabase } from '@/lib/supabase/client'
import { s, PromoCode, ADMIN_EMAILS } from '@/types'

export default function AdminPromoPage() {
  const { t } = useLang()
  const router = useRouter()
  const [codes, setCodes] = useState<PromoCode[]>([])
  const [loading, setLoading] = useState(true)
  const [showNew, setShowNew] = useState(false)
  const [form, setForm] = useState({ code: '', discount: 25, maxUses: 100, expiresAt: '', description: '' })

  useEffect(() => {
    const load = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user || !ADMIN_EMAILS.includes(user.email || '')) {
        router.push('/dashboard')
        return
      }
      const { data } = await supabase.from('promo_codes').select('*').order('created_at', { ascending: false })
      setCodes(data || [])
      setLoading(false)
    }
    load()
  }, [router])

  const createCode = async () => {
    const { error } = await supabase.from('promo_codes').insert({
      code: form.code.toUpperCase().trim(),
      discount_percent: form.discount,
      max_uses: form.maxUses,
      expires_at: form.expiresAt ? new Date(form.expiresAt).toISOString() : null,
      description: form.description || null,
    })
    if (!error) {
      setShowNew(false)
      setForm({ code: '', discount: 25, maxUses: 100, expiresAt: '', description: '' })
      const { data } = await supabase.from('promo_codes').select('*').order('created_at', { ascending: false })
      setCodes(data || [])
    } else {
      alert(error.message)
    }
  }

  const toggleActive = async (id: string, current: boolean) => {
    await supabase.from('promo_codes').update({ is_active: !current }).eq('id', id)
    setCodes(codes.map(c => c.id === id ? { ...c, is_active: !current } : c))
  }

  return (
    <div style={{ padding: 24, maxWidth: 1000, margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 18 }}>
        <div>
          <div style={{
            display: 'inline-block',
            padding: '3px 9px',
            background: 'rgba(230,0,18,0.15)',
            color: s.redLight,
            borderRadius: 100,
            fontSize: 10,
            fontWeight: 800,
            letterSpacing: 2,
          }}>
            {t.admin_badge}
          </div>
          <h1 style={{ fontSize: 24, fontWeight: 900, marginTop: 6, letterSpacing: -0.5 }}>
            {t.admin_promo_title}
          </h1>
        </div>
        <Button variant="primary" size="sm" onClick={() => setShowNew(true)}>
          + {t.admin_new_code}
        </Button>
      </div>

      {showNew && (
        <div style={{ background: s.dark, borderRadius: 12, padding: 16, marginBottom: 14 }}>
          <h3 style={{ fontSize: 14, fontWeight: 700, marginBottom: 10 }}>{t.admin_new_code}</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 8 }}>
            <input placeholder="CODE" value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })} style={{ padding: '10px 12px', fontSize: 13 }} />
            <input type="number" placeholder="% off" value={form.discount} onChange={(e) => setForm({ ...form, discount: +e.target.value })} style={{ padding: '10px 12px', fontSize: 13 }} />
            <input type="number" placeholder="Max uses" value={form.maxUses} onChange={(e) => setForm({ ...form, maxUses: +e.target.value })} style={{ padding: '10px 12px', fontSize: 13 }} />
            <input type="date" value={form.expiresAt} onChange={(e) => setForm({ ...form, expiresAt: e.target.value })} style={{ padding: '10px 12px', fontSize: 13 }} />
          </div>
          <input placeholder="Description (optional)" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} style={{ marginTop: 8, padding: '10px 12px', fontSize: 13 }} />
          <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
            <Button variant="primary" size="sm" onClick={createCode}>Create</Button>
            <Button variant="ghost" size="sm" onClick={() => setShowNew(false)}>{t.cancel}</Button>
          </div>
        </div>
      )}

      {loading ? (
        <div style={{ padding: 40, textAlign: 'center', color: '#666' }}>{t.loading}</div>
      ) : (
        <div style={{ background: s.dark, borderRadius: 12, overflow: 'auto' }}>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '1fr 90px 80px 80px 110px 90px',
              padding: '10px 14px',
              fontSize: 10,
              color: 'rgba(255,255,255,0.5)',
              borderBottom: `1px solid ${s.gray}`,
              letterSpacing: 1,
              fontWeight: 700,
            }}
          >
            <span>{t.admin_col_code}</span>
            <span>{t.admin_col_discount}</span>
            <span>{t.admin_col_used}</span>
            <span>{t.admin_col_max}</span>
            <span>{t.admin_col_expires}</span>
            <span>{t.admin_col_status}</span>
          </div>
          {codes.map(c => (
            <div
              key={c.id}
              style={{
                display: 'grid',
                gridTemplateColumns: '1fr 90px 80px 80px 110px 90px',
                padding: '12px 14px',
                fontSize: 12,
                borderBottom: `1px solid ${s.gray}`,
                alignItems: 'center',
              }}
            >
              <span style={{ fontWeight: 700, color: c.is_active ? s.red : 'rgba(255,255,255,0.5)' }}>{c.code}</span>
              <span>{c.discount_percent}%</span>
              <span>{c.used_count}</span>
              <span>{c.max_uses}</span>
              <span style={{ color: 'rgba(255,255,255,0.6)' }}>
                {c.expires_at ? new Date(c.expires_at).toLocaleDateString() : '—'}
              </span>
              <button
                onClick={() => toggleActive(c.id, c.is_active)}
                style={{
                  background: c.is_active ? 'rgba(34,197,94,0.2)' : s.gray,
                  color: c.is_active ? s.green : 'rgba(255,255,255,0.5)',
                  border: 'none',
                  padding: '3px 9px',
                  borderRadius: 100,
                  fontSize: 10,
                  fontWeight: 800,
                  letterSpacing: 1,
                  cursor: 'pointer',
                }}
              >
                {c.is_active ? t.admin_active : t.admin_inactive}
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
