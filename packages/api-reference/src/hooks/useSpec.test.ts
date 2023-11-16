import { type SpecConfiguration } from 'src/types'
import { describe, expect, it, vi } from 'vitest'
import { computed, nextTick, reactive, watch } from 'vue'

import { useSpec } from './useSpec'

describe('useSpec', () => {
  it('returns the content', async () => {
    const { rawSpecRef } = useSpec({
      configuration: {
        content: { openapi: '3.1.0', info: { title: 'Example' }, paths: {} },
      },
    })

    await nextTick()

    expect(rawSpecRef.value).toBe(
      '{"openapi":"3.1.0","info":{"title":"Example"},"paths":{}}',
    )
  })

  it('returns an empty string', async () => {
    const { rawSpecRef } = useSpec({
      configuration: {
        content: '',
      },
    })

    await nextTick()

    expect(rawSpecRef.value).toBe('')
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
    await nextTick()

    expect(rawSpecRef.value).toBe(
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

    expect(rawSpecRef.value).toBe(
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

    expect(rawSpecRef.value).toBe(
      '{"openapi":"3.1.0","info":{"title":"Example"},"paths":{}}',
    )
  })

  // @ts-ignore
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

    await new Promise((resolve) => {
      watch(rawSpecRef, (value) => {
        expect(JSON.parse(value)).toMatchObject({
          openapi: '3.1.0',
          info: {
            title: 'Example',
          },
          paths: {},
        })

        resolve(null)
      })
    })
  })

  it('uses a ref', async () => {
    const configuration = reactive<SpecConfiguration>({
      content: { openapi: '3.1.0', info: { title: 'Example' }, paths: {} },
    })

    const { rawSpecRef } = useSpec({
      configuration,
    })

    await nextTick()

    expect(rawSpecRef.value).toBe(
      '{"openapi":"3.1.0","info":{"title":"Example"},"paths":{}}',
    )
  })

  it('reacts to ref changes', async () => {
    const configurationRef = reactive<SpecConfiguration>({
      content: { openapi: '3.1.0', info: { title: 'Example' }, paths: {} },
    })

    // Pass the configuration as a ComputedRef
    const configuration = computed(() => {
      return configurationRef
    })

    const { rawSpecRef } = useSpec({
      configuration,
    })

    await nextTick()

    expect(rawSpecRef.value).toBe(
      '{"openapi":"3.1.0","info":{"title":"Example"},"paths":{}}',
    )

    // Change the configuration …
    Object.assign(configurationRef, {
      content: '',
    })

    await nextTick()

    expect(rawSpecRef.value).toBe('')
  })

  it('content isn’t overwritten if there’s nothing configured', async () => {
    const configurationRef = reactive<SpecConfiguration>({
      content: { openapi: '3.1.0', info: { title: 'Example' }, paths: {} },
    })

    // Pass the configuration as a ComputedRef
    const configuration = computed(() => {
      return configurationRef
    })

    const { rawSpecRef } = useSpec({
      configuration,
    })

    await nextTick()

    expect(rawSpecRef.value).toBe(
      '{"openapi":"3.1.0","info":{"title":"Example"},"paths":{}}',
    )

    // Change the configuration …
    Object.assign(configurationRef, {
      content: undefined,
    })

    await nextTick()

    // … but the content shouldn’t be overwritten
    expect(rawSpecRef.value).toBe(
      '{"openapi":"3.1.0","info":{"title":"Example"},"paths":{}}',
    )
  })
})
