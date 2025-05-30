import { HTTP_METHODS, type OpenAPIV3_1 } from '@scalar/openapi-types'

// TODO: this file is getting bloated, split it up into a lib

/** Use a set for unique plus slightly better perf */
export const httpMethods = new Set(HTTP_METHODS)

/**
 * HTTP methods in a specific order
 * Do not change the order
 */
export const REQUEST_METHODS: {
  [x in OpenAPIV3_1.HttpMethods]: {
    short: string
    colorClass: `text-${string}`
    colorVar: `var(--scalar-color-${string})`
    backgroundColor: string
  }
} = {
  get: {
    short: 'GET',
    colorClass: 'text-blue',
    colorVar: 'var(--scalar-color-blue)',
    backgroundColor: 'bg-blue/10',
  },
  post: {
    short: 'POST',
    colorClass: 'text-green',
    colorVar: 'var(--scalar-color-green)',
    backgroundColor: 'bg-green/10',
  },
  put: {
    short: 'PUT',
    colorClass: 'text-orange',
    colorVar: 'var(--scalar-color-orange)',
    backgroundColor: 'bg-orange/10',
  },
  patch: {
    short: 'PATCH',
    colorClass: 'text-yellow',
    colorVar: 'var(--scalar-color-yellow)',
    backgroundColor: 'bg-yellow/10',
  },
  delete: {
    short: 'DEL',
    colorClass: 'text-red',
    colorVar: 'var(--scalar-color-red)',
    backgroundColor: 'bg-red/10',
  },
  options: {
    short: 'OPTS',
    colorClass: 'text-purple',
    colorVar: 'var(--scalar-color-purple)',
    backgroundColor: 'bg-purple/10',
  },
  head: {
    short: 'HEAD',
    colorClass: 'text-c-2',
    colorVar: 'var(--scalar-color-2)',
    backgroundColor: 'bg-c-2/10',
  },
  connect: {
    short: 'CONN',
    colorClass: 'text-c-2',
    colorVar: 'var(--scalar-color-2)',
    backgroundColor: 'bg-c-2/10',
  },
  trace: {
    short: 'TRACE',
    colorClass: 'text-c-2',
    colorVar: 'var(--scalar-color-2)',
    backgroundColor: 'bg-c-2/10',
  },
} as const

/** HTTP Methods which can have a body */
const BODY_METHODS = ['post', 'put', 'patch', 'delete'] as const
type BodyMethod = (typeof BODY_METHODS)[number]

/** Makes a check to see if this method CAN have a body */
export const canMethodHaveBody = (method: OpenAPIV3_1.HttpMethods): method is BodyMethod =>
  BODY_METHODS.includes(method as BodyMethod)

/** Type guard which takes in a string and returns true if it is in fact an HTTPMethod */
export const isHttpMethod = (method?: string | undefined): method is OpenAPIV3_1.HttpMethods =>
  method ? httpMethods.has(method.toLowerCase() as OpenAPIV3_1.HttpMethods) : false

const DEFAULT_REQUEST_METHOD = 'get'

/**
 * Get a normalized request method (e.g. get, post, etc.)
 * Lowercases the method and returns the default if it is not a valid method so you will always have a valid method
 */
export const normalizeRequestMethod = (method?: string): OpenAPIV3_1.HttpMethods => {
  // Make sure it's a string
  if (typeof method !== 'string') {
    console.warn(`Request method is not a string. Using ${DEFAULT_REQUEST_METHOD} as the default.`)

    return DEFAULT_REQUEST_METHOD
  }

  // Normalize the string
  const normalizedMethod = method.trim().toLowerCase()

  if (!isHttpMethod(normalizedMethod)) {
    console.warn(`${method} is not a valid request method. Using ${DEFAULT_REQUEST_METHOD} as the default.`)

    return DEFAULT_REQUEST_METHOD
  }

  return normalizedMethod as OpenAPIV3_1.HttpMethods
}

/**
 * Accepts an HTTP Method name and returns some properties for the tag
 * Defaults to get if the method is not valid
 */
export const getHttpMethodInfo = (methodName: string) => REQUEST_METHODS[normalizeRequestMethod(methodName)]

/**
 * Filters an OpenAPI PathsObject to only include standard HTTP methods.
 * Removes any vendor extensions or other non-HTTP properties.
 *
 * @param paths - The OpenAPI PathsObject to filter
 * @returns A new PathsObject containing only standard HTTP methods
 *
 * @example
 * Input: {
 *   "/users": {
 *     "get": {...},
 *     "x-custom": {...},
 *     "post": {...}
 *   }
 * }
 * Output: {
 *   "/users": {
 *     "get": {...},
 *     "post": {...}
 *   }
 * }
 */
export const filterHttpMethodsOnly = (paths: OpenAPIV3_1.PathsObject) => {
  const result: OpenAPIV3_1.PathsObject = {}

  for (const [path, methods] of Object.entries(paths)) {
    if (!methods) {
      continue
    }

    const filteredMethods: OpenAPIV3_1.PathItemObject = {}

    for (const [method, operation] of Object.entries(methods)) {
      if (isHttpMethod(method)) {
        filteredMethods[method] = operation as OpenAPIV3_1.OperationObject
      }
    }

    if (Object.keys(filteredMethods).length > 0) {
      result[path] = filteredMethods
    }
  }

  return result
}
