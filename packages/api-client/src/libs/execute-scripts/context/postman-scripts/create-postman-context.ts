import type { TestResult } from '@/libs/execute-scripts'
import { type EnvironmentUtils, createEnvironmentUtils } from './create-environment-utils'
import { type ExpectChain, createExpectChain } from './create-expect-chain'
import { type ResponseUtils, createResponseUtils } from './create-response-utils'
import { createTestUtils } from './create-test-utils'

export type PostmanContext = {
  response: ResponseUtils
  environment: EnvironmentUtils
  test: (name: string, fn: () => void | Promise<void>) => Promise<void>
  expect: (actual: any) => ExpectChain
}

export type PM = {
  response: ResponseUtils
  environment: EnvironmentUtils
  test: (name: string, fn: () => void | Promise<void>) => Promise<void>
  expect: (actual: any) => ExpectChain
}

export const createPostmanContext = (
  response: Response,
  env: Record<string, any> = {},
  testResults: TestResult[],
  onTestResultsUpdate?: (results: TestResult[]) => void,
): PostmanContext & { pm: PM } => {
  const expect = (actual: any) => createExpectChain(actual)

  const context = {
    response: createResponseUtils(response),
    environment: createEnvironmentUtils(env),
    test: createTestUtils(testResults, onTestResultsUpdate).test,
    expect,
  }

  return {
    ...context,
    pm: {
      ...context,
      expect,
    },
  }
}
