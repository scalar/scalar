import type {
  AnyApiDefinitionFormat,
  DereferenceResult,
  Filesystem,
} from '../types/index.js'
import { details } from './details.js'
import { getEntrypoint } from './getEntrypoint.js'
import { makeFilesystem } from './makeFilesystem.js'
import {
  type ResolveReferencesOptions,
  resolveReferences,
} from './resolveReferences.js'

export type DereferenceOptions = ResolveReferencesOptions

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
