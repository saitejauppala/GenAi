import { Response } from 'express';
import User from '../models/user';
import bcrypt from 'bcrypt';

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

export async function updateMyPassword(req: any, res: Response) {
  const user = await User.findById(req.user.id);
  if (!user) return res.status(404).json({ message: 'Not found' });

  const currentPassword = String(req.body?.currentPassword || '');
  const newPassword = String(req.body?.newPassword || '');
  const confirmPassword = String(req.body?.confirmPassword || '');

  if (!currentPassword || !newPassword || !confirmPassword) {
    return res.status(400).json({ message: 'All password fields are required' });
  }
  if (newPassword.length < 8) {
    return res.status(400).json({ message: 'New password must be at least 8 characters' });
  }
  if (newPassword !== confirmPassword) {
    return res.status(400).json({ message: 'New password and confirm password do not match' });
  }

  const isCurrentValid = await bcrypt.compare(currentPassword, user.password);
  if (!isCurrentValid) {
    return res.status(400).json({ message: 'Current password is incorrect' });
  }

  const sameAsCurrent = await bcrypt.compare(newPassword, user.password);
  if (sameAsCurrent) {
    return res.status(400).json({ message: 'New password must be different from current password' });
  }

  user.password = await bcrypt.hash(newPassword, 10);
  await user.save();
  return res.json({ message: 'Password updated successfully' });
}
