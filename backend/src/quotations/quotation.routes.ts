import { Router, Request, Response, NextFunction } from 'express';
import {
  getAllQuotations, getQuotationById, createQuotation,
  updateQuotation, addQuotationLine, removeQuotationLine,
} from './quotation.service';
import { requireAuth, requireRole } from '../auth/middleware';
import { sendSuccess } from '../common/response';
import { checkDiscounts } from '../discounts/discount.service';
import { submitForApproval } from '../approvals/approval.service';
import { createAuditLog } from '../audit/audit.service';

const router = Router();

// GET /api/quotations
router.get('/', requireAuth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { status, salesRepId, customerId } = req.query;
    const quotations = await getAllQuotations({
      status: status as string,
      salesRepId: salesRepId as string,
      customerId: customerId as string,
    });
    sendSuccess(res, 200, 'Quotations fetched', { quotations });
  } catch (err) {
    next(err);
  }
});

// GET /api/quotations/:id
router.get('/:id', requireAuth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const quotation = await getQuotationById(req.params.id);
    sendSuccess(res, 200, 'Quotation fetched', { quotation });
  } catch (err) {
    next(err);
  }
});

// POST /api/quotations
router.post('/', requireAuth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { customerId, currency, notes, validUntil } = req.body;
    if (!customerId) {
      return res.status(400).json({ error: 'customerId is required' });
    }
    const quotation = await createQuotation({
      customerId,
      salesRepId: req.user!.userId,
      currency,
      notes,
      validUntil,
    });
    sendSuccess(res, 201, 'Quotation created', { quotation });
  } catch (err) {
    next(err);
  }
});

// PUT /api/quotations/:id
router.put('/:id', requireAuth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { status, notes, validUntil } = req.body;
    const quotation = await updateQuotation(
      req.params.id,
      { status, notes, validUntil },
      req.user!.userId
    );
    sendSuccess(res, 200, 'Quotation updated', { quotation });
  } catch (err) {
    next(err);
  }
});

// POST /api/quotations/:id/lines
router.post('/:id/lines', requireAuth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const line = await addQuotationLine(req.params.id, req.body);
    sendSuccess(res, 201, 'Line added', { line });
  } catch (err) {
    next(err);
  }
});

// DELETE /api/quotations/:id/lines/:lineId
router.delete('/:id/lines/:lineId', requireAuth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    await removeQuotationLine(req.params.lineId);
    sendSuccess(res, 200, 'Line removed');
  } catch (err) {
    next(err);
  }
});

// POST /api/quotations/:id/discount-check
router.post('/:id/discount-check', requireAuth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await checkDiscounts(req.params.id);
    sendSuccess(res, 200, 'Discount check completed', result);
  } catch (err) {
    next(err);
  }
});

// POST /api/quotations/:id/submit
router.post('/:id/submit', requireAuth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await submitForApproval(req.params.id, req.user!.userId);

    await createAuditLog({
      userId: req.user!.userId,
      action: 'approval_requested',
      entityType: 'quotation',
      entityId: req.params.id,
      newValues: { riskScore: result.discountResult?.riskScore },
    });

    sendSuccess(res, 200, 'Quotation submitted for approval', result);
  } catch (err) {
    next(err);
  }
});

export default router;
