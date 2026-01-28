import { useDebounceFn } from '@vueuse/core'
import { computed, ref } from 'vue'

import type { ApiMetadata } from '@/entities/registry/document'
import { useState } from '@/state/state'

export function useSearch() {
  const { api } = useState()

  const queryRef = ref('')

  const search = useDebounceFn(async (q) => {
    const searchResponse = await api.search(q)

    if (!searchResponse.success) {
      return
    }

    results.value = searchResponse.data.results
  }, 200)

  const query = computed({
    get: () => {
      return queryRef.value
    },
    set: (v) => {
      search(v)
      queryRef.value = v
    },
  })

  const results = ref<ApiMetadata[]>([])

  search('')

  return {
    query,
    results,
  }
}
