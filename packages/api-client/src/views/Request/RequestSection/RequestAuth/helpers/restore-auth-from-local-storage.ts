import { isDefined } from '@scalar/helpers/array/is-defined'
import { CLIENT_LS_KEYS, safeLocalStorage } from '@scalar/helpers/object/local-storage'
import type { Collection, SecurityScheme } from '@scalar/oas-utils/entities/spec'
import type { Path } from '@scalar/object-utils/nested'
import type { Entries } from 'type-fest/source/entries'

import type { WorkspaceStore } from '@/store/store'
import type { Auth } from '@/views/Request/RequestSection/helpers/update-scheme'

/**
 * Manually restore the auth from local storage
 *
 * Only use this if you need to restore auth manually, in the client web + app we load the whole store from
 * local storage so it isn't needed there.
 */
export const restoreAuthFromLocalStorage = (store: WorkspaceStore, collectionUid: string) => {
  try {
    const { collectionMutators, securitySchemes, securitySchemeMutators } = store
    const auth: Auth<Path<SecurityScheme>> = JSON.parse(safeLocalStorage().getItem(CLIENT_LS_KEYS.AUTH) ?? '{}')

    /** Map the security scheme name key to the uid */
    const dict = Object.keys(securitySchemes).reduce(
      (acc, key) => {
        const scheme = securitySchemes[key]
        if (scheme) {
          acc[scheme.nameKey] = scheme.uid
        }
        return acc
      },
      {} as Record<string, SecurityScheme['uid']>,
    )

    /** Now we can use the dict to restore the auth from local storage */
    Object.entries(auth).forEach(([key, entry]) => {
      const uid = dict[key]
      if (uid) {
        const entries = Object.entries(entry) as Entries<typeof entry>
        entries.forEach(([path, value]) => {
          securitySchemeMutators.edit(uid, path, value)
        })
      }
    })

    /** Restore the selected security scheme uids */
    const selectedSchemeUids: (string | string[])[] = JSON.parse(
      safeLocalStorage().getItem(CLIENT_LS_KEYS.SELECTED_SECURITY_SCHEMES) ?? '[]',
    )

    // Convert back to uids
    const uids = selectedSchemeUids
      .map((nameKeys) => {
        if (Array.isArray(nameKeys)) {
          return nameKeys.map((key) => dict[key]).filter(isDefined)
        }
        return dict[nameKeys]
      })
      .filter(isDefined)

    collectionMutators.edit(collectionUid as Collection['uid'], 'selectedSecuritySchemeUids', uids)
  } catch (e) {
    // Nothing to restore
    console.error(e)
  }
}
