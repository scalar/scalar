import { onMounted } from 'vue'

import { useState } from '@/state/state'

export function useCuratedDocuments() {
  const { api, curatedDocuments } = useState()

  onMounted(async () => {
    const getCuratedDocumentsResult = await api.getCuratedDocuments()

    if (!getCuratedDocumentsResult.success) {
      return
    }

    curatedDocuments.value = getCuratedDocumentsResult.data.results
  })
}
