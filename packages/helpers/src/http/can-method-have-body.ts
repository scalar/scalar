import { isElectron } from '@/general/is-electron'

import { isHttpMethod } from './is-http-method'

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

  // Extension methods can carry bodies too; keep the existing policy for standard OpenAPI methods.
  const isExtensionMethod =
    !isHttpMethod(method) && /^[!#$%&'*+.^_`|~0-9A-Za-z-]+$/.test(method) && !['connect', 'track'].includes(normalized)

  return BODY_METHODS.has(normalized) || isExtensionMethod
}

/*** We must purge body from requests that cannot accept it, skips the electron check */
export const buildSafeBodyRequest = (url: string, init: RequestInit) =>
  new Request(url, {
    ...init,
    body: canMethodHaveBody(init.method ?? 'GET', true) ? init.body : null,
  })
