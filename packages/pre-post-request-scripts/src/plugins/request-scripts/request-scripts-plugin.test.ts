import type { RequestFactory, VariableEntry, VariablesStore } from '@scalar/workspace-store/request-example'
import { describe, expect, it } from 'vitest'

import type { TestResult } from '@/libs/execute-scripts'
import { executePostResponseScript } from '@/libs/execute-scripts/execute-post-response-script'
import { executePreRequestScript } from '@/libs/execute-scripts/execute-pre-request-script'

const createRequestBuilder = (): RequestFactory => ({
  baseUrl: 'https://example.com',
  path: { variables: {}, raw: '/api/example' },
  method: 'GET',
  proxy: { proxyUrl: '' },
  query: { params: new URLSearchParams() },
  headers: new Headers(),
  body: null,
  cookies: { list: [] },
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
})
