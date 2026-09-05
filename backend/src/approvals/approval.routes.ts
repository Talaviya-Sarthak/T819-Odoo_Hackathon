import { Router, Request, Response, NextFunction } from 'express';
import {
  approveRequest, rejectRequest,
  returnRequest, getPendingApprovals,
} from './approval.service';
import { requireAuth, requireRole } from '../auth/middleware';
import { sendSuccess } from '../common/response';
import { createAuditLog } from '../audit/audit.service';

const router = Router();

// GET /api/approvals/pending
router.get('/pending', requireAuth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const approvals = await getPendingApprovals(req.user!.role);
    sendSuccess(res, 200, 'Pending approvals fetched', { approvals });
  } catch (err) {
    next(err);
  }
});

// POST /api/approvals/:id/approve
router.post('/:id/approve', requireAuth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { notes } = req.body;
    const result = await approveRequest(
      req.params.id, req.user!.userId, req.user!.role, notes
    );

    await createAuditLog({
      userId: req.user!.userId,
      action: 'approval_approved',
      entityType: 'approval_request',
      entityId: req.params.id,
      newValues: { notes },
    });

    sendSuccess(res, 200, 'Approval processed', result);
  } catch (err) {
    next(err);
  }
});

// POST /api/approvals/:id/reject
router.post('/:id/reject', requireAuth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { notes } = req.body;
    const result = await rejectRequest(
      req.params.id, req.user!.userId, req.user!.role, notes
    );

    await createAuditLog({
      userId: req.user!.userId,
      action: 'approval_rejected',
      entityType: 'approval_request',
      entityId: req.params.id,
      newValues: { notes },
    });

    sendSuccess(res, 200, 'Approval rejected', result);
  } catch (err) {
    next(err);
  }
});

// POST /api/approvals/:id/return
router.post('/:id/return', requireAuth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { notes } = req.body;
    const result = await returnRequest(
      req.params.id, req.user!.userId, req.user!.role, notes
    );

    await createAuditLog({
      userId: req.user!.userId,
      action: 'approval_returned',
      entityType: 'approval_request',
      entityId: req.params.id,
      newValues: { notes },
    });

    sendSuccess(res, 200, 'Approval returned', result);
  } catch (err) {
    next(err);
  }
});

export default router;
