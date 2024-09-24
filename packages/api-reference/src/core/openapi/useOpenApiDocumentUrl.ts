import { ref, watch } from 'vue'

import { pending } from './utils/pending'

enum State {
  Idle = 'idle',
  Processing = 'processing',
}

// type Error = {
//   message: string
// }

/**
 * WIP
 */
export function useOpenApiDocumentUrl(url: string) {
  const state = ref<State>(State.Idle)

  const content = ref<string | undefined>()

  //   const errors: Error[] = []

  watch(
    () => url,
    async () => {
      await pending<State>(
        {
          state,
          before: State.Processing,
          after: State.Idle,
          debug: 'fetch-openapi-document',
        },
        async () => {
          const result = await fetch(url, {
            cache: 'no-cache',
          })

          if (result.ok) {
            content.value = await result.text()
          }

          // TODO: add error
        },
      )
    },
    {
      immediate: true,
    },
  )

  return {
    state,
    content,
    // errors,
  }
}
