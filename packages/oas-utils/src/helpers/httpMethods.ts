import type { RequestMethod } from '@/entities/spec/requests'

export const REQUEST_METHODS: {
  [x in RequestMethod]: {
    short: string
    color: string
    backgroundColor: string
  }
} = {
  connect: {
    short: 'CONN',
    color: 'text-c-2',
    backgroundColor: 'bg-c-2',
  },
  delete: {
    short: 'DEL',
    color: 'text-red',
    backgroundColor: 'bg-red',
  },
  get: {
    short: 'GET',
    color: 'text-blue',
    backgroundColor: 'bg-blue',
  },
  head: {
    short: 'HEAD',
    color: 'text-scalar-c-2',
    backgroundColor: 'bg-c-2',
  },
  options: {
    short: 'OPTS',
    color: 'text-purple',
    backgroundColor: 'bg-purple',
  },
  patch: {
    short: 'PATCH',
    color: 'text-yellow',
    backgroundColor: 'bg-yellow',
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
  trace: {
    short: 'TRACE',
    color: 'text-c-2',
    backgroundColor: 'bg-c-2',
  },
} as const

/**
 * Accepts an HTTP Method name and returns some properties for the tag
 */
export const getHttpMethodInfo = (methodName: string) => {
  const normalizedMethod = methodName.trim().toUpperCase()
  return (
    REQUEST_METHODS[normalizedMethod as RequestMethod] ?? {
      short: normalizedMethod,
      color: 'text-c-2',
      backgroundColor: 'bg-c-2',
    }
  )
}
