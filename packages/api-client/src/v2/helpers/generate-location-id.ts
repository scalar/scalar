import { isDefined } from '@scalar/helpers/array/is-defined'
import type { HttpMethod } from '@scalar/helpers/http/http-methods'

/**
 * Generates a unique string ID for an API location, based on the document, path, method, and example.
 * Filters out undefined values and serializes the composite array into a stable string.
 *
 * @param params - An object containing document, path, method, and optional example name.
 * @returns A stringified array representing the unique location identifier.
 *
 * Example:
 *   generateLocationId({ document: 'mydoc', path: '/users', method: 'get', example: 'default' })
 *   // => '["mydoc","/users","get","default"]'
 */
export const generateLocationId = ({
  document,
  path,
  method,
  example,
  isWebhook,
}: {
  document: string
  path?: string
  method?: HttpMethod
  example?: string
  /** When true, the id is namespaced so a webhook does not collide with an operation that shares its path. */
  isWebhook?: boolean
}) => {
  const prefix = isWebhook ? 'webhook' : 'operation'
  return JSON.stringify([prefix, document, path, method, example].filter(isDefined))
}
