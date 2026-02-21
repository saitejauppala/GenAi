import { Request, Response, NextFunction } from 'express';
import AIUsage from '../models/aiUsage';
import User from '../models/user';

const FREE_DAILY_LIMIT = parseInt(process.env.FREE_DAILY_LIMIT || '50', 10);

export async function enforceAiQuota(req: any, res: Response, next: NextFunction){
  // expects req.user populated
  if (!req.user) return res.status(401).json({ message: 'Unauthorized' });
  const user = await User.findById(req.user.id);
  if (!user) return res.status(401).json({ message: 'Unauthorized' });
  if (user.plan === 'premium') return next();

  // free plan: count today's AI requests
  const start = new Date();
  start.setHours(0,0,0,0);
  const count = await AIUsage.countDocuments({ user: user._id, createdAt: { $gte: start } });
  if (count >= FREE_DAILY_LIMIT) return res.status(429).json({ message: 'Daily AI quota exceeded' });
  next();
}
