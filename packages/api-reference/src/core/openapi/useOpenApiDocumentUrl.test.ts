import { describe, expect, it, vi } from 'vitest'
import { type Ref, watch } from 'vue'

import { useOpenApiDocumentUrl } from './useOpenApiDocumentUrl'

global.fetch = vi.fn()

function createFetchResponse(data: string) {
  return {
    ok: true,
    text: () => new Promise((resolve) => resolve(data)),
  }
}

describe('useOpenApiDocumentUrl', () => {
  it('has processing state', async () => {
    // @ts-expect-error
    fetch.mockResolvedValue(
      createFetchResponse(
        JSON.stringify({
          openapi: '3.1.0',
        }),
      ),
    )

    const { state, content } = useOpenApiDocumentUrl(
      'https://cdn.jsdelivr.net/npm/@scalar/galaxy/dist/latest.json',
    )

    expect(state.value).toBe('processing')

    await waitFor(state, 'idle')

    expect(content.value).toStrictEqual(
      JSON.stringify({
        openapi: '3.1.0',
      }),
    )
  })

  it('switches to idle state', async () => {
    // @ts-expect-error
    fetch.mockResolvedValue(
      createFetchResponse(
        JSON.stringify({
          openapi: '3.1.0',
        }),
      ),
    )

    const { state } = useOpenApiDocumentUrl(
      'https://cdn.jsdelivr.net/npm/@scalar/galaxy/dist/latest.json',
    )

    await waitFor(state, 'idle')
  })

  it('returns content', async () => {
    // @ts-expect-error
    fetch.mockResolvedValue(
      createFetchResponse(
        JSON.stringify({
          openapi: '3.1.0',
        }),
      ),
    )

    const { state, content } = useOpenApiDocumentUrl(
      'https://cdn.jsdelivr.net/npm/@scalar/galaxy/dist/latest.json',
    )

    await waitFor(state, 'idle')

    expect(content.value).toStrictEqual(
      JSON.stringify({
        openapi: '3.1.0',
      }),
    )
  })
})

// TODO: Move to test utils, remove duplicates
function waitFor(input: Ref<any>, expectedValue: any) {
  return new Promise<void>((resolve) => {
    const unwatch = watch(input, (newValue) => {
      if (newValue === expectedValue) {
        unwatch()
        resolve()
      }
    })
  })
}
