import { Request, Response } from 'express';
import { createCheckoutSessionForCustomer, createCustomerPortalSession, createOrRetrieveCustomer, stripe } from '../services/billingService';
import User from '../models/user';
import Subscription from '../models/subscription';
import crypto from 'crypto';
import ProcessedEvent from '../models/processedEvent';

export async function createCheckout(req: any, res: Response){
  const { priceId } = req.body;
  if (!priceId) return res.status(400).json({ message: 'Missing priceId' });
  const user = await User.findById(req.user.id);
  if (!user) return res.status(401).json({ message: 'Unauthorized' });

  // Create or retrieve stripe customer and create a checkout session tied to this internal user
  const customer = await createOrRetrieveCustomer(user._id.toString(), user.email);

  // create a one-time internal token to validate webhook payloads
  const internalToken = crypto.randomBytes(16).toString('hex');

  const session = await createCheckoutSessionForCustomer(customer.id, priceId, { userId: user._id.toString(), token: internalToken });

  // persist mapping so we can validate webhook events (by checkout session id)
  await Subscription.findOneAndUpdate({ user: user._id }, { stripeCustomerId: customer.id, checkoutSessionId: session.id }, { upsert: true });

  res.json({ url: session.url, id: session.id });
}

export async function createPortal(req: any, res: Response){
  const user = await User.findById(req.user.id);
  if (!user) return res.status(401).json({ message: 'Unauthorized' });
  // Ensure we have a stripe customer id in subscription record
  const sub = await Subscription.findOne({ user: user._id });
  if (!sub || !sub.stripeCustomerId) return res.status(400).json({ message: 'No Stripe customer on record' });
  const session = await createCustomerPortalSession(sub.stripeCustomerId);
  res.json({ url: session.url });
}

export async function webhookHandler(req: Request, res: Response){
  const sig = (req.headers['stripe-signature'] as string) || '';
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET || '';
  let event: any;
  try{
    event = stripe.webhooks.constructEvent((req as any).rawBody, sig, webhookSecret);
  }catch(err:any){
    console.error('Webhook signature verification failed', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  // Idempotency / replay protection: ensure we only process each event.id once.
  const eventId = event.id;
  if (!eventId) return res.status(400).send('Missing event id');

  try{
    // Attempt to insert a processed-event record atomically to claim this event id.
    // If another worker has already processed it, the unique index will prevent duplication.
    try{
      await ProcessedEvent.create({ eventId: eventId, type: event.type, payload: event.data.object });
    }catch(createErr:any){
      // Duplicate key error means already processed.
      if (createErr && createErr.code === 11000){
        return res.json({ received: true });
      }
      throw createErr;
    }

    // Now process events (we already recorded claim so retries won't reprocess)
    switch(event.type){
      case 'checkout.session.completed':{
        const sessionObj = event.data.object;
        // retrieve authoritative session data from Stripe
        const session = await stripe.checkout.sessions.retrieve(sessionObj.id, { expand: ['customer', 'subscription'] });

        // validate metadata and match against internal subscription record
        const metadata = session.metadata || {};
        const userId = metadata.userId;
        const token = metadata.token;

        if (!userId || !token) {
          console.warn('Checkout session missing metadata; ignoring');
          break;
        }

        const subRecord = await Subscription.findOne({ user: userId });
        if (!subRecord || subRecord.checkoutSessionId !== session.id) {
          console.warn('No matching subscription record for checkout session; possible mismatch');
          break;
        }

        // At this point the session is validated against our stored session id; mark active
        const subscriptionId = session.subscription as string | undefined;
        await Subscription.findOneAndUpdate(
          { user: userId },
          { stripeCustomerId: (session.customer as any)?.id || subRecord.stripeCustomerId, stripeSubscriptionId: subscriptionId, plan: 'premium', status: 'active' },
          { upsert: true }
        );

        const user = await User.findById(userId);
        if (user){ user.plan = 'premium'; await user.save(); }

        break;
      }
      case 'invoice.payment_failed':{
        const invoice = event.data.object;
        const subId = invoice.subscription;
        await Subscription.findOneAndUpdate({ stripeSubscriptionId: subId }, { status: 'past_due' });
        break;
      }
      case 'customer.subscription.deleted':{
        const sub = event.data.object;
        await Subscription.findOneAndUpdate({ stripeSubscriptionId: sub.id }, { status: 'canceled' });
        // also downgrade user
        const s = await Subscription.findOne({ stripeSubscriptionId: sub.id });
        if (s){
          const user = await User.findById(s.user);
          if (user){ user.plan = 'free'; await user.save(); }
        }
        break;
      }
      case 'customer.subscription.updated':{
        const sub = event.data.object;
        await Subscription.findOneAndUpdate({ stripeSubscriptionId: sub.id }, { status: sub.status, currentPeriodEnd: new Date(sub.current_period_end * 1000) });
        break;
      }
      default:
        // no-op for unhandled event types
    }

    return res.json({ received: true });
  }catch(err){
    console.error('Error processing webhook', err);
    return res.status(500).send('Error');
  }
}
