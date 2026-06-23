import { ScalarTeleportRoot } from '@scalar/components/teleport'
import type { HttpMethod } from '@scalar/helpers/http/http-methods'
import type { AvailableClients } from '@scalar/snippetz'
import type { WorkspaceStore } from '@scalar/workspace-store/client'
import { createWorkspaceEventBus } from '@scalar/workspace-store/events'
import { getFirstServer } from '@scalar/workspace-store/helpers/get-first-server'
import { getResolvedRef } from '@scalar/workspace-store/helpers/get-resolved-ref'
import { generateClientMutators } from '@scalar/workspace-store/mutators'
import type { SecuritySchemeObjectSecret } from '@scalar/workspace-store/request-example'
import type { OperationObject, ServerObject } from '@scalar/workspace-store/schemas/v3.1/strict/openapi-document'
import { createApp, h, reactive } from 'vue'

import CodeExample, { type CodeExampleProps } from './components/CodeExample.vue'
import { generateClientOptions } from './helpers/generate-client-options'

export type CreateCodeExampleOptions = {
  /** Workspace store that holds the OpenAPI document(s) to render from. */
  store: WorkspaceStore
  /** Path of the operation to render, e.g. '/users/{id}'. */
  path: string
  /** HTTP method of the operation to render. */
  method: HttpMethod
  /** Pre-selected client ID, e.g. 'shell/curl'. */
  selectedClient?: AvailableClients[number]
  /**
   * Server object override used to build the example request.
   *
   * When omitted, the server is derived from the active document (operation,
   * then path item, then document level), mirroring the API reference. Pass
   * `null` to force "no server".
   */
  selectedServer?: ServerObject | null
  /**
   * Pre-selected example key for parameters and the request body.
   *
   * The store is the source of truth once an example is picked, so
   * `x-scalar-default-example` wins over this initial seed and the selection
   * round-trips through the store like the client selection does.
   */
  selectedExample?: string
  /** Security schemes applicable to the operation. */
  securitySchemes?: SecuritySchemeObjectSecret[]
  /**
   * Force a color mode on the rendered block.
   *
   * When omitted, the block inherits the ambient theme of the host page.
   * Pass `true` for dark mode or `false` for light mode.
   */
  darkMode?: boolean
}

/**
 * Builds the wrapper classes for the mounted block.
 *
 * The `.scalar-app` class scopes the Tailwind utilities, and the optional
 * color-mode class lets consumers pin the block to dark or light.
 */
const getWrapperClass = (darkMode: boolean | undefined): string =>
  ['scalar-app', darkMode === true ? 'dark-mode' : darkMode === false ? 'light-mode' : ''].filter(Boolean).join(' ')

/**
 * Mount the CodeExample block to a DOM element without Vue.
 *
 * The consumer creates and controls their own workspace store,
 * then passes it in along with the path and method to render.
 */
