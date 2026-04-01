import type { VariablesStore } from '@scalar/oas-utils/helpers'

import { createConsoleContext } from './context/console'
import { executeInPostmanSandbox } from './postman-sandbox-adapter'

export type TestResult = {
  title: string
  passed: boolean
  duration: number
  error?: string
  status: 'pending' | 'passed' | 'failed'
}

export const executePostResponseScript = async (
  script: string | undefined,
  data: {
    request?: Request
    response: Response
    onTestResultsUpdate?: ((results: TestResult[]) => void) | undefined
    variablesStore?: VariablesStore
  },
): Promise<void> => {
  if (!script) {
    return
  }
  await executeInPostmanSandbox({
    script,
    type: 'post-response',
    context: {
      request: data.request,
      response: data.response,
      scriptConsole: createConsoleContext(),
      variablesStore: data.variablesStore,
    },
    onTestResultsUpdate: data.onTestResultsUpdate,
  })
}
