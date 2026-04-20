'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Logo from '@/components/ui/Logo'
import Button from '@/components/ui/Button'
import LangToggle from '@/components/ui/LangToggle'
import { useLang } from '@/lib/i18n/LangProvider'
import { s } from '@/types'

export default function JoinPage() {
  const { t } = useLang()
  const router = useRouter()
  const [code, setCode] = useState('')

  const submit = (e: React.FormEvent) => {
    e.preventDefault()
    if (code.length < 4) return
    router.push(`/join/${code.toUpperCase()}`)
  }

  return (
    <div
      style={{
        minHeight: '100vh',
        background: s.black,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 20,
        position: 'relative',
      }}
    >
      <div style={{ position: 'absolute', top: 20, right: 20 }}>
        <LangToggle />
      </div>

      <form onSubmit={submit} style={{ maxWidth: 400, width: '100%', textAlign: 'center' }}>
        <Link href="/">
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 28 }}>
            <Logo size={56} />
          </div>
        </Link>

        <div
          style={{
            fontSize: 11,
            letterSpacing: 3,
            color: s.redLight,
            fontWeight: 800,
            marginBottom: 8,
          }}
        >
          {t.join_a_party}
        </div>
        <h1 style={{ fontSize: 28, fontWeight: 900, marginBottom: 24, letterSpacing: -1 }}>
          {t.enter_party_code}
        </h1>
        <input
          autoFocus
          value={code}
          onChange={(e) => setCode(e.target.value.toUpperCase())}
          placeholder="ABC123"
          maxLength={6}
          style={{
            textAlign: 'center',
            fontSize: 28,
            letterSpacing: 8,
            fontWeight: 900,
            marginBottom: 16,
          }}
        />
        <Button type="submit" variant="primary" size="lg" fullWidth disabled={code.length < 4}>
          {t.join_party_btn}
        </Button>
        <Link href="/">
          <div style={{ marginTop: 12 }}>
            <Button variant="ghost" fullWidth>
              {t.cancel}
            </Button>
          </div>
        </Link>
      </form>
    </div>
  )
}
