import { Router, Request, Response, NextFunction } from 'express';
import { getAllCustomers, getCustomerById, createCustomer, getAllCustomerTiers } from './customer.service';
import { requireAuth } from '../auth/middleware';
import { sendSuccess } from '../common/response';

const router = Router();

router.get('/', requireAuth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const customers = await getAllCustomers();
    sendSuccess(res, 200, 'Customers fetched', { customers });
  } catch (err) {
    next(err);
  }
});

router.get('/tiers', requireAuth, async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const tiers = await getAllCustomerTiers();
    sendSuccess(res, 200, 'Customer tiers fetched', { tiers });
  } catch (err) {
    next(err);
  }
});

router.get('/:id', requireAuth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const customer = await getCustomerById(req.params.id);
    sendSuccess(res, 200, 'Customer fetched', { customer });
  } catch (err) {
    next(err);
  }
});

router.post('/', requireAuth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const customer = await createCustomer(req.body);
    sendSuccess(res, 201, 'Customer created', { customer });
  } catch (err) {
    next(err);
  }
});

export default router;
