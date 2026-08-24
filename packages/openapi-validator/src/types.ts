import type { UnknownObject } from '@scalar/types/utils'

import type { ERRORS } from '@/errors'
import type { OpenApiVersion } from '@/specifications'

export type { OpenApiVersion } from '@/specifications'

/**
 * A single validation error.
 *
 * `path` is either a JSON Pointer string (from schema validation) or a list of
 * path segments (from the semantic path-parameter checks).
 */
export type ErrorObject = {
  path?: string | string[]
  message: string
  code?: keyof typeof ERRORS | string
}

export type ThrowOnErrorOption = {
  /**
   * If `true`, the function will throw an error if the document is invalid.
   *
   * @default false
   */
  throwOnError?: boolean
}

/**
 * The result of validating a document.
 */
export type ValidationOutcome =
  | {
      valid: true
      version: OpenApiVersion
      errors?: ErrorObject[]
      schema: UnknownObject
    }
  | {
      valid: false
      version?: OpenApiVersion
      errors: ErrorObject[]
      schema?: UnknownObject
    }
