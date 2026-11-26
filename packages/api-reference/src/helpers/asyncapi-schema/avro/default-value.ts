import { isObject } from '@scalar/helpers/object/is-object'

/** Check reader defaults against Avro's first-union-branch and native JSON value rules. */
export const matchesDefault = (
  schema: unknown,
  value: unknown,
  namespace: string,
  names: Map<string, Record<string, unknown>>,
  budget: (depth: number) => void,
  depth = 0,
): boolean => {
  budget(depth)
  if (Array.isArray(schema)) {
    return matchesDefault(schema[0], value, namespace, names, budget, depth + 1)
  }
  const type = typeof schema === 'string' ? schema : isObject(schema) ? schema.type : undefined
  if (typeof type !== 'string') {
    return false
  }
  const check = (child: unknown, candidate: unknown, scope = namespace): boolean =>
    matchesDefault(child, candidate, scope, names, budget, depth + 1)
  if (type === 'null') {
    return value === null
  }
  if (type === 'boolean') {
    return typeof value === 'boolean'
  }
  if (type === 'string') {
    return typeof value === 'string'
  }
  if (type === 'int') {
    return typeof value === 'number' && Number.isInteger(value) && value >= -2147483648 && value <= 2147483647
  }
  // Fall back to source if JavaScript cannot preserve the exact reader default.
  if (type === 'long') {
    return typeof value === 'number' && Number.isSafeInteger(value)
  }
  if (type === 'float' || type === 'double') {
    return typeof value === 'number' && Number.isFinite(value)
  }
  if (type === 'bytes' || type === 'fixed') {
    return (
      typeof value === 'string' &&
      [...value].every((char) => char.charCodeAt(0) <= 255) &&
      (type === 'bytes' || (isObject(schema) && value.length === schema.size))
    )
  }
  if (isObject(schema)) {
    if (type === 'array') {
      return Array.isArray(value) && value.every((item) => check(schema.items, item))
    }
    if (type === 'map') {
      return isObject(value) && Object.values(value).every((item) => check(schema.values, item))
    }
    if (type === 'enum') {
      return Array.isArray(schema.symbols) && schema.symbols.includes(value)
    }
    if (type === 'record') {
      const scope =
        typeof schema.name === 'string' && schema.name.includes('.')
          ? schema.name.split('.').slice(0, -1).join('.')
          : typeof schema.namespace === 'string'
            ? schema.namespace
            : namespace
      return (
        isObject(value) &&
        Array.isArray(schema.fields) &&
        schema.fields.every(
          (field) =>
            isObject(field) &&
            typeof field.name === 'string' &&
            check(field.type, Object.hasOwn(value, field.name) ? value[field.name] : field.default, scope),
        )
      )
    }
  }
  const fullname = type.includes('.') || !namespace ? type : `${namespace}.${type}`
  const target = names.get(fullname)
  return !!target && check(target, value, fullname.split('.').slice(0, -1).join('.'))
}
