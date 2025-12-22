import * as controller from '@/server/controllers/leaveController';

export const PATCH = controller.updateLeaveById as any;
export const DELETE = controller.deleteLeaveById as any;
