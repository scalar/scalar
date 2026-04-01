import type { VariablesStore } from '@scalar/oas-utils/helpers'
import type { RequestFactory } from '@scalar/workspace-store/request-example'

import type { TestResult } from '@/libs/execute-scripts'

import { createConsoleContext } from './context/console'
import { executeInPostmanSandbox } from './postman-sandbox-adapter'
import { createPostmanRequestFromFactory } from './request-factory-postman-adapter'

/**
 * Runs the pre-request script in the Postman sandbox with a Postman-shaped
 * `pm.request` built from {@link RequestFactory}. Header and method changes from
 * the script are merged back from the sandbox execution result (the in-memory
 * Postman `Request` on the host is not updated). Variable changes use the store.
 */
export const executePreRequestScript = async (
  script: string | undefined,
  data: {
    requestFactory: RequestFactory
    envVariables: Record<string, string>
    variablesStore?: VariablesStore
    onTestResultsUpdate?: ((results: TestResult[]) => void) | undefined
  },
): Promise<void> => {
  if (!script) {
    return
  }
  const postmanRequest = createPostmanRequestFromFactory(data.requestFactory, data.envVariables)
  await executeInPostmanSandbox({
    script,
    type: 'pre-request',
    context: {
      request: postmanRequest,
      scriptConsole: createConsoleContext(),
      variablesStore: data.variablesStore,
    },
    onTestResultsUpdate: data.onTestResultsUpdate,
    requestFactory: data.requestFactory,
  })
  console.log({
    postmanRequest,
    script,
    requestFactory: data.requestFactory,
    envVariables: data.envVariables,
    variablesStore: data.variablesStore,
    onTestResultsUpdate: data.onTestResultsUpdate,
  })
}
