import type { AnyObject } from '@scalar/types/utils'
import { parse as parseYaml } from 'yaml'

import type { ThrowOnErrorOption, ValidationOutcome } from '@/types'
import { Validator } from '@/validator'

export type ValidateOptions = ThrowOnErrorOption

/**
 * Validates a single OpenAPI document against the OpenAPI Specification.
 *
 * The input must be a self-contained document. This validator does not resolve
 * external `$ref`s, so bundle or dereference documents that span multiple files
 * before validating them.
 *
 * @param document - A JSON string, a YAML string, or an object.
 */
export function validate(document: string | AnyObject, options?: ValidateOptions): ValidationOutcome {
  let specification: AnyObject

  if (typeof document === 'string') {
    try {
      specification = parseYaml(document)
    } catch (error) {
      if (options?.throwOnError) {
        throw error
      }

      return {
        valid: false,
        errors: [{ message: error instanceof Error ? error.message : String(error) }],
      }
    }
  } else {
    specification = document
  }

  return new Validator().validate(specification, options)
}
