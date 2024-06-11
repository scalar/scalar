export const REQUEST_METHODS = {
  CONNECT: {
    short: 'CONN',
    color: 'text-c-2',
    backgroundColor: 'bg-c-2',
  },
  DELETE: {
    short: 'DEL',
    color: 'text-red',
    backgroundColor: 'bg-red',
  },
  GET: {
    short: 'GET',
    color: 'text-blue',
    backgroundColor: 'bg-blue',
  },
  HEAD: {
    short: 'HEAD',
    color: 'text-scalar-c-2',
    backgroundColor: 'bg-c-2',
  },
  OPTIONS: {
    short: 'OPTS',
    color: 'text-purple',
    backgroundColor: 'bg-purple',
  },
  PATCH: {
    short: 'PATCH',
    color: 'text-yellow',
    backgroundColor: 'bg-yellow',
  },
  POST: {
    short: 'POST',
    color: 'text-green',
    backgroundColor: 'bg-green',
  },
  PUT: {
    short: 'PUT',
    color: 'text-orange',
    backgroundColor: 'bg-orange',
  },
  TRACE: {
    short: 'TRACE',
    color: 'text-c-2',
    backgroundColor: 'bg-c-2',
  },
} as const

export type RequestMethod = keyof typeof REQUEST_METHODS

/**
 * Accepts an HTTP Method name and returns some properties for the tag
 */
export const getRequest = (methodName: string) => {
  const normalizedMethod = methodName.trim().toUpperCase()

  if (normalizedMethod in REQUEST_METHODS)
    return REQUEST_METHODS[normalizedMethod as RequestMethod]
  else {
    return {
      short: normalizedMethod,
      color: 'text-c-2',
      backgroundColor: 'bg-c-2',
    }
  }
}
