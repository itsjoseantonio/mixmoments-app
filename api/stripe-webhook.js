import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Vercel: disable body parsing so we get the raw body for Stripe signature verification
export const config = { api: { bodyParser: false } };

async function getRawBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    req.on('data', c => chunks.push(c));
    req.on('end', () => resolve(Buffer.concat(chunks)));
    req.on('error', reject);
  });
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  const sig = req.headers['stripe-signature'];
  const rawBody = await getRawBody(req);

  let event;
  try {
    event = stripe.webhooks.constructEvent(rawBody, sig, process.env.STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    console.error('Webhook signature error:', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object;
    const clerkUserId = session.metadata?.clerkUserId;

    if (clerkUserId && session.payment_status === 'paid') {
      const { error } = await supabase.from('purchases').upsert({
        clerk_user_id: clerkUserId,
        stripe_session_id: session.id,
        stripe_customer_id: session.customer,
        amount: session.amount_total,
        currency: session.currency,
        status: 'active',
        purchased_at: new Date().toISOString(),
      }, { onConflict: 'clerk_user_id' });

      if (error) {
        console.error('Supabase upsert error:', error);
        return res.status(500).json({ error: 'DB write failed' });
      }
    }
  }

  res.status(200).json({ received: true });
}
