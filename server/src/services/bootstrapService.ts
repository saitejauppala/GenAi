import bcrypt from 'bcrypt';
import { adminEmail, adminPassword, syncSuperAdminPassword } from '../config';
import User from '../models/user';
import { logger } from '../utils/logger';

function escapeRegex(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

export async function ensureSuperAdmin() {
  const email = adminEmail.trim().toLowerCase();
  const password = adminPassword.trim();

  if (!email || !password) {
    logger.warn('SUPER_ADMIN_EMAIL or SUPER_ADMIN_PASSWORD missing; skipping super admin bootstrap');
    return;
  }

  const matcher = new RegExp(`^${escapeRegex(email)}$`, 'i');
  const existing = await User.findOne({ email: matcher });

  if (!existing) {
    const hash = await bcrypt.hash(password, 10);
    await User.create({
      email,
      password: hash,
      role: 'superadmin',
      plan: 'premium'
    });
    logger.info(`Super admin bootstrapped: ${email}`);
    return;
  }

  let changed = false;
  if (existing.role !== 'superadmin') {
    existing.role = 'superadmin';
    changed = true;
  }
  if (existing.plan !== 'premium') {
    existing.plan = 'premium';
    changed = true;
  }
  if (existing.email !== email) {
    existing.email = email;
    changed = true;
  }

  if (syncSuperAdminPassword) {
    existing.password = await bcrypt.hash(password, 10);
    changed = true;
  }

  if (changed) {
    await existing.save();
    logger.info(`Super admin account synchronized: ${email}`);
  }
}
