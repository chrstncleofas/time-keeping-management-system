/**
 * API v1 - Users Route
 * @version v1
 * @since 2026-01-26
 */

import { requireAdmin } from '@/lib/middleware/auth';
import * as controller from '@/server/controllers/userController';

// Controllers expect user param from requireAdmin middleware
export const GET = requireAdmin(controller.getUsers);
export const POST = requireAdmin(controller.createUser);
export const PATCH = requireAdmin(controller.updateUser);
export const DELETE = requireAdmin(controller.deleteUser);
