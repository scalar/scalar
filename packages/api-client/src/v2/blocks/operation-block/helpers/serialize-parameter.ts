/**
 * Shared parameter serialization utilities for OpenAPI style values.
 * Used by both build-request-parameters and process-parameters.
 *
 * @see https://spec.openapis.org/oas/v3.1.1.html#style-values
 */

/**
 * Serializes a value based on the content type for content-based query parameters.
 * Content-based query parameters do not use style serialization and instead follow
 * their content type specification (e.g., application/json should be JSON.stringified).
 *
 * @param value - The value to serialize
 * @param contentType - The content type to use for serialization
 * @returns The serialized value as a string
 */
export const serializeContentValue = (value: unknown, contentType: string): string => {
  // If already a string, return as is
  if (typeof value === 'string') {
    return value
  }

  // Handle JSON content types
  if (contentType.includes('json') || (typeof value === 'object' && value !== null && !Array.isArray(value))) {
    return JSON.stringify(value)
  }

  // Default: convert to string
  return String(value)
}

/**
 * Serializes a value according to OpenAPI simple style.
 * Used for path and header parameters.
 *
 * Simple style with explode: false
 * - Primitive: blue
 * - Array: blue,black,brown
 * - Object: R,100,G,200,B,150
 *
 * Simple style with explode: true
 * - Primitive: blue
 * - Array: blue,black,brown
 * - Object: R=100,G=200,B=150
 */
export const serializeSimpleStyle = (value: unknown, explode: boolean): unknown => {
  // Handle arrays
  if (Array.isArray(value)) {
    return value.join(',')
  }

  // Handle objects
  if (typeof value === 'object' && value !== null) {
    const entries = Object.entries(value as Record<string, unknown>)

    if (explode) {
      // Simple explode object: R=100,G=200,B=150
      return entries.map(([k, v]) => `${k}=${v}`).join(',')
    }

    // Simple no explode object: R,100,G,200,B,150
    return entries.map(([k, v]) => `${k},${v}`).join(',')
  }

  // Handle primitives - return as-is to preserve type
  return value
}

/**
 * Serializes a value according to OpenAPI form style.
 * Used for query and cookie parameters.
 *
 * Form style with explode: true (default for query)
 * - Primitive: color=blue
 * - Array: color=blue&color=black&color=brown (multiple entries)
 * - Object: R=100&G=200&B=150 (multiple entries)
 *
 * Form style with explode: false
 * - Primitive: color=blue
 * - Array: color=blue,black,brown
 * - Object: color=R,100,G,200,B,150
 */
export const serializeFormStyle = (
  value: unknown,
  explode: boolean,
): unknown | Array<{ key: string; value: unknown }> => {
  // Handle arrays with explode
  if (Array.isArray(value) && explode) {
    return value.map((v) => ({ key: '', value: v }))
  }

  // Handle arrays without explode
  if (Array.isArray(value)) {
    return value.join(',')
  }

  // Handle objects with explode
  if (typeof value === 'object' && value !== null && explode) {
    return Object.entries(value as Record<string, unknown>).map(([k, v]) => ({
      key: k,
      value: v,
    }))
  }

  // Handle objects without explode
  if (typeof value === 'object' && value !== null) {
    return Object.entries(value as Record<string, unknown>)
      .map(([k, v]) => `${k},${v}`)
      .join(',')
  }

  // Handle primitives - return as-is to preserve type
  return value
}

/**
 * Serializes a value according to OpenAPI form style for cookies.
 * This is similar to serializeFormStyle but handles nested objects recursively
 * and treats null values specially for cookie serialization.
 *
 * Form style with explode: true (default for cookies)
 * - Primitive: color=blue
 * - Array: color=blue&color=black&color=brown (multiple entries)
 * - Object: R=100&G=200&B=150 (multiple entries)
 *
 * Form style with explode: false
 * - Primitive: color=blue
 * - Array: color=blue,black,brown (null becomes "null")
 * - Object: color=R,100,G,200,B,150 (recursively flattened)
 */
