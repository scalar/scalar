import type { VariablesStore } from '@scalar/oas-utils/helpers'
import type { RequestFactory } from '@scalar/workspace-store/request-example'

import type { TestResult } from '@/libs/execute-scripts'

import { createConsoleContext } from './context/console'
import { executeInPostmanSandbox } from './postman-adapter/sandbox-adapter'

/**
 * Runs the pre-request script in the Postman sandbox with a Postman-shaped
 * `pm.request` built from {@link RequestFactory}. Header and method changes from
 * the script are merged back from the sandbox execution result (the in-memory
 * Postman `Request` on the host is not updated). Variable changes use the store.
 */
export const executePreRequestScript = async (
  script: string | undefined,
  data: {
    requestBuilder: RequestFactory
    variablesStore?: VariablesStore
    onTestResultsUpdate?: ((results: TestResult[]) => void) | undefined
  },
): Promise<void> => {
  if (!script) {
    return
  }
  await executeInPostmanSandbox({
    script,
    type: 'pre-request',
    context: {
      scriptConsole: createConsoleContext(),
      requestBuilder: data.requestBuilder,
      variablesStore: data.variablesStore,
    },
    onTestResultsUpdate: data.onTestResultsUpdate,
  })
}
