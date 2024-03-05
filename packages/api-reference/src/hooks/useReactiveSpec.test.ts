import { describe, expect, it, vi } from 'vitest'
import { computed, nextTick, reactive, watch } from 'vue'

import { type SpecConfiguration } from '../types'
import { useReactiveSpec } from './useReactiveSpec'

describe('useReactiveSpec', () => {
  it('returns the content', async () => {
    const { rawSpecRef } = useReactiveSpec({
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
    const { rawSpecRef } = useReactiveSpec({
      configuration: {
        content: '',
      },
    })

    await nextTick()

    expect(rawSpecRef.value).toBe('')
  })

  it('calls the content callback', async () => {
    const { rawSpecRef } = useReactiveSpec({
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
    const { rawSpecRef } = useReactiveSpec({
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
    const { rawSpecRef } = useReactiveSpec({
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

    const { rawSpecRef } = useReactiveSpec({
      configuration: {
        url: 'https://example.com/swagger.json',
      },
    })

    expect(fetch).toHaveBeenCalledWith('https://example.com/swagger.json')

    await new Promise((resolve) => {
      watch(rawSpecRef, (value) => {
        if (!value) return
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

    const { rawSpecRef } = useReactiveSpec({
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

    const { rawSpecRef } = useReactiveSpec({
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

    const { rawSpecRef } = useReactiveSpec({
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

describe('useParser', () => {
  it('returns the content', async () => {
    const { parsedSpecRef } = useParser({
      input: JSON.stringify({
        openapi: '3.1.0',
        info: { title: 'Example' },
        paths: {},
      }),
    })

    // Sleep for 10ms to wait for the parser to finish
    await new Promise((resolve) => setTimeout(resolve, 10))

    expect(parsedSpecRef.info.title).toBe('Example')
  })

  it('works with refs', async () => {
    const rawSpec = ref<string>(
      JSON.stringify({
        openapi: '3.1.0',
        info: { title: 'Example' },
        paths: {},
      }),
    )

    const { parsedSpecRef } = useParser({
      input: rawSpec,
    })

    // Sleep for 300ms to wait for the debouncer and the parser
    await new Promise((resolve) => setTimeout(resolve, 300))

    expect(parsedSpecRef.info.title).toBe('Example')
  })

  it('watches the ref', async () => {
    const rawSpec = ref<string>(
      JSON.stringify({
        openapi: '3.1.0',
        info: { title: 'Example' },
        paths: {},
      }),
    )

    const { parsedSpecRef } = useParser({
      input: rawSpec,
    })

    // Sleep for 300ms to wait for the debouncer and the parser
    await new Promise((resolve) => setTimeout(resolve, 300))

    expect(parsedSpecRef.info.title).toBe('Example')

    rawSpec.value = JSON.stringify({
      openapi: '3.1.0',
      info: { title: 'Foobar' },
      paths: {},
    })

    // Sleep for 300ms to wait for the debouncer and the parser
    await new Promise((resolve) => setTimeout(resolve, 300))

    expect(parsedSpecRef.info.title).toBe('Foobar')
  })

  it('deals with undefined input', async () => {
    const { parsedSpecRef } = useParser({})

    // Sleep for 10ms to wait for the parser to finish
    await new Promise((resolve) => setTimeout(resolve, 10))

    expect(parsedSpecRef.info.title).toBe('')
  })

  it('deals with empty input', async () => {
    const { parsedSpecRef } = useParser({
      input: '',
    })

    // Sleep for 10ms to wait for the parser to finish
    await new Promise((resolve) => setTimeout(resolve, 10))

    expect(parsedSpecRef.info.title).toBe('')
  })

  it('returns errors', async () => {
    const { errorRef } = useParser({
      input: '{"foo}',
    })

    // Sleep for 10ms to wait for the parser to finish
    await new Promise((resolve) => setTimeout(resolve, 10))

    expect(errorRef.value).toContain('SyntaxError')
  })

  it('overwrites the ref', async () => {
    const { parsedSpecRef, overwriteParsedSpecRef } = useParser({})

    overwriteParsedSpecRef({
      // @ts-ignore
      info: { title: 'Example' },
    })

    expect(parsedSpecRef.info.title).toBe('Example')
  })
})
