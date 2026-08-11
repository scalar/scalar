import { isDefined } from '@scalar/helpers/array/is-defined'
import type { HttpMethod } from '@scalar/helpers/http/http-methods'

/**
 * Generates a unique string ID for an API location, based on the document, path, method, and example.
 * Filters out undefined values and serializes the composite array into a stable string.
 *
 * AsyncAPI channels are located by `channel` instead of `path`/`method`. It is kept at the end of
 * the tuple so existing OpenAPI ids (where `channel` is undefined) serialize unchanged.
 *
 * @param params - An object containing document, path, method, example, and optional channel name.
 * @returns A stringified array representing the unique location identifier.
 *
 * Example:
 *   generateLocationId({ document: 'mydoc', path: '/users', method: 'get', example: 'default' })
 *   // => '["mydoc","/users","get","default"]'
 *   generateLocationId({ document: 'mydoc', channel: 'room' })
 *   // => '["mydoc","room"]'
 */
export const generateLocationId = ({
  document,
  path,
  method,
  example,
  channel,
}: {
  document: string
  path?: string
  method?: HttpMethod
  example?: string
  channel?: string
}) => {
  return JSON.stringify([document, path, method, example, channel].filter(isDefined))
}
