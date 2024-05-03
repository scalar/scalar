import { describe, expect, test, vi } from 'vitest'
import { computed, nextTick, reactive, ref, watch } from 'vue'

import type { SpecConfiguration } from '../types'
import { useReactiveSpec } from './useReactiveSpec'

const basicSpec = {
  openapi: '3.1.0',
  info: { title: 'Example' },
  paths: {},
}

const basicSpecString = JSON.stringify(basicSpec)

describe('useReactiveSpec', () => {
  test('returns the content', async () => {
    const { rawSpec } = useReactiveSpec({
      specConfig: {
        content: basicSpec,
      },
    })

    await nextTick()

    expect(rawSpec.value).toBe(basicSpecString)
  })

  test('returns an empty string', async () => {
    const { rawSpec } = useReactiveSpec({
      specConfig: {
        content: '',
      },
    })

    await nextTick()

    expect(rawSpec.value).toBe('')
  })

  test('calls the content callback', async () => {
    const { rawSpec } = useReactiveSpec({
      specConfig: {
        content: () => {
          return basicSpec
        },
      },
    })

    await nextTick()
    await nextTick()

    expect(rawSpec.value).toBe(basicSpecString)
  })

  test('works with strings', async () => {
    const { rawSpec } = useReactiveSpec({
      specConfig: {
        content: basicSpecString,
      },
    })

    await nextTick()

    expect(rawSpec.value).toBe(basicSpecString)
  })

  test('works with strings in callbacks', async () => {
    const { rawSpec } = useReactiveSpec({
      specConfig: {
        content: () => basicSpecString,
      },
    })

    await nextTick()

    expect(rawSpec.value).toBe(basicSpecString)
  })

  global.fetch = vi.fn()

  function createFetchResponse(data: string) {
    return { text: () => new Promise((resolve) => resolve(data)) }
  }

  test('fetches JSON from an URL', async () => {
    // @ts-ignore
    fetch.mockResolvedValue(createFetchResponse(basicSpecString))

    const { rawSpec } = useReactiveSpec({
      specConfig: {
        url: 'https://example.com/openapi.json',
      },
    })

    expect(fetch).toHaveBeenCalledWith('https://example.com/openapi.json')

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

  test('uses a ref', async () => {
    const specConfig = reactive<SpecConfiguration>({
      content: basicSpec,
    })

    const { rawSpec } = useReactiveSpec({
      specConfig,
    })

    await nextTick()

    expect(rawSpec.value).toBe(basicSpecString)
  })

  test('reacts to ref changes', async () => {
    const configurationRef = reactive<SpecConfiguration>({
      content: basicSpec,
    })

    // Pass the configuration as a ComputedRef
    const specConfig = computed(() => configurationRef)

    const { rawSpec } = useReactiveSpec({ specConfig })

    await nextTick()

    expect(rawSpec.value).toBe(basicSpecString)

    // Change the configuration …
    Object.assign(configurationRef, {
      content: {
        ...basicSpec,
        info: {
          ...basicSpec.info,
          title: 'My Changed Title',
        },
      },
    })

    await nextTick()

    expect(rawSpec.value).toBe(
      basicSpecString.replace('Example', 'My Changed Title'),
    )

    // Change the configuration to empty
    Object.assign(configurationRef, { content: '' })
    await nextTick()

    expect(rawSpec.value).toBe('')
  })

  test('content isn’t overwritten if there’s nothing configured', async () => {
    const configurationRef = reactive<SpecConfiguration>({ content: basicSpec })

    // Pass the configuration as a ComputedRef
    const specConfig = computed(() => configurationRef)

    const { rawSpec } = useReactiveSpec({ specConfig })

    await nextTick()

    expect(rawSpec.value).toBe(basicSpecString)

    // Change the configuration …
    Object.assign(configurationRef, {
      content: undefined,
    })

    await nextTick()

    // … but the content shouldn’t be overwritten
    expect(rawSpec.value).toBe(basicSpecString)
  })
})

// ---------------------------------------------------------------------------

describe('useParser', () => {
  test('returns the content', async () => {
    const { parsedSpec } = useReactiveSpec({
      specConfig: {
        content: basicSpec,
      },
    })

    await nextTick()
    // Sleep for 10ms to wait for the parser to finish
    await new Promise((resolve) => setTimeout(resolve, 50))

    expect(parsedSpec.info.title).toBe('Example')
  })

  test('works with refs', async () => {
    const rawSpecConfig = ref({
      content: basicSpecString,
    })

    const { parsedSpec } = useReactiveSpec({
      specConfig: rawSpecConfig,
    })

    // Sleep for 300ms to wait for the debouncer and the parser
    await new Promise((resolve) => setTimeout(resolve, 300))

    expect(parsedSpec.info.title).toBe('Example')
  })

  test('watches the ref', async () => {
    const rawSpecConfig = ref({
      content: basicSpecString,
    })

    const { parsedSpec } = useReactiveSpec({
      specConfig: rawSpecConfig,
    })

    // Sleep for 300ms to wait for the debouncer and the parser
    await new Promise((resolve) => setTimeout(resolve, 300))

    expect(parsedSpec.info.title).toBe('Example')

    rawSpecConfig.value = {
      content: JSON.stringify(basicSpecString.replace('Example', 'Foobar')),
    }

    // Sleep for 300ms to wait for the debouncer and the parser
    await new Promise((resolve) => setTimeout(resolve, 300))

    expect(parsedSpec.info.title).toBe('Foobar')
  })

  test('deals with undefined input', async () => {
    const { parsedSpec } = useReactiveSpec({})

    // Sleep for 10ms to wait for the parser to finish
    await new Promise((resolve) => setTimeout(resolve, 10))

    expect(parsedSpec.info.title).toBe('')
  })

  test('deals with empty input', async () => {
    const { parsedSpec } = useReactiveSpec({
      specConfig: {
        content: '',
      },
    })

    // Sleep for 10ms to wait for the parser to finish
    await new Promise((resolve) => setTimeout(resolve, 10))

    expect(parsedSpec.info.title).toBe('')
  })

  test('returns errors', async () => {
    const { specErrors } = useReactiveSpec({
      specConfig: {
        content: '{"foo}',
      },
    })

    // Sleep for 10ms to wait for the parser to finish
    await new Promise((resolve) => setTimeout(resolve, 10))

    expect(specErrors.value).toContain('YAMLParseError')
  })
})
