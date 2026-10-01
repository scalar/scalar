import {
  type AnyEvent,
  type Navigation,
  type WorkspaceEventBus,
  createNavigation,
  navigate,
} from '@scalar/workspace-store/events'
import { type ShallowRef, getCurrentScope, onScopeDispose, shallowRef } from 'vue'

import type { ApiClientModal } from './helpers/create-api-client-modal'

type OpenPayload = Extract<AnyEvent, { event: 'ui:open:client-modal' }>['payload']

/** Load and mount the client only when requested, retaining the latest open intent during loading. */
export const useLazyApiClient = ({
  eventBus,
  load,
  status = shallowRef('idle'),
}: {
  eventBus: WorkspaceEventBus
  load: () => Promise<() => ApiClientModal | null>
  /** Optional visitor-facing state for the initial download. */
  status?: ShallowRef<'idle' | 'loading' | 'error'>
}): ShallowRef<ApiClientModal | null> & { navigation: Navigation<'ui:open:client-modal'> } => {
  const scope = getCurrentScope()
  const client = shallowRef<ApiClientModal | null>(null)
  let disposed = false
  let loading = false
  let pending: { payload: OpenPayload } | null = null

  const openNavigation = createNavigation(eventBus, {
    'ui:open:client-modal': (payload) => {
      pending = { payload }
      status.value = 'loading'
      if (loading) {
        return
      }
      loading = true
      void load()
        .then((createClient) => {
          if (disposed || !pending) {
            return
          }
          client.value = (scope ? scope.run(createClient) : createClient()) ?? null
          if (!client.value) {
            return
          }
          openNavigation.dispose()
          unsubscribeClose()
          // Replay the full event after the modal subscribes, including example and composition selection.
          navigate(client.value.navigation, 'ui:open:client-modal', pending.payload)
        })
        .catch((error: unknown) => {
          if (!disposed && pending) {
            status.value = 'error'
          }
          console.error('[@scalar/api-client] Could not load the API client modal.', error)
        })
        .finally(() => {
          pending = null
          loading = false
          if (status.value === 'loading') {
            status.value = 'idle'
          }
        })
    },
  })
  const unsubscribeClose = eventBus.on('ui:close:client-modal', () => {
    pending = null
    status.value = 'idle'
  })

  onScopeDispose(() => {
    disposed = true
    status.value = 'idle'
    pending = null
    openNavigation.dispose()
    unsubscribeClose()
    client.value?.app.unmount()
  }, true)
  return Object.assign(client, {
    navigation: {
      'ui:open:client-modal': (payload: OpenPayload) => {
        if (disposed) {
          throw new Error('[Navigation] The API client owner has been disposed.')
        }
        navigate(client.value?.navigation ?? openNavigation.navigation, 'ui:open:client-modal', payload)
      },
    },
  })
}
