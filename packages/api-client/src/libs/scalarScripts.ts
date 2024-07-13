import type { ResponseTest } from '@scalar/oas-utils/entities/workspace/spec'
import type { AxiosRequestConfig, AxiosResponse } from 'axios'

function getPreRequestScalarObject(config: AxiosRequestConfig) {
  const _config = config
  return {
    environment: {
      set: (key: string, value: string) => {},
      get: (key: string) => '',
    },
    request: {
      headers: {
        add({ key, value }: { key: string; value: string }) {
          _config.headers = _config.headers || {}
          _config.headers[key] = value
        },
      },
    },
    _config,
  }
}
export const executePreRequestScript = (
  script: string,
  config: AxiosRequestConfig,
) => {
  const scalar = getPreRequestScalarObject(config)
  const executeScript = new Function('scalar', script)

  const output = executeScript(scalar)

  return { output, config: scalar._config }
}

function expect(actual: any) {
  return {
    toBe: (expected: any) => {
      if (actual !== expected) {
        throw new Error(`Expected ${actual} to be ${expected}`)
      }
    },
  }
}

function getPostRequestScriptObject(response?: AxiosResponse) {
  const testResults: ResponseTest[] = []
  return {
    sub: (a: number, b: number) => a - b,
    test: (title: string, func: () => boolean) => {
      try {
        func()
        testResults.push({ title, passed: true })
      } catch (e) {
        testResults.push({ title, passed: false, error: e as string })
      }
    },
    expect,
    response,
    _testResults: testResults,
  }
}
export const executePostRequestScript = (
  script: string,
  response?: AxiosResponse,
) => {
  const scalar = getPostRequestScriptObject(response)
  const executeScript = new Function('scalar', script)

  const output = executeScript(scalar)

  return {
    output,
    testResults: scalar._testResults,
  }
}
