/**
 * API v1 - Auth Login Route
 * @version v1
 * @since 2026-01-26
 */

import { NextResponse } from 'next/server';
import * as controller from '@/server/controllers/authController';

// Login is public (no auth required), add version header manually
export async function POST(request: Request) {
  const response = await controller.login(request);
  
  // Clone and add version headers
  const data = await response.json();
  return NextResponse.json(data, {
    status: response.status,
    headers: {
      'X-API-Version': 'v1',
      'X-API-Deprecated': 'false',
    },
  });
}
