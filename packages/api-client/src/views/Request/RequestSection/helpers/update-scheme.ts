import type { SecurityScheme } from '@scalar/oas-utils/entities/spec'
import type { Path, PathValue } from '@scalar/object-utils/nested'
import { CLIENT_LS_KEYS, safeLocalStorage } from '@scalar/helpers/object/local-storage'
import type { WorkspaceStore } from '@/store/store'

/** Shape of the local storage auth object */
export type Auth<P extends Path<SecurityScheme>> = Record<string, Record<P, NonNullable<PathValue<SecurityScheme, P>>>>

/** Update the security scheme with side effects */
export const updateScheme = <U extends SecurityScheme['uid'], P extends Path<SecurityScheme>>(
  uid: U,
  path: P,
  value: NonNullable<PathValue<SecurityScheme, P>>,
  { securitySchemeMutators, securitySchemes }: WorkspaceStore,
  persistAuth = false,
) => {
  securitySchemeMutators.edit(uid, path, value)

  if (!persistAuth) {
    return
  }

  // We persist auth to local storage by name key
  try {
    const auth: Auth<P> = JSON.parse(safeLocalStorage().getItem(CLIENT_LS_KEYS.AUTH) ?? '{}')
    const scheme = securitySchemes[uid]

    if (auth && scheme?.nameKey) {
      const nameScheme = (auth[scheme.nameKey] ||= {} as Record<P, NonNullable<PathValue<SecurityScheme, P>>>)
      nameScheme[path] = value
      safeLocalStorage().setItem(CLIENT_LS_KEYS.AUTH, JSON.stringify(auth))
    }
  } catch (e) {
    console.error(e)
  }
}
