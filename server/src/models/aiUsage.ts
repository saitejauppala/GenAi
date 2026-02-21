import mongoose, { Schema, Document } from 'mongoose';

export interface IAIUsage extends Document {
  user: mongoose.Types.ObjectId;
  prompt: string;
  type: 'assist' | 'generate' | 'chat';
  modelName: string;
  tokensUsed: number;
  approxCost: number; // in cents
  success: boolean;
}

const AIUsageSchema: Schema = new Schema({
  user: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  prompt: { type: String },
  type: { type: String, enum: ['assist', 'generate', 'chat'], required: true },
  modelName: { type: String },
  tokensUsed: { type: Number, default: 0 },
  approxCost: { type: Number, default: 0 },
  success: { type: Boolean, default: true }
}, { timestamps: true });

export default mongoose.model<IAIUsage>('AIUsage', AIUsageSchema);
