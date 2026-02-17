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
    response: Response
    onTestResultsUpdate?: ((results: TestResult[]) => void) | undefined
  },
): Promise<void> => {
  if (!script) {
    return
  }
  await executeInPostmanSandbox({
    script,
    response: data.response,
    onTestResultsUpdate: data.onTestResultsUpdate,
    scriptConsole: createConsoleContext(),
  })
}
