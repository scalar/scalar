import { isObject } from '@scalar/helpers/object/is-object'

import type { XBadge } from '@/schemas/extensions/operation/x-badge'

/**
 * Reads the `x-badges` extension of an OpenAPI object (operation, tag, tag group or schema)
 * for the navigation entry of that object.
 *
 * Badges without a name are dropped, and so are fields with an invalid value.
 * Returns `undefined` when no badge is left, so the entry can omit the key.
 */
export const getXBadges = (object: unknown): XBadge[] | undefined => {
  if (!isObject(object) || !Array.isArray(object['x-badges'])) {
    return undefined
  }

  const badges = object['x-badges'].flatMap((badge): XBadge[] => {
    if (!isObject(badge) || typeof badge.name !== 'string' || badge.name === '') {
      return []
    }

    return [
      {
        name: badge.name,
        ...(badge.position === 'before' || badge.position === 'after' ? { position: badge.position } : {}),
        ...(typeof badge.color === 'string' ? { color: badge.color } : {}),
      },
    ]
  })

  return badges.length ? badges : undefined
}
