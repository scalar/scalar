import type { UnknownObject } from '@scalar/types/utils'

import type { ERRORS, OpenApiVersion } from '@/configuration'

export type { OpenApiVersion } from '@/configuration'

/**
 * A single validation error.
 */
export type ErrorObject = {
  path?: string[]
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
