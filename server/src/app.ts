import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import authRoutes from './routes/authRoutes';
import adminRoutes from './routes/adminRoutes';
import projectRoutes from './routes/projectRoutes';
import aiRoutes from './routes/aiRoutes';
import billingRoutes from './routes/billingRoutes';
import profileRoutes from './routes/profileRoutes';
import filesRoutes from './routes/filesRoutes';

const app = express();

app.use(helmet());
app.use(cors({ origin: true }));
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
