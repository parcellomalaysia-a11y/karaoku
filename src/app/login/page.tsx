import { Suspense } from 'react'
import LoginClient from './LoginClient'

export default function LoginPage() {
  return (
    <Suspense fallback={<div style={{ padding: 40, color: '#888', textAlign: 'center' }}>Loading...</div>}>
      <LoginClient />
    </Suspense>
  )
}