export const serializeFormStyleForCookies = (
  value: unknown,
  explode: boolean,
): unknown | Array<{ key: string; value: unknown }> => {
  // Handle arrays with explode
  if (Array.isArray(value) && explode) {
    return value.map((v) => ({ key: '', value: v }))
  }

  // Handle arrays without explode - convert null to "null" string
  if (Array.isArray(value)) {
    return value.map((v) => (v === null ? 'null' : String(v))).join(',')
  }

  // Handle objects with explode
  if (typeof value === 'object' && value !== null && explode) {
    return Object.entries(value as Record<string, unknown>).map(([k, v]) => ({
      key: k,
      value: v,
    }))
  }

  // Handle objects without explode - recursively flatten nested objects
  if (typeof value === 'object' && value !== null) {
    const flattenObject = (obj: Record<string, unknown>): string[] => {
      const result: string[] = []

      for (const [key, val] of Object.entries(obj)) {
        // Recursively flatten nested objects
        if (typeof val === 'object' && val !== null && !Array.isArray(val)) {
          result.push(key, ...flattenObject(val as Record<string, unknown>))
        }
        // Handle primitive values
        else {
          result.push(key, val === null ? 'null' : String(val))
        }
      }

      return result
    }

    return flattenObject(value as Record<string, unknown>).join(',')
  }

  // Handle primitives - return as-is to preserve type
  return value
}

/**
 * Serializes a value according to OpenAPI spaceDelimited style.
 * Only valid for query parameters with array or object values.
 *
 * SpaceDelimited array: blue black brown
 * SpaceDelimited object: R 100 G 200 B 150
 */
export const serializeSpaceDelimitedStyle = (value: unknown): string => {
  // Handle arrays
  if (Array.isArray(value)) {
    return value.join(' ')
  }

  // Handle objects
  if (typeof value === 'object' && value !== null) {
    return Object.entries(value as Record<string, unknown>)
      .map(([k, v]) => `${k} ${v}`)
      .join(' ')
  }

  // Handle primitives (shouldn't happen for spaceDelimited)
  return String(value)
}

/**
 * Serializes a value according to OpenAPI pipeDelimited style.
 * Only valid for query parameters with array or object values.
 *
 * PipeDelimited array: blue|black|brown
 * PipeDelimited object: R|100|G|200|B|150
 */
export const serializePipeDelimitedStyle = (value: unknown): string => {
  // Handle arrays
  if (Array.isArray(value)) {
    return value.join('|')
  }

  // Handle objects
  if (typeof value === 'object' && value !== null) {
    return Object.entries(value as Record<string, unknown>)
      .flat()
      .join('|')
  }

  // Handle primitives (shouldn't happen for pipeDelimited)
  return String(value)
}

/**
 * Serializes a value according to OpenAPI deepObject style.
 * Only valid for query parameters with explode: true.
 *
 * DeepObject: color[R]=100&color[G]=200&color[B]=150
 * Nested: user[name][first]=Alex&user[name][last]=Smith&user[role]=admin
 */
export const serializeDeepObjectStyle = (paramName: string, value: unknown): Array<{ key: string; value: string }> => {
  const result: Array<{ key: string; value: string }> = []

  /**
   * Recursively flattens nested objects into deepObject notation.
   */
  const flatten = (obj: Record<string, unknown>, prefix: string): void => {
    for (const [key, val] of Object.entries(obj)) {
      const fullKey = `${prefix}[${key}]`

      if (typeof val === 'object' && val !== null && !Array.isArray(val)) {
        // Recursively flatten nested objects
        flatten(val as Record<string, unknown>, fullKey)
      } else {
        // Add primitive values
        result.push({ key: fullKey, value: String(val) })
      }
    }
  }

  if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
    flatten(value as Record<string, unknown>, paramName)
  }

  return result
}
