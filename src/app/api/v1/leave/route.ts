/**
 * API v1 - Leave Route
 * @version v1
 * @since 2026-01-26
 */

import { NextRequest, NextResponse } from 'next/server';
import * as controller from '@/server/controllers/leaveController';

// Controllers handle their own auth internally
// Add version headers to responses

async function withVersionHeaders(handler: (req: NextRequest) => Promise<NextResponse>) {
  return async (request: NextRequest) => {
    const response = await handler(request);
    response.headers.set('X-API-Version', 'v1');
    return response;
  };
}

export const GET = controller.getLeaves;
export const POST = controller.createLeave;
