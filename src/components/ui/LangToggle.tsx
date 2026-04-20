'use client'

import { useLang } from '@/lib/i18n/LangProvider'
import { s } from '@/types'

export default function LangToggle({ compact = false }: { compact?: boolean }) {
  const { lang, setLang } = useLang()
  return (
    <div
      style={{
        display: 'inline-flex',
        background: s.gray,
        borderRadius: 10,
        padding: 3,
        border: '2px solid rgba(255,255,255,0.1)',
        boxShadow: '0 4px 0 #111',
      }}
    >
      {(['en', 'bm'] as const).map((l) => (
        <button
          key={l}
          onClick={() => setLang(l)}
          style={{
            padding: compact ? '4px 10px' : '6px 12px',
            border: 'none',
            borderRadius: 7,
            background: lang === l ? s.red : 'transparent',
            color: lang === l ? 'white' : '#999',
            fontSize: compact ? 10 : 11,
            fontWeight: 800,
            letterSpacing: 1,
            cursor: 'pointer',
            transition: 'all 0.15s',
            fontFamily: 'inherit',
          }}
        >
          {l.toUpperCase()}
        </button>
      ))}
    </div>
  )
}
