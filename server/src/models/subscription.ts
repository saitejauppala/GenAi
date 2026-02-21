import mongoose, { Schema, Document } from 'mongoose';

export interface ISubscription extends Document {
  user: mongoose.Types.ObjectId;
  stripeCustomerId?: string;
  stripeSubscriptionId?: string;
  checkoutSessionId?: string;
  plan: 'free' | 'premium';
  status: 'active' | 'past_due' | 'canceled' | 'trialing';
  currentPeriodEnd?: Date;
}

const SubscriptionSchema: Schema = new Schema({
  user: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  stripeCustomerId: { type: String },
  stripeSubscriptionId: { type: String },
  checkoutSessionId: { type: String },
  plan: { type: String, enum: ['free', 'premium'], default: 'free' },
  status: { type: String, enum: ['active','past_due','canceled','trialing'], default: 'active' },
  currentPeriodEnd: { type: Date }
}, { timestamps: true });

export default mongoose.model<ISubscription>('Subscription', SubscriptionSchema);
