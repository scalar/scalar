import { Type } from '@sinclair/typebox'
import { PathItemObject } from './path-item'

/**
 * A map of possible out-of band callbacks related to the parent operation. Each value in the map is a Path Item Object that describes a set of requests that may be initiated by the API provider and the expected responses. The key value used to identify the Path Item Object is an expression, evaluated at runtime, that identifies a URL to use for the callback operation.
 *
 * To describe incoming requests from the API provider independent from another API call, use the webhooks field.
 */
export const CallbackObject = Type.Record(
  Type.String(),
  /** A Path Item Object used to define a callback request and expected responses. A complete example is available. */
  PathItemObject,
)
