import * as controller from '@/server/controllers/timeAdjustmentController';

export const GET = controller.getAdjustments as any;
export const POST = controller.createAdjustment as any;
