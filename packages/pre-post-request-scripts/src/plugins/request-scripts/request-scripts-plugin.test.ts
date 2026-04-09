import type { RequestFactory, VariableEntry, VariablesStore } from '@scalar/workspace-store/request-example'
import { describe, expect, it } from 'vitest'
import type { Ref } from 'vue'

import type { TestResult } from '@/libs/execute-scripts'
import { executePostResponseScript } from '@/libs/execute-scripts/execute-post-response-script'
import { executePreRequestScript } from '@/libs/execute-scripts/execute-pre-request-script'
import { requestScriptsPlugin } from '@/plugins/request-scripts/request-scripts-plugin'

const createRequestBuilder = (): RequestFactory => ({
  baseUrl: 'https://example.com',
  path: { variables: {}, raw: '/api/example' },
  method: 'GET',
  proxyUrl: '',
  query: new URLSearchParams(),
  headers: new Headers(),
  body: null,
  cookies: [],
  cache: 'default',
  security: [],
})

/**
 * Creates a simple in-memory VariablesStore for testing variable persistence
 * between pre-request and post-response scripts.
 */
const createVariablesStore = (): VariablesStore => {
  let localVariables: VariableEntry[] = []
  let collectionVariables: VariableEntry[] = []
  let globals: VariableEntry[] = []
  let environment: VariableEntry[] = []

  return {
    getEnvironment: () => environment,
    getGlobals: () => globals,
    getCollectionVariables: () => collectionVariables,
    getData: () => ({}),
    getLocalVariables: () => localVariables,
    setLocalVariables: (variables) => {
      localVariables = variables
    },
    setCollectionVariables: (variables) => {
      collectionVariables = variables
    },
    setGlobals: (variables) => {
      globals = variables
    },
    setEnvironment: (variables) => {
      environment = variables
    },
    getVariables: () => {
      const merged: Record<string, string> = {}
      for (const { key, value } of globals) {
        merged[key] = value
      }
      for (const { key, value } of collectionVariables) {
        merged[key] = value
      }
      for (const { key, value } of environment) {
        merged[key] = value
      }
      for (const { key, value } of localVariables) {
        merged[key] = value
      }
      return merged
    },
  }
}

