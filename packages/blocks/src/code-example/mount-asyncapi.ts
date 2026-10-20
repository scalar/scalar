import { ScalarTeleportRoot } from '@scalar/components/teleport'
import type { WorkspaceStore } from '@scalar/workspace-store/client'
import { isAsyncApiDocument } from '@scalar/workspace-store/schemas/type-guards'
import { type App, createApp, h } from 'vue'

import AsyncApiCodeExample from './components/AsyncApiCodeExample.vue'
import { getAsyncApiExampleContext } from './helpers/get-asyncapi-example-context'

/** Mount an operation-level AsyncAPI code example from the active workspace document. */
export type CreateAsyncApiCodeExampleOptions = {
  store: WorkspaceStore
  operationName: string
  darkMode?: boolean
}

/** AsyncAPI branch of createCodeExample; no HTTP path or method is required. */
export const createAsyncApiCodeExample = (
  el: HTMLElement | string,
  options: CreateAsyncApiCodeExampleOptions,
): { app: App; destroy: () => void } => {
  const element = typeof el === 'string' ? document.querySelector(el) : el
  if (!element) throw new Error(`Element not found: ${el}`)
  const initialDocument = options.store.workspace.activeDocument
  if (!isAsyncApiDocument(initialDocument) || !getAsyncApiExampleContext(initialDocument, options.operationName)) {
    throw new Error(`AsyncAPI operation not found: ${options.operationName}`)
  }
  const app = createApp(() => {
    const activeDocument = options.store.workspace.activeDocument
    return h(
      'div',
      {
        class: ['scalar-app', options.darkMode === true ? 'dark-mode' : options.darkMode === false ? 'light-mode' : ''],
      },
      [
        h(ScalarTeleportRoot, null, {
          default: () =>
            isAsyncApiDocument(activeDocument)
              ? h(AsyncApiCodeExample, {
                  document: activeDocument,
                  operationName: options.operationName,
                })
              : h('p', { role: 'status' }, 'No AsyncAPI document selected.'),
        }),
      ],
    )
  })
  app.mount(element)
  return { app, destroy: () => app.unmount() }
}
