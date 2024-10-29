import type { OpenAPI } from '@scalar/openapi-types'

import { Validator } from '../lib/Validator/index.js'
import type {
  AnyObject,
  Filesystem,
  ThrowOnErrorOption,
  ValidateResult,
} from '../types/index.js'
import { makeFilesystem } from './makeFilesystem.js'

export type ValidateOptions = ThrowOnErrorOption

/**
 * Validates an OpenAPI schema.
 */
export async function validate(
  value: string | AnyObject | Filesystem,
  options?: ValidateOptions,
): Promise<ValidateResult> {
  const filesystem = makeFilesystem(value)

  const validator = new Validator()
  const result = await validator.validate(filesystem, options)

  return {
    ...result,
    specification: validator.specification as OpenAPI.Document,
    version: validator.version,
  }
}
