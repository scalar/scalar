import type { ClientPlugin } from '@scalar/oas-utils/helpers'
import { ref } from 'vue'

import { type TestResult, executePostResponseScript, executePreRequestScript } from '@/libs/execute-scripts'
import TestResults from '@/plugins/request-scripts/components/TestResults/TestResults.vue'

import ScriptsSection from './components/ScriptsSection.vue'

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
        const preRequestScript = `${document['x-pre-request'] ?? ''}\n${operation['x-pre-request'] ?? ''}`.trim()
        await executePreRequestScript(preRequestScript, {
          requestBuilder,
          variablesStore,
          onTestResultsUpdate: (newResults) => (results.value = [...newResults]),
        })
      },

      responseReceived: async ({ requestBuilder, response, operation, document, variablesStore }) => {
        const postResponseScript = `${document['x-post-response'] ?? ''};\n${operation['x-post-response'] ?? ''}`.trim()
        await executePostResponseScript(postResponseScript, {
          requestBuilder,
          response,
          onTestResultsUpdate: (newResults) => (results.value = [...results.value, ...newResults]),
          variablesStore,
        })
      },
    },
  }
}
