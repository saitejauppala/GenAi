import mongoose, { Schema, Document } from 'mongoose';

export interface IProject extends Document {
  owner: mongoose.Types.ObjectId;
  createdBy: mongoose.Types.ObjectId;
  name: string;
  description?: string;
  folderPath: string;
  files: any; // JSON structure for files
  logs: Array<{ message: string; ts: Date }>;
  version: number;
}

const ProjectSchema: Schema = new Schema({
  owner: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  createdBy: { type: Schema.Types.ObjectId, ref: 'User', index: true },
  name: { type: String, required: true },
  description: { type: String },
  folderPath: { type: String, required: true },
  files: { type: Schema.Types.Mixed, default: {} },
  logs: [{ message: String, ts: Date }],
  version: { type: Number, default: 1 }
}, { timestamps: true });

export default mongoose.model<IProject>('Project', ProjectSchema);
