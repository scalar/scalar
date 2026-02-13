import type { ClientPlugin } from '@scalar/oas-utils/helpers'
import type { ApiClientPlugin } from '@scalar/types/api-reference'
import { ref } from 'vue'

import { type TestResult, executePostResponseScript } from '@/libs/execute-scripts'

import { PostResponseScripts } from './components/PostResponseScripts'
import { TestResults } from './components/TestResults'

export const postResponseScriptsPlugin = (): ApiClientPlugin => {
  const results = ref<TestResult[]>([])

  return () => ({
    name: 'post-response-scripts',
    views: {
      'request.section': [
        {
          title: 'Scripts',
          component: PostResponseScripts,
        },
      ],
      'response.section': [
        {
          title: 'Tests',
          component: TestResults,
          props: {
            results,
          },
        },
      ],
    },
    hooks: {
      // Reset test results when a new request is sent
      onBeforeRequest() {
        results.value = []
      },
      // Execute post-response scripts when a response is received
      async onResponseReceived({ response, operation }) {
        await executePostResponseScript(operation['x-post-response'], {
          response,
          onTestResultsUpdate: (newResults) => (results.value = [...newResults]),
        })
      },
    },
  })
}

/** Post Response Scripts Plugin for client V2 */
export const postResponseScriptsPluginV2 = (): ClientPlugin => {
  const results = ref<TestResult[]>([])

  return {
    components: {
      request: { component: PostResponseScripts },
      response: { component: TestResults, additionalProps: { results } },
    },

    hooks: {
      // Reset test results when a new request is sent
      beforeRequest: () => {
        results.value = []
      },
      // Execute post-response scripts when a response is received
      responseReceived: async ({ response, operation }) => {
        await executePostResponseScript(operation['x-post-response'], {
          response,
          onTestResultsUpdate: (newResults) => (results.value = [...newResults]),
        })
      },
    },
  }
}
