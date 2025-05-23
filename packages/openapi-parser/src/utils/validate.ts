import type { OpenAPI } from '@scalar/openapi-types'

import { Validator } from '@/lib/Validator/Validator'
import type { AnyObject, Filesystem, ThrowOnErrorOption, ValidateResult } from '@/types/index'
import { makeFilesystem } from './make-filesystem'

export type ValidateOptions = ThrowOnErrorOption

/**
 * Validates an OpenAPI document
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
