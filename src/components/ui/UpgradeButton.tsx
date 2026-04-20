'use client'

import { useState } from 'react'
import UpgradeModal from './UpgradeModal'
import { s } from '@/types'

interface Props {
  /** Hide button if user is already on paid plan. Pass the current plan string. */
  currentPlan?: string
  /** Label override, default "Upgrade" */
  label?: string
  /** Custom style override */
  style?: React.CSSProperties
}

export default function UpgradeButton({ currentPlan = 'free', label = 'Upgrade', style }: Props) {
  const [open, setOpen] = useState(false)

  // Don't show upgrade button for paid users
  if (currentPlan !== 'free') return null

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        style={{
          background: 'transparent',
          color: '#ff4757',
          border: `1px solid rgba(230,0,18,0.5)`,
          borderRadius: 100,
          padding: '2px 7px',
          fontSize: 9,
          fontWeight: 700,
          letterSpacing: 0.2,
          cursor: 'pointer',
          display: 'inline-flex',
          alignItems: 'center',
          gap: 3,
          fontFamily: 'inherit',
          whiteSpace: 'nowrap',
          ...style,
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.background = 'rgba(230,0,18,0.1)'
          e.currentTarget.style.borderColor = s.red
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.background = 'transparent'
          e.currentTarget.style.borderColor = 'rgba(230,0,18,0.5)'
        }}
      >
        ⚡ {label}
      </button>

      {open && <UpgradeModal onClose={() => setOpen(false)} />}
    </>
  )
}
