import type { HttpMethod } from './http-methods'

export type HttpInfo = {
  short: string
  colorClass: `text-${string}`
  colorVar: `var(--scalar-color-${string})`
  backgroundColor: string
}

/**
 * HTTP methods in a specific order
 * Do not change the order
 */
export const REQUEST_METHODS = {
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
} as const satisfies Record<HttpMethod, HttpInfo>

/**
 * Accepts an HTTP Method name and returns some properties for the tag
 */
export const getHttpMethodInfo = (methodName: string) => {
  const normalizedMethod = methodName.trim().toLowerCase() as HttpMethod
  return (
    REQUEST_METHODS[normalizedMethod] ?? {
      short: normalizedMethod,
      color: 'text-c-2',
      backgroundColor: 'bg-c-2',
    }
  )
}
