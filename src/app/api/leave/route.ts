import * as controller from '@/server/controllers/leaveController';

export const GET = controller.getLeaves as any;
export const POST = controller.createLeave as any;
