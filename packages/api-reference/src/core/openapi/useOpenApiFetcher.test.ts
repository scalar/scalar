import { describe, expect, it, vi } from 'vitest'
import { ref } from 'vue'

import { useOpenApiFetcher } from './useOpenApiFetcher'
import { waitFor } from './utils/waitFor'

global.fetch = vi.fn()

function createFetchResponse(data: string) {
  return {
    ok: true,
    text: () => new Promise((resolve) => resolve(data)),
  }
}

describe('useOpenApiFetcher', () => {
  it('has processing state', async () => {
    // @ts-expect-error
    fetch.mockResolvedValue(
      createFetchResponse(
        JSON.stringify({
          openapi: '3.1.0',
        }),
      ),
    )

    const { state, content } = useOpenApiFetcher(
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

    const { state } = useOpenApiFetcher(
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

    const { state, content } = useOpenApiFetcher(
      'https://cdn.jsdelivr.net/npm/@scalar/galaxy/dist/latest.json',
    )

    await waitFor(state, 'idle')

    expect(content.value).toStrictEqual(
      JSON.stringify({
        openapi: '3.1.0',
      }),
    )
  })

  it('fetches when the url changes', async () => {
    // JSON
    const url = ref<string>(
      'https://cdn.jsdelivr.net/npm/@scalar/galaxy/dist/latest.json',
    )

    // @ts-expect-error
    fetch.mockResolvedValue(
      createFetchResponse(
        JSON.stringify({
          openapi: '3.1.0',
        }),
      ),
    )

    const { state, content } = useOpenApiFetcher(url)

    await waitFor(state, 'idle')

    expect(content.value).toContain('"openapi":"3.1.0"')

    // YAML
    // @ts-expect-error
    fetch.mockResolvedValue(createFetchResponse('openapi: 3.1.0'))

    url.value = 'https://cdn.jsdelivr.net/npm/@scalar/galaxy/dist/latest.yaml'

    await waitFor(state, 'idle')

    expect(content.value).toContain('openapi: 3.1.0')
  })
})
