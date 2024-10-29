import type {
  AnyApiDefinitionFormat,
  AnyObject,
  DereferenceResult,
  Filesystem,
  ThrowOnErrorOption,
} from '../types/index.js'
import { details } from './details.js'
import { getEntrypoint } from './getEntrypoint.js'
import { makeFilesystem } from './makeFilesystem.js'
import { resolveReferences } from './resolveReferences.js'

export type DereferenceOptions = ThrowOnErrorOption

/**
 * Validates an OpenAPI schema and resolves all references.
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
