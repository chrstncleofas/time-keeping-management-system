/**
 * API Version Middleware
 * Adds version headers to API responses and handles deprecation warnings
 * 
 * @see copilot-instructions.md - API Versioning Strategy
 */

import { NextRequest, NextResponse } from 'next/server';
import { API_CONFIG, isVersionDeprecated } from '@/lib/api/config';
import { AuthUser } from './auth';

interface VersionInfo {
  version: string;
  deprecated: boolean;
  sunset?: string; // ISO date when version will be removed
}

/** Version metadata for each supported version */
const VERSION_INFO: Record<string, VersionInfo> = {
  v1: { 
    version: 'v1', 
    deprecated: false 
  },
  // Future versions:
  // v2: { version: 'v2', deprecated: false },
};

/**
 * Add version headers to response
 * @param response - NextResponse to modify
 * @param version - API version
 * @returns Response with version headers
 */
function addVersionHeaders(response: NextResponse, version: string): NextResponse {
  const info = VERSION_INFO[version];
  
  if (info) {
    response.headers.set('X-API-Version', info.version);
    response.headers.set('X-API-Deprecated', String(info.deprecated));
    
    if (info.sunset) {
      response.headers.set('Sunset', info.sunset);
      response.headers.set('Deprecation', 'true');
      response.headers.set('Link', `</api/${API_CONFIG.CURRENT_VERSION}>; rel="successor-version"`);
    }
  }
  
  return response;
}

/**
 * Wrap handler with API version headers
 * @param version - API version string
 * @returns Middleware wrapper function
 * 
 * @example
 * // In route.ts
 * export const GET = withApiVersion('v1')(controller.getUsers);
 */
export function withApiVersion(version: string) {
  return function <T extends (request: NextRequest, ...args: unknown[]) => Promise<NextResponse>>(
    handler: T
  ): T {
    return (async (request: NextRequest, ...args: unknown[]) => {
      const response = await handler(request, ...args);
      return addVersionHeaders(response, version);
    }) as T;
  };
}

/**
 * Combine version headers with requireAuth middleware
 * @param version - API version string
 * @returns Middleware wrapper function
 * 
 * @example
 * // In route.ts
 * export const GET = withVersionedAuth('v1')(controller.getAttendances);
 */
export function withVersionedAuth(version: string) {
  return function <T extends (request: NextRequest, user: AuthUser) => Promise<NextResponse>>(
    handler: T
  ): (request: NextRequest) => Promise<NextResponse> {
    // Import dynamically to avoid circular dependency
    const { requireAuth } = require('./auth');
    
    return async (request: NextRequest) => {
      // Create wrapper that adds version headers after auth middleware runs
      const authWrapped = requireAuth(async (req: NextRequest, user: AuthUser) => {
        const response = await handler(req, user);
        return addVersionHeaders(response, version);
      });
      
      return authWrapped(request);
    };
  };
}

/**
 * Combine version headers with requireAdmin middleware
 * @param version - API version string
 * @returns Middleware wrapper function
 * 
 * @example
 * // In route.ts
 * export const GET = withVersionedAdmin('v1')(controller.getUsers);
 */
export function withVersionedAdmin(version: string) {
  return function <T extends (request: NextRequest, user: AuthUser) => Promise<NextResponse>>(
    handler: T
  ): (request: NextRequest) => Promise<NextResponse> {
    // Import dynamically to avoid circular dependency
    const { requireAdmin } = require('./auth');
    
    return async (request: NextRequest) => {
      // Create wrapper that adds version headers after admin middleware runs
      const adminWrapped = requireAdmin(async (req: NextRequest, user: AuthUser) => {
        const response = await handler(req, user);
        return addVersionHeaders(response, version);
      });
      
      return adminWrapped(request);
    };
  };
}

/**
 * Create a deprecated endpoint response
 * Use this to deprecate old unversioned routes
 * 
 * @param oldPath - The deprecated path
 * @param newPath - The new versioned path
 * @param sunsetDate - Date when old endpoint will be removed
 * @returns NextResponse with deprecation info
 * 
 * @example
 * // In old /api/users/route.ts
 * export async function GET() {
 *   return createDeprecatedResponse('/api/users', '/api/v1/users', '2026-06-01');
 * }
 */
export function createDeprecatedResponse(
  oldPath: string,
  newPath: string,
  sunsetDate: string
): NextResponse {
  return NextResponse.json(
    {
      success: false,
      error: `This endpoint is deprecated. Please use ${newPath}`,
      migration: {
        oldPath,
        newPath,
        sunsetDate,
        documentation: 'See API documentation for migration guide',
      },
    },
    {
      status: 410, // Gone
      headers: {
        'X-API-Deprecated': 'true',
        'Sunset': new Date(sunsetDate).toUTCString(),
        'Link': `<${newPath}>; rel="successor-version"`,
        'Deprecation': 'true',
      },
    }
  );
}
