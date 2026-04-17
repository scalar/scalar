import { isElectron } from '@/general/is-electron'

import type { HttpMethod } from './http-methods'

/** HTTP Methods which can have a body */
const BODY_METHODS = ['post', 'put', 'patch', 'delete'] as const satisfies HttpMethod[]
type BodyMethod = (typeof BODY_METHODS)[number]

/** HTTP Methods which can have a body when running in Electron, where the fetch implementation allows bodies on GET. */
const ELECTRON_BODY_METHODS = [...BODY_METHODS, 'get'] as const satisfies HttpMethod[]
type ElectronBodyMethod = (typeof ELECTRON_BODY_METHODS)[number]

/**
 * Makes a check to see if this method CAN have a body.
 *
 * When running inside Electron, GET requests are also allowed to have a body because the underlying
 * undici implementation does not reject it, which matches the behavior users expect from desktop API clients.
 *
 * Note: this intentionally returns `boolean` rather than a type predicate. The result depends on the
 * runtime environment (browser vs. Electron), so no single static predicate can soundly narrow the
 * input type across both branches — narrowing out `'get'` in the false branch would be incorrect in
 * Electron, and narrowing it in would be incorrect in the browser.
 */
export const canMethodHaveBody = (method: HttpMethod): boolean => {
  const normalized = method.toLowerCase() as ElectronBodyMethod

  if (isElectron()) {
    return ELECTRON_BODY_METHODS.includes(normalized)
  }

  return BODY_METHODS.includes(normalized as BodyMethod)
}
