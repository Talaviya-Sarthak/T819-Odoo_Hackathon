import { Router, Request, Response, NextFunction } from 'express';
import { getAllUsers, getUserById } from './user.service';
import { requireAuth } from '../auth/middleware';
import { sendSuccess } from '../common/response';

const router = Router();

router.get('/', requireAuth, async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const users = await getAllUsers();
    sendSuccess(res, 200, 'Users fetched', { users });
  } catch (err) {
    next(err);
  }
});

router.get('/:id', requireAuth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const user = await getUserById(req.params.id);
    sendSuccess(res, 200, 'User fetched', { user });
  } catch (err) {
    next(err);
  }
});

export default router;
