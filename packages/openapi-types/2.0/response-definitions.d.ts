import type { ResponseObject } from './response'
/**
 * Responses Definitions object
 *
 * An object to hold responses to be reused across operations. Response definitions can be referenced to the ones defined here.  This does *not* define global operation responses.
 *
 * @see {@link https://swagger.io/specification/v2/#responses-definitions-object}
 */
export type ResponseDefinitionsObject = {
  [key: string]: ResponseObject
}
