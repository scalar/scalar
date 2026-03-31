import type { VariablesStore } from '@scalar/oas-utils/helpers'

import type { TestResult } from '@/libs/execute-scripts'

import { createConsoleContext } from './context/console'
import { executeInPostmanSandbox } from './postman-sandbox-adapter'

/**
 * Runs the pre-request script in the Postman sandbox with the current request and
 * variables store. Variable changes (pm.variables.set, pm.collectionVariables.set,
 * pm.globals.set) are applied to the store after execution. No response is
 * available in the script context.
 */
export const executePreRequestScript = async (
  script: string | undefined,
  data: {
    request: Request
    variablesStore?: VariablesStore
    onTestResultsUpdate?: ((results: TestResult[]) => void) | undefined
  },
): Promise<void> => {
  if (!script) {
    return
  }
  await executeInPostmanSandbox({
    script,
    request: data.request,
    scriptConsole: createConsoleContext(),
    variablesStore: data.variablesStore,
    onTestResultsUpdate: data.onTestResultsUpdate,
  })
}
