import { describe, it, expect } from 'vitest'
import { PLANS, getPlanLeadLimit } from '@/lib/stripe'

describe('Stripe plan config (lib/stripe)', () => {
  it('free plan has correct defaults', () => {
    expect(PLANS.free.price).toBe(0)
    expect(PLANS.free.priceId).toBeNull()
    expect(PLANS.free.leadsPerCampaign).toBe(5)
  })

  it('pro plan is Starter at €997', () => {
    expect(PLANS.pro.name).toBe('Starter')
    expect(PLANS.pro.price).toBe(997)
    expect(PLANS.pro.currency).toBe('eur')
    expect(PLANS.pro.leadsPerCampaign).toBe(30)
  })

  it('enterprise plan is Growth at €2497', () => {
    expect(PLANS.enterprise.name).toBe('Growth')
    expect(PLANS.enterprise.price).toBe(2497)
    expect(PLANS.enterprise.currency).toBe('eur')
    expect(PLANS.enterprise.leadsPerCampaign).toBe(100)
  })

  it('getPlanLeadLimit returns correct limits', () => {
    expect(getPlanLeadLimit('free')).toBe(5)
    expect(getPlanLeadLimit('pro')).toBe(30)
    expect(getPlanLeadLimit('enterprise')).toBe(100)
  })

  it('price IDs come from env vars', () => {
    expect(PLANS.pro.priceId).toBe(process.env.STRIPE_PRO_PRICE_ID)
    expect(PLANS.enterprise.priceId).toBe(process.env.STRIPE_ENTERPRISE_PRICE_ID)
  })
})
