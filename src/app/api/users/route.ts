import * as controller from '@/server/controllers/userController';
import { requireAdmin } from '@/lib/middleware/auth';

export const GET = requireAdmin(controller.getUsers as any);
export const POST = requireAdmin(controller.createUser as any);
export const PATCH = requireAdmin(controller.updateUser as any);
export const DELETE = requireAdmin(controller.deleteUser as any);
