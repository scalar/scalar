import type { UnknownObject } from '@/helpers/general'
import { apply, diff } from '@scalar/json-diff'

// Keys to exclude from the diff
const excludeKeys = new Set(['x-scalar-navigation', 'x-ext', 'x-ext-urls', '$ref', '$status'])

export const updateOriginalDocument = (originalDocument: UnknownObject, updatedDocument: UnknownObject) => {
  const diffs = diff(originalDocument, updatedDocument)

  const filterDiffs = diffs.filter((d) => !d.path.some((p) => excludeKeys.has(p)))

  return apply(originalDocument, filterDiffs)
}
