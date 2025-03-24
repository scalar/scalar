import { z } from 'zod'
import { ResponseObjectSchema } from './response-object'

/**
 * Responses Object
 *
 * A container for the expected responses of an operation. The container maps a HTTP response code to the expected
 * response.
 *
 * The documentation is not necessarily expected to cover all possible HTTP response codes because they may not be known
 *  in advance. However, documentation is expected to cover a successful operation response and any known errors.
 * The default MAY be used as a default Response Object for all HTTP codes that are not covered individually by the
 * Responses Object.
 *
 * The Responses Object MUST contain at least one response code, and if only one response code is provided it SHOULD be
 * the response for a successful operation call.
 *
 * @see https://github.com/OAI/OpenAPI-Specification/blob/main/versions/3.1.1.md#responses-object
 */
export const ResponsesObjectSchema = z.record(
  /**
   * Response Object | Reference Object	Any HTTP status code can be used as the property name, but only one property per
   *  code, to describe the expected response for that HTTP status code. This field MUST be enclosed in quotation marks
   * (for example, "200") for compatibility between JSON and YAML. To define a range of response codes, this field MAY
   * contain the uppercase wildcard character X. For example, 2XX represents all response codes between 200 and 299.
   * Only the following range definitions are allowed: 1XX, 2XX, 3XX, 4XX, and 5XX. If a response is defined using an
   * explicit code, the explicit code definition takes precedence over the range definition for that code.
   */
  z.string(),
  ResponseObjectSchema,
)
