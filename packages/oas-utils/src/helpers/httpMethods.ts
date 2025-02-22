import { type RequestMethod, requestMethods } from '@/entities/spec/requests'

/**
 * HTTP methods in a specific order
 * Do not change the order
 */
export const REQUEST_METHODS: {
  [x in RequestMethod]: {
    short: string
    color: string
    backgroundColor: string
  }
} = {
  get: {
    short: 'GET',
    color: 'text-blue',
    backgroundColor: 'bg-blue',
  },
  post: {
    short: 'POST',
    color: 'text-green',
    backgroundColor: 'bg-green',
  },
  put: {
    short: 'PUT',
    color: 'text-orange',
    backgroundColor: 'bg-orange',
  },
  patch: {
    short: 'PATCH',
    color: 'text-yellow',
    backgroundColor: 'bg-yellow',
  },
  delete: {
    short: 'DEL',
    color: 'text-red',
    backgroundColor: 'bg-red',
  },
  options: {
    short: 'OPTS',
    color: 'text-purple',
    backgroundColor: 'bg-purple',
  },
  head: {
    short: 'HEAD',
    color: 'text-scalar-c-2',
    backgroundColor: 'bg-c-2',
  },
  connect: {
    short: 'CONN',
    color: 'text-c-2',
    backgroundColor: 'bg-c-2',
  },
  trace: {
    short: 'TRACE',
    color: 'text-c-2',
    backgroundColor: 'bg-c-2',
  },
} as const

/** HTTP Methods which can have a body */
const BODY_METHODS = ['post', 'put', 'patch', 'delete'] as const
type BodyMethod = (typeof BODY_METHODS)[number]

/** Makes a check to see if this method CAN have a body */
export const canMethodHaveBody = (method: RequestMethod): method is BodyMethod =>
  BODY_METHODS.includes(method as BodyMethod)

/**
 * Accepts an HTTP Method name and returns some properties for the tag
 */
export const getHttpMethodInfo = (methodName: string) => {
  const normalizedMethod = methodName.trim().toLowerCase()
  return (
    REQUEST_METHODS[normalizedMethod as RequestMethod] ?? {
      short: normalizedMethod,
      color: 'text-c-2',
      backgroundColor: 'bg-c-2',
    }
  )
}

/** Type guard which takes in a string and returns true if it is in fact an HTTPMethod */
export const isHttpMethod = (method?: string | undefined): method is RequestMethod =>
  method ? requestMethods.includes(method as RequestMethod) : false
