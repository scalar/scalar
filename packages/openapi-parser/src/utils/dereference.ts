import type {
  AnyApiDefinitionFormat,
  DereferenceResult,
  Filesystem,
} from '../types/index.ts'
import { details } from './details.ts'
import { getEntrypoint } from './getEntrypoint.ts'
import { makeFilesystem } from './makeFilesystem.ts'
import {
  type ResolveReferencesOptions,
  resolveReferences,
} from './resolveReferences.ts'

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
