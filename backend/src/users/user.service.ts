import prisma from '../common/prisma';
import { NotFoundError } from '../common/errors';

export async function getAllUsers() {
  return prisma.user.findMany({
    select: {
      id: true, email: true, name: true, role: true,
      status: true, avatarUrl: true, emailVerified: true,
      createdAt: true, updatedAt: true,
    },
    orderBy: { createdAt: 'desc' },
  });
}

export async function getUserById(id: string) {
  const user = await prisma.user.findUnique({
    where: { id },
    select: {
      id: true, email: true, name: true, role: true,
      status: true, avatarUrl: true, emailVerified: true,
      createdAt: true, updatedAt: true,
    },
  });
  if (!user) throw new NotFoundError('User not found');
  return user;
}
