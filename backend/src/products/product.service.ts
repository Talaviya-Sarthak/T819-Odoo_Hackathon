import prisma from '../common/prisma';
import { NotFoundError } from '../common/errors';

export async function getAllProducts(categoryId?: string) {
  const where: any = { active: true };
  if (categoryId) where.categoryId = categoryId;

  return prisma.product.findMany({
    where,
    include: {
      category: true,
      variants: true,
    },
    orderBy: { name: 'asc' },
  });
}

export async function getProductById(id: string) {
  const product = await prisma.product.findUnique({
    where: { id },
    include: {
      category: true,
      variants: true,
    },
  });
  if (!product) throw new NotFoundError('Product not found');
  return product;
}

export async function getAllCategories() {
  return prisma.category.findMany({ orderBy: { name: 'asc' } });
}

export async function getCategoryById(id: string) {
  const category = await prisma.category.findUnique({ where: { id } });
  if (!category) throw new NotFoundError('Category not found');
  return category;
}
