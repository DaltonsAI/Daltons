import Stripe from 'stripe'

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!)

export const PLANS = {
  free: {
    name: 'Gratis Demo',
    price: 0,
    currency: 'eur',
    priceId: null,
    leadsPerCampaign: 5,
    features: ['5 demo leads', 'Claude AI scoring preview', 'Apollo discovery', 'Email support'],
  },
  pro: {
    name: 'Starter',
    price: 997,
    currency: 'eur',
    priceId: process.env.STRIPE_PRO_PRICE_ID,
    leadsPerCampaign: 30,
    features: [
      '30 gekwalificeerde leads',
      'Claude AI scoring (0–100)',
      'Apollo.io prospecting',
      'Instantly outreach sequenties',
      'Airtable CRM sync',
      'Notion rapportage',
      'E-mail support',
    ],
  },
  enterprise: {
    name: 'Growth',
    price: 2497,
    currency: 'eur',
    priceId: process.env.STRIPE_ENTERPRISE_PRICE_ID,
    leadsPerCampaign: 100,
    features: [
      '100 gekwalificeerde leads',
      'Claude AI scoring (0–100)',
      'Apollo.io prospecting',
      'Instantly multi-step sequenties',
      'Airtable CRM sync',
      'Notion rapportage',
      'Prioriteit support',
      'Campagne optimalisatie',
    ],
  },
} as const

export type PlanType = keyof typeof PLANS

export function getPlanLeadLimit(plan: PlanType): number {
  return PLANS[plan].leadsPerCampaign
}

// Keep backward compat alias
export const getPlanTaskLimit = getPlanLeadLimit
