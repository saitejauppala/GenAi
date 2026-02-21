import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { jwtSecret } from '../config';

export interface AuthedRequest extends Request {
  user?: any;
}

export function authenticateJWT(req: AuthedRequest, res: Response, next: NextFunction) {
  const auth = req.headers.authorization;
  if (!auth) return res.status(401).json({ message: 'Missing token' });
  const token = auth.replace('Bearer ', '');
  try {
    const payload = jwt.verify(token, jwtSecret) as any;
    req.user = payload;
    next();
  } catch (err) {
    return res.status(401).json({ message: 'Invalid token' });
  }
}

export function requireRole(role: 'user'|'admin'|'superadmin'){
  return (req: AuthedRequest, res: Response, next: NextFunction) => {
    if (!req.user) return res.status(401).json({ message: 'Unauthorized' });
    const userRole = req.user.role as 'user' | 'admin' | 'superadmin';
    const hierarchy = { user: 1, admin: 2, superadmin: 3 };
    if (hierarchy[userRole] >= hierarchy[role]) return next();
    return res.status(403).json({ message: 'Forbidden' });
  };
}
