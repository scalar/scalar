import { prettyPrintJson } from '@scalar/oas-utils/helpers'
import type { SpecConfiguration } from '@scalar/types/legacy'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { computed, nextTick, reactive, ref, watch } from 'vue'

import { useReactiveSpec } from './useReactiveSpec'

const basicSpec = {
  openapi: '3.1.0',
  info: { title: 'Example' },
  paths: {},
}

const basicSpecString = JSON.stringify(basicSpec)

global.fetch = vi.fn()

describe('useReactiveSpec', () => {
  beforeEach(() => {
    // @ts-expect-error
    global.fetch.mockReset()
  })

  it('returns the content', async () => {
    const { rawSpec } = useReactiveSpec({
      specConfig: {
        content: basicSpec,
      },
    })

    await nextTick()

    expect(rawSpec.value).toBe(prettyPrintJson(basicSpecString))
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
          return basicSpec
        },
      },
    })

    await nextTick()
    await nextTick()

    expect(rawSpec.value).toBe(prettyPrintJson(basicSpecString))
  })

  it('works with strings', async () => {
    const { rawSpec } = useReactiveSpec({
      specConfig: {
        content: basicSpecString,
      },
    })

    await nextTick()

    expect(rawSpec.value).toBe(basicSpecString)
  })

  it('works with strings in callbacks', async () => {
    const { rawSpec } = useReactiveSpec({
      specConfig: {
        content: () => basicSpecString,
      },
    })

    await nextTick()

    expect(rawSpec.value).toBe(basicSpecString)
  })

  function createFetchResponse(data: string) {
    return {
      status: 200,
      ok: true,
      text: () => new Promise((resolve) => resolve(data)),
    }
  }

  it('fetches JSON from an URL', async () => {
    // @ts-expect-error TODO
    fetch.mockResolvedValue(createFetchResponse(basicSpecString))

    const { rawSpec } = useReactiveSpec({
      specConfig: {
        url: 'https://example.com/openapi.json',
      },
    })

    await nextTick()

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

  it('uses a ref', async () => {
    const specConfig = reactive<SpecConfiguration>({
      content: basicSpec,
    })

    const { rawSpec } = useReactiveSpec({
      specConfig,
    })

    await nextTick()

    expect(rawSpec.value).toBe(prettyPrintJson(basicSpecString))
  })

  it('reacts to ref changes', async () => {
    const configurationRef = reactive<SpecConfiguration>({
      content: basicSpec,
    })

    // Pass the configuration as a ComputedRef
    const specConfig = computed(() => configurationRef)

    const { rawSpec } = useReactiveSpec({ specConfig })

    await nextTick()

    expect(rawSpec.value).toBe(prettyPrintJson(basicSpecString))

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
      prettyPrintJson(basicSpecString.replace('Example', 'My Changed Title')),
    )

    // Change the configuration to empty
    Object.assign(configurationRef, { content: '' })
    await nextTick()

    expect(rawSpec.value).toBe('')
  })

  it('content isn’t overwritten if there’s nothing configured', async () => {
    const configurationRef = reactive<SpecConfiguration>({ content: basicSpec })

    // Pass the configuration as a ComputedRef
    const specConfig = computed(() => configurationRef)

    const { rawSpec } = useReactiveSpec({ specConfig })

    await nextTick()

    expect(rawSpec.value).toBe(prettyPrintJson(basicSpecString))

    // Change the configuration …
    Object.assign(configurationRef, {
      content: undefined,
    })

    await nextTick()

    // … but the content shouldn’t be overwritten
    expect(rawSpec.value).toBe(prettyPrintJson(basicSpecString))
  })
})

// ---------------------------------------------------------------------------

describe('useParser', () => {
  it('returns the content', async () => {
    const { parsedSpec } = useReactiveSpec({
      specConfig: {
        content: basicSpec,
      },
    })

    await nextTick()
    // Sleep for 10ms to wait for the parser to finish
    await new Promise((resolve) => setTimeout(resolve, 50))

    expect(parsedSpec.info?.title).toBe('Example')
  })

  it('works with refs', async () => {
    const rawSpecConfig = ref({
      content: basicSpecString,
    })

    const { parsedSpec } = useReactiveSpec({
      specConfig: rawSpecConfig,
    })

    // Sleep for 300ms to wait for the debouncer and the parser
    await new Promise((resolve) => setTimeout(resolve, 300))

    expect(parsedSpec.info?.title).toBe('Example')
  })

  it('watches the ref', async () => {
    const rawSpecConfig = ref({
      content: basicSpecString,
    })

    const { parsedSpec } = useReactiveSpec({
      specConfig: rawSpecConfig,
    })

    // Sleep for 300ms to wait for the debouncer and the parser
    await new Promise((resolve) => setTimeout(resolve, 300))

    expect(parsedSpec.info?.title).toBe('Example')

    rawSpecConfig.value = {
      content: JSON.stringify(basicSpecString.replace('Example', 'Foobar')),
    }

    // Sleep for 300ms to wait for the debouncer and the parser
    await new Promise((resolve) => setTimeout(resolve, 300))

    expect(parsedSpec.info?.title).toBe('Foobar')
  })

  it('deals with undefined input', async () => {
    const { parsedSpec } = useReactiveSpec({})

    // Sleep for 10ms to wait for the parser to finish
    await new Promise((resolve) => setTimeout(resolve, 10))

    expect(parsedSpec.info?.title).toBe('')
  })

  it('deals with empty input', async () => {
    const { parsedSpec } = useReactiveSpec({
      specConfig: {
        content: '',
      },
    })

    // Sleep for 10ms to wait for the parser to finish
    await new Promise((resolve) => setTimeout(resolve, 10))

    expect(parsedSpec.info?.title).toBe('')
  })

  it('returns errors', async () => {
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
