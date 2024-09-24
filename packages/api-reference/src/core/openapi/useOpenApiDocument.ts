import { processInput } from '@/core/openapi/processInput'
import type { OpenAPI } from '@scalar/openapi-types'
import { ref, watch } from 'vue'

// load
// upgrade
// transform

enum State {
  Idle = 'idle',
  Processing = 'processing',
  Done = 'done',
}

type Error = {
  message: string
}

// TODO: Don't forget to add the proxy

/**
 * WIP
 */
export function useOpenApiDocument(input: Record<string, any>) {
  const state = ref<State>(State.Idle)

  const schema = ref<OpenAPI.Document>({})

  const errors: Error[] = []

  watch(
    input,
    async () => {
      state.value = State.Processing
      const result = await processInput(input)
      state.value = State.Done

      if (result) {
        schema.value = result
      }
    },
    {
      immediate: true,
    },
  )

  return {
    state,
    errors,
    schema,
  }
}
