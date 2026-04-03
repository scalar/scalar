import type { JsonReferenceObject } from './json-reference'
import type { ResponseObject } from './response'
/**
 * Response object
 *
 * Describes a single response from an API Operation.
 *
 * @see {@link https://swagger.io/specification/v2/#response-object}
 */
export type ResponseValueObject = ResponseObject | JsonReferenceObject
