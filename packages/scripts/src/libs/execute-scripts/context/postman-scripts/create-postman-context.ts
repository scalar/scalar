import type { TestResult } from '../../index'
import { type EnvironmentUtils, createEnvironmentUtils } from './create-environment-utils'
import { type ExpectChain, createExpectChain } from './create-expect-chain'
import { type ExtendedSynchronousResponse, createExtendedSynchronousResponse } from './create-response-utils'
import { createTestUtils } from './create-test-utils'

type PostmanApi = {
  response: ExtendedSynchronousResponse
  environment: EnvironmentUtils
  test: (name: string, fn: () => void | Promise<void>) => Promise<void>
  expect: (actual: any) => ExpectChain
}

type SyncExtendedSynchronousResponse = Omit<ExtendedSynchronousResponse, 'text' | 'json'> & {
  text: () => string
  json: () => any
}

type SyncPostmanApi = Omit<PostmanApi, 'response'> & {
  response: SyncExtendedSynchronousResponse
}

export type PostmanContext = SyncPostmanApi & {
  pm: SyncPostmanApi
}

export const createPostmanContext = async (
  response: Response,
  env: Record<string, any> = {},
  testResults: TestResult[],
  onTestResultsUpdate?: (results: TestResult[]) => void,
): Promise<PostmanContext> => {
  const expect = (actual: any) => createExpectChain(actual)

  const responseUtils = await createExtendedSynchronousResponse(response)

  const context = {
    response: responseUtils,
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
