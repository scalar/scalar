import { describe, expect, it } from 'vitest'
import { ref } from 'vue'

import { waitFor } from '../utils/waitFor'
import { useOpenApiDocument } from './useOpenApiDocument'

describe('useOpenApiDocument', () => {
  it('has processing state', async () => {
    const { openApiDocument, state } = useOpenApiDocument({
      openapi: '3.1.0',
    })

    expect(state.value).toBe('processing')

    await waitFor(state, 'idle')

    expect(openApiDocument.value).toStrictEqual({
      openapi: '3.1.0',
    })
  })

  it('has done state', async () => {
    const { state } = useOpenApiDocument({
      openapi: '3.1.0',
    })

    await waitFor(state, 'idle')

    expect(state.value).toBe('idle')
  })

  it('returns an openApiDocument', async () => {
    const { state, openApiDocument } = useOpenApiDocument({
      openapi: '3.1.0',
    })

    await waitFor(state, 'idle')

    expect(openApiDocument.value).toStrictEqual({
      openapi: '3.1.0',
    })
  })

  it('updates the openApiDocument', async () => {
    const input = ref<string>(
      JSON.stringify({
        openapi: '3.1.0',
      }),
    )

    const { state, openApiDocument } = useOpenApiDocument(input)

    await waitFor(state, 'idle')

    expect(openApiDocument.value).toStrictEqual({
      openapi: '3.1.0',
    })

    input.value = JSON.stringify({
      swagger: '2.0',
    })

    await waitFor(state, 'idle')

    expect(openApiDocument.value).toStrictEqual({
      swagger: '2.0',
    })
  })
})
