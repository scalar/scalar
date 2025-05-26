import type { AnyApiDefinitionFormat, DereferenceResult, Filesystem } from '@/types/index'
import { details } from './details'
import { getEntrypoint } from './get-entrypoint'
import { makeFilesystem } from './make-filesystem'
import { type ResolveReferencesOptions, resolveReferences } from './resolve-references'

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
