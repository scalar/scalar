import type {
  Collection,
  Request,
  SecurityScheme,
} from '@scalar/oas-utils/entities/spec'

/** Format a scheme object into a display object */
export const displaySchemeFormatter = (s: {
  type: SecurityScheme['type']
  nameKey: SecurityScheme['nameKey']
  uid: SecurityScheme['uid']
}) => ({
  id: s.uid,
  label: s.type === 'openIdConnect' ? `${s.nameKey} (coming soon)` : s.nameKey,
})

/** Compute what the security requirements should be for a request */
export const getSecurityRequirements = (
  request?: Request,
  collection?: Collection,
) => {
  // If the request security is optional, use the collection security and ensure it includes an optional object
  if (
    JSON.stringify(request?.security) === '[{}]' &&
    collection?.security?.length
  ) {
    const collectionHasOptional = Boolean(
      collection.security.find((s) => JSON.stringify(s) === '{}'),
    )

    return collectionHasOptional
      ? collection.security
      : [...collection.security, {}]
  }

  return request?.security ?? collection?.security ?? []
}
