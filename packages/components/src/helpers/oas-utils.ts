/**
 * These are temporarily copied over from oas-utils to remove components dependence on that package
 * this should greatly speed up our build times as components won't be rebuilt every time we make a change in oas-utils
 *
 * This is however a temporary solution, the real fix would be to separate oas-utils into a package that rarely changes
 * which houses these helpers, and one which changes much more frequently (entities)
 */

type AnyObject = Record<string, any>
type PrimitiveOrObject = object | string | null | number | boolean | undefined

/**
 * Check if value is a valid JSON string
 */
const isJsonString = (value?: any) => {
  if (typeof value !== 'string') return false

  return !!json.parseSafe(value, false)
}

/** JSON handling with optional safeparse */
const json = {
  /** Parse and throw if the return value is not an object */
  parse: (val: string): AnyObject => {
    const jsonObject = JSON.parse(val)
    if (typeof jsonObject !== 'object') throw Error('Invalid JSON object')
    return jsonObject
  },
  /** Parse and return a fallback on failure */
  parseSafe<T extends PrimitiveOrObject>(val: string, fallback: T | ((err: any) => T)): AnyObject | T {
    try {
      return json.parse(val)
    } catch (err) {
      return typeof fallback === 'function' ? fallback(err) : fallback
    }
  },
  stringify: (val: object) => JSON.stringify(val),
}

/**
 * Takes JSON and formats it.
 */
export const prettyPrintJson = (value: string | number | any[] | Record<any, any>) => {
  if (typeof value === 'string') {
    // JSON string
    if (isJsonString(value)) {
      return JSON.stringify(JSON.parse(value), null, 2)
    }

    // Regular string
    return value
  }

  // Object
  if (typeof value === 'object') {
    try {
      return JSON.stringify(value, null, 2)
    } catch {
      return replaceCircularDependencies(value)
    }
  }

  return value.toString()
}

/**
 * JSON.stringify, but with circular dependencies replaced with '[Circular]'
 */
function replaceCircularDependencies(content: any) {
  const cache = new Set()

  return JSON.stringify(
    content,
    (_, value) => {
      if (typeof value === 'object' && value !== null) {
        if (cache.has(value)) {
          return '[Circular]'
        }

        cache.add(value)
      }
      return value
    },
    2,
  )
}

/**
 * Little helper for sleeping for x milliseconds
 * an async await friendly setTimeout
 *
 * @param ms - time to sleep in ms
 */
export const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms))
