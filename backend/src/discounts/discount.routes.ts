import { Router, Request, Response, NextFunction } from 'express';
import { getDiscountRules } from './discount.service';
import { requireAuth } from '../auth/middleware';
import { sendSuccess } from '../common/response';

const router = Router();

// GET /api/discounts/rules
router.get('/rules', requireAuth, async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const rules = await getDiscountRules();
    sendSuccess(res, 200, 'Discount rules fetched', { rules });
  } catch (err) {
    next(err);
  }
});

export default router;
