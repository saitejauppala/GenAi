import Stripe from 'stripe';
import { stripeSecret } from '../config';

const stripe = new Stripe(stripeSecret || '', { apiVersion: '2022-11-15' });

export async function createOrRetrieveCustomer(userId: string, email: string){
  // Try to find existing customer by metadata or email
  const list = await stripe.customers.list({ email, limit: 1 });
  if (list.data && list.data.length > 0) return list.data[0];
  const customer = await stripe.customers.create({ email, metadata: { userId } });
  return customer;
}

export async function createCheckoutSessionForCustomer(customerId: string, priceId: string, metadata: Record<string,string> = {}){
  const session = await stripe.checkout.sessions.create({
    payment_method_types: ['card'],
    mode: 'subscription',
    line_items: [{ price: priceId, quantity: 1 }],
    customer: customerId,
    metadata,
    success_url: process.env.STRIPE_SUCCESS_URL || 'https://example.com/success',
    cancel_url: process.env.STRIPE_CANCEL_URL || 'https://example.com/cancel'
  });
  return session;
}

export async function createCustomerPortalSession(customerId: string){
  const session = await stripe.billingPortal.sessions.create({
    customer: customerId,
    return_url: process.env.STRIPE_RETURN_URL || 'https://yourapp.com/account'
  });
  return session;
}

export { stripe };
