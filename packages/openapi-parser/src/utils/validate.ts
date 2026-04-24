import { Validator } from '@/lib/Validator/Validator'
import type { Filesystem, OpenApiDocument, ThrowOnErrorOption, UnknownObject, ValidateResult } from '@/types/index'

import { makeFilesystem } from './make-filesystem'

export type ValidateOptions = ThrowOnErrorOption

/**
 * Validates an OpenAPI document
 */
export function validate(value: string | UnknownObject | Filesystem, options?: ValidateOptions): Promise<ValidateResult> {
  try {
    const filesystem = makeFilesystem(value)

    const validator = new Validator()
    const result = validator.validate(filesystem, options)

    /**
     * Currently contains no asynchronous logic, but returns a Promise
     * to preserve API compatibility and allow async logic in the future.
     */
    if (result.valid) {
      return Promise.resolve({
        ...result,
        specification: validator.specification as OpenApiDocument,
        version: validator.version,
      })
    }

    return Promise.resolve({
      ...result,
      specification: validator.specification as UnknownObject,
    })
  } catch (err) {
    return Promise.reject(err)
  }
}
