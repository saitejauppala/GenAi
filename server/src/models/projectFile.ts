import mongoose, { Document, Schema } from 'mongoose';

export interface IProjectFile extends Document {
  project: mongoose.Types.ObjectId;
  owner: mongoose.Types.ObjectId;
  projectName: string;
  fileName: string;
  relativePath: string;
  absolutePath: string;
  filePath: string;
  contentType: string;
  size: number;
}

const ProjectFileSchema = new Schema<IProjectFile>(
  {
    project: { type: Schema.Types.ObjectId, ref: 'Project', required: true, index: true },
    owner: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    projectName: { type: String, required: true, index: true },
    fileName: { type: String, required: true },
    relativePath: { type: String, required: true },
    absolutePath: { type: String, required: true },
    filePath: { type: String, required: true },
    contentType: { type: String, default: 'text/plain' },
    size: { type: Number, default: 0 }
  },
  { timestamps: true }
);

ProjectFileSchema.index({ project: 1, createdAt: -1 });
ProjectFileSchema.index({ projectName: 1, createdAt: -1 });

export default mongoose.model<IProjectFile>('ProjectFile', ProjectFileSchema);
