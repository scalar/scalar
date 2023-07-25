import { useWebWorker } from '@vueuse/core'
import { nextTick, ref, watch } from 'vue'

import { transformToJson } from '../helpers/transformToJson'

const { data, post } = useWebWorker('/web-worker.js')

const parserResult = ref<Record<any, any>>()
const parserError = ref<string>('')
const parserReady = ref(false)

type ErrorObject = { error: string }

/**
 * Takes the content of a swagger file and asynchronously calls the given callback with the result.
 */
export const useSwaggerParser = () => {
  const parseSwaggerFile = async (
    value: string,
    callback: (result: Record<any, any>) => void,
  ) => {
    const jsonValue = transformToJson(value)

    // Send data to WASM parser.
    const triggeredAction = watch(data, (result: string | ErrorObject) => {
      // Skip if the value is empty.
      if (typeof result === 'string' && result === '') {
        return
      }

      // Check if the parser had an error.
      if (typeof result === 'object') {
        console.warn('[parseSwaggerFile] ERROR:', result.error)
        parserError.value = result.error
        return
      }

      // Something with the Parser went really wrong.
      if (typeof result === 'undefined') {
        console.error('[parseSwaggerFile] ERROR: result is undefined')
        parserError.value =
          'Something went wrong. The parser failed to parse the content.'
        return
      }

      // Execute the given callback.
      const content = JSON.parse(result)

      // Check if content is empty.
      if (!content) {
        return
      }

      parserError.value = ''
      parserResult.value = content
      callback(content)

      // Don’t watch `data` anymore.
      triggeredAction()
    })

    post(jsonValue)

    if (parserReady.value) {
      return
    }

    await nextTick()

    parserReady.value = true
  }

  return {
    parseSwaggerFile,
    parserResult,
    parserError,
    parserReady,
  }
}
