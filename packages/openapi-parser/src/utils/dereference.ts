import type { AnyApiDefinitionFormat, DereferenceResult, Filesystem } from '@/types/index'

import { details } from './details'
import { getEntrypoint } from './get-entrypoint'
import { makeFilesystem } from './make-filesystem'
import { type ResolveReferencesOptions, resolveReferences } from './resolve-references'

export type DereferenceOptions = ResolveReferencesOptions

/**
 * Dereferences an API definition or filesystem by resolving all references within the specification.
 *
 * @param value - The API definition or filesystem to dereference.\
 *                Can be any supported API definition format or a filesystem object.
 *
 * @param options - Optional options for the dereferencing process.
 */
export function dereference(
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
