import type { ErrorObject } from '@scalar/json-schema-validator'
import type { UnknownObject } from '@scalar/types/utils'

import type { OpenApiVersion } from '@/specifications'

export type { ErrorObject } from '@scalar/json-schema-validator'

export type { OpenApiVersion } from '@/specifications'

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
