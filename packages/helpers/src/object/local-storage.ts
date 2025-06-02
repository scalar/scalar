/**
 * localStorage keys for resources
 * DO NOT CHANGE THESE AS IT WILL BREAK THE MIGRATION
 */
export const LS_KEYS = {
  COLLECTION: 'collection',
  COOKIE: 'cookie',
  ENVIRONMENT: 'environment',
  REQUEST: 'request',
  REQUEST_EXAMPLE: 'requestExample',
  SECURITY_SCHEME: 'securityScheme',
  SERVER: 'server',
  TAG: 'tag',
  WORKSPACE: 'workspace',
} as const

/**
 * localStorage keys for all reference resources
 * to ensure we do not have any conflicts
 */
export const REFERENCE_LS_KEYS = {
  SELECTED_CLIENT: 'scalar-reference-selected-client',
} as const

/**
 * localStorage keys for all client resources
 * to ensure we do not have any conflicts
 */
export const CLIENT_LS_KEYS = {
  AUTH: 'scalar-client-auth',
  SELECTED_SECURITY_SCHEMES: 'scalar-client-selected-security-schemes',
} as const

/** SSR safe alias for localStorage */
export const safeLocalStorage = () =>
  typeof window === 'undefined'
    ? {
        getItem: () => null,
        setItem: () => null,
        removeItem: () => null,
      }
    : localStorage
