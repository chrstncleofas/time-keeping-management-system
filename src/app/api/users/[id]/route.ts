import * as controller from '@/server/controllers/userController';

export const GET = controller.getUserById as any;
export const PATCH = controller.patchUserById as any;
export const DELETE = controller.deleteUserById as any;
