import { isObject } from '@scalar/helpers/object/is-object'
import type { UnknownObject } from '@scalar/types/utils'

import { cloneDocument } from '../helpers/clone-document'
import { migrateObjects } from './migrate-objects'
import { migrateTagGroups } from './migrate-tag-groups'

/** Reject malformed 3.1 declarations instead of silently leaving a requested upgrade incomplete. */
const isThreeOneDocument = (document: UnknownObject): boolean => {
  if (!isObject(document) || typeof document.openapi !== 'string') {
    return false
  }
  if (/^3\.1\.\d+$/.test(document.openapi)) {
    return true
  }
  if (/^3\.1(?:\D|$)/.test(document.openapi)) {
    throw new Error(
      `Cannot upgrade to OpenAPI 3.2: invalid OpenAPI version "${document.openapi}". Expected 3.1.x with a numeric patch version.`,
    )
  }
  return false
}

/** Apply the final migration to a document already owned by the upgrade pipeline. */
export const migrateThreeOneToThreeTwo = (document: UnknownObject): UnknownObject => {
  if (!isThreeOneDocument(document)) {
    return document
  }
  const operationTags = migrateObjects(document)
  migrateTagGroups(document, operationTags)
  document.openapi = '3.2.0'
  return document
}

/**
 * Upgrade OpenAPI 3.1.x to 3.2 without changing the input.
 *
 * Collects incompatibilities requiring an author's decision in an AggregateError
 * with a JSON pointer for each issue. External references and custom schema dialects are not validated.
 * Malformed 3.1 versions, object cycles, and excessive alias expansion throw ordinary Errors.
 */
export const upgradeFromThreeOneToThreeTwo = (originalDocument: UnknownObject): UnknownObject => {
  if (!isThreeOneDocument(originalDocument)) {
    return originalDocument
  }
  return migrateThreeOneToThreeTwo(cloneDocument(originalDocument))
}
