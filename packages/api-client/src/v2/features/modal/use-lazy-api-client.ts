import type { AnyEvent, WorkspaceEventBus } from '@scalar/workspace-store/events'
import { type ShallowRef, getCurrentScope, onScopeDispose, shallowRef } from 'vue'

import type { ApiClientModal } from './helpers/create-api-client-modal'

type OpenPayload = Extract<AnyEvent, { event: 'ui:open:client-modal' }>['payload']

/** Load and mount the client only when requested, retaining the latest open intent during loading. */
export const useLazyApiClient = ({
  eventBus,
  load,
}: {
  eventBus: WorkspaceEventBus
  load: () => Promise<() => ApiClientModal | null>
}): ShallowRef<ApiClientModal | null> => {
  const scope = getCurrentScope()
  const client = shallowRef<ApiClientModal | null>(null)
  let disposed = false
  let loading = false
  let pending: { payload: OpenPayload } | null = null

  const unsubscribeOpen = eventBus.on('ui:open:client-modal', (payload) => {
    pending = { payload }
    if (loading) {
      return
    }
    loading = true
    void load()
      .then((createClient) => {
        if (disposed || !pending) {
          return
        }
        client.value = scope?.run(createClient) ?? null
        if (!client.value) {
          return
        }
        unsubscribeOpen()
        unsubscribeClose()
        // Replay the full event after the modal subscribes, including example and composition selection.
        eventBus.emit('ui:open:client-modal', pending.payload)
      })
      .catch((error: unknown) => {
        console.error('[@scalar/api-client] Could not load the API client modal.', error)
      })
      .finally(() => {
        pending = null
        loading = false
      })
  })
  const unsubscribeClose = eventBus.on('ui:close:client-modal', () => {
    pending = null
  })

  onScopeDispose(() => {
    disposed = true
    pending = null
    unsubscribeOpen()
    unsubscribeClose()
    client.value?.app.unmount()
  })
  return client
}
