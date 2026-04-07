/**
 * Daltons AI — Stripe Checkout Handler
 * Daltons AI B.V. · KvK 97688835
 *
 * Gebruik: POST /api/checkout met { plan: 'starter' | 'growth' | 'enterprise' }
 * Geeft terug: { url: '<stripe checkout url>' }
 *
 * Vereist env vars:
 *   STRIPE_SECRET_KEY — Stripe secret key (sk_live_...)
 *   NEXT_PUBLIC_BASE_URL — basis URL van de site (bijv. https://daltonsai.nl)
 */

const PLANS = {
  starter: {
    name: 'Starter Plan — 30 Hot Leads / kwartaal',
    amount: 49700,          // € 497,00 in cents
    currency: 'eur',
    interval: 'month',
    interval_count: 3,
    leads: 30,
  },
  growth: {
    name: 'Growth Plan — 100 Hot Leads / kwartaal',
    amount: 119700,         // € 1.197,00 in cents
    currency: 'eur',
    interval: 'month',
    interval_count: 3,
    leads: 100,
  },
  enterprise: {
    name: 'Enterprise Plan — 350+ Hot Leads / kwartaal',
    amount: 299700,         // € 2.997,00 in cents
    currency: 'eur',
    interval: 'month',
    interval_count: 3,
    leads: 350,
  },
};

/**
 * createCheckoutSession
 * Maak een Stripe Checkout Session aan voor een kwartaalabonnement.
 *
 * @param {string} plan - 'starter' | 'growth' | 'enterprise'
 * @param {string} customerEmail - optioneel e-mailadres voor prefill
 * @returns {Promise<{ url: string }>}
 */
async function createCheckoutSession(plan, customerEmail) {
  const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://daltonsai.nl';

  const selectedPlan = PLANS[plan];
  if (!selectedPlan) {
    throw new Error(`Ongeldig plan: ${plan}. Kies: starter, growth of enterprise.`);
  }

  const price = await stripe.prices.create({
    currency: selectedPlan.currency,
    unit_amount: selectedPlan.amount,
    recurring: {
      interval: selectedPlan.interval,
      interval_count: selectedPlan.interval_count,
    },
    product_data: {
      name: selectedPlan.name,
      metadata: {
        leads_per_quarter: selectedPlan.leads,
        provider: 'Daltons AI B.V.',
        kvk: '97688835',
      },
    },
  });

  const sessionParams = {
    mode: 'subscription',
    line_items: [{ price: price.id, quantity: 1 }],
    success_url: `${baseUrl}/dashboard/?checkout=success&plan=${plan}`,
    cancel_url: `${baseUrl}/#pricing`,
    payment_method_types: ['card', 'ideal'],
    billing_address_collection: 'required',
    tax_id_collection: { enabled: true },
    metadata: {
      plan,
      leads_per_quarter: selectedPlan.leads,
      kvk: '97688835',
    },
  };

  if (customerEmail) {
    sessionParams.customer_email = customerEmail;
  }

  const session = await stripe.checkout.sessions.create(sessionParams);
  return { url: session.url };
}

/**
 * Next.js API Route Handler (app router)
 * POST /api/checkout
 */
async function POST(request) {
  try {
    const body = await request.json();
    const { plan, email } = body;

    if (!plan || !PLANS[plan]) {
      return Response.json(
        { error: 'Ongeldig plan. Kies: starter, growth of enterprise.' },
        { status: 400 }
      );
    }

    const { url } = await createCheckoutSession(plan, email);
    return Response.json({ url });
  } catch (err) {
    console.error('[Daltons AI Checkout Error]', err.message);
    return Response.json(
      { error: 'Kon checkout sessie niet aanmaken. Probeer opnieuw of mail Daltonsaisystems@gmail.com.' },
      { status: 500 }
    );
  }
}

module.exports = { POST, createCheckoutSession, PLANS };
