import { Request, Response } from 'express';
import User from '../models/user';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import {
  appBaseUrl,
  exposeResetTokenResponse,
  jwtSecret,
  resetPasswordTokenExpiresMinutes
} from '../config';
import { logger } from '../utils/logger';

function normalizeEmail(input: unknown) {
  return String(input || '').trim().toLowerCase();
}

function escapeRegex(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function emailMatcher(email: string) {
  return new RegExp(`^${escapeRegex(email)}$`, 'i');
}

function hashResetToken(token: string) {
  return crypto.createHash('sha256').update(token).digest('hex');
}

export async function register(req: Request, res: Response){
  const email = normalizeEmail(req.body?.email);
  const password = String(req.body?.password || '');
  const name = String(req.body?.name || '').trim();
  if (!email || !password) return res.status(400).json({ message: 'Missing fields' });
  const existing = await User.findOne({ email: emailMatcher(email) });
  if (existing) return res.status(400).json({ message: 'User exists' });
  const hash = await bcrypt.hash(password, 10);
  const user = new User({ email, password: hash, name: name || undefined });
  await user.save();
  return res.json({ id: user._id, email: user.email, name: user.name });
}

export async function login(req: Request, res: Response){
  const email = normalizeEmail(req.body?.email);
  const password = String(req.body?.password || '');
  const user = await User.findOne({ email: emailMatcher(email) });
  if (!user) return res.status(400).json({ message: 'Invalid credentials' });
  const ok = await bcrypt.compare(password, user.password);
  if (!ok) return res.status(400).json({ message: 'Invalid credentials' });
  if (user.disabled) return res.status(403).json({ message: 'Account disabled' });
  const token = jwt.sign({ id: user._id, email: user.email, role: user.role }, jwtSecret, { expiresIn: '7d' });
  return res.json({ token });
}

export async function me(req: any, res: Response){
  const user = await User.findById(req.user.id).select('-password');
  if (!user) return res.status(404).json({ message: 'Not found' });
  res.json(user);
}

export async function forgotPassword(req: Request, res: Response) {
  const email = normalizeEmail(req.body?.email);
  if (!email) return res.status(400).json({ message: 'Email is required' });

  const defaultMessage =
    'If this email is registered, a reset link has been generated.';
  const user = await User.findOne({ email: emailMatcher(email) });

  if (!user) {
    return res.json({ message: defaultMessage });
  }

  const resetToken = crypto.randomBytes(32).toString('hex');
  const tokenHash = hashResetToken(resetToken);
  const expiresAt = new Date(Date.now() + resetPasswordTokenExpiresMinutes * 60_000);

  user.resetPasswordToken = tokenHash;
  user.resetPasswordExpires = expiresAt;
  await user.save();

  const resetUrl = `${appBaseUrl.replace(/\/+$/, '')}/reset-password?token=${resetToken}`;
  logger.info(`Password reset token generated for ${email}. Expires at ${expiresAt.toISOString()}`);

  if (exposeResetTokenResponse) {
    return res.json({
      message: defaultMessage,
      resetUrl,
      resetToken,
      expiresAt: expiresAt.toISOString()
    });
  }

  return res.json({ message: defaultMessage });
}

export async function resetPassword(req: Request, res: Response) {
  const token = String(req.body?.token || '').trim();
  const password = String(req.body?.password || '');

  if (!token || !password) {
    return res.status(400).json({ message: 'Token and password are required' });
  }
  if (password.length < 8) {
    return res.status(400).json({ message: 'Password must be at least 8 characters' });
  }

  const tokenHash = hashResetToken(token);
  const user = await User.findOne({
    resetPasswordToken: tokenHash,
    resetPasswordExpires: { $gt: new Date() }
  });

  if (!user) {
    return res.status(400).json({ message: 'Reset token is invalid or expired' });
  }

  user.password = await bcrypt.hash(password, 10);
  user.resetPasswordToken = undefined;
  user.resetPasswordExpires = undefined;
  await user.save();

  return res.json({ message: 'Password has been reset successfully. Please login.' });
}
