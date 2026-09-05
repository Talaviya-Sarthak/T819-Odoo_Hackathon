import { Router, Request, Response, NextFunction } from 'express';
import { login, refreshToken, getCurrentUser } from './auth.service';
import { requireAuth } from './middleware';
import { sendSuccess } from '../common/response';

const router = Router();

router.post('/login', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }
    const result = await login(email, password);
    sendSuccess(res, 200, 'Login successful', result);
  } catch (err) {
    next(err);
  }
});

router.post('/refresh', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const refreshTokenValue = req.body?.refreshToken;
    const result = await refreshToken(refreshTokenValue);
    sendSuccess(res, 200, 'Token refreshed', result);
  } catch (err) {
    next(err);
  }
});

router.get('/me', requireAuth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await getCurrentUser(req.user!.userId);
    sendSuccess(res, 200, 'User fetched', result);
  } catch (err) {
    next(err);
  }
});

export default router;
