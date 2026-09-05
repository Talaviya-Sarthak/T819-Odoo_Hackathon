import { Router, Request, Response, NextFunction } from 'express';
import { getAuditLogs } from './audit.service';
import { requireAuth, requireRole } from '../auth/middleware';
import { sendSuccess } from '../common/response';

const router = Router();

router.get('/', requireAuth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { entityType, entityId, userId, limit, offset } = req.query;
    const result = await getAuditLogs({
      entityType: entityType as string,
      entityId: entityId as string,
      userId: userId as string,
      limit: limit ? parseInt(limit as string) : undefined,
      offset: offset ? parseInt(offset as string) : undefined,
    });
    sendSuccess(res, 200, 'Audit logs fetched', result);
  } catch (err) {
    next(err);
  }
});

export default router;
