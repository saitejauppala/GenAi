import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();
import User from '../models/user';
import { adminEmail, adminPassword } from '../config';
import bcrypt from 'bcrypt';

const MONGO = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/devai_pro';

async function seed(){
  await mongoose.connect(MONGO);
  const email = adminEmail.trim().toLowerCase();
  const existing = await User.findOne({ email });
  if (existing) {
    console.log('Super admin already exists');
    process.exit(0);
  }
  const hash = await bcrypt.hash(adminPassword, 10);
  const user = new User({ email, password: hash, role: 'superadmin', plan: 'premium' });
  await user.save();
  console.log('Super admin created:', email);
  process.exit(0);
}

seed().catch(err => {
  console.error(err);
  process.exit(1);
});
