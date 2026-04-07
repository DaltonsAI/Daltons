'use client'

import { useState } from 'react'
import { PLANS, PlanType } from '@/lib/stripe'
import { toast } from 'sonner'
import { Check, Zap, Crown, Atom, ArrowRight, Shield, Clock, Users } from 'lucide-react'
import { Button } from '@/components/ui/button'
import type { Session } from '@/lib/session/types'

interface BillingPageContentProps {
  user: Session['user']
  currentPlan: 'free' | 'pro' | 'enterprise'
  subscription: {
    status: string
    currentPeriodEnd: string | null
    cancelAtPeriodEnd: boolean
  } | null
}

const planIcons = {
  free: Atom,
  pro: Zap,
  enterprise: Crown,
}

const planGradients = {
  free: 'from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800',
  pro: 'from-blue-50 to-indigo-50 dark:from-blue-950 dark:to-indigo-950',
  enterprise: 'from-purple-50 to-fuchsia-50 dark:from-purple-950 dark:to-fuchsia-950',
}

const planBorders = {
  free: 'border-border',
  pro: 'border-blue-400 ring-2 ring-blue-400/30 shadow-lg shadow-blue-500/10',
  enterprise: 'border-purple-400 ring-2 ring-purple-400/30 shadow-lg shadow-purple-500/10',
}

const planButtonClass = {
  free: 'bg-muted text-muted-foreground cursor-default',
  pro: 'bg-blue-600 hover:bg-blue-700 text-white shadow-md shadow-blue-500/25',
  enterprise: 'bg-purple-600 hover:bg-purple-700 text-white shadow-md shadow-purple-500/25',
}

const trustBadges = [
  { icon: Shield, text: 'Veilig betalen via Stripe' },
  { icon: Clock, text: 'Resultaat binnen 48 uur' },
  { icon: Users, text: '100+ tevreden klanten' },
]

