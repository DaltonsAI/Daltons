import { NextRequest, NextResponse } from 'next/server'
import { stripe, PLANS, PlanType } from '@/lib/stripe'
import { getServerSession } from '@/lib/session/get-server-session'
import { db } from '@/lib/db/client'
import { subscriptions } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { plan } = body as { plan: PlanType }

    if (!plan || !PLANS[plan] || plan === 'free') {
      return NextResponse.json({ error: 'Invalid plan' }, { status: 400 })
    }

    const priceId = PLANS[plan].priceId
    if (!priceId) {
      return NextResponse.json({ error: 'Price not configured' }, { status: 500 })
    }

    // Check if user already has a subscription with a customer ID
    const [existingSub] = await db.select().from(subscriptions).where(eq(subscriptions.userId, session.user.id)).limit(1)

    const origin = request.headers.get('origin') || 'http://localhost:3000'

    const checkoutSession = await stripe.checkout.sessions.create({
      mode: 'subscription',
      payment_method_types: ['card'],
      customer: existingSub?.stripeCustomerId || undefined,
      customer_email: !existingSub ? session.user.email || undefined : undefined,
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: `${origin}/billing?success=true&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/billing?canceled=true`,
      metadata: {
        userId: session.user.id,
        plan,
      },
      subscription_data: {
        metadata: {
          userId: session.user.id,
          plan,
        },
      },
    })

    return NextResponse.json({ url: checkoutSession.url })
  } catch (error) {
    console.error('Stripe checkout error:', error)
    return NextResponse.json({ error: 'Failed to create checkout session' }, { status: 500 })
  }
}
