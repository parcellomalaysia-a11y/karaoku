'use client'

import { CSSProperties, ReactNode } from 'react'
import { s } from '@/types'

type Variant = 'primary' | 'ghost' | 'white' | 'danger'
type Size = 'sm' | 'md' | 'lg'

interface Props {
  children: ReactNode
  onClick?: (e: React.MouseEvent<HTMLButtonElement>) => void
  variant?: Variant
  size?: Size
  disabled?: boolean
  type?: 'button' | 'submit'
  style?: CSSProperties
  fullWidth?: boolean
  title?: string
}

export default function Button({
  children,
  onClick,
  variant = 'primary',
  size = 'md',
  disabled,
  type = 'button',
  style,
  fullWidth,
  title,
}: Props) {
  const sizes: Record<Size, { padding: string; fontSize: number }> = {
    sm: { padding: '8px 14px', fontSize: 12 },
    md: { padding: '12px 24px', fontSize: 14 },
    lg: { padding: '16px 32px', fontSize: 16 },
  }

  const variants: Record<Variant, CSSProperties> = {
    primary: {
      background: s.red,
      color: 'white',
      boxShadow: `0 6px 0 ${s.redDark}, 0 8px 16px rgba(230,0,18,0.25)`,
      border: '2px solid rgba(255,255,255,0.15)',
    },
    ghost: {
      background: s.gray,
      color: 'white',
      boxShadow: `0 6px 0 #111, 0 8px 16px rgba(0,0,0,0.3)`,
      border: '2px solid rgba(255,255,255,0.15)',
    },
    white: {
      background: 'white',
      color: s.red,
      boxShadow: `0 6px 0 #ccc`,
      border: '2px solid rgba(0,0,0,0.08)',
    },
    danger: {
      background: '#dc2626',
      color: 'white',
      boxShadow: `0 6px 0 #7f1d1d`,
      border: '2px solid rgba(255,255,255,0.15)',
    },
  }

  const handleDown = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (disabled) return
    e.currentTarget.style.transform = 'translateY(4px)'
    const cur = variants[variant].boxShadow as string
    e.currentTarget.style.boxShadow = cur.replace('0 6px 0', '0 2px 0')
  }
  const handleUp = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (disabled) return
    e.currentTarget.style.transform = 'translateY(0)'
    e.currentTarget.style.boxShadow = variants[variant].boxShadow as string
  }

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      title={title}
      onMouseDown={handleDown}
      onMouseUp={handleUp}
      onMouseLeave={handleUp}
      style={{
        ...variants[variant],
        ...sizes[size],
        borderRadius: 12,
        fontWeight: 700,
        cursor: disabled ? 'not-allowed' : 'pointer',
        opacity: disabled ? 0.5 : 1,
        letterSpacing: 0.5,
        transition: 'transform 0.1s, box-shadow 0.1s',
        fontFamily: 'inherit',
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 6,
        width: fullWidth ? '100%' : undefined,
        ...style,
      }}
    >
      {children}
    </button>
  )
}
