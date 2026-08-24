/**
 * A single validation error.
 *
 * `path` is either a JSON Pointer string (from schema validation) or a list of
 * path segments (when a caller adds its own semantic errors).
 */
export type ErrorObject = {
  message: string
  path?: string | string[]
  code?: string
}

export type ValidateOptions = {
  /**
   * If `true`, throw on the first error instead of returning them.
   *
   * @default false
   */
  throwOnError?: boolean
  /**
   * Extra Ajv formats to register beyond `ajv-formats`, keyed by name.
   *
   * For example OpenAPI 3.1/3.2 documents use a `media-range` format.
   */
  formats?: Record<string, unknown>
}

/**
 * The result of validating a document against a schema.
 */
export type ValidationResult =
  | {
      valid: true
      errors: []
    }
  | {
      valid: false
      errors: ErrorObject[]
    }
