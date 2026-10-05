import { isObjectLike } from '../object/is-object'

const hasStructuredType = (schema: unknown, seen = new WeakSet<object>()): boolean => {
  if (!isObjectLike(schema) || seen.has(schema)) {
    return false
  }
  seen.add(schema)
  const types = Array.isArray(schema.type) ? schema.type : [schema.type]
  return (
    types.some((type) => type === 'array' || type === 'object') ||
    ['anyOf', 'oneOf', 'allOf'].some((key) => {
      const variants = schema[key]
      return Array.isArray(variants) && variants.some((variant) => hasStructuredType(variant, seen))
    })
  )
}

/**
 * Reports structured cookie declarations that would introduce forbidden comma delimiters.
 * Callers apply this OpenAPI 3.2 rule only after checking the document version.
 * Schema checks catch invalid declarations even when their selected example is empty.
 */
export const getCookieSerializationError = (
  parameter: { name: string; in: string; style?: string; explode?: boolean; schema?: unknown },
  value?: unknown,
): string | undefined => {
  if (
    parameter.in !== 'cookie' ||
    parameter.explode !== false ||
    (parameter.style !== undefined && parameter.style !== 'form' && parameter.style !== 'cookie')
  ) {
    return undefined
  }
  if (!isObjectLike(value) && !hasStructuredType(parameter.schema)) {
    return undefined
  }
  return `Cookie parameter "${parameter.name}" cannot serialize an array or object with style: ${parameter.style ?? 'form'} and explode: false because comma-separated cookie values are invalid. Use style: cookie with explode: true.`
}
