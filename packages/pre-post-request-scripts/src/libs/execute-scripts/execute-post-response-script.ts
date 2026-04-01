import type { VariablesStore } from '@scalar/oas-utils/helpers'
import type { RequestFactory } from '@scalar/workspace-store/request-example'

import { createConsoleContext } from './context/console'
import { executeInPostmanSandbox } from './postman-sandbox-adapter'
import { createPostmanRequestFromFactory } from './request-factory-postman-adapter'

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
    requestFactory?: RequestFactory
    envVariables?: Record<string, string>
    response: Response
    onTestResultsUpdate?: ((results: TestResult[]) => void) | undefined
    variablesStore?: VariablesStore
  },
): Promise<void> => {
  if (!script) {
    return
  }
  const postmanRequest =
    data.requestFactory && data.envVariables
      ? createPostmanRequestFromFactory(data.requestFactory, data.envVariables)
      : undefined
  await executeInPostmanSandbox({
    script,
    type: 'post-response',
    context: {
      request: postmanRequest,
      response: data.response,
      scriptConsole: createConsoleContext(),
      variablesStore: data.variablesStore,
    },
    onTestResultsUpdate: data.onTestResultsUpdate,
  })
}
