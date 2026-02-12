import { describe, expect, it } from 'vitest'

import type { TestResult } from './execute-post-response-script'
import { executePostResponseScript } from './execute-post-response-script'

const executeScript = async ({
  script,
  responseBody = { success: true },
  status = 200,
  headers = { 'content-type': 'application/json' },
}: {
  script: string
  responseBody?: unknown
  status?: number
  headers?: Record<string, string>
}): Promise<TestResult[]> => {
  const response = new Response(typeof responseBody === 'string' ? responseBody : JSON.stringify(responseBody), {
    status,
    headers,
  })

  const latestResults: TestResult[] = []

  await executePostResponseScript(script, {
    response,
    onTestResultsUpdate: (results) => {
      latestResults.splice(0, latestResults.length, ...results)
    },
  })

  return latestResults
}

describe('execute-post-response-script', () => {
  it('executes a passing Postman test and reports the result', async () => {
    const results = await executeScript({
      script: `pm.test("Status code is 200", function () {
  pm.response.to.have.status(200)
})`,
    })

    expect(results).toHaveLength(1)
    expect(results[0]).toMatchObject({
      title: 'Status code is 200',
      passed: true,
      status: 'passed',
    })
  })

  it('reports failed assertions from pm.test', async () => {
    const results = await executeScript({
      status: 500,
      script: `pm.test("Status code is 200", function () {
  pm.response.to.have.status(200)
})`,
    })

    expect(results).toHaveLength(1)
    expect(results[0]).toMatchObject({
      title: 'Status code is 200',
      passed: false,
      status: 'failed',
    })
  })

  it('reports runtime errors outside pm.test', async () => {
    const results = await executeScript({
      script: `throw new Error("kaboom")`,
    })

    expect(results).toHaveLength(1)
    expect(results[0]).toMatchObject({
      title: 'Script Execution',
      passed: false,
      status: 'failed',
      error: 'kaboom',
    })
  })
})
