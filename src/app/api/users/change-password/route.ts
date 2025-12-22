import * as controller from '@/server/controllers/userController';
import { requireAdmin } from '@/lib/middleware/auth';

export const POST = requireAdmin(controller.changePassword as any);
