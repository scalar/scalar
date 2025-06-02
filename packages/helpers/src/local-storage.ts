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

/** SSR safe alias for localStorage */
export const safeLocalStorage =
  typeof window === 'undefined'
    ? {
        getItem: () => null,
        setItem: () => null,
        removeItem: () => null,
      }
    : localStorage
