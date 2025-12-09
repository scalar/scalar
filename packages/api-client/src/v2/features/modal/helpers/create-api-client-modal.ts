import { useModal } from '@scalar/components'
import type { HttpMethod } from '@scalar/helpers/http/http-methods'
import { isHttpMethod } from '@scalar/helpers/http/is-http-method'
import type { WorkspaceStore } from '@scalar/workspace-store/client'
import { computed, createApp, reactive } from 'vue'

import Modal, { type ModalProps } from '@/v2/features/modal/Modal.vue'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type CreateApiClientModalOptions = {
  /** Element to mount the client modal to. */
  el: HTMLElement | null
  /**
   * Will attempt to mount the references immediately.
   * For SSR this may need to be disabled and handled manually on the client side.
   */
  mountOnInitialize?: boolean
  /** The workspace store must be initialized and passed in. */
  workspaceStore: WorkspaceStore
}

/** Payload for routing and opening the API client modal. */
export type RoutePayload = {
  path: string
  method: HttpMethod
  example?: string
  documentSlug?: string
}

export type ActiveEntities = Required<RoutePayload>

/** Internal type for default entity values before resolution. */
type DefaultEntities = {
  path: string
  method: string
  example: string
  documentSlug: string
}

/** Context for resolving route parameters from the workspace store. */
type ResolverContext = {
  store: WorkspaceStore
  documentSlug: string | undefined
}

// ---------------------------------------------------------------------------
// Route Parameter Resolvers
// ---------------------------------------------------------------------------

/**
 * Resolves the document slug, falling back to the active document or first available document
 * when "default" is specified and no document exists with that slug.
 */
const resolveDocumentSlug = (store: WorkspaceStore, slug: string | undefined): string | undefined => {
  const isDefaultWithNoMatch = slug === 'default' && store.workspace.documents[slug] === undefined
  if (isDefaultWithNoMatch) {
    return store.workspace['x-scalar-active-document'] || Object.keys(store.workspace.documents)[0]
  }
  return slug
}

/**
 * Resolves the path, returning the first available path when "default" is specified.
 * Returns undefined if the document does not exist.
 */
const resolvePath = (ctx: ResolverContext, path: string | undefined): string | undefined => {
  const document = ctx.store.workspace.documents[ctx.documentSlug ?? '']
  if (!document) {
    return undefined
  }
  if (path === 'default') {
    return Object.keys(document.paths ?? {})[0]
  }
  return path
}

/**
 * Resolves the HTTP method, returning the first valid method when "default" is specified.
 * Returns undefined if the document or path does not exist, or if the method is invalid.
 */
const resolveMethod = (
  ctx: ResolverContext,
  path: string | undefined,
  method: string | undefined,
): HttpMethod | undefined => {
  const document = ctx.store.workspace.documents[ctx.documentSlug ?? '']
  if (!document || !path) {
    return undefined
  }
  if (method === 'default') {
    return Object.keys(document.paths?.[path] ?? {}).filter(isHttpMethod)[0]
  }
  if (!isHttpMethod(method)) {
    return undefined
  }
  return method
}

/**
 * Resolves all route parameters from raw input values to their actual values.
 * Handles "default" placeholders by looking up actual values from the workspace store.
 */
const resolveRouteParameters = (store: WorkspaceStore, params: DefaultEntities): Partial<RoutePayload> => {
  const documentSlug = resolveDocumentSlug(store, params.documentSlug)
  const ctx: ResolverContext = { store, documentSlug }
  const path = resolvePath(ctx, params.path)
  const method = resolveMethod(ctx, path, params.method)

  return {
    documentSlug,
    path,
    method,
    example: params.example,
  }
}

// ---------------------------------------------------------------------------
// Modal Factory
// ---------------------------------------------------------------------------

/**
 * Creates the API Client Modal.
 *
 * The modal does not require a router. Instead, navigation is handled by setting
 * active entities directly through the returned `route` function.
 */
export const createApiClientModal = ({ el, workspaceStore, mountOnInitialize = true }: CreateApiClientModalOptions) => {
  const defaultEntities: DefaultEntities = {
    path: 'default',
    method: 'default',
    example: 'default',
    documentSlug: workspaceStore.workspace['x-scalar-active-document'] || 'default',
  }

  const parameters = reactive<DefaultEntities>({ ...defaultEntities })

  const computedParameters = computed<Partial<RoutePayload>>(() => resolveRouteParameters(workspaceStore, parameters))

  /** Navigate to the specified path, method, and example. */
  const route = (payload: RoutePayload): void => {
    Object.assign(parameters, defaultEntities, payload)
  }

  const modalState = useModal()

  const app = createApp(Modal, {
    route,
    workspaceStore,
    modalState,
    routePayload: computedParameters,
  } satisfies ModalProps)

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
