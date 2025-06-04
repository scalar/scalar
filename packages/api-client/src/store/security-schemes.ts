import type { StoreContext } from '@/store/store-context'
import {
  type Collection,
  type SecurityScheme,
  type SecuritySchemePayload,
  securitySchemeSchema,
} from '@scalar/oas-utils/entities/spec'
import { LS_KEYS } from '@scalar/helpers/object/local-storage'
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
    collectionUid: Collection['uid'],
  ) => {
    const scheme = securitySchemeSchema.parse(payload)
    securitySchemeMutators.add(scheme)

    // Add to collection dictionary
    if (collectionUid && collections[collectionUid]) {
      collectionMutators.edit(collectionUid, 'securitySchemes', [
        ...collections[collectionUid].securitySchemes,
        scheme.uid,
      ])
    }

    return scheme
  }

  /** Delete a security scheme and remove the key from its corresponding parent */
  const deleteSecurityScheme = (schemeUid: SecurityScheme['uid']) => {
    Object.values(collections).forEach((c) => {
      // Remove the scheme from any collections that reference it (should only be 1 collection)
      if (c.securitySchemes.includes(schemeUid)) {
        collectionMutators.edit(
          c.uid,
          'securitySchemes',
          c.securitySchemes.filter((s) => s !== schemeUid),
        )
      }
    })

    Object.values(requests).forEach((r) => {
      // Remove from any requests that have it as a requirement
      if (r.security?.some((s) => Object.keys(s).includes(schemeUid))) {
        requestMutators.edit(
          r.uid,
          'security',
          requests[r.uid]?.security?.filter((s) => !Object.keys(s).includes(schemeUid)),
        )
      }
      // Remove from any requests that have it selected
      if (r.selectedSecuritySchemeUids.flat().includes(schemeUid)) {
        requestMutators.edit(
          r.uid,
          'selectedSecuritySchemeUids',
          r.selectedSecuritySchemeUids?.filter((uid) => {
            if (Array.isArray(uid)) {
              return !uid.includes(schemeUid)
            }
            return uid !== schemeUid
          }),
        )
      }
    })

    securitySchemeMutators.delete(schemeUid)
  }

  return {
    addSecurityScheme,
    deleteSecurityScheme,
  }
}
