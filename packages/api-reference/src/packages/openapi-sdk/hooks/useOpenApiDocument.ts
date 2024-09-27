import { normalize } from '@scalar/openapi-parser'
import type { OpenAPI } from '@scalar/openapi-types'
import { type Ref, isRef, ref, watch } from 'vue'

import { createDefaultTag } from '../utils/createDefaultTag'
import { filterInternalItems } from '../utils/filterInternalItems'
import { getOpenApiDocument } from '../utils/getOpenApiDocument'
// import { measure } from '../utils/measure'
import { pending } from '../utils/pending'

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
  input: string | Record<string, any> | Ref<Record<string, any>>,
) {
  const state = ref<State>(State.Idle)

  const openApiDocument = ref<OpenAPI.Document>({})

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
            openApiDocument.value = result
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
    openApiDocument,
  }
}

const pipeline = [
  getOpenApiDocument,
  // addRequiredProperties,
  filterInternalItems,
  createDefaultTag,
]

/**
 * Get any OpenAPI Document and prepare it for the rendering
 */
export async function handle(content: string | Record<string, any>) {
  return pipeline.reduce(
    async (acc, nextTask) => {
      // return await measure<OpenAPI.Document>(`- ${nextTask.name}`, async () => {
      return nextTask(await acc)
      // })
    },
    Promise.resolve(normalize(content)),
  )
}

// // paths, tags
// function addRequiredProperties(content: OpenAPI.Document) {
//   const updatedContent = { ...content }

//   if (!updatedContent.paths) {
//     updatedContent.paths = {}
//   }

//   if (!updatedContent.tags) {
//     updatedContent.tags = []
//   }

//   return updatedContent
// }
