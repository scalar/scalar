import { type Ref, isRef, ref, watch } from 'vue'

import { pending } from '../utils/pending'

// TODO: proxy support

enum State {
  Idle = 'idle',
  Processing = 'processing',
}

/**
 * WIP
 */
export function useOpenApiFetcher(url: string | Ref<string>) {
  const state = ref<State>(State.Idle)

  const content = ref<string | undefined>()

  //   const errors: Error[] = []

  watch(
    isRef(url) ? url : () => url,
    async () => {
      await pending<State>(
        {
          state,
          before: State.Processing,
          after: State.Idle,
          debug: 'fetch-openapi-document',
        },
        async () => {
          // TODO: Do two requests?
          // 1. one with 'force-cache' (use fresh or stale entries) and
          // 2. one with 'reload' (force to get a fresh file)
          const result = await fetch(isRef(url) ? url.value : url, {
            cache: 'no-cache',
          })

          if (result.ok) {
            content.value = await result.text()
            console.info('size:', Math.round(content.value.length / 1024), 'kB')
          }

          // TODO: add error handling
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
