import { describe, expect, it, vi } from 'vitest'
import { nextTick } from 'vue'

import { useSpec } from './useSpec'

describe('useSpec', () => {
  it('returns the content', async () => {
    const { rawSpecRef } = useSpec({
      configuration: {
        content: { openapi: '3.1.0', info: { title: 'Example' }, paths: {} },
      },
    })

    await nextTick()

    expect(rawSpecRef.value).toMatch(
      '{"openapi":"3.1.0","info":{"title":"Example"},"paths":{}}',
    )
  })

  it('calls the content callback', async () => {
    const { rawSpecRef } = useSpec({
      configuration: {
        content: () => {
          return { openapi: '3.1.0', info: { title: 'Example' }, paths: {} }
        },
      },
    })

    await nextTick()

    expect(rawSpecRef.value).toMatch(
      '{"openapi":"3.1.0","info":{"title":"Example"},"paths":{}}',
    )
  })

  it('works with strings', async () => {
    const { rawSpecRef } = useSpec({
      configuration: {
        content: '{"openapi":"3.1.0","info":{"title":"Example"},"paths":{}}',
      },
    })

    await nextTick()

    expect(rawSpecRef.value).toMatch(
      '{"openapi":"3.1.0","info":{"title":"Example"},"paths":{}}',
    )
  })

  it('works with strings in callbacks', async () => {
    const { rawSpecRef } = useSpec({
      configuration: {
        content: () =>
          '{"openapi":"3.1.0","info":{"title":"Example"},"paths":{}}',
      },
    })

    await nextTick()

    expect(rawSpecRef.value).toMatch(
      '{"openapi":"3.1.0","info":{"title":"Example"},"paths":{}}',
    )
  })

  global.fetch = vi.fn()

  function createFetchResponse(data: string) {
    return { text: () => new Promise((resolve) => resolve(data)) }
  }

  it('fetches JSON from an URL', async () => {
    // @ts-ignore
    fetch.mockResolvedValue(
      createFetchResponse(
        '{"openapi":"3.1.0","info":{"title":"Example"},"paths":{}}',
      ),
    )

    const { rawSpecRef } = useSpec({
      configuration: {
        url: 'https://example.com/swagger.json',
      },
    })

    expect(fetch).toHaveBeenCalledWith('https://example.com/swagger.json')

    // await nextTick()

    // expect(rawSpecRef.value).toMatch(
    //   '{"openapi":"3.1.0","info":{"title":"Example"},"paths":{}}',
    // )
  })
})
