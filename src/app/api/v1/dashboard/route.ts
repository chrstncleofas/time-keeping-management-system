/**
 * API v1 - Dashboard Route
 * @version v1
 * @since 2026-01-26
 * 
 * Note: Main dashboard stats are at /api/v1/dashboard/stats
 */

import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({
    success: true,
    message: 'Dashboard API v1. Use /api/v1/dashboard/stats for statistics.',
    endpoints: {
      stats: '/api/v1/dashboard/stats',
    },
  }, {
    headers: { 'X-API-Version': 'v1' },
  });
}
