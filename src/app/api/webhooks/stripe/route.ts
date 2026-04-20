import { NextResponse } from 'next/server'
import Stripe from 'stripe'
import { getAdminSupabase } from '@/lib/supabase/server'
import { PLANS, Plan } from '@/types'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: '2024-06-20' })
const WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET!

export async function POST(req: Request) {
  const body = await req.text()
  const sig = req.headers.get('stripe-signature')!
  let event: Stripe.Event

  try {
    event = stripe.webhooks.constructEvent(body, sig, WEBHOOK_SECRET)
  } catch (err: any) {
    console.error('[webhook] bad signature', err.message)
    return NextResponse.json({ error: 'Bad signature' }, { status: 400 })
  }

  const admin = getAdminSupabase()

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object as Stripe.Checkout.Session
    const userId = session.metadata?.userId
    const plan = session.metadata?.plan as Plan | undefined
    const promoCode = session.metadata?.promoCode

    if (userId && plan && plan !== 'free') {
      const durHours = PLANS[plan as Exclude<Plan, 'free'>].durationHours
      const expiresAt = new Date(Date.now() + durHours * 60 * 60 * 1000).toISOString()

      await admin
        .from('profiles')
        .update({
          plan,
          plan_upgraded_at: new Date().toISOString(),
          plan_expires_at: expiresAt,
        })
        .eq('id', userId)

      // Increment promo usage
      if (promoCode) {
        const { data: promo } = await admin
          .from('promo_codes')
          .select('id, used_count')
          .eq('code', promoCode)
          .single()
        if (promo) {
          await admin.from('promo_codes').update({ used_count: promo.used_count + 1 }).eq('id', promo.id)
          await admin.from('promo_uses').insert({ promo_id: promo.id, user_id: userId })
        }
      }
    }
  }

  return NextResponse.json({ received: true })
}
