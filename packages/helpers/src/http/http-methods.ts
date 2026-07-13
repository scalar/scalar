/** Fixed OpenAPI Path Item method fields */
export const HTTP_METHODS = ['get', 'put', 'post', 'delete', 'options', 'head', 'patch', 'trace', 'query'] as const

/** Fixed OpenAPI Path Item method fields */
export type StandardHttpMethod = (typeof HTTP_METHODS)[number]

/** All http methods we support */
export type HttpMethod = StandardHttpMethod | (string & {})

/** Set of all http methods we support */
export const httpMethods = Object.freeze(new Set(HTTP_METHODS))
