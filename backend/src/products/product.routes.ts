import { Router, Request, Response, NextFunction } from 'express';
import { getAllProducts, getProductById, getAllCategories } from './product.service';
import { requireAuth } from '../auth/middleware';
import { sendSuccess } from '../common/response';

const router = Router();

router.get('/', requireAuth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { categoryId } = req.query;
    const products = await getAllProducts(categoryId as string | undefined);
    sendSuccess(res, 200, 'Products fetched', { products });
  } catch (err) {
    next(err);
  }
});

router.get('/categories', requireAuth, async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const categories = await getAllCategories();
    sendSuccess(res, 200, 'Categories fetched', { categories });
  } catch (err) {
    next(err);
  }
});

router.get('/:id', requireAuth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const product = await getProductById(req.params.id);
    sendSuccess(res, 200, 'Product fetched', { product });
  } catch (err) {
    next(err);
  }
});

export default router;
