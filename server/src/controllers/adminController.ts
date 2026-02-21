import { Request, Response } from 'express';
import User from '../models/user';

export async function listUsers(req: Request, res: Response){
  const users = await User.find().select('-password');
  res.json(users);
}

export async function updateUser(req: Request, res: Response){
  const { id } = req.params;
  const update = req.body;
  const user = await User.findByIdAndUpdate(id, update, { new: true }).select('-password');
  res.json(user);
}

export async function getUsage(req: Request, res: Response){
  const users = await User.find({}, 'email usage plan');
  res.json(users);
}
