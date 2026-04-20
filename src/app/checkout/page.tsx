import { Suspense } from 'react'
import CheckoutClient from './CheckoutClient'

export default function CheckoutPage() {
  return (
    <Suspense fallback={<div style={{ padding: 40, color: 'white' }}>Loading...</div>}>
      <CheckoutClient />
    </Suspense>
  )
}
