import { Validator } from '@/lib/Validator/Validator'
import type { AnyObject, Filesystem, OpenApiDocument, ThrowOnErrorOption, ValidateResult } from '@/types/index'

import { makeFilesystem } from './make-filesystem'

export type ValidateOptions = ThrowOnErrorOption

/**
 * Validates an OpenAPI document
 */
export function validate(value: string | AnyObject | Filesystem, options?: ValidateOptions): Promise<ValidateResult> {
  try {
    const filesystem = makeFilesystem(value)

    const validator = new Validator()
    const result = validator.validate(filesystem, options)

    /**
     * Currently contains no asynchronous logic, but returns a Promise
     * to preserve API compatibility and allow async logic in the future.
     */
    return Promise.resolve({
      ...result,
      specification: validator.specification as OpenApiDocument,
      version: validator.version,
    })
  } catch (err) {
    return Promise.reject(err)
  }
}
