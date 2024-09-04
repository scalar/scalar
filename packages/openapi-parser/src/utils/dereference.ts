import type {
  AnyObject,
  DereferenceResult,
  Filesystem,
  ThrowOnErrorOption,
} from '../types'
import { details } from './details'
import { getEntrypoint } from './getEntrypoint'
import { makeFilesystem } from './makeFilesystem'
import { resolveReferences } from './resolveReferences'

export type DereferenceOptions = ThrowOnErrorOption

/**
 * Validates an OpenAPI schema and resolves all references.
 */
export async function dereference(
  value: string | AnyObject | Filesystem,
  options?: DereferenceOptions,
): Promise<DereferenceResult> {
  const filesystem = makeFilesystem(value)

  const entrypoint = getEntrypoint(filesystem)
  const result = resolveReferences(filesystem, options)

  return {
    specification: entrypoint.specification,
    errors: result.errors,
    schema: result.schema,
    ...details(entrypoint.specification),
  }
}