export const createCodeExample = (el: HTMLElement | string, options: CreateCodeExampleOptions) => {
  const element = typeof el === 'string' ? document.querySelector(el) : el
  if (!element) {
    throw new Error(`Element not found: ${el}`)
  }

  const eventBus = createWorkspaceEventBus()
  const clientOptions = generateClientOptions()

  // Persist client changes back to the store. The block emits
  // `workspace:update:selected-client` on its private bus when the user picks a
  // client; without this subscription the choice would never reach the store
  // and `x-scalar-default-client` (the source of truth read below) would stay
  // stale, so the selection would not survive a re-render or be shared with
  // other blocks reading from the same store.
  const mutators = generateClientMutators(options.store)
  const unsubscribeClient = eventBus.on('workspace:update:selected-client', (payload) =>
    mutators.workspace().workspace.updateSelectedClient(payload),
  )

  // Persist example changes back to the store as well, mirroring the client
  // round-trip above. The block emits `workspace:update:selected-example` when
  // the user picks an example; without this the choice would never reach
  // `x-scalar-default-example` (read below) and would neither survive a
  // re-render nor sync to other blocks reading from the same store.
  const unsubscribeExample = eventBus.on('workspace:update:selected-example', (payload) =>
    mutators.workspace().workspace.updateSelectedExample(payload),
  )

  type OperationContext = { operation: OperationObject; server: ServerObject | null }

  /**
   * Resolve the operation and its effective server from the active document.
   *
   * The server is resolved from the same document the operation came from
   * (operation, then path item, then document level), so a snippet never pairs
   * an operation with a server URL from a different spec.
   */
  const resolveContext = (): OperationContext | undefined => {
    // The active document may be an AsyncAPI document, which has no `paths`.
    const activeDocument = options.store.workspace.activeDocument
    if (!activeDocument || !('paths' in activeDocument)) {
      return undefined
    }
    const pathItem = getResolvedRef(activeDocument.paths?.[options.path])
    const operation = getResolvedRef(pathItem?.[options.method])
    if (!operation) {
      return undefined
    }
    const server = getFirstServer(operation.servers ?? null, pathItem?.servers ?? null, activeDocument.servers ?? null)
    return { operation, server }
  }

  // Fail loudly if the path and method do not point at an operation in the store,
  // mirroring the "element not found" guard above.
  if (!resolveContext()) {
    throw new Error(`Operation not found: ${options.method.toUpperCase()} ${options.path}`)
  }

  // Remember the last context that resolved so a transient miss (e.g. the active
  // document is swapped to one without this path or method after mount) keeps
  // rendering the previous operation, paired with the server it actually came
  // from, instead of feeding `undefined` to the block.
  let lastContext: OperationContext | undefined

  /** Current operation + server, falling back to the last good resolution on a transient miss. */
  const currentContext = (): OperationContext => {
    const context = resolveContext()
    if (context) {
      lastContext = context
    }
    return (context ?? lastContext) as OperationContext
  }

  // Props are getters so the block tracks the reactive store (active document,
  // `x-scalar-default-client`, `x-scalar-default-example`) live. Change the
  // client, example, or server through the store to drive re-renders.
  const props = reactive<CodeExampleProps>({
    get operation(): OperationObject {
      return currentContext().operation
    },
    get method() {
      return options.method
    },
    get path() {
      return options.path
    },
    clientOptions,
    eventBus,
    get securitySchemes() {
      return options.securitySchemes ?? []
    },
    get selectedClient() {
      // The store is the source of truth once the user picks a client, so it
      // wins over the initial `options.selectedClient` seed and the selection
      // round-trips through the subscription above.
      return options.store.workspace['x-scalar-default-client'] ?? options.selectedClient
    },
    get selectedExample() {
      // Same as the client: the store wins over the initial seed so the example
      // selection survives re-renders and syncs across blocks.
      return options.store.workspace['x-scalar-default-example'] ?? options.selectedExample
    },
    get selectedServer() {
      // An explicit option wins (including an explicit `null` for "no server");
      // otherwise derive it from the same document the operation resolved from.
      return options.selectedServer !== undefined ? options.selectedServer : currentContext().server
    },
  })

  // Render the operation path in the header by default. The reference renders
  // this via the `#header` slot too, so the standalone block matches its look.
  const renderHeader = () => h('span', { class: 'font-code text-c-2 min-w-0 truncate' }, options.path)

  // Wrap the block in its own teleport root so floating UI (the client picker
  // popover) renders inside the themed `.scalar-app` wrapper instead of escaping
  // to `body`, where it would miss the color-mode variables and lose its styling.
  const app = createApp(() =>
    h('div', { class: getWrapperClass(options.darkMode) }, [
      h(ScalarTeleportRoot, null, { default: () => h(CodeExample, props, { header: renderHeader }) }),
    ]),
  )

  app.mount(element)

  return {
    app,
    destroy: () => {
      unsubscribeClient()
      unsubscribeExample()
      app.unmount()
    },
  }
}