export function BillingPageContent({ user, currentPlan, subscription }: BillingPageContentProps) {
  const [loading, setLoading] = useState<PlanType | null>(null)
  const [portalLoading, setPortalLoading] = useState(false)

  const handleUpgrade = async (plan: PlanType) => {
    if (plan === 'free' || plan === currentPlan) return
    setLoading(plan)
    try {
      const res = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plan }),
      })
      const data = await res.json()
      if (data.url) {
        window.location.href = data.url
      } else {
        toast.error('Checkout starten mislukt')
      }
    } catch {
      toast.error('Checkout starten mislukt')
    } finally {
      setLoading(null)
    }
  }

  const handleManageBilling = async () => {
    setPortalLoading(true)
    try {
      const res = await fetch('/api/stripe/portal', { method: 'POST' })
      const data = await res.json()
      if (data.url) {
        window.location.href = data.url
      } else {
        toast.error('Betalingsportaal openen mislukt')
      }
    } catch {
      toast.error('Betalingsportaal openen mislukt')
    } finally {
      setPortalLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <div className="bg-gradient-to-b from-muted/50 to-background py-12 sm:py-16 px-4">
        <div className="max-w-3xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 bg-blue-500/10 text-blue-600 dark:text-blue-400 text-xs font-semibold px-3 py-1.5 rounded-full mb-4 border border-blue-500/20">
            <Zap className="h-3 w-3" />
            AI-gedreven lead generation
          </div>
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight mb-4">
            Campagne Plannen
          </h1>
          <p className="text-base sm:text-lg text-muted-foreground max-w-xl mx-auto">
            {currentPlan !== 'free'
              ? `Je zit op het ${PLANS[currentPlan].name} plan. Beheer je campagnes hieronder.`
              : 'Kies een campagne en ontvang dagelijks gekwalificeerde B2B leads via Apollo + Claude AI.'}
          </p>
          {subscription?.currentPeriodEnd && (
            <p className="text-sm text-muted-foreground mt-3">
              {subscription.cancelAtPeriodEnd
                ? `Eindigt op ${new Date(subscription.currentPeriodEnd).toLocaleDateString('nl-NL')}`
                : `Verlengt op ${new Date(subscription.currentPeriodEnd).toLocaleDateString('nl-NL')}`}
            </p>
          )}
          {currentPlan !== 'free' && (
            <Button
              variant="outline"
              size="sm"
              className="mt-5"
              onClick={handleManageBilling}
              disabled={portalLoading}
            >
              {portalLoading ? 'Laden...' : 'Betalingen Beheren'}
            </Button>
          )}
        </div>
      </div>

      {/* Pricing Cards */}
      <div className="max-w-6xl mx-auto px-4 pb-16">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6">
          {(Object.keys(PLANS) as PlanType[]).map((plan) => {
            const planData = PLANS[plan]
            const Icon = planIcons[plan]
            const isCurrentPlan = plan === currentPlan
            const isPro = plan === 'pro'

            return (
              <div
                key={plan}
                className={`relative rounded-2xl border bg-gradient-to-b ${planGradients[plan]} ${planBorders[plan]} p-6 sm:p-7 flex flex-col gap-5 transition-transform hover:-translate-y-0.5`}
              >
                {isPro && (
                  <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 whitespace-nowrap">
                    <span className="bg-blue-600 text-white text-xs font-bold px-4 py-1.5 rounded-full shadow-md">
                      Meest Gekozen
                    </span>
                  </div>
                )}

                {/* Plan header */}
                <div className="flex items-start gap-3 mt-1">
                  <div
                    className={`p-2.5 rounded-xl flex-shrink-0 ${
                      plan === 'enterprise'
                        ? 'bg-purple-500/15 text-purple-500'
                        : plan === 'pro'
                          ? 'bg-blue-500/15 text-blue-500'
                          : 'bg-muted text-muted-foreground'
                    }`}
                  >
                    <Icon className="h-5 w-5" />
                  </div>
                  <div>
                    <h2 className="font-bold text-lg leading-tight">{planData.name}</h2>
                    <div className="flex items-baseline gap-1 mt-0.5">
                      <span className="text-3xl font-extrabold">
                        {planData.price === 0 ? 'Gratis' : `€${planData.price.toLocaleString('nl-NL')}`}
                      </span>
                      {planData.price > 0 && (
                        <span className="text-sm text-muted-foreground font-normal">/campagne</span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Lead count highlight */}
                <div
                  className={`rounded-xl px-4 py-3 text-center ${
                    plan === 'enterprise'
                      ? 'bg-purple-500/10 text-purple-700 dark:text-purple-300'
                      : plan === 'pro'
                        ? 'bg-blue-500/10 text-blue-700 dark:text-blue-300'
                        : 'bg-muted text-muted-foreground'
                  }`}
                >
                  <span className="text-2xl font-extrabold">{planData.leadsPerCampaign}</span>
                  <span className="text-sm font-medium ml-1">gekwalificeerde leads</span>
                </div>

                {/* Features */}
                <ul className="flex flex-col gap-2.5 flex-1">
                  {planData.features.map((feature) => (
                    <li key={feature} className="flex items-start gap-2.5 text-sm">
                      <Check
                        className={`h-4 w-4 flex-shrink-0 mt-0.5 ${
                          plan === 'enterprise'
                            ? 'text-purple-500'
                            : plan === 'pro'
                              ? 'text-blue-500'
                              : 'text-green-500'
                        }`}
                      />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>

                {/* CTA Button */}
                <Button
                  className={`w-full mt-1 h-11 font-semibold transition-all ${
                    isCurrentPlan
                      ? 'border-2'
                      : plan === 'free'
                        ? planButtonClass.free
                        : planButtonClass[plan]
                  }`}
                  variant={isCurrentPlan ? 'outline' : 'default'}
                  disabled={isCurrentPlan || plan === 'free' || loading !== null}
                  onClick={() => handleUpgrade(plan)}
                >
                  {loading === plan ? (
                    <span className="flex items-center gap-2">
                      <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                      </svg>
                      Laden...
                    </span>
                  ) : isCurrentPlan ? (
                    'Huidig Plan'
                  ) : plan === 'free' ? (
                    'Gratis Demo'
                  ) : (
                    <span className="flex items-center gap-2">
                      Start {planData.name}
                      <ArrowRight className="h-4 w-4" />
                    </span>
                  )}
                </Button>
              </div>
            )
          })}
        </div>

        {/* Trust badges */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-8 mt-10 pt-8 border-t border-border/60">
          {trustBadges.map(({ icon: Icon, text }) => (
            <div key={text} className="flex items-center gap-2 text-sm text-muted-foreground">
              <Icon className="h-4 w-4 text-green-500 flex-shrink-0" />
              {text}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
