import type { AnyApiDefinitionFormat, DereferenceResult, Filesystem } from '@/types/index'

import { details } from './details'
import { getEntrypoint } from './get-entrypoint'
import { makeFilesystem } from './make-filesystem'
import { type ResolveReferencesOptions, resolveReferences } from './resolve-references'

export type DereferenceOptions = ResolveReferencesOptions

/**
 * Dereferences a OpenAPI document synchronously
 */
export function dereferenceSync(
  value: AnyApiDefinitionFormat | Filesystem,
  options?: DereferenceOptions,
): DereferenceResult {
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

/**
 * Resolves all references in an OpenAPI document
 *
 * Currently not needed, leaving it here for reference
 */
// export async function dereferenceAsync(
//   value: AnyApiDefinitionFormat | Filesystem,
//   options?: DereferenceOptions,
// ): Promise<DereferenceResult> {
//   return Promise.resolve(dereferenceSync(value, options))
// }
