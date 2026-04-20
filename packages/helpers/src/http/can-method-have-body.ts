import { isElectron } from '@/general/is-electron'

/** HTTP Methods which can have a body */
export const BODY_METHODS = new Set(['post', 'put', 'patch', 'delete'])

/**
 * Makes a check to see if this method CAN have a body.
 *
 * When running inside Electron, all requests are also allowed to have a body because the underlying
 * undici implementation does not reject it, which matches the behavior users expect from desktop API clients.
 */
export const canMethodHaveBody = (method: string, skipElectron: boolean = false): boolean => {
  const normalized = method.toLowerCase()

  // For electron we allow any method to have a body
  if (isElectron() && !skipElectron) {
    return true
  }

  return BODY_METHODS.has(normalized)
}

/*** We must purge body from requests that cannot accept it, skips the electron check */
export const buildSafeBodyRequest = (url: string, init: RequestInit) =>
  new Request(url, {
    ...init,
    body: canMethodHaveBody(init.method ?? 'GET', true) ? init.body : null,
  })
