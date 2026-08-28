import type { ValidationOutcome as GenericValidationOutcome } from '@scalar/json-schema-validator'

import type { AsyncApiVersion } from '@/specifications'

export type { ErrorObject } from '@scalar/json-schema-validator'

export type { AsyncApiVersion } from '@/specifications'

export type ThrowOnErrorOption = {
  /**
   * If `true`, the function will throw an error if the document is invalid.
   *
   * @default false
   */
  throwOnError?: boolean
}

/**
 * The result of validating an AsyncAPI document.
 */
export type ValidationOutcome = GenericValidationOutcome<AsyncApiVersion>
