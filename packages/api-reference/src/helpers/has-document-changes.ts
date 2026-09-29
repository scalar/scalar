import diff from 'microdiff'

/**
 * Detect document changes without diffing subtrees that still share an identity.
 *
 * Configuration normalization makes a new document root but preserves nested values.
 * Keep microdiff for changed values so its handling of cycles and rich values remains
 * consistent with the document update path.
 */
export const hasDocumentChanges = (updated: Record<string, unknown>, previous: Record<string, unknown>): boolean => {
  if (updated === previous) {
    return false
  }

  // biome-ignore lint/suspicious/useGuardForIn: Preserve microdiff comparisons of enumerable inherited fields.
  for (const key in updated) {
    if (!(key in previous)) {
      return true
    }

    const value = updated[key]
    const oldValue = previous[key]
    if (value !== oldValue && diff({ value }, { value: oldValue }).length) {
      return true
    }
  }

  for (const key in previous) {
    if (!(key in updated)) {
      return true
    }
  }

  return false
}
