import { ADD_AUTH_OPTIONS, type SecuritySchemeGroup, type SecuritySchemeOption } from '@/views/Request/consts'
import type { Collection, Operation, SecurityScheme } from '@scalar/oas-utils/entities/spec'
import { isDefined } from '@scalar/oas-utils/helpers'

type DisplayScheme = {
  type: SecurityScheme['type'] | 'complex'
  nameKey: SecurityScheme['nameKey']
  uid: SecurityScheme['uid']
}

/** Format a scheme object into a display object */
export const formatScheme = (s: DisplayScheme) => ({
  id: s.uid,
  label: s.type === 'openIdConnect' ? `${s.nameKey} (coming soon)` : s.nameKey,
})

/** Formats complex security schemes */
export const formatComplexScheme = (uids: string[], securitySchemes: Record<string, DisplayScheme>) =>
  formatScheme(
    uids.reduce(
      (acc, uid, index) => {
        const scheme = securitySchemes[uid]
        if (scheme) {
          acc.nameKey += `${index > 0 ? ' & ' : ''}${scheme.nameKey}`
          acc.uid = `${acc.uid}${index > 0 ? ',' : ''}${scheme.uid}` as SecurityScheme['uid']
        }
        return acc
      },
      { type: 'complex', nameKey: '', uid: '' as SecurityScheme['uid'] },
    ),
  )

/** Compute what the security requirements should be for a request */
export const getSecurityRequirements = (operation?: Operation, collection?: Collection) => {
  // If the request security is optional, use the collection security and ensure it includes an optional object
  if (JSON.stringify(operation?.security) === '[{}]' && collection?.security?.length) {
    const collectionHasOptional = Boolean(collection?.security.find((s) => JSON.stringify(s) === '{}'))

    return collectionHasOptional ? collection.security : [...collection.security, {}]
  }

  return operation?.security ?? collection?.security ?? []
}

/**
 * Generates the options for the security scheme combobox
 *
 * contains either a flat list, or different groups of required, available, and add new
 */
export const getSchemeOptions = (
  filteredRequirements: Collection['security'],
  collectionSchemeUids: Collection['securitySchemes'],
  securitySchemes: Record<string, DisplayScheme>,
  isReadOnly: boolean = false,
): SecuritySchemeOption[] | SecuritySchemeGroup[] => {
  {
    /** Creates a dictionary of security schemes by nameKey (not UID) */
    const schemeDict = collectionSchemeUids.reduce(
      (acc, uid) => {
        const scheme = securitySchemes[uid]
        if (scheme) {
          acc[scheme.nameKey] = scheme
        }
        return acc
      },
      {} as Record<string, DisplayScheme>,
    )

    /** Builds the required schemes formatted as options */
    const requiredFormatted = filteredRequirements.flatMap((r): SecuritySchemeOption | [] => {
      const keys = Object.keys(r)

      // Complex auth
      if (keys.length > 1) {
        const uids = keys.map((k) => schemeDict[k]?.uid).filter(isDefined)
        return formatComplexScheme(uids, securitySchemes)
      }
      // Simple auth
      if (keys[0]) {
        const scheme = schemeDict[keys[0]]
        if (scheme) {
          return formatScheme(scheme)
        }
      }

      return []
    })

    /** Collection schemes minus the required ones */
    const availableFormatted = collectionSchemeUids
      .filter((uid) => !requiredFormatted.some((r) => r.id === uid))
      .map((uid) => {
        const scheme = securitySchemes[uid]
        if (scheme) {
          return formatScheme(scheme)
        }
        return null
      })
      .filter(isDefined)

    const options = [
      { label: 'Required authentication', options: requiredFormatted },
      { label: 'Available authentication', options: availableFormatted },
    ]

    if (isReadOnly) {
      return requiredFormatted.length ? options : availableFormatted
    }

    options.push({
      label: 'Add new authentication',
      options: ADD_AUTH_OPTIONS,
    })

    return options
  }
}
