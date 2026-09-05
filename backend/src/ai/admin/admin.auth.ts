import type { Request, Response, NextFunction } from 'express';
import { logger } from '../../config/logger';

export interface AdminUser {
  id: string;
  username: string;
  role: 'admin';
  createdAt: string;
}

const DEFAULT_ADMIN_USER = process.env.ADMIN_USERNAME || 'admin';
const DEFAULT_ADMIN_PASS = process.env.ADMIN_PASSWORD || '12345678';

export function authenticateAdmin(username?: string, password?: string): { success: boolean; token?: string; user?: AdminUser; error?: string } {
  if (!username || !password) {
    return { success: false, error: 'Username and password are required' };
  }

  if (username.trim() === DEFAULT_ADMIN_USER && password === DEFAULT_ADMIN_PASS) {
    const adminUser: AdminUser = {
      id: 'admin_root_1',
      username: DEFAULT_ADMIN_USER,
      role: 'admin',
      createdAt: new Date().toISOString(),
    };
    const token = `admin_token_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
    logger.info({ username }, 'Admin authenticated successfully');
    return { success: true, token, user: adminUser };
  }

  return { success: false, error: 'Invalid admin credentials' };
}

export function requireAdminAuth(req: Request, res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({ success: false, message: 'Unauthorized: Admin authentication token required' });
    return;
  }
  next();
}
