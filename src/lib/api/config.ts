/**
 * API Configuration
 * Centralized version management for API endpoints
 * 
 * @see copilot-instructions.md - API Versioning Strategy
 */

export const API_CONFIG = {
  /** Current active API version */
  CURRENT_VERSION: 'v1',
  
  /** All supported API versions */
  SUPPORTED_VERSIONS: ['v1'] as const,
  
  /** Deprecated versions (will show warnings) */
  DEPRECATED_VERSIONS: [] as const,
  
  /** Base path for all API routes */
  BASE_PATH: '/api',
} as const;

/** Type for supported API versions */
export type ApiVersion = typeof API_CONFIG.SUPPORTED_VERSIONS[number];

/** Type for deprecated API versions */
export type DeprecatedApiVersion = typeof API_CONFIG.DEPRECATED_VERSIONS[number];

/**
 * Build versioned API path
 * @param version - API version (default: current version)
 * @returns Full versioned path (e.g., '/api/v1')
 */
export function getVersionedPath(version: ApiVersion = API_CONFIG.CURRENT_VERSION): string {
  return `${API_CONFIG.BASE_PATH}/${version}`;
}

/**
 * Check if a version is deprecated
 * @param version - Version to check
 * @returns true if version is deprecated
 */
export function isVersionDeprecated(version: string): boolean {
  return (API_CONFIG.DEPRECATED_VERSIONS as readonly string[]).includes(version);
}

/**
 * Check if a version is supported
 * @param version - Version to check
 * @returns true if version is supported
 */
export function isVersionSupported(version: string): boolean {
  return (API_CONFIG.SUPPORTED_VERSIONS as readonly string[]).includes(version);
}