describe('request-scripts-plugin', () => {
  it('persists pm.globals between pre-request and post-response scripts', async () => {
    const variablesStore = createVariablesStore()
    const requestBuilder = createRequestBuilder()
    const testResults: TestResult[] = []

    // Pre-request script sets a global variable
    await executePreRequestScript('pm.globals.set("var", "hello")', {
      requestBuilder,
      variablesStore,
    })

    // Post-response script reads the global variable and tests it
    const response = new Response('{}', { status: 200 })
    await executePostResponseScript(
      `pm.test("globals persist between scripts", () => pm.expect(pm.globals.get("var")).to.eq("hello"))`,
      {
        requestBuilder,
        response,
        variablesStore,
        onTestResultsUpdate: (results) => {
          testResults.splice(0, testResults.length, ...results)
        },
      },
    )

    expect(testResults).toStrictEqual([
      {
        title: 'globals persist between scripts',
        passed: true,
        duration: expect.any(Number),
        error: undefined,
        status: 'passed',
      },
    ])
  })

  it('persists pm.variables between pre-request and post-response scripts', async () => {
    const variablesStore = createVariablesStore()
    const requestBuilder = createRequestBuilder()
    const testResults: TestResult[] = []

    // Pre-request script sets a local variable
    await executePreRequestScript('pm.variables.set("localVar", "world")', {
      requestBuilder,
      variablesStore,
    })

    // Post-response script reads the local variable and tests it
    const response = new Response('{}', { status: 200 })
    await executePostResponseScript(
      `pm.test("variables persist between scripts", () => pm.expect(pm.variables.get("localVar")).to.eq("world"))`,
      {
        requestBuilder,
        response,
        variablesStore,
        onTestResultsUpdate: (results) => {
          testResults.splice(0, testResults.length, ...results)
        },
      },
    )

    expect(testResults).toStrictEqual([
      {
        title: 'variables persist between scripts',
        passed: true,
        duration: expect.any(Number),
        error: undefined,
        status: 'passed',
      },
    ])
  })

  it('persists pm.collectionVariables between pre-request and post-response scripts', async () => {
    const variablesStore = createVariablesStore()
    const requestBuilder = createRequestBuilder()
    const testResults: TestResult[] = []

    // Pre-request script sets a collection variable
    await executePreRequestScript('pm.collectionVariables.set("collVar", "collection-value")', {
      requestBuilder,
      variablesStore,
    })

    // Post-response script reads the collection variable and tests it
    const response = new Response('{}', { status: 200 })
    await executePostResponseScript(
      `pm.test("collectionVariables persist between scripts", () => pm.expect(pm.collectionVariables.get("collVar")).to.eq("collection-value"))`,
      {
        requestBuilder,
        response,
        variablesStore,
        onTestResultsUpdate: (results) => {
          testResults.splice(0, testResults.length, ...results)
        },
      },
    )

    expect(testResults).toStrictEqual([
      {
        title: 'collectionVariables persist between scripts',
        passed: true,
        duration: expect.any(Number),
        error: undefined,
        status: 'passed',
      },
    ])
  })

  it('persists multiple variable types simultaneously between scripts', async () => {
    const variablesStore = createVariablesStore()
    const requestBuilder = createRequestBuilder()
    const testResults: TestResult[] = []

    // Pre-request script sets variables in all scopes
    await executePreRequestScript(
      `
      pm.globals.set("globalVar", "global-value")
      pm.collectionVariables.set("collVar", "collection-value")
      pm.variables.set("localVar", "local-value")
    `,
      {
        requestBuilder,
        variablesStore,
      },
    )

    // Post-response script verifies all variables persist
    const response = new Response('{}', { status: 200 })
    await executePostResponseScript(
      `
      pm.test("globals persist", () => pm.expect(pm.globals.get("globalVar")).to.eq("global-value"))
      pm.test("collectionVariables persist", () => pm.expect(pm.collectionVariables.get("collVar")).to.eq("collection-value"))
      pm.test("variables persist", () => pm.expect(pm.variables.get("localVar")).to.eq("local-value"))
    `,
      {
        requestBuilder,
        response,
        variablesStore,
        onTestResultsUpdate: (results) => {
          testResults.splice(0, testResults.length, ...results)
        },
      },
    )

    expect(testResults).toStrictEqual([
      {
        title: 'globals persist',
        passed: true,
        duration: expect.any(Number),
        error: undefined,
        status: 'passed',
      },
      {
        title: 'collectionVariables persist',
        passed: true,
        duration: expect.any(Number),
        error: undefined,
        status: 'passed',
      },
      {
        title: 'variables persist',
        passed: true,
        duration: expect.any(Number),
        error: undefined,
        status: 'passed',
      },
    ])
  })

  it('does not duplicate test results when onTestResultsUpdate is called multiple times', async () => {
    const plugin = requestScriptsPlugin()
    const variablesStore = createVariablesStore()
    const requestBuilder = createRequestBuilder()
    const document = {
      'x-pre-request': 'pm.test("pre-request test", () => pm.expect(true).to.be.true)',
      'x-post-response': `
        pm.test("post-response test 1", () => pm.expect(true).to.be.true)
        pm.test("post-response test 2", () => pm.expect(true).to.be.true)
      `,
    }
    const operation = {}

    // Run beforeRequest hook (pre-request script with 1 test)
    await plugin.hooks?.beforeRequest?.({
      requestBuilder,
      document,
      operation,
      variablesStore,
    } as never)

    // Run responseReceived hook (post-response script with 2 tests)
    const response = new Response('{}', { status: 200 })
    await plugin.hooks?.responseReceived?.({
      requestBuilder,
      response,
      document,
      operation,
      variablesStore,
    } as never)

    // Get results from the plugin's response component props
    const results = plugin.components?.response?.additionalProps?.results as Ref<TestResult[]> | undefined
    expect(results).toBeDefined()
    expect(results?.value).toHaveLength(3) // 1 pre-request + 2 post-response

    const titles = results?.value.map((r) => r.title)
    expect(titles).toStrictEqual(['pre-request test', 'post-response test 1', 'post-response test 2'])
  })

  it('preserves pre-request results when post-response script runs', async () => {
    const plugin = requestScriptsPlugin()
    const variablesStore = createVariablesStore()
    const requestBuilder = createRequestBuilder()
    const document = {
      'x-pre-request': 'pm.test("pre-request assertion", () => pm.expect(1).to.eq(1))',
      'x-post-response': 'pm.test("post-response assertion", () => pm.expect(2).to.eq(2))',
    }
    const operation = {}

    await plugin.hooks?.beforeRequest?.({
      requestBuilder,
      document,
      operation,
      variablesStore,
    } as never)

    const response = new Response('{}', { status: 200 })
    await plugin.hooks?.responseReceived?.({
      requestBuilder,
      response,
      document,
      operation,
      variablesStore,
    } as never)

    const results = plugin.components?.response?.additionalProps?.results as Ref<TestResult[]> | undefined
    expect(results?.value).toHaveLength(2)
    expect(results?.value?.[0]?.title).toBe('pre-request assertion')
    expect(results?.value?.[1]?.title).toBe('post-response assertion')
  })

  it('resets results on new request', async () => {
    const plugin = requestScriptsPlugin()
    const variablesStore = createVariablesStore()
    const requestBuilder = createRequestBuilder()
    const document = {
      'x-pre-request': 'pm.test("test", () => pm.expect(true).to.be.true)',
      'x-post-response': '',
    }
    const operation = {}

    // First request
    await plugin.hooks?.beforeRequest?.({
      requestBuilder,
      document,
      operation,
      variablesStore,
    } as never)

    const results = plugin.components?.response?.additionalProps?.results as Ref<TestResult[]> | undefined
    expect(results?.value).toHaveLength(1)

    // Second request should reset results
    await plugin.hooks?.beforeRequest?.({
      requestBuilder,
      document,
      operation,
      variablesStore,
    } as never)

    expect(results?.value).toHaveLength(1) // Still 1, not 2 (reset happened)
  })
})
