import type { WorkspaceStore } from '@scalar/workspace-store/client'
import { createWorkspaceEventBus } from '@scalar/workspace-store/events'
import { getResolvedRef } from '@scalar/workspace-store/helpers/get-resolved-ref'
import { createApp, h, reactive } from 'vue'

import OperationCodeSample from './components/OperationCodeSample.vue'
import { generateClientOptions } from './helpers/generate-client-options'

type createCodeExampleOptions = {
  store: WorkspaceStore
  path: string
  method: string
  /** Pre-selected client ID, e.g. 'shell/curl' */
  selectedClient?: string
  /** Server object override */
  selectedServer?: object | null
}

/**
 * Mount the OperationCodeSample block to a DOM element without Vue.
 *
 * The consumer creates and controls their own workspace store,
 * then passes it in along with the path and method to render.
 */
export const createCodeExample = (el: HTMLElement | string, options: createCodeExampleOptions) => {
  const element = typeof el === 'string' ? document.querySelector(el) : el
  if (!element) throw new Error(`Element not found: ${el}`)

  const eventBus = createWorkspaceEventBus()
  const clientOptions = generateClientOptions()

  const props = reactive({
    get operation() {
      const doc = options.store.workspace.activeDocument
      const pathItem = doc?.paths?.[options.path]
      const entry = pathItem?.[options.method as keyof typeof pathItem]
      return getResolvedRef(entry as Record<string, unknown> | undefined)
    },
    method: options.method,
    path: options.path,
    clientOptions,
    eventBus,
    securitySchemes: [],
    selectedClient: options.selectedClient,
    selectedServer: options.selectedServer ?? null,
  })

  const app = createApp(() => h('div', { class: 'scalar-app dark-mode' }, h(OperationCodeSample, props)))

  app.mount(element)

  return {
    app,
    destroy: () => app.unmount(),
  }
}
