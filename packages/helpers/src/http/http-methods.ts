/** All OpenAPI HTTP methods plus connect */
export const HTTP_METHODS = ['connect', 'delete', 'get', 'head', 'options', 'patch', 'post', 'put', 'trace'] as const

/** All http methods we support */
export type HttpMethod = (typeof HTTP_METHODS)[number]

/** Set of all http methods we support */
export const httpMethods = Object.freeze(new Set(HTTP_METHODS))
