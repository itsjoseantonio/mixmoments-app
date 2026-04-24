import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);
const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
);

export async function POST(request: NextRequest) {
  const sig = request.headers.get('stripe-signature');
  if (!sig) return NextResponse.json({ error: 'Missing signature' }, { status: 400 });

  const rawBody = await request.text();

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(rawBody, sig, process.env.STRIPE_WEBHOOK_SECRET!);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    console.error('Webhook signature error:', message);
    return NextResponse.json({ error: `Webhook Error: ${message}` }, { status: 400 });
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object as Stripe.Checkout.Session;
    const clerkUserId = session.metadata?.clerkUserId;

    if (clerkUserId && session.payment_status === 'paid') {
      const { error } = await supabase.from('purchases').upsert(
        {
          clerk_user_id: clerkUserId,
          stripe_session_id: session.id,
          stripe_customer_id: session.customer,
          amount: session.amount_total,
          currency: session.currency,
          status: 'active',
          purchased_at: new Date().toISOString(),
        },
        { onConflict: 'clerk_user_id' },
      );

      if (error) {
        console.error('Supabase upsert error:', error);
        return NextResponse.json({ error: 'DB write failed' }, { status: 500 });
      }
    }
  }

  return NextResponse.json({ received: true });
}
