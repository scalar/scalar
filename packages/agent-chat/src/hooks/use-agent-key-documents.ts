import { onMounted } from 'vue'

import { useState } from '@/state/state'

export function useAgentKeyDocuments() {
  const { api, addDocument, mode, getAgentKey } = useState()

  onMounted(async () => {
    if (mode !== 'full' || !getAgentKey) {
      return
    }

    const keyDocumentsResult = await api.getKeyDocuments()

    if (!keyDocumentsResult.success) {
      return
    }

    keyDocumentsResult.data.documents.forEach(({ namespace, slug }) =>
      addDocument({ namespace, slug, removable: false }),
    )
  })
}
