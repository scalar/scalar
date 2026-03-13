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
export declare const serializeContentValue: (value: unknown, contentType: string) => string
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
export declare const serializeSimpleStyle: (value: unknown, explode: boolean) => unknown
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
export declare const serializeFormStyle: (
  value: unknown,
  explode: boolean,
) =>
  | unknown
  | Array<{
      key: string
      value: unknown
    }>
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
export declare const serializeFormStyleForCookies: (
  value: unknown,
  explode: boolean,
) =>
  | unknown
  | Array<{
      key: string
      value: unknown
    }>
/**
 * Serializes a value according to OpenAPI spaceDelimited style.
 * Only valid for query parameters with array or object values.
 *
 * SpaceDelimited array: blue black brown
 * SpaceDelimited object: R 100 G 200 B 150
 */
export declare const serializeSpaceDelimitedStyle: (value: unknown) => string
/**
 * Serializes a value according to OpenAPI pipeDelimited style.
 * Only valid for query parameters with array or object values.
 *
 * PipeDelimited array: blue|black|brown
 * PipeDelimited object: R|100|G|200|B|150
 */
export declare const serializePipeDelimitedStyle: (value: unknown) => string
/**
 * Serializes a value according to OpenAPI deepObject style.
 * Only valid for query parameters with explode: true.
 *
 * DeepObject: color[R]=100&color[G]=200&color[B]=150
 * Nested: user[name][first]=Alex&user[name][last]=Smith&user[role]=admin
 */
export declare const serializeDeepObjectStyle: (
  paramName: string,
  value: unknown,
) => Array<{
  key: string
  value: string
}>
//# sourceMappingURL=serialize-parameter.d.ts.map
