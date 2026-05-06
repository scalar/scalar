import type { ConvertOptions } from '@scalar/postman-to-openapi'

import { pathKeysToRequestIndexPaths } from '@/v2/features/command-palette/helpers/postman-request-tree'

type GetPostmanConvertOptionsInput = {
  document?: ConvertOptions['document'] | null
  mergeOperation: boolean
  importPathKeys: readonly string[]
}

/**
 * Builds Postman conversion options from command palette state.
 *
 * An empty selection means "import all requests", so we omit requestIndexPaths.
 */
export const getPostmanConvertOptions = ({
  document,
  mergeOperation,
  importPathKeys,
}: GetPostmanConvertOptionsInput): ConvertOptions => {
  const requestIndexPaths = importPathKeys.length > 0 ? pathKeysToRequestIndexPaths(importPathKeys) : undefined

  return {
    document: document ?? undefined,
    mergeOperation,
    requestIndexPaths,
  }
}
