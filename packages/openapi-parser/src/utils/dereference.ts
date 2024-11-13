import type {
  AnyApiDefinitionFormat,
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
 * Resolves all references in an OpenAPI document
 */
export async function dereference(
  value: AnyApiDefinitionFormat | Filesystem,
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
