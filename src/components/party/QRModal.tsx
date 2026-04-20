'use client'

import { useEffect, useRef } from 'react'
import Button from '@/components/ui/Button'
import { useLang } from '@/lib/i18n/LangProvider'
import { s } from '@/types'

interface Props {
  code: string
  onClose: () => void
}

export default function QRModal({ code, onClose }: Props) {
  const { t } = useLang()
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    if (!canvasRef.current) return
    const url = `${window.location.origin}/join/${code}`
    import('qrcode').then((QRCode) => {
      if (canvasRef.current) {
        QRCode.default.toCanvas(canvasRef.current, url, {
          width: 280,
          margin: 1,
          color: { dark: '#E60012', light: '#ffffff' },
        })
      }
    })
  }, [code])

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0,0,0,0.92)',
        zIndex: 100,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 20,
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: 'white',
          borderRadius: 20,
          padding: 32,
          maxWidth: 360,
          width: '100%',
          textAlign: 'center',
        }}
      >
        <div style={{ fontSize: 11, letterSpacing: 3, color: s.red, fontWeight: 900, marginBottom: 4 }}>
          {t.scan_to_join}
        </div>
        <div style={{ fontSize: 22, fontWeight: 900, color: '#111', marginBottom: 16 }}>{t.join_the_party}</div>
        <canvas ref={canvasRef} style={{ borderRadius: 12 }} />
        <div style={{ fontSize: 13, color: '#666', margin: '16px 0 8px' }}>{t.or_enter_code}</div>
        <div style={{ fontSize: 30, fontWeight: 900, letterSpacing: 8, color: s.red }}>{code}</div>
        <div style={{ marginTop: 20 }}>
          <Button variant="white" fullWidth onClick={onClose}>
            {t.done}
          </Button>
        </div>
      </div>
    </div>
  )
}
