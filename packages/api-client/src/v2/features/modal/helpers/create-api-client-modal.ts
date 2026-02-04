import { type ModalState, useModal } from '@scalar/components'
import type { WorkspaceStore } from '@scalar/workspace-store/client'
import { type WorkspaceEventBus, createWorkspaceEventBus } from '@scalar/workspace-store/events'
import type {
  OpenApiDocument,
  SecuritySchemes,
  ServerObject,
} from '@scalar/workspace-store/schemas/v3.1/strict/openapi-document'
import { type App, computed, createApp, reactive, watch } from 'vue'

import {
  type DefaultEntities,
  type RoutePayload,
  resolveRouteParameters,
} from '@/v2/features/modal/helpers/resolve-route-parameters'
import { useModalSidebar } from '@/v2/features/modal/hooks/use-modal-sidebar'
import Modal, { type ModalProps } from '@/v2/features/modal/Modal.vue'
import type { ClientPlugin } from '@/v2/helpers/plugins'

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
  options?: ModalProps['options']
}

export type ApiClientModal = {
  app: App
  open: (payload?: RoutePayload) => void
  mount: (mountingEl: HTMLElement | null) => void
  route: (payload: RoutePayload) => void
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
    sidebarState,
    workspaceStore,
    options,
  } satisfies ModalProps)

  type PreservedProperties = {
    selectedServer?: string
    securitySchemes?: SecuritySchemes
    servers?: ServerObject[]
  }

  /**
   * Restores preserved properties to the document after reverting changes.
   * These properties need to be preserved because they represent user selections
   * that should persist across modal sessions.
   */
  const restorePreservedProperties = (doc: OpenApiDocument | null, preserved: PreservedProperties): void => {
    if (!doc) {
      return
    }
    if (preserved.selectedServer !== undefined) {
      doc['x-scalar-selected-server'] = preserved.selectedServer
    }
    if (preserved.securitySchemes !== undefined) {
      doc.components ??= {}
      doc.components.securitySchemes = preserved.securitySchemes
    }
    if (preserved.servers !== undefined) {
      doc.servers = preserved.servers
    }
  }

  watch(
    () => modalState.open,
    async (open) => {
      if (open) {
        return
      }

      // When the modal is closed, revert the document changes while preserving user selections
      const preservedProperties = {
        selectedServer: document.value?.['x-scalar-selected-server'],
        securitySchemes: document.value?.components?.securitySchemes,
        servers: document.value?.servers,
      }

      // Any other changes to the document will be reverted
      await workspaceStore.revertDocumentChanges(documentSlug.value ?? '')

      // Restore the preserved properties
      restorePreservedProperties(document.value, preservedProperties)
    },
  )

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
  }
}
