import type { OpenApiDocument } from '@scalar/workspace-store/schemas/v3.1/strict/openapi-document'
import type { FuseResult } from 'fuse.js'
import { type MaybeRefOrGetter, computed, ref, shallowRef, toValue, watch } from 'vue'

import { createFuseInstance } from '../helpers/create-fuse-instance'
import { createSearchIndex } from '../helpers/create-search-index'
import type { FuseData } from '../types'

const MAX_SEARCH_RESULTS = 25

/**
 * Creates the search index from an OpenAPI document.
 */
export function useSearchIndex(
  document: MaybeRefOrGetter<OpenApiDocument | undefined>,
  enabled: MaybeRefOrGetter<boolean> = true,
) {
  const fuse = shallowRef<ReturnType<typeof createFuseInstance> | null>(null)

  watch(
    [() => toValue(document), () => toValue(enabled)],
    async ([nextDocument, isEnabled]) => {
      if (!isEnabled) {
        return
      }

      if (!fuse.value) {
        const { default: Fuse } = await import('fuse.js')
        fuse.value = createFuseInstance(Fuse)
      }

      fuse.value.setCollection(createSearchIndex(nextDocument))
    },
    { immediate: true },
  )

  const query = ref<string>('')

  const results = computed(() => {
    if (!fuse.value) {
      return []
    }

    if (query.value.length !== 0) {
      return fuse.value.search(query.value, {
        limit: MAX_SEARCH_RESULTS,
      })
    }

    // @ts-expect-error - _docs is a private property
    const allEntries: FuseData[] = fuse.value._docs

    // Show a few entries as a placeholder
    return allEntries.slice(0, MAX_SEARCH_RESULTS).map(
      (item: FuseData, index: number) =>
        ({
          item,
          refIndex: index,
        }) satisfies FuseResult<FuseData>,
    )
  })

  return {
    results,
    query,
  }
}
