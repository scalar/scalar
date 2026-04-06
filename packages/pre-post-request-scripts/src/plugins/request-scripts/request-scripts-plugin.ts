import type { ClientPlugin } from '@scalar/oas-utils/helpers'
import { ref } from 'vue'

import { type TestResult, executePostResponseScript, executePreRequestScript } from '@/libs/execute-scripts'
import { TestResults } from '@/plugins/request-scripts/components/TestResults'

import ScriptsSection from './components/ScriptsSection.vue'

/**
 * Concatenates any number of pre/post-request scripts into a single string,
 * trimming empty/undefined values and separating them with newlines.
 *
 * Useful for merging scripts defined at different levels (document, operation, etc.).
 */
const getScript = (...args: (string | undefined | null)[]): string => {
  return args
    .map((script) => script?.trim())
    .filter((script) => typeof script === 'string' && script.length > 0)
    .join('\n')
}

/**
 * Unified request scripts plugin for client V2. Provides a single "Scripts"
 * section with:
 * - Pre-request script editor (x-pre-request) — runs before each request
 * - Post-response script editor (x-post-response) — runs after each response
 * - Test results from post-response assertions, shown in the response section
 *
 * Hooks: beforeRequest runs pre-request scripts and resets results;
 * responseReceived runs post-response scripts and updates test results.
 */
export const requestScriptsPlugin = (): ClientPlugin => {
  const results = ref<TestResult[]>([])

  return {
    components: {
      request: {
        component: ScriptsSection,
      },
      response: {
        component: TestResults,
        additionalProps: { results },
      },
    },

    hooks: {
      beforeRequest: async ({ requestBuilder, document, operation, variablesStore }) => {
        // Reset test results when a new request is sent
        results.value = []
        const script = getScript(document['x-pre-request'], operation['x-pre-request'])
        await executePreRequestScript(script, {
          requestBuilder,
          variablesStore,
          onTestResultsUpdate: (newResults) => (results.value = [...newResults]),
        })
      },

      responseReceived: async ({ requestBuilder, response, operation, document, variablesStore }) => {
        const script = getScript(document['x-post-response'], operation['x-post-response'])
        await executePostResponseScript(script, {
          requestBuilder,
          response,
          onTestResultsUpdate: (newResults) => (results.value = [...results.value, ...newResults]),
          variablesStore,
        })
      },
    },
  }
}
