import { isObject } from '@scalar/helpers/object/is-object'
import type { UnknownObject } from '@scalar/types/utils'

import { cloneDocument } from './clone-document'
import { migrateObjects } from './migrate-objects'
import { migrateTagGroups } from './migrate-tag-groups'

/**
 * Upgrade OpenAPI 3.1.x to 3.2 without changing the input.
 *
 * Collects incompatibilities requiring an author's decision in an AggregateError
 * with a JSON pointer for each issue. External references and custom schema dialects are not validated.
 */
export const upgradeFromThreeOneToThreeTwo = (originalDocument: UnknownObject): UnknownObject => {
  if (
    !isObject(originalDocument) ||
    typeof originalDocument.openapi !== 'string' ||
    !/^3\.1\.\d+$/.test(originalDocument.openapi)
  ) {
    return originalDocument
  }

  const document = cloneDocument(originalDocument)
  const operationTags = migrateObjects(document)
  migrateTagGroups(document, operationTags)
  document.openapi = '3.2.0'
  return document
}
