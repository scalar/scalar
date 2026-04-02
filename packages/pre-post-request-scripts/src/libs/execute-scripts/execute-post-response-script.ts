import type { RequestFactory, VariablesStore } from '@scalar/workspace-store/request-example'

import { createConsoleContext } from './context/console'
import { executeInPostmanSandbox } from './postman-adapter/sandbox-adapter'

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
    requestBuilder: RequestFactory
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
      requestBuilder: data.requestBuilder,
      response: data.response,
      scriptConsole: createConsoleContext(),
      variablesStore: data.variablesStore,
    },
    onTestResultsUpdate: data.onTestResultsUpdate,
  })
}
