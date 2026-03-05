import { type Difference, apply, diff } from '@scalar/json-magic/diff'

import { type UnknownObject, split } from '@/helpers/general'
import type { OpenAPIExtensions } from '@/schemas/v3.1/strict/openapi-document'

/**
 * Checks if a key is a Scalar secret key.
 * Secret keys start with 'x-scalar-secret-' prefix.
 */
const isSecretKey = (key: string) => key.startsWith('x-scalar-secret-')

/**
 * Keys to exclude from diffs.
 * These are metadata fields that should be omitted when syncing updates to the original document.
 * Changes to these fields are not persisted.
 */
type BunlderKeys = 'x-ext' | 'x-ext-urls' | '$status'
export const EXCLUDE_KEYS = [
  // Bundler keys
  'x-ext',
  'x-ext-urls',
  '$status',
  // Scalar keys
  'x-scalar-navigation',
  'x-scalar-is-dirty',
  'x-original-oas-version',
  'x-scalar-original-document-hash',
  'x-scalar-original-source-url',
] satisfies (keyof OpenAPIExtensions | BunlderKeys)[] as string[]
export const excludeKeysSet = new Set(EXCLUDE_KEYS)

/**
 * Determines whether a diff should be included when applying updates.
 *
 * Returns `true` if the diff does not involve excluded metadata fields
 * (such as navigation or external references) or secret keys.
 * Excluded keys and secret keys are not persisted to the original document.
 */
const filterDiff = (diff: Difference<unknown>) => {
  // Omit diff if its path contains a key we want to exclude from updates
  if (diff.path.some((p) => excludeKeysSet.has(p))) {
    return false
  }

  // Omit diff if its last path element is a secret key
  if (isSecretKey(diff.path.at(-1) ?? '')) {
    return false
  }

  return true
}

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

  const [writableDiffs, excludedDiffs] = split(diffs, filterDiff)

  apply(originalDocument, writableDiffs)

  return excludedDiffs
}
