import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import { frontendOrigin } from './config';
import authRoutes from './routes/authRoutes';
import adminRoutes from './routes/adminRoutes';
import projectRoutes from './routes/projectRoutes';
import aiRoutes from './routes/aiRoutes';
import billingRoutes from './routes/billingRoutes';
import profileRoutes from './routes/profileRoutes';
import filesRoutes from './routes/filesRoutes';

const app = express();
app.set('trust proxy', 1);

app.use(helmet());
const allowedOrigins = frontendOrigin
  .split(',')
  .map((value) => value.trim())
  .filter(Boolean);

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin) return callback(null, true);
      if (allowedOrigins.includes('*') || allowedOrigins.includes(origin)) {
        return callback(null, true);
      }
      return callback(new Error('Origin not allowed by CORS'));
    },
    credentials: true
  })
);
app.use(express.json({ limit: '10mb' }));
app.use(morgan('combined'));

const limiter = rateLimit({ windowMs: 60 * 1000, max: 120 });
app.use(limiter);

app.use('/api/auth', authRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/billing', billingRoutes);
app.use('/api/profile', profileRoutes);
app.use('/api/files', filesRoutes);

app.get('/health', (_, res) => res.json({ status: 'ok' }));

export default app;
