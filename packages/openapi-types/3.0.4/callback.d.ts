/**
 * Callback object
 *
 * A map of possible out-of band callbacks related to the parent operation. Each value in the map is a [Path Item Object](#path-item-object) that describes a set of requests that may be initiated by the API provider and the expected responses. The key value used to identify the Path Item Object is an expression, evaluated at runtime, that identifies a URL to use for the callback operation.
 *
 * @see {@link https://spec.openapis.org/oas/v3.0.4#callback-object}
 */
export type CallbackObject = Record<string, unknown>
