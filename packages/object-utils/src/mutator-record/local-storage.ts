/** localStorage keys for resources */
export const LS_KEYS = {
  COLLECTIONS: 'collections',
  COOKIES: 'cookies',
  ENVIRONMENTS: 'environments',
  FOLDERS: 'folders',
  REQUEST_EXAMPLES: 'request-examples',
  REQUESTS: 'requests',
  SERVERS: 'servers',
  SECURITY_SCHEMES: 'security-schemes',
  WORKSPACE: 'workspace',
} as const

/** Config options for localStorage mutators */
export const LS_CONFIG = {
  /** The debounce time in milliseconds for saving to localStorage per resource */
  DEBOUNCE_MS: 1000,
  /** The max wait time in milliseconds for saving to localStorage per resource */
  MAX_WAIT_MS: 5000,
} as const
