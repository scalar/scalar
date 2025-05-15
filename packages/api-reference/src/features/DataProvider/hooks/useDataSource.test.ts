import { prettyPrintJson } from '@scalar/oas-utils/helpers'
import type { SpecConfiguration } from '@scalar/types/api-reference'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { computed, nextTick, reactive, watch } from 'vue'

import { useDataSource } from './useDataSource'

const EXAMPLE_DOCUMENT = {
  openapi: '3.1.0',
  info: { title: 'Example' },
  paths: {},
}

const EXAMPLE_DOCUMENT_STRING = JSON.stringify(EXAMPLE_DOCUMENT, null, 2)

global.fetch = vi.fn()

describe('useDataSource', () => {
  beforeEach(() => {
    // @ts-expect-error
    global.fetch.mockReset()
  })

  it('returns the content from an object', async () => {
    const { originalDocument } = useDataSource({
      configuration: {
        content: EXAMPLE_DOCUMENT,
      },
    })

    await nextTick()

    expect(originalDocument.value).toBe(prettyPrintJson(EXAMPLE_DOCUMENT_STRING))
  })

  it('returns an empty string for empty content', async () => {
    const { originalDocument } = useDataSource({
      configuration: {
        content: '',
      },
    })

    await nextTick()

    expect(originalDocument.value).toBe('')
  })

  it('handles content callback', async () => {
    const { originalDocument } = useDataSource({
      configuration: {
        content: () => EXAMPLE_DOCUMENT,
      },
    })

    await nextTick()

    expect(originalDocument.value).toBe(prettyPrintJson(EXAMPLE_DOCUMENT_STRING))
  })

  it('handles string content', async () => {
    const { originalDocument } = useDataSource({
      configuration: {
        content: EXAMPLE_DOCUMENT_STRING,
      },
    })

    await nextTick()

    expect(originalDocument.value).toBe(EXAMPLE_DOCUMENT_STRING)
  })

  it('handles string content from callback', async () => {
    const { originalDocument } = useDataSource({
      configuration: {
        content: () => EXAMPLE_DOCUMENT_STRING,
      },
    })

    await nextTick()

    expect(originalDocument.value).toBe(EXAMPLE_DOCUMENT_STRING)
  })

  function createFetchResponse(data: string) {
    return {
      status: 200,
      ok: true,
      text: () => new Promise((resolve) => resolve(data)),
    }
  }

  it('fetches content from URL', async () => {
    // @ts-expect-error
    fetch.mockResolvedValue(createFetchResponse(EXAMPLE_DOCUMENT_STRING))

    const { originalDocument } = useDataSource({
      configuration: {
        url: 'https://example.com/openapi.json',
      },
    })

    await nextTick()

    expect(fetch).toHaveBeenCalledWith('https://example.com/openapi.json')

    await new Promise((resolve) => {
      watch(originalDocument, (value) => {
        if (!value) {
          return
        }

        expect(value).toBe(EXAMPLE_DOCUMENT_STRING)
        resolve(null)
      })
    })
  })

  it('handles reactive configuration', async () => {
    const configurationRef = reactive<SpecConfiguration>({
      content: EXAMPLE_DOCUMENT,
    })

    const { originalDocument } = useDataSource({
      configuration: configurationRef,
    })

    await nextTick()

    expect(originalDocument.value).toBe(prettyPrintJson(EXAMPLE_DOCUMENT_STRING))

    // Update configuration
    Object.assign(configurationRef, {
      content: {
        ...EXAMPLE_DOCUMENT,
        info: {
          ...EXAMPLE_DOCUMENT.info,
          title: 'Updated Title',
        },
      },
    })

    await nextTick()

    expect(originalDocument.value).toBe(prettyPrintJson(EXAMPLE_DOCUMENT_STRING.replace('Example', 'Updated Title')))
  })

  it('handles computed configuration', async () => {
    const configurationRef = reactive<SpecConfiguration>({
      content: EXAMPLE_DOCUMENT,
    })

    const { originalDocument } = useDataSource({
      configuration: computed(() => configurationRef),
    })

    await nextTick()

    expect(originalDocument.value).toBe(prettyPrintJson(EXAMPLE_DOCUMENT_STRING))

    // Update configuration
    Object.assign(configurationRef, {
      content: {
        ...EXAMPLE_DOCUMENT,
        info: {
          ...EXAMPLE_DOCUMENT.info,
          title: 'Updated Title',
        },
      },
    })

    await nextTick()

    expect(originalDocument.value).toBe(prettyPrintJson(EXAMPLE_DOCUMENT_STRING.replace('Example', 'Updated Title')))
  })

  it('preserves content when configuration is undefined', async () => {
    const configurationRef = reactive<SpecConfiguration>({
      content: EXAMPLE_DOCUMENT,
    })

    const { originalDocument } = useDataSource({
      configuration: computed(() => configurationRef),
    })

    await nextTick()

    expect(originalDocument.value).toBe(prettyPrintJson(EXAMPLE_DOCUMENT_STRING))

    // Set configuration to undefined
    Object.assign(configurationRef, {
      content: undefined,
    })

    await nextTick()

    // Content should remain unchanged
    expect(originalDocument.value).toBe(prettyPrintJson(EXAMPLE_DOCUMENT_STRING))
  })

  it('handles undefined configuration', async () => {
    const { originalDocument } = useDataSource({})

    await nextTick()

    expect(originalDocument.value).toBe('')
  })
})
