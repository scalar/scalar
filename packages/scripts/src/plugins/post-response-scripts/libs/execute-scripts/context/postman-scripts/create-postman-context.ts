import type { TestResult } from '../../index'
import { type EnvironmentUtils, createEnvironmentUtils } from './create-environment-utils'
import { type ExpectChain, createExpectChain } from './create-expect-chain'
import { type ResponseUtils, createResponseUtils } from './create-response-utils'
import { createTestUtils } from './create-test-utils'

type PostmanApi = {
  response: ResponseUtils
  environment: EnvironmentUtils
  test: (name: string, fn: () => void | Promise<void>) => Promise<void>
  expect: (actual: any) => ExpectChain
}

type SyncResponseUtils = Omit<ResponseUtils, 'text' | 'json'> & {
  text: () => string
  json: () => any
}

type SyncPostmanApi = Omit<PostmanApi, 'response'> & {
  response: SyncResponseUtils
}

export type PostmanContext = SyncPostmanApi & {
  pm: SyncPostmanApi
}

export const createPostmanContext = (
  response: Response,
  responseText: string,
  env: Record<string, any> = {},
  testResults: TestResult[],
  onTestResultsUpdate?: (results: TestResult[]) => void,
): PostmanContext => {
  const expect = (actual: any) => createExpectChain(actual)

  // Try to parse JSON from response text
  let responseJson = null
  try {
    responseJson = JSON.parse(responseText)
  } catch {
    // Keep responseJson as null if parsing fails
  }

  const responseUtils = {
    ...createResponseUtils(response),
    text: () => {
      return responseText
    },
    json: () => {
      if (responseJson === null) {
        throw new Error('Response is not valid JSON')
      }

      return responseJson
    },
  }

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
