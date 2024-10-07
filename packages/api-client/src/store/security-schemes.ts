import type { StoreContext } from '@/store/store-context'
import {
  type SecurityScheme,
  type SecuritySchemePayload,
  authExampleFromSchema,
  securitySchemeSchema,
} from '@scalar/oas-utils/entities/spec'
import { LS_KEYS } from '@scalar/oas-utils/helpers'
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
}: StoreContext) {
  /** Adds a security scheme and appends it to either a collection or a request */
  const addSecurityScheme = (
    payload: SecuritySchemePayload,
    /** Schemes will always live at the collection level */
    collectionUid: string,
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

    // Add to the collection as auth
    // This is NOT written to spec and just allows collections to use securitySchemes ad-hoc
    const defaultValue = authExampleFromSchema(scheme)

    collectionMutators.edit(collectionUid, 'auth', {
      ...collections[collectionUid].auth,
      [scheme.uid]: defaultValue,
    })

    return scheme
  }

  /** Delete a security scheme and remove the key from its corresponding parent */
  const deleteSecurityScheme = (schemeUid: string) => {
    // Remove the scheme from any collections that reference it (should only be 1 collection)
    Object.values(collections).forEach((c) => {
      if (c.securitySchemes.includes(schemeUid)) {
        collectionMutators.edit(
          c.uid,
          'securitySchemes',
          c.securitySchemes.filter((s) => s !== schemeUid),
        )
      }
    })

    // Remove the scheme from any collections that use it
    Object.values(collections).forEach((c) => {
      if (schemeUid in c.auth) {
        const { [schemeUid]: toDelete, ...rest } = c.auth
        collectionMutators.edit(c.uid, 'auth', rest)
      }
    })

    Object.values(requests).forEach((r) => {
      // Remove from any requests that have it as a requirement
      if (r.security?.some((s) => Object.keys(s).includes(schemeUid))) {
        requestMutators.edit(
          r.uid,
          'security',
          requests[r.uid].security?.filter(
            (s) => !Object.keys(s).includes(schemeUid),
          ),
        )
      }
      // Remove from any requests that have it selected
      if (r.selectedSecuritySchemeUids.includes(schemeUid))
        requestMutators.edit(
          r.uid,
          'selectedSecuritySchemeUids',
          r.selectedSecuritySchemeUids?.filter((uid) => uid !== schemeUid),
        )
    })

    securitySchemeMutators.delete(schemeUid)
  }

  return {
    addSecurityScheme,
    deleteSecurityScheme,
  }
}
