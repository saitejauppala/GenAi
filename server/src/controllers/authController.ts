import { Request, Response } from 'express';
import User from '../models/user';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { jwtSecret } from '../config';

export async function register(req: Request, res: Response){
  const email = String(req.body?.email || '').trim().toLowerCase();
  const password = String(req.body?.password || '');
  const name = String(req.body?.name || '').trim();
  if (!email || !password) return res.status(400).json({ message: 'Missing fields' });
  const existing = await User.findOne({ email });
  if (existing) return res.status(400).json({ message: 'User exists' });
  const hash = await bcrypt.hash(password, 10);
  const user = new User({ email, password: hash, name: name || undefined });
  await user.save();
  return res.json({ id: user._id, email: user.email, name: user.name });
}

export async function login(req: Request, res: Response){
  const email = String(req.body?.email || '').trim().toLowerCase();
  const password = String(req.body?.password || '');
  const user = await User.findOne({ email });
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
