import { NextResponse } from 'next/server'
import Stripe from 'stripe'
import { getRouteHandlerSupabase } from '@/lib/supabase/server'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: '2024-06-20' })

const PRICE_MAP: Record<string, string | undefined> = {
  day: process.env.STRIPE_PRICE_DAY,
  month: process.env.STRIPE_PRICE_MONTHLY,
  year: process.env.STRIPE_PRICE_YEARLY,
}

export async function POST(req: Request) {
  try {
    const { plan, promoCode } = await req.json()
    const priceId = PRICE_MAP[plan]
    if (!priceId) return NextResponse.json({ error: 'Invalid plan' }, { status: 400 })

    const supabase = getRouteHandlerSupabase()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })

    // Validate promo
    let discountId: string | undefined
    if (promoCode) {
      const { data: promo } = await supabase
        .from('promo_codes')
        .select('id, discount_percent, max_uses, used_count, expires_at, is_active')
        .eq('code', promoCode)
        .single()

      if (
        promo &&
        promo.is_active &&
        promo.used_count < promo.max_uses &&
        (!promo.expires_at || new Date(promo.expires_at) > new Date())
      ) {
        // Create one-shot Stripe coupon
        const coupon = await stripe.coupons.create({
          percent_off: promo.discount_percent,
          duration: 'once',
          name: promoCode,
        })
        discountId = coupon.id
      }
    }

    const origin = req.headers.get('origin') || process.env.NEXT_PUBLIC_APP_URL

    const isSubscription = plan === 'month' || plan === 'year'

    const session = await stripe.checkout.sessions.create({
      mode: isSubscription ? 'subscription' : 'payment',
      // FPX & GrabPay only work for one-time payments (Day Pass).
      // Subscriptions must use card only.
      payment_method_types: isSubscription ? ['card'] : ['card', 'fpx', 'grabpay'],
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: `${origin}/dashboard?checkout=success`,
      cancel_url: `${origin}/pricing?checkout=cancel`,
      customer_email: user.email,
      client_reference_id: user.id,
      metadata: {
        userId: user.id,
        plan,
        promoCode: promoCode || '',
      },
      discounts: discountId ? [{ coupon: discountId }] : undefined,
    })

    return NextResponse.json({ url: session.url })
  } catch (err: any) {
    console.error('[checkout] error', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}