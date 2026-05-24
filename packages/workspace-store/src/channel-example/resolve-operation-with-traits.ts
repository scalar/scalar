import type { AsyncApiOperationObject } from '@scalar/types/asyncapi/3.1'

import { getResolvedRef, mergeSiblingReferences } from '@/helpers/get-resolved-ref'

/**
 * Merges operation traits into a single operation view (security and bindings from traits first).
 */
export const resolveOperationWithTraits = (operation: AsyncApiOperationObject): AsyncApiOperationObject => {
  const traits = operation.traits ?? []
  if (traits.length === 0) {
    return operation
  }

  const traitSecurity = traits.flatMap((traitRef) => {
    const trait = getResolvedRef(traitRef, mergeSiblingReferences)
    return trait.security?.length ? trait.security : []
  })

  const traitBindings = traits.reduce<AsyncApiOperationObject['bindings'] | undefined>((accumulated, traitRef) => {
    const trait = getResolvedRef(traitRef, mergeSiblingReferences)
    if (!trait.bindings) {
      return accumulated
    }

    const resolvedTraitBindings = getResolvedRef(trait.bindings, mergeSiblingReferences)
    return accumulated
      ? ({
          ...getResolvedRef(accumulated, mergeSiblingReferences),
          ...resolvedTraitBindings,
        } as AsyncApiOperationObject['bindings'])
      : resolvedTraitBindings
  }, undefined)

  const operationSecurity = operation.security ?? []
  const mergedSecurity = [...traitSecurity, ...operationSecurity]

  const bindings =
    traitBindings && operation.bindings
      ? ({
          ...getResolvedRef(traitBindings, mergeSiblingReferences),
          ...getResolvedRef(operation.bindings, mergeSiblingReferences),
        } as AsyncApiOperationObject['bindings'])
      : (operation.bindings ?? traitBindings)

  return {
    ...operation,
    ...(mergedSecurity.length > 0 ? { security: mergedSecurity } : {}),
    ...(bindings !== operation.bindings ? { bindings } : {}),
  }
}
