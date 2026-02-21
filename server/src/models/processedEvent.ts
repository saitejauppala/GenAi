import mongoose, { Schema, Document } from 'mongoose';

export interface IProcessedEvent extends Document {
  eventId: string;
  type: string;
  processedAt: Date;
  payload?: any;
}

const ProcessedEventSchema: Schema = new Schema({
  eventId: { type: String, required: true, unique: true, index: true },
  type: { type: String },
  processedAt: { type: Date, default: Date.now },
  payload: { type: Schema.Types.Mixed }
}, { timestamps: true });

export default mongoose.model<IProcessedEvent>('ProcessedEvent', ProcessedEventSchema);
