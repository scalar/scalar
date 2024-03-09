import { describe, expect, it, vi } from 'vitest'
import { computed, nextTick, reactive, ref, watch } from 'vue'

import { type SpecConfiguration } from '../types'
import { useReactiveSpec } from './useReactiveSpec'

describe('useReactiveSpec', () => {
  it('returns the content', async () => {
    const { rawSpec } = useReactiveSpec({
      specConfig: {
        content: { openapi: '3.1.0', info: { title: 'Example' }, paths: {} },
      },
    })

    await nextTick()

    expect(rawSpec.value).toBe(
      '{"openapi":"3.1.0","info":{"title":"Example"},"paths":{}}',
    )
  })

  it('returns an empty string', async () => {
    const { rawSpec } = useReactiveSpec({
      specConfig: {
        content: '',
      },
    })

    await nextTick()

    expect(rawSpec.value).toBe('')
  })

  it('calls the content callback', async () => {
    const { rawSpec } = useReactiveSpec({
      specConfig: {
        content: () => {
          return { openapi: '3.1.0', info: { title: 'Example' }, paths: {} }
        },
      },
    })

    await nextTick()
    await nextTick()

    expect(rawSpec.value).toBe(
      '{"openapi":"3.1.0","info":{"title":"Example"},"paths":{}}',
    )
  })

  it('works with strings', async () => {
    const { rawSpec } = useReactiveSpec({
      specConfig: {
        content: '{"openapi":"3.1.0","info":{"title":"Example"},"paths":{}}',
      },
    })

    await nextTick()

    expect(rawSpec.value).toBe(
      '{"openapi":"3.1.0","info":{"title":"Example"},"paths":{}}',
    )
  })

  it('works with strings in callbacks', async () => {
    const { rawSpec } = useReactiveSpec({
      specConfig: {
        content: () =>
          '{"openapi":"3.1.0","info":{"title":"Example"},"paths":{}}',
      },
    })

    await nextTick()

    expect(rawSpec.value).toBe(
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

    const { rawSpec } = useReactiveSpec({
      specConfig: {
        url: 'https://example.com/swagger.json',
      },
    })

    expect(fetch).toHaveBeenCalledWith('https://example.com/swagger.json')

    await new Promise((resolve) => {
      watch(rawSpec, (value) => {
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
    const specConfig = reactive<SpecConfiguration>({
      content: { openapi: '3.1.0', info: { title: 'Example' }, paths: {} },
    })

    const { rawSpec } = useReactiveSpec({
      specConfig,
    })

    await nextTick()

    expect(rawSpec.value).toBe(
      '{"openapi":"3.1.0","info":{"title":"Example"},"paths":{}}',
    )
  })

  it('reacts to ref changes', async () => {
    const configurationRef = reactive<SpecConfiguration>({
      content: JSON.stringify({
        openapi: '3.1.0',
        info: { title: 'Example' },
        paths: {},
      }),
    })

    // Pass the configuration as a ComputedRef
    const specConfig = computed(() => {
      return configurationRef
    })

    const { rawSpec } = useReactiveSpec({
      specConfig,
    })

    await nextTick()

    expect(rawSpec.value).toBe(
      '{"openapi":"3.1.0","info":{"title":"Example"},"paths":{}}',
    )

    // Change the configuration …
    Object.assign(configurationRef, {
      content: {
        openapi: '3.1.0',
        info: { title: 'My Changed Title' },
        paths: {},
      },
    })
    await nextTick()

    expect(rawSpec.value).toBe(
      '{"openapi":"3.1.0","info":{"title":"My Changed Title"},"paths":{}}',
    )

    // Change the configuration to empty
    Object.assign(configurationRef, { content: '' })
    await nextTick()

    expect(rawSpec.value).toBe('')
  })

  it('content isn’t overwritten if there’s nothing configured', async () => {
    const configurationRef = reactive<SpecConfiguration>({
      content: { openapi: '3.1.0', info: { title: 'Example' }, paths: {} },
    })

    // Pass the configuration as a ComputedRef
    const specConfig = computed(() => {
      return configurationRef
    })

    const { rawSpec } = useReactiveSpec({
      specConfig,
    })

    await nextTick()

    expect(rawSpec.value).toBe(
      '{"openapi":"3.1.0","info":{"title":"Example"},"paths":{}}',
    )

    // Change the configuration …
    Object.assign(configurationRef, {
      content: undefined,
    })

    await nextTick()

    // … but the content shouldn’t be overwritten
    expect(rawSpec.value).toBe(
      '{"openapi":"3.1.0","info":{"title":"Example"},"paths":{}}',
    )
  })
})

describe('useParser', () => {
  it('returns the content', async () => {
    const { parsedSpec } = useReactiveSpec({
      specConfig: {
        content: JSON.stringify({
          openapi: '3.1.0',
          info: { title: 'Example' },
          paths: {},
        }),
      },
    })

    // Sleep for 10ms to wait for the parser to finish
    await new Promise((resolve) => setTimeout(resolve, 10))

    expect(parsedSpec.info.title).toBe('Example')
  })

  it('works with refs', async () => {
    const rawSpecConfig = ref({
      content: JSON.stringify({
        openapi: '3.1.0',
        info: { title: 'Example' },
        paths: {},
      }),
    })

    const { parsedSpec } = useReactiveSpec({
      specConfig: rawSpecConfig,
    })
    // Sleep for 300ms to wait for the debouncer and the parser
    await new Promise((resolve) => setTimeout(resolve, 300))

    expect(parsedSpec.info.title).toBe('Example')
  })

  it('watches the ref', async () => {
    const rawSpecConfig = ref({
      content: JSON.stringify({
        openapi: '3.1.0',
        info: { title: 'Example' },
        paths: {},
      }),
    })

    const { parsedSpec } = useReactiveSpec({
      specConfig: rawSpecConfig,
    })

    // Sleep for 300ms to wait for the debouncer and the parser
    await new Promise((resolve) => setTimeout(resolve, 300))

    expect(parsedSpec.info.title).toBe('Example')

    rawSpecConfig.value = {
      content: JSON.stringify({
        openapi: '3.1.0',
        info: { title: 'Foobar' },
        paths: {},
      }),
    }

    // Sleep for 300ms to wait for the debouncer and the parser
    await new Promise((resolve) => setTimeout(resolve, 300))

    expect(parsedSpec.info.title).toBe('Foobar')
  })

  it('deals with undefined input', async () => {
    const { parsedSpec } = useReactiveSpec({})

    // Sleep for 10ms to wait for the parser to finish
    await new Promise((resolve) => setTimeout(resolve, 10))

    expect(parsedSpec.info.title).toBe('')
  })

  it('deals with empty input', async () => {
    const { parsedSpec } = useReactiveSpec({
      specConfig: {
        content: '',
      },
    })

    // Sleep for 10ms to wait for the parser to finish
    await new Promise((resolve) => setTimeout(resolve, 10))

    expect(parsedSpec.info.title).toBe('')
  })

  it('returns errors', async () => {
    const { specErrors } = useReactiveSpec({
      specConfig: {
        content: '{"foo}',
      },
    })

    // Sleep for 10ms to wait for the parser to finish
    await new Promise((resolve) => setTimeout(resolve, 10))

    expect(specErrors.value).toContain('Invalid JSON or YAML')
  })
})
