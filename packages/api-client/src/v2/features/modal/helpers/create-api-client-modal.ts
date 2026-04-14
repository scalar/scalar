import { type ModalState, useModal } from '@scalar/components'
import type { ClientPlugin } from '@scalar/oas-utils/helpers'
import type { WorkspaceStore } from '@scalar/workspace-store/client'
import { type WorkspaceEventBus, createWorkspaceEventBus } from '@scalar/workspace-store/events'
import { type App, type MaybeRefOrGetter, computed, createApp, isRef, reactive, ref, toValue, watch } from 'vue'

import {
  type DefaultEntities,
  type RoutePayload,
  resolveRouteParameters,
} from '@/v2/features/modal/helpers/resolve-route-parameters'
import type { ApiClientModalOptions, ApiClientModalOptionsRef } from '@/v2/features/modal/helpers/types'
import { useModalSidebar } from '@/v2/features/modal/hooks/use-modal-sidebar'
import Modal, { type ModalProps } from '@/v2/features/modal/Modal.vue'

type CreateApiClientModalOptions = {
  /** Element to mount the client modal to. */
  el: HTMLElement | null
  /**
   * Will attempt to mount the references immediately.
   * For SSR this may need to be disabled and handled manually on the client side.
   */
  mountOnInitialize?: boolean
  /** You can pass in an event bus if you have one already, or we will create one */
  eventBus?: WorkspaceEventBus
  /** The workspace store must be initialized and passed in. */
  workspaceStore: WorkspaceStore
  /** Api client plugins to include in the modal */
  plugins?: ClientPlugin[]
  /** Subset of the configuration options for the modal, if you want it to be reactive ensure its a ref */
  options?: MaybeRefOrGetter<ApiClientModalOptions>
}

export type ApiClientModal = {
  app: App
  open: (payload?: RoutePayload) => void
  mount: (mountingEl: HTMLElement | null) => void
  route: (payload: RoutePayload) => void
  updateOptions: (nextOptions: ApiClientModalOptions, overwrite?: boolean) => void
  modalState: ModalState
}

/**
 * Creates the API Client Modal.
 *
 * The modal does not require a router. Instead, navigation is handled by setting
 * active entities directly through the returned `route` function.
 */
export const createApiClientModal = ({
  el,
  eventBus = createWorkspaceEventBus({
    debug: import.meta.env.DEV,
  }),
  mountOnInitialize = true,
  plugins = [],
  workspaceStore,
  options = {},
}: CreateApiClientModalOptions): ApiClientModal => {
  const requestBodyCompositionSelection = ref<Record<string, number>>({})

  /** This is to ensure that the options are a ref if they are not already, useful for react */
  const optionsRef = (isRef(options) ? options : ref(toValue(options))) as ApiClientModalOptionsRef

  const defaultEntities: DefaultEntities = {
    path: 'default',
    method: 'default',
    example: 'default',
    documentSlug: workspaceStore.workspace['x-scalar-active-document'] || 'default',
  }

  const parameters = reactive<DefaultEntities>({ ...defaultEntities })

  /** Navigate to the specified path, method, and example. */
  const route = (payload: RoutePayload): void => {
    Object.assign(parameters, defaultEntities, payload)
  }

  /** Resolved parameters from the workspace store. */
  const resolvedParameters = computed(() => resolveRouteParameters(workspaceStore, parameters))
  const documentSlug = computed(() => resolvedParameters.value.documentSlug)
  const path = computed(() => resolvedParameters.value.path)
  const method = computed(() => resolvedParameters.value.method)
  const exampleName = computed(() => resolvedParameters.value.example)
  /** The document from the workspace store. */
  const document = computed(() => workspaceStore.workspace.documents[documentSlug.value ?? ''] ?? null)

  /** Sidebar state and selection handling. */
  const sidebarState = useModalSidebar({
    workspaceStore,
    documentSlug: documentSlug,
    path: path,
    method: method,
    exampleName: exampleName,
    route,
  })

  const modalState = useModal()

  const app = createApp(Modal, {
    document,
    eventBus,
    exampleName,
    method,
    modalState,
    path,
    plugins,
    requestBodyCompositionSelection,
    sidebarState,
    workspaceStore,
    options: optionsRef,
  } satisfies ModalProps)

  /** Restore the workspace store when the modal is closed. */
  const handleModalClose = () => {
    requestBodyCompositionSelection.value = {}
  }

  /** Clean up plugin event bus subscriptions when the app is unmounted */
  app.onUnmount(() => {
    for (const unsub of pluginUnsubscribes) {
      unsub()
    }
  })

  watch(
    () => modalState.open,
    (open) => (open ? null : handleModalClose()),
  )

  // Update the active proxy when the proxyUrl changes
  watch(
    () => toValue(optionsRef).proxyUrl,
    (newProxyUrl) => workspaceStore.update('x-scalar-active-proxy', newProxyUrl),
    { immediate: true },
  )

  /** Subscribe to event bus events declared by plugins */
  const pluginUnsubscribes: (() => void)[] = []
  for (const plugin of plugins) {
    if (plugin.on) {
      for (const [event, handler] of Object.entries(plugin.on)) {
        pluginUnsubscribes.push(eventBus.on(event as any, handler as any))
      }
    }
  }

  // Use a unique id prefix to prevent collisions with other Vue apps on the page
  app.config.idPrefix = 'scalar-client'

  /** Mount the modal to a given element. */
  const mount = (mountingEl: HTMLElement | null = el): void => {
    if (!mountingEl) {
      console.error(
        '[@scalar/api-client] Could not create the API client Modal.',
        'Invalid HTML element provided.',
        'Read more: https://github.com/scalar/scalar/tree/main/packages/api-client',
      )
      return
    }
    app.mount(mountingEl)
  }

  if (mountOnInitialize) {
    mount()
  }

  return {
    /** The Vue app instance for the modal. Use with caution. */
    app,
    /** Open the modal and optionally navigate to a specific route. */
    open: (payload?: RoutePayload): void => {
      modalState.open = true
      if (payload) {
        route(payload)
      }
    },
    /** Mount the modal to a given element. */
    mount,
    /** Navigate to the specified path, method, and example. */
    route,
    /** Controls the visibility of the modal. */
    modalState,
    /**
     * Merge new options into the current modal options.
     *
     * @param newOptions - The new options to merge into the current modal options.
     * @param overwrite - Whether to overwrite the current modal options with the new options. If false, the new options will be merged with the current options.
     */
    updateOptions: (newOptions: ApiClientModalOptions, overwrite = false): void => {
      optionsRef.value = overwrite
        ? newOptions
        : {
            ...optionsRef.value,
            ...newOptions,
          }
    },
  }
}
