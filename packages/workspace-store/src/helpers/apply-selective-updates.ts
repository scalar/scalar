import { type Difference, apply, diff } from '@scalar/json-magic/diff'

import { type UnknownObject, split } from '@/helpers/general'

// Keys to exclude from the diff - these are metadata fields that should not be persisted
// when applying updates to the original document
const excludeKeys = new Set(['x-scalar-navigation', 'x-ext', 'x-ext-urls', '$status'])

/**
 * Applies updates from an updated document to an original document, while excluding changes to certain metadata keys.
 *
 * This function computes the differences between the original and updated documents,
 * filters out any diffs that affect excluded keys (such as navigation, external references, or status fields),
 * and applies only the allowed changes to the original document in place.
 *
 * Note: The originalDocument is mutated directly.
 *
 * @param originalDocument - The document to be updated (mutated in place)
 * @param updatedDocument - The document containing the desired changes
 * @returns A tuple: [the updated original document, array of excluded diffs that were not applied]
 */
export const applySelectiveUpdates = (originalDocument: UnknownObject, updatedDocument: UnknownObject) => {
  const diffs: Difference<unknown>[] = diff(originalDocument, updatedDocument)

  const [writableDiffs, excludedDiffs] = split(diffs, (d) => !d.path.some((p) => excludeKeys.has(p)))

  apply(originalDocument, writableDiffs)

  return [originalDocument, excludedDiffs]
}
