import { isElectron } from '@/general/is-electron'

/** HTTP Methods which can have a body */
const BODY_METHODS = new Set(['post', 'put', 'patch', 'delete'])

/**
 * Makes a check to see if this method CAN have a body.
 *
 * When running inside Electron, GET requests are also allowed to have a body because the underlying
 * undici implementation does not reject it, which matches the behavior users expect from desktop API clients.
 */
export const canMethodHaveBody = (method: string): boolean => {
  const normalized = method.toLowerCase()

  // For electron we allow any method to have a body
  if (isElectron()) {
    return true
  }

  return BODY_METHODS.has(normalized)
}
