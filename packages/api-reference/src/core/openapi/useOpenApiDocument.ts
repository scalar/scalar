import type { OpenAPI } from '@scalar/openapi-types'
import { ref, watch } from 'vue'

import { processInput } from './processInput'
import { measure } from './utils/measure'
import { pending } from './utils/pending'

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
    () => input,
    async () => {
      await pending<State>(
        {
          state,
          before: State.Processing,
          after: State.Done,
          debug: 'process-input',
        },
        async () => {
          const result = await processInput(input)

          if (result) {
            schema.value = result
          }
        },
      )
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
