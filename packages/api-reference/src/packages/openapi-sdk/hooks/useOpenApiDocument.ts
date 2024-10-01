import type { OpenAPI } from '@scalar/openapi-types'
import { type Ref, isRef, reactive, ref, watch } from 'vue'

import { type OpenApiDocumentTask, State } from '../types'
import {
  addRequiredProperties,
  createDefaultTag,
  createMissingTags,
  filterInternalItems,
  getOpenApiDocument,
  pending,
} from '../utils'
import { handle } from '../utils/handle'

/** A list of tasks */
const pipeline: OpenApiDocumentTask[] = [
  (content) =>
    getOpenApiDocument(content, {
      // TODO: Don't forget to make that dynamic
      proxy: 'https://proxy.scalar.com',
    }),
  addRequiredProperties,
  filterInternalItems,
  createDefaultTag,
  createMissingTags,
]

/**
 * Reactive wrapper around the OpenAPI helpers
 */
export function useOpenApiDocument(
  input: string | Record<string, any> | Ref<Record<string, any>>,
) {
  const state = ref<State>(State.Idle)

  const openApiDocument = reactive<OpenAPI.Document>({})

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

          const result = await handle(content, pipeline)

          if (result) {
            // Overwrite openApiDocument with the new result
            Object.keys(openApiDocument).forEach((key) => {
              delete openApiDocument[key]
            })
            Object.assign(openApiDocument, result)
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
