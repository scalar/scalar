import { getLoadedPlugin, loadPlugin, preloadClients } from '@scalar/snippetz/lazy'
import { enableAutoUnmount, flushPromises, mount } from '@vue/test-utils'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { generateClientOptions } from '../helpers/generate-client-options'
import { getSnippet } from '../helpers/get-snippet'
import { mockEventBus } from '../test-utils'
import CodeExample from './CodeExample.vue'

// Wrap the real loader, so we can see which generators the component asks for (and make one fail)
vi.mock('@scalar/snippetz/lazy', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@scalar/snippetz/lazy')>()
  return { ...actual, loadPlugin: vi.fn(actual.loadPlugin) }
})

enableAutoUnmount(afterEach)

const clientOptions = generateClientOptions()

const mountCodeExample = (selectedClient: string) =>
  mount(CodeExample, {
    props: {
      eventBus: mockEventBus,
      method: 'get',
      path: '/planets',
      clientOptions,
      selectedClient,
      selectedServer: { url: 'https://example.com' },
      securitySchemes: [],
      operation: { summary: 'List planets' },
    },
  })

/** Text that must never flash while a generator loads */
const ERROR_TEXT = /not loaded|no snippet found|error generating/i

describe('CodeExample.lazy', () => {
  it('renders an empty placeholder without error text while the generator loads', async () => {
    const wrapper = mountCodeExample('shell/wget')

    expect(getLoadedPlugin('shell', 'wget')).toBeUndefined()
    expect(wrapper.find('.code-snippet').exists()).toBe(true)
    expect(wrapper.find('.code-snippet').text()).toBe('')
    expect(wrapper.text()).not.toMatch(ERROR_TEXT)
    expect(wrapper.find('[role="status"]').exists()).toBe(false)

    await vi.waitFor(() => expect(wrapper.text()).toContain('wget'))
    expect(wrapper.find('.code-snippet').text()).toContain('- https://example.com/planets')
    expect(wrapper.text()).not.toMatch(ERROR_TEXT)
  })

  it('loads exactly the selected client and loads the new one when switching', async () => {
    const wrapper = mountCodeExample('ruby/native')
    await flushPromises()

    expect(vi.mocked(loadPlugin).mock.calls).toStrictEqual([['ruby', 'native']])
    await vi.waitFor(() => expect(wrapper.text()).toContain("require 'uri'"))
    expect(getLoadedPlugin('go', 'native')).toBeUndefined()

    await wrapper.setProps({ selectedClient: 'go/native' })

    expect(wrapper.text()).not.toMatch(ERROR_TEXT)
    expect(vi.mocked(loadPlugin).mock.calls).toStrictEqual([
      ['ruby', 'native'],
      ['go', 'native'],
    ])
    await vi.waitFor(() => expect(wrapper.text()).toContain('package main'))
    // Every other generator stays unloaded
    expect(getLoadedPlugin('rust', 'reqwest')).toBeUndefined()
  })

  it('renders the final snippet on the first render when the client was preloaded', async () => {
    await preloadClients(['python/requests'])
    vi.mocked(loadPlugin).mockClear()

    const wrapper = mountCodeExample('python/requests')

    expect(wrapper.find('.code-snippet').text()).toContain('requests.get("https://example.com/planets")')
    expect(loadPlugin).not.toHaveBeenCalled()
  })

  it('never waits for custom code samples', () => {
    const wrapper = mount(CodeExample, {
      props: {
        eventBus: mockEventBus,
        method: 'get',
        path: '/planets',
        clientOptions,
        selectedClient: 'custom/python',
        selectedServer: { url: 'https://example.com' },
        securitySchemes: [],
        operation: { 'x-codeSamples': [{ lang: 'python', source: 'client.planets.list()' }] },
      },
    })

    expect(wrapper.text()).toContain('client.planets.list()')
    expect(loadPlugin).not.toHaveBeenCalled()
  })

  it('shows a status line with Retry after a failed load, instead of an error as code', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => undefined)
    vi.mocked(loadPlugin).mockRejectedValueOnce(new Error('Failed to fetch dynamically imported module'))

    const wrapper = mountCodeExample('kotlin/okhttp')

    expect(wrapper.text()).not.toMatch(ERROR_TEXT)
    await vi.waitFor(() =>
      expect(wrapper.find('[role="status"]').text()).toContain('Could not load this code example.'),
    )
    expect(wrapper.text()).not.toMatch(ERROR_TEXT)
    expect(wrapper.find('code').exists()).toBe(false)

    await wrapper.get('[role="status"] button').trigger('click')

    expect(wrapper.find('[role="status"]').exists()).toBe(false)
    await vi.waitFor(() => expect(wrapper.text()).toContain('OkHttpClient'))
    expect(wrapper.text()).not.toMatch(ERROR_TEXT)
  })

  it('shows the snippet on Retry when another code example loaded the generator meanwhile', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => undefined)
    vi.mocked(loadPlugin).mockRejectedValueOnce(new Error('Failed to fetch dynamically imported module'))

    const wrapper = mountCodeExample('java/okhttp')
    await vi.waitFor(() => expect(wrapper.find('[role="status"]').exists()).toBe(true))

    // Another code example on the page loads the same generator successfully
    await preloadClients(['java/okhttp'])
    vi.mocked(loadPlugin).mockClear()

    await wrapper.get('[role="status"] button').trigger('click')

    expect(wrapper.find('[role="status"]').exists()).toBe(false)
    expect(wrapper.text()).toContain('OkHttpClient')
    expect(loadPlugin).not.toHaveBeenCalled()
  })

  it('retries a failed load when the client is selected again', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => undefined)
    vi.mocked(loadPlugin).mockRejectedValueOnce(new Error('Failed to fetch dynamically imported module'))

    const wrapper = mountCodeExample('java/unirest')
    await vi.waitFor(() => expect(wrapper.find('[role="status"]').exists()).toBe(true))

    await wrapper.setProps({ selectedClient: 'shell/curl' })
    await wrapper.setProps({ selectedClient: 'java/unirest' })

    expect(wrapper.text()).not.toMatch(ERROR_TEXT)
    await vi.waitFor(() => expect(wrapper.text()).toContain('Unirest'))
  })

  it('getSnippet reports a generator that is not loaded yet', () => {
    expect(getLoadedPlugin('swift', 'nsurlsession')).toBeUndefined()

    const [error, result] = getSnippet('swift', 'nsurlsession', {
      method: 'GET',
      url: 'https://example.com',
      headers: [],
      queryString: [],
      cookies: [],
      headersSize: 0,
      bodySize: 0,
      httpVersion: 'HTTP/1.1',
    })

    expect(error?.message).toBe('Code snippet generator is not loaded')
    expect(result).toBeNull()
  })
})
