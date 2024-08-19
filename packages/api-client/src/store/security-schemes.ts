import { LS_KEYS } from '@/store/local-storage'
import type { StoreContext } from '@/store/store-context'
import {
  type SecurityScheme,
  authExampleFromSchema,
  securitySchemeSchema,
} from '@scalar/oas-utils/entities/spec'
import { mutationFactory } from '@scalar/object-utils/mutator-record'
import { reactive } from 'vue'

/** Create storage entities for security schemes */
export function createStoreSecuritySchemes(useLocalStorage: boolean) {
  const securitySchemes = reactive<Record<string, SecurityScheme>>({})
  const securitySchemeMutators = mutationFactory(
    securitySchemes,
    reactive({}),
    useLocalStorage && LS_KEYS.SECURITY_SCHEME,
  )

  return {
    securitySchemes,
    securitySchemeMutators,
  }
}

/** Extended mutators and data for security schemas */
export function extendedSecurityDataFactory({
  securitySchemeMutators,
  collectionMutators,
  collections,
  requests,
  requestMutators,
  requestExamples,
  requestExampleMutators,
}: StoreContext) {
  /** Adds a security scheme and appends it to either a collection or a request */
  const addSecurityScheme = (
    payload: SecurityScheme,
    /** Schemes will always live at the collection level */
    collectionUid: string,

    /** Option to add the scheme as a requirement to an example or request */
    options?: {
      requestUid?: string
      exampleUid?: string
    },
  ) => {
    const scheme = securitySchemeSchema.parse(payload)

    securitySchemeMutators.add(scheme)

    // Add to collection dictionary
    if (collectionUid) {
      collectionMutators.edit(collectionUid, 'securitySchemes', [
        ...collections[collectionUid].securitySchemes,
        scheme.uid,
      ])
    }

    // Add the scheme as a requirement to the request schema
    if (options?.requestUid) {
      requestMutators.edit(options.requestUid, 'security', [
        ...requests[options.requestUid].security,
        scheme.uid,
      ])
    }

    // Check the scheme as utilized by an example
    // This is NOT written to spec and just allows examples to use securitySchemes ad-hoc
    if (options?.exampleUid) {
      const defaultValue = authExampleFromSchema(scheme)

      requestExampleMutators.edit(options.exampleUid, 'auth', {
        ...requestExamples[options.exampleUid].auth,
        [scheme.uid]: defaultValue,
      })
    }
  }

  /** Delete a security scheme and remove the key from its corresponding parent */
  const deleteSecurityScheme = (scheme: SecurityScheme) => {
    // Remove the scheme from any collections that reference it (should only be 1 collection)
    Object.values(collections).forEach((c) => {
      if (c.securitySchemes.includes(scheme.uid)) {
        collectionMutators.edit(
          c.uid,
          'securitySchemes',
          c.securitySchemes.filter((s) => s !== scheme.uid),
        )
      }
    })

    // Remove the scheme from any examples that use it
    Object.values(requestExamples).forEach((e) => {
      if (scheme.uid in e.auth) {
        const { [scheme.uid]: toDelete, ...rest } = requestExamples[e.uid].auth
        requestExampleMutators.edit(e.uid, 'auth', rest)
      }
    })

    // Remove from any requests that have it as a requirement
    Object.values(requests).forEach((r) => {
      if (r.security.includes(scheme.uid)) {
        requestMutators.edit(
          r.uid,
          'security',
          requests[r.uid].security.filter((s) => s !== scheme.uid),
        )
      }
    })

    securitySchemeMutators.delete(scheme.uid)
  }

  return {
    addSecurityScheme,
    deleteSecurityScheme,
  }
}
