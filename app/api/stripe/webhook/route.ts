import { NextRequest, NextResponse } from 'next/server'
import { stripe } from '@/lib/stripe'
import { db } from '@/lib/db/client'
import { subscriptions } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'
import type Stripe from 'stripe'

type SubStatus = 'active' | 'canceled' | 'incomplete' | 'past_due' | 'trialing' | 'unpaid'

function mapStatus(s: string): SubStatus {
  const allowed: SubStatus[] = ['active', 'canceled', 'incomplete', 'past_due', 'trialing', 'unpaid']
  return allowed.includes(s as SubStatus) ? (s as SubStatus) : 'incomplete'
}

function getPeriodStart(sub: Stripe.Subscription): Date | undefined {
  const item = sub.items?.data?.[0]
  const val = (item as any)?.current_period_start ?? (sub as any).current_period_start
  return val ? new Date(val * 1000) : undefined
}

function getPeriodEnd(sub: Stripe.Subscription): Date | undefined {
  const item = sub.items?.data?.[0]
  const val = (item as any)?.current_period_end ?? (sub as any).current_period_end
  return val ? new Date(val * 1000) : undefined
}

export async function POST(request: NextRequest) {
  const body = await request.text()
  const signature = request.headers.get('stripe-signature')

  if (!signature) {
    return NextResponse.json({ error: 'Missing stripe-signature header' }, { status: 400 })
  }

  let event: Stripe.Event

  try {
    event = stripe.webhooks.constructEvent(body, signature, process.env.STRIPE_WEBHOOK_SECRET!)
  } catch (error) {
    console.error('Webhook signature verification failed:', error)
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session
        if (session.mode !== 'subscription') break

        const userId = session.metadata?.userId
        const plan = session.metadata?.plan as 'pro' | 'enterprise'
        if (!userId || !plan) break

        const stripeSubscription = await stripe.subscriptions.retrieve(session.subscription as string)

        await db
          .insert(subscriptions)
          .values({
            id: stripeSubscription.id,
            userId,
            stripeCustomerId: stripeSubscription.customer as string,
            stripePriceId: stripeSubscription.items.data[0].price.id,
            plan,
            status: mapStatus(stripeSubscription.status),
            currentPeriodStart: getPeriodStart(stripeSubscription),
            currentPeriodEnd: getPeriodEnd(stripeSubscription),
            cancelAtPeriodEnd: stripeSubscription.cancel_at_period_end,
          })
          .onConflictDoUpdate({
            target: subscriptions.id,
            set: {
              plan,
              status: mapStatus(stripeSubscription.status),
              stripePriceId: stripeSubscription.items.data[0].price.id,
              currentPeriodStart: getPeriodStart(stripeSubscription),
              currentPeriodEnd: getPeriodEnd(stripeSubscription),
              cancelAtPeriodEnd: stripeSubscription.cancel_at_period_end,
              updatedAt: new Date(),
            },
          })

        break
      }

      case 'customer.subscription.updated': {
        const stripeSubscription = event.data.object as Stripe.Subscription

        await db
          .update(subscriptions)
          .set({
            status: mapStatus(stripeSubscription.status),
            currentPeriodStart: getPeriodStart(stripeSubscription),
            currentPeriodEnd: getPeriodEnd(stripeSubscription),
            cancelAtPeriodEnd: stripeSubscription.cancel_at_period_end,
            updatedAt: new Date(),
          })
          .where(eq(subscriptions.id, stripeSubscription.id))

        break
      }

      case 'customer.subscription.deleted': {
        const stripeSubscription = event.data.object as Stripe.Subscription

        await db
          .update(subscriptions)
          .set({
            status: 'canceled',
            updatedAt: new Date(),
          })
          .where(eq(subscriptions.id, stripeSubscription.id))

        break
      }
    }

    return NextResponse.json({ received: true })
  } catch (error) {
    console.error('Webhook handler error:', error)
    return NextResponse.json({ error: 'Webhook handler failed' }, { status: 500 })
  }
}
