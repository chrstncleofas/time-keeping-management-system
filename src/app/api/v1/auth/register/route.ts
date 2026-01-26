/**
 * API v1 - Auth Register Route
 * @version v1
 * @since 2026-01-26
 */

import { NextResponse } from 'next/server';
import * as controller from '@/server/controllers/authController';

// Register is public (no auth required), add version header manually
export async function POST(request: Request) {
  const response = await controller.register(request);
  
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
