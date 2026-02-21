import mongoose, { Document, Schema } from 'mongoose';

export type ChatRole = 'user' | 'assistant';

export interface IChatMessage {
  role: ChatRole;
  content: string;
  createdAt: Date;
  fileId?: mongoose.Types.ObjectId;
}

export interface IChatSession extends Document {
  user: mongoose.Types.ObjectId;
  project?: mongoose.Types.ObjectId;
  associatedProject?: mongoose.Types.ObjectId;
  title: string;
  messages: IChatMessage[];
}

const ChatMessageSchema = new Schema<IChatMessage>(
  {
    role: { type: String, enum: ['user', 'assistant'], required: true },
    content: { type: String, required: true },
    createdAt: { type: Date, default: Date.now },
    fileId: { type: Schema.Types.ObjectId, ref: 'ProjectFile' }
  },
  { _id: false }
);

const ChatSessionSchema = new Schema<IChatSession>(
  {
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    project: { type: Schema.Types.ObjectId, ref: 'Project', index: true },
    associatedProject: { type: Schema.Types.ObjectId, ref: 'Project', index: true },
    title: { type: String, required: true, trim: true },
    messages: { type: [ChatMessageSchema], default: [] }
  },
  { timestamps: true }
);

ChatSessionSchema.index({ user: 1, updatedAt: -1 });
ChatSessionSchema.index({ title: 'text', 'messages.content': 'text' });

export default mongoose.model<IChatSession>('ChatSession', ChatSessionSchema);
