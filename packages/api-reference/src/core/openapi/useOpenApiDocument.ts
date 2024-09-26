import { normalize } from '@scalar/openapi-parser'
import type { OpenAPI } from '@scalar/openapi-types'
import { type Ref, isRef, ref, watch } from 'vue'

import { createDefaultTag } from './utils/createDefaultTag'
import { filterInternalItems } from './utils/filterInternalItems'
import { getOpenApiDocument } from './utils/getOpenApiDocument'
import { pending } from './utils/pending'

// load
// upgrade
// transform

enum State {
  Idle = 'idle',
  Processing = 'processing',
}

type Error = {
  message: string
}

// TODO: Don't forget to add the proxy

/**
 * Reactive wrapper around the OpenAPI helpers
 */
export function useOpenApiDocument(
  input: Record<string, any> | Ref<Record<string, any>>,
) {
  const state = ref<State>(State.Idle)

  const schema = ref<OpenAPI.Document>({})

  const errors: Error[] = []

  watch(
    isRef(input) ? input : () => input,
    async () => {
      await pending<State>(
        {
          state,
          before: State.Processing,
          after: State.Idle,
          debug: 'process-input',
        },
        async () => {
          const content = (isRef(input) ? input.value : input) as string

          const result = await handle(content)

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

const pipeline = [getOpenApiDocument, filterInternalItems, createDefaultTag]

/**
 * Get any OpenAPI Document and prepare it for the rendering
 */
async function handle(content: string) {
  return pipeline.reduce(
    async (acc, nextTask) => {
      return nextTask(await acc)
    },
    Promise.resolve(normalize(content)),
  )
}
