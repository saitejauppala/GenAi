import mongoose, { Schema, Document } from 'mongoose';

export interface IUser extends Document {
  email: string;
  password: string;
  name?: string;
  title?: string;
  location?: string;
  bio?: string;
  avatarDataUrl?: string;
  role: 'user' | 'admin' | 'superadmin';
  plan: 'free' | 'premium';
  usage: { requests: number; lastReset: Date };
  disabled?: boolean;
}

const UserSchema: Schema = new Schema({
  email: { type: String, required: true, unique: true, index: true },
  password: { type: String, required: true },
  name: { type: String, trim: true },
  title: { type: String, trim: true },
  location: { type: String, trim: true },
  bio: { type: String, trim: true },
  avatarDataUrl: { type: String },
  role: { type: String, enum: ['user', 'admin', 'superadmin'], default: 'user' },
  plan: { type: String, enum: ['free', 'premium'], default: 'free' },
  usage: {
    requests: { type: Number, default: 0 },
    lastReset: { type: Date, default: Date.now }
  },
  disabled: { type: Boolean, default: false }
}, { timestamps: true });

export default mongoose.model<IUser>('User', UserSchema);
