import type { HttpMethod } from '@scalar/helpers/http/http-methods'
import type { AvailableClients } from '@scalar/snippetz'
import type { WorkspaceStore } from '@scalar/workspace-store/client'
import { createWorkspaceEventBus } from '@scalar/workspace-store/events'
import { getResolvedRef } from '@scalar/workspace-store/helpers/get-resolved-ref'
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
  /** Server object override used to build the example request. */
  selectedServer?: ServerObject | null
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

  const props = reactive<CodeExampleProps>({
    // Resolve the operation lazily so the block reacts to document changes in the store.
    get operation(): OperationObject {
      // The active document may be an AsyncAPI document, which has no `paths`.
      const document = options.store.workspace.activeDocument
      const paths = document && 'paths' in document ? document.paths : undefined
      const pathItem = getResolvedRef(paths?.[options.path])
      return getResolvedRef(pathItem?.[options.method]) as OperationObject
    },
    method: options.method,
    path: options.path,
    clientOptions,
    eventBus,
    securitySchemes: options.securitySchemes ?? [],
    selectedClient: options.selectedClient,
    selectedServer: options.selectedServer ?? null,
  })

  const app = createApp(() => h('div', { class: getWrapperClass(options.darkMode) }, h(CodeExample, props)))

  app.mount(element)

  return {
    app,
    destroy: () => app.unmount(),
  }
}
