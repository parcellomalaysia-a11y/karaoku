'use client'

import { useLang } from '@/lib/i18n/LangProvider'
import { s } from '@/types'

export default function Logo({
  size = 40,
  showSubtitle = true,
  onClick,
}: {
  size?: number
  showSubtitle?: boolean
  onClick?: () => void
}) {
  const { t } = useLang()
  return (
    <div
      onClick={onClick}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        cursor: onClick ? 'pointer' : 'default',
      }}
    >
      <div
        style={{
          width: size,
          height: size,
          background: s.red,
          borderRadius: '50%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: `0 4px 0 ${s.redDark}, inset 0 -4px 8px rgba(0,0,0,0.2)`,
          flexShrink: 0,
        }}
      >
        <svg width={size * 0.55} height={size * 0.55} viewBox="0 0 24 24" fill="white">
          <path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z" />
        </svg>
      </div>
      <div>
        <div
          style={{
            fontSize: size * 0.42,
            fontWeight: 900,
            letterSpacing: '-1px',
            color: 'white',
            lineHeight: 1,
          }}
        >
          KARAOKU
        </div>
        {showSubtitle && (
          <div
            style={{
              fontSize: size * 0.18,
              fontWeight: 500,
              color: s.redLight,
              letterSpacing: '2px',
              marginTop: 2,
            }}
          >
            {t.tagline}
          </div>
        )}
      </div>
    </div>
  )
}
