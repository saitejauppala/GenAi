import dotenv from 'dotenv';
dotenv.config();

import app from './app';
import mongoose from 'mongoose';
import { logger } from './utils/logger';
import { startOllamaHealthMonitor } from './services/ollamaService';
import { ensureSuperAdmin } from './services/bootstrapService';

const isProduction = String(process.env.NODE_ENV || '').toLowerCase() === 'production';
const MONGO =
  process.env.MONGO_URI ||
  process.env.MONGODB_URI ||
  (isProduction ? '' : 'mongodb://127.0.0.1:27017/devai_pro');
const PORT = process.env.PORT || 4000;

if (!MONGO) {
  throw new Error('Missing MongoDB connection string. Set MONGO_URI (or MONGODB_URI).');
}

async function start() {
  await mongoose.connect(MONGO);
    logger.info('Connected to MongoDB');
    await ensureSuperAdmin();
    startOllamaHealthMonitor();
    app.listen(PORT, () => logger.info(`Server running on port ${PORT}`));
}

start().catch((err) => {
  logger.error('Startup error', err);
  process.exitCode = 1;
});
