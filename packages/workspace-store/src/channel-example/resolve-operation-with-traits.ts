import type { AsyncApiOperationObject } from '@scalar/types/asyncapi/3.1'

import { getResolvedRef, mergeSiblingReferences } from '@/helpers/get-resolved-ref'

type AsyncApiSecurityEntry = NonNullable<AsyncApiOperationObject['security']>[number]

/**
 * Merges operation traits into a single operation view (security and bindings from traits first).
 */
export const resolveOperationWithTraits = (operation: AsyncApiOperationObject): AsyncApiOperationObject => {
  const traits = operation.traits ?? []
  if (traits.length === 0) {
    return operation
  }

  const traitSecurity: AsyncApiSecurityEntry[] = []
  let bindings = operation.bindings

  for (const traitRef of traits) {
    const trait = getResolvedRef(traitRef, mergeSiblingReferences)
    if (trait.security?.length) {
      traitSecurity.push(...trait.security)
    }
    if (trait.bindings) {
      bindings = bindings
        ? ({
            ...getResolvedRef(bindings, mergeSiblingReferences),
            ...getResolvedRef(trait.bindings, mergeSiblingReferences),
          } as AsyncApiOperationObject['bindings'])
        : trait.bindings
    }
  }

  const operationSecurity = operation.security ?? []
  const mergedSecurity = [...traitSecurity, ...operationSecurity]

  return {
    ...operation,
    ...(mergedSecurity.length > 0 ? { security: mergedSecurity } : {}),
    ...(bindings !== operation.bindings ? { bindings } : {}),
  }
}
