import { getServerSession } from '@/lib/session/get-server-session'
import { redirect } from 'next/navigation'
import { BillingPageContent } from '@/components/billing-page-content'
import { db } from '@/lib/db/client'
import { subscriptions } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'

export default async function BillingPage() {
  const session = await getServerSession()
  if (!session?.user?.id) {
    redirect('/')
  }

  const [sub] = await db.select().from(subscriptions).where(eq(subscriptions.userId, session.user.id)).limit(1)

  const currentPlan = !sub || sub.status === 'canceled' ? 'free' : sub.plan

  return (
    <BillingPageContent
      user={session.user}
      currentPlan={currentPlan}
      subscription={
        sub && sub.status !== 'canceled'
          ? {
              status: sub.status,
              currentPeriodEnd: sub.currentPeriodEnd?.toISOString() ?? null,
              cancelAtPeriodEnd: sub.cancelAtPeriodEnd ?? false,
            }
          : null
      }
    />
  )
}
