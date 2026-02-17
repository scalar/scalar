import { describe, expect, it } from 'vitest'

import { type TestResult, executePostResponseScript } from '../libs/execute-scripts'
import { EXAMPLE_SCRIPTS } from './example-scripts'

describe('example scripts', () => {
  it.each(EXAMPLE_SCRIPTS)('execute the $title example', async ({ script, mockResponse }) => {
    const response = new Response(JSON.stringify(mockResponse.body), {
      status: mockResponse.status ?? 200,
      headers: mockResponse.headers ?? { 'Content-Type': 'application/json' },
    })

    const testResults: TestResult[] = []
    await executePostResponseScript(script, {
      response,
      onTestResultsUpdate: (results) => Object.assign(testResults, results),
    })

    expect(testResults[0]).toMatchObject({
      title: expect.any(String),
      passed: true,
      error: undefined,
      duration: expect.any(Number),
      status: 'passed',
    })

    expect(testResults[0]?.duration).toBeGreaterThan(0)

    expect(testResults.length).toBe(1)
  })
})
