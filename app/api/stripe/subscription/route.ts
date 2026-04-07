import { NextResponse } from 'next/server'
import { getServerSession } from '@/lib/session/get-server-session'
import { db } from '@/lib/db/client'
import { subscriptions } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'
import { PLANS } from '@/lib/stripe'

export async function GET() {
  try {
    const session = await getServerSession()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const [sub] = await db.select().from(subscriptions).where(eq(subscriptions.userId, session.user.id)).limit(1)

    if (!sub || sub.status === 'canceled') {
      return NextResponse.json({
        plan: 'free',
        status: 'active',
        leadsPerCampaign: PLANS.free.leadsPerCampaign,
        features: PLANS.free.features,
      })
    }

    return NextResponse.json({
      plan: sub.plan,
      status: sub.status,
      currentPeriodEnd: sub.currentPeriodEnd,
      cancelAtPeriodEnd: sub.cancelAtPeriodEnd,
      leadsPerCampaign: PLANS[sub.plan].leadsPerCampaign,
      features: PLANS[sub.plan].features,
    })
  } catch (error) {
    console.error('Error fetching subscription:', error)
    return NextResponse.json({ error: 'Failed to fetch subscription' }, { status: 500 })
  }
}
