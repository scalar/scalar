import type { ClientPlugin } from '@scalar/oas-utils/helpers'
import { ref } from 'vue'

import { getScript } from '@/helpers/get-script'
import {
  type TestResult,
  executePostResponseScript,
  executePreRequestScript,
  prewarmSandboxFrame,
} from '@/libs/execute-scripts'
import { TestResults } from '@/plugins/request-scripts/components/TestResults'

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
      onRequestMount: ({ document, operation }) => {
        // Only warm up the sandbox when this operation actually has scripts. Requests without
        // scripts never touch the sandbox, so creating the iframe for them would waste work.
        const script = getScript(
          document['x-pre-request'],
          operation['x-pre-request'],
          document['x-post-response'],
          operation['x-post-response'],
        )

        if (script) {
          prewarmSandboxFrame()
        }
      },

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
        // Snapshot pre-request results before running post-response script
        const preRequestResults = [...results.value]
        await executePostResponseScript(script, {
          requestBuilder,
          response,
          onTestResultsUpdate: (postResponseResults) =>
            (results.value = [...preRequestResults, ...postResponseResults]),
          variablesStore,
        })
      },
    },
  }
}
