import type { ResponseObject } from './response'
/**
 * Responses Definitions object
 *
 * An object to hold responses to be reused across operations. Response definitions can be referenced to the ones defined here.  This does *not* define global operation responses.
 *
 * @see {@link https://github.com/OAI/OpenAPI-Specification/blob/main/versions/2.0.md#responses-definitions-object}
 */
export type ResponseDefinitionsObject = {
  [key: string]: ResponseObject
}
