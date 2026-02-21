import { Response } from 'express';
import User from '../models/user';

export async function getMyProfile(req: any, res: Response) {
  const user = await User.findById(req.user.id).select('-password');
  if (!user) return res.status(404).json({ message: 'Not found' });
  res.json(user);
}

export async function updateMyProfile(req: any, res: Response) {
  const user = await User.findById(req.user.id);
  if (!user) return res.status(404).json({ message: 'Not found' });

  const name = String(req.body?.name || '').trim();
  const title = String(req.body?.title || '').trim();
  const location = String(req.body?.location || '').trim();
  const bio = String(req.body?.bio || '').trim();
  const avatarDataUrl = String(req.body?.avatarDataUrl || '');

  if (name) user.name = name;
  user.title = title || undefined;
  user.location = location || undefined;
  user.bio = bio || undefined;

  if (avatarDataUrl) {
    if (avatarDataUrl.length > 1_500_000) {
      return res.status(400).json({ message: 'Avatar payload too large' });
    }
    user.avatarDataUrl = avatarDataUrl;
  }

  await user.save();
  const safe = await User.findById(user._id).select('-password');
  res.json(safe);
}
