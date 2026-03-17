import type { ClientPlugin } from '@scalar/oas-utils/helpers'

import { executePreRequestScript } from '@/libs/execute-scripts'

import { PreRequestScripts } from './components/PreRequestScripts'

/**
 * Pre-request scripts plugin for client V2. Runs scripts from document and
 * operation `x-pre-request` before each request. Scripts have access to the
 * request and variables store (pm.variables, pm.collectionVariables, pm.globals);
 * variable changes are synced back to the store.
 */
export const preRequestScriptsPlugin = (): ClientPlugin => ({
  components: {
    request: { component: PreRequestScripts },
  },

  hooks: {
    beforeRequest: async ({ request, document, operation, variablesStore }) => {
      const script = `${document['x-pre-request'] ?? ''}\n${operation['x-pre-request'] ?? ''}`.trim()
      await executePreRequestScript(script, {
        request,
        variablesStore,
      })
      return { request }
    },
  },
})
