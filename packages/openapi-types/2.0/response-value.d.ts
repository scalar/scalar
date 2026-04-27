import type { JsonReferenceObject } from './json-reference'
import type { ResponseObject } from './response'
/**
 * Response object
 *
 * Describes a single response from an API Operation.
 *
 * @see {@link https://github.com/OAI/OpenAPI-Specification/blob/main/versions/2.0.md#response-object}
 */
export type ResponseValueObject = ResponseObject | JsonReferenceObject
