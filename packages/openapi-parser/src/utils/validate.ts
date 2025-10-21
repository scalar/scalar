import type { OpenAPI } from '@scalar/openapi-types'

import { Validator } from '@/lib/Validator/Validator'
import type { AnyObject, Filesystem, ThrowOnErrorOption, ValidateResult } from '@/types/index'

import { makeFilesystem } from './make-filesystem'

export type ValidateOptions = ThrowOnErrorOption

/**
 * Validates an OpenAPI document
 */
export function validate(value: string | AnyObject | Filesystem, options?: ValidateOptions): ValidateResult {
  const filesystem = makeFilesystem(value)

  const validator = new Validator()
  const result = validator.validate(filesystem, options)

  return {
    ...result,
    specification: validator.specification as OpenAPI.Document,
    version: validator.version,
  }
}
