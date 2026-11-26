import { REFERENCE_LS_KEYS } from '@scalar/helpers/object/local-storage'
import type { AnyApiReferenceConfiguration } from '@scalar/types/api-reference'
import type { WorkspaceEventBus } from '@scalar/workspace-store/events'
import { enableAutoUnmount, flushPromises, mount } from '@vue/test-utils'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import ApiReference from './ApiReference.vue'

// Wrap the real preload, so the tests see which grammars the reference asks for up front
vi.mock('@scalar/components/code-block', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@scalar/components/code-block')>()
  return { ...actual, preloadGrammars: vi.fn(actual.preloadGrammars) }
})

const { preloadGrammars } = await import('@scalar/components/code-block')

/** Every language the reference asked to preload */
const preloadedLanguages = (): string[] => vi.mocked(preloadGrammars).mock.calls.flatMap(([names]) => [...names])

enableAutoUnmount(afterEach)

const content = {
  openapi: '3.1.0',
  info: { title: 'Client persistence', version: '1.0.0' },
  paths: {},
}

const storageKey = REFERENCE_LS_KEYS.SELECTED_CLIENT

describe('ApiReference.persistence', () => {
  beforeEach(() => {
    localStorage.clear()
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.clearAllTimers()
    vi.useRealTimers()
    vi.restoreAllMocks()
    localStorage.clear()
  })

  it.each([undefined, true])(
    'restores and saves client selection with persistSelectedClient=%s',
    async (persistSelectedClient) => {
      localStorage.setItem(storageKey, 'php/guzzle')
      const wrapper = mount(ApiReference, {
        props: { configuration: { content, persistSelectedClient } },
      })
      await flushPromises()

      const selector = wrapper.findComponent({ name: 'ClientSelector' })
      expect(selector.props('selectedClient')).toBe('php/guzzle')

      const eventBus: WorkspaceEventBus = selector.props('eventBus')
      eventBus.emit('workspace:update:selected-client', 'js/fetch')
      await flushPromises()
      await vi.advanceTimersByTimeAsync(500)

      expect(selector.props('selectedClient')).toBe('js/fetch')
      expect(localStorage.getItem(storageKey)).toBe('js/fetch')
    },
  )

  it.each([
    { defaultHttpClient: undefined, expected: 'shell/curl' },
    { defaultHttpClient: { targetKey: 'js', clientKey: 'fetch' } as const, expected: 'js/fetch' },
  ])(
    'keeps client selection in memory when persistence is disabled and default is $expected',
    async ({ defaultHttpClient, expected }) => {
      localStorage.setItem(storageKey, 'php/guzzle')
      const getItem = vi.spyOn(Storage.prototype, 'getItem')
      const setItem = vi.spyOn(Storage.prototype, 'setItem')
      const removeItem = vi.spyOn(Storage.prototype, 'removeItem')
      const wrapper = mount(ApiReference, {
        props: { configuration: { content, persistSelectedClient: false, defaultHttpClient } },
      })
      await flushPromises()
      await vi.advanceTimersByTimeAsync(500)

      const selector = wrapper.findComponent({ name: 'ClientSelector' })
      expect(selector.props('selectedClient')).toBe(expected)

      const eventBus: WorkspaceEventBus = selector.props('eventBus')
      eventBus.emit('workspace:update:selected-client', 'python/requests')
      await flushPromises()
      await vi.advanceTimersByTimeAsync(500)

      expect(selector.props('selectedClient')).toBe('python/requests')
      expect(getItem.mock.calls.filter(([key]) => key === storageKey)).toStrictEqual([])
      expect(setItem.mock.calls.filter(([key]) => key === storageKey)).toStrictEqual([])
      expect(removeItem.mock.calls.filter(([key]) => key === storageKey)).toStrictEqual([])
      expect(localStorage.getItem(storageKey)).toBe('php/guzzle')
    },
  )

  it.each<{ configuration: AnyApiReferenceConfiguration }>([
    { configuration: { persistSelectedClient: false } },
    { configuration: { persistSelectedClient: false, sources: [] } },
    { configuration: [{ persistSelectedClient: false }] },
    { configuration: [{ persistSelectedClient: true }, { persistSelectedClient: false, default: true }] },
  ])('honors the opt-out before a source is supplied: $configuration', async ({ configuration }) => {
    localStorage.setItem(storageKey, 'php/guzzle')
    const getItem = vi.spyOn(Storage.prototype, 'getItem')
    const setItem = vi.spyOn(Storage.prototype, 'setItem')
    const wrapper = mount(ApiReference, { props: { configuration } })
    await flushPromises()
    await vi.advanceTimersByTimeAsync(500)

    await wrapper.setProps({ configuration: { content, persistSelectedClient: false } })
    await flushPromises()
    await vi.advanceTimersByTimeAsync(500)

    expect(getItem.mock.calls.filter(([key]) => key === storageKey)).toStrictEqual([])
    expect(setItem.mock.calls.filter(([key]) => key === storageKey)).toStrictEqual([])
    expect(localStorage.getItem(storageKey)).toBe('php/guzzle')
  })

  it('honors configuration updates while a selection write is queued', async () => {
    const wrapper = mount(ApiReference, {
      props: { configuration: { content } },
    })
    await flushPromises()

    const selector = wrapper.findComponent({ name: 'ClientSelector' })
    const eventBus: WorkspaceEventBus = selector.props('eventBus')
    eventBus.emit('workspace:update:selected-client', 'js/fetch')
    await flushPromises()
    await wrapper.setProps({ configuration: { content, persistSelectedClient: false } })
    await vi.advanceTimersByTimeAsync(500)

    expect(selector.props('selectedClient')).toBe('js/fetch')
    expect(localStorage.getItem(storageKey)).toBeNull()
  })

  describe('grammar of the selected client', () => {
    beforeEach(() => {
      vi.mocked(preloadGrammars).mockClear()
    })

    it('starts loading the grammar of the saved client before any code example renders', async () => {
      localStorage.setItem(storageKey, 'php/guzzle')
      // The document has no operations, so no code example is there to ask for the grammar itself
      mount(ApiReference, { props: { configuration: { content } } })
      await flushPromises()

      expect(preloadedLanguages()).toContain('php')
    })

    it('loads the grammar of a client the reader switches to', async () => {
      const wrapper = mount(ApiReference, { props: { configuration: { content } } })
      await flushPromises()

      const eventBus: WorkspaceEventBus = wrapper.findComponent({ name: 'ClientSelector' }).props('eventBus')
      eventBus.emit('workspace:update:selected-client', 'ruby/native')
      await flushPromises()

      expect(preloadedLanguages()).toContain('ruby')
    })

    it('ignores the saved client when persistence is disabled', async () => {
      localStorage.setItem(storageKey, 'php/guzzle')
      mount(ApiReference, { props: { configuration: { content, persistSelectedClient: false } } })
      await flushPromises()

      expect(preloadedLanguages()).not.toContain('php')
    })
  })
})
