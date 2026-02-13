import { useToasts } from '@scalar/use-toasts'
import { onMounted } from 'vue'

import { useState } from '@/state/state'

export function useAgentKeyDocuments() {
  const { api, addDocument, mode, getAgentKey } = useState()
  const { toast } = useToasts()

  onMounted(async () => {
    if (mode !== 'full' || !getAgentKey) {
      return
    }

    const keyDocumentsResult = await api.getKeyDocuments()

    if (!keyDocumentsResult.success) {
      toast('Unable to fetch registry documents for the provided key', 'error')
      return
    }

    keyDocumentsResult.data.documents.forEach(({ namespace, slug }) =>
      addDocument({ namespace, slug, removable: false }),
    )
  })
}
