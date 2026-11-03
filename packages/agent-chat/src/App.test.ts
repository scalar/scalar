import { DOMWrapper, enableAutoUnmount, flushPromises, mount } from '@vue/test-utils'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { ref } from 'vue'

import App from './App.vue'

enableAutoUnmount(afterEach)

beforeEach(() => {
  // JSDOM does not observe layout; Headless UI uses this browser API for dialogs.
  vi.stubGlobal(
    'ResizeObserver',
    class {
      observe = vi.fn()
      unobserve = vi.fn()
      disconnect = vi.fn()
    },
  )
})

const clickConfirmation = async (label: string): Promise<void> => {
  const button = new DOMWrapper(document.body).findAll('button').find((item) => item.text() === label)
  expect(button?.text()).toBe(label)
  await button?.trigger('click')
  await flushPromises()
}

const props = {
  baseUrl: 'https://api.example.com',
  registryUrl: 'https://registry.example.com',
  dashboardUrl: 'https://dashboard.example.com',
  platformProxyUrl: '',
  registryDocuments: [],
  mode: 'preview' as const,
}

afterEach(() => {
  vi.restoreAllMocks()
  vi.useRealTimers()
  vi.unstubAllGlobals()
  localStorage.clear()
})

describe('App', () => {
  it.each(['preview', 'full'] as const)(
    'retries the selected description in %s mode and allows questions as soon as it is ready',
    async (mode) => {
      vi.useFakeTimers()
      localStorage.setItem('scalar/agent-terms-accepted', 'true')
      const previousDocument = JSON.stringify({ namespace: 'previous', slug: 'preview' })
      localStorage.setItem('scalar-tmp-doc', previousDocument)
      const content = JSON.stringify({ openapi: '3.1.0', info: { title: 'Selected', version: '1' }, paths: {} })
      let resolveEmbedding: (response: Response) => void = () => {
        throw new Error('Embedding response is not initialized')
      }
      const embedding = new Promise<Response>((resolve) => {
        resolveEmbedding = resolve
      })
      const uploads: string[] = []
      const chats: unknown[] = []
      const metadata = {
        id: 'selected',
        namespace: 'share',
        slug: 'selected',
        title: 'Selected',
        currentVersion: '1',
        logoUrl: null,
      }
      vi.spyOn(globalThis, 'fetch').mockImplementation((url, options) => {
        const path = String(url)
        const respond = (body: unknown): Promise<Response> => Promise.resolve(new Response(JSON.stringify(body)))
        if (path.includes('/upload/')) {
          uploads.push(String(options?.body))
          return uploads.length === 1
            ? Promise.resolve(new Response('{}', { status: 500 }))
            : respond({ namespace: 'share', slug: 'selected', url: 'https://registry.example.com/share/apis/selected' })
        }
        if (path.includes('/embeddings/')) {
          return embedding
        }
        if (path.includes('/registry/document/share/')) {
          return respond(metadata)
        }
        if (path.includes('/@share/apis/')) {
          return Promise.resolve(new Response(content))
        }
        if (path.endsWith('/chat')) {
          chats.push(JSON.parse(String(options?.body)))
          return Promise.resolve(
            new Response('data: [DONE]\n\n', {
              headers: { 'content-type': 'text/event-stream', 'x-vercel-ai-ui-message-stream': 'v1' },
            }),
          )
        }
        return respond({ results: [] })
      })
      const wrapper = mount(App, {
        props: {
          ...props,
          mode,
          getActiveDocumentJson: () => content,
          getAgentKey: mode === 'full' ? () => 'key' : undefined,
        },
        attachTo: document.body,
      })
      try {
        await flushPromises()
        expect(uploads).toStrictEqual([])
        await clickConfirmation('Upload and continue')
        await wrapper.get('textarea').setValue('Explain this API')
        await wrapper.get('textarea').trigger('keydown', { key: 'Enter' })
        expect(chats).toStrictEqual([])
        const retry = wrapper.findAll('button').find((button) => button.text() === 'Try upload again')
        expect(retry?.text()).toBe('Try upload again')
        await retry?.trigger('click')
        await flushPromises()
        expect(uploads).toStrictEqual([JSON.stringify({ document: content })])
        await clickConfirmation('Upload and continue')
        expect(uploads).toStrictEqual([JSON.stringify({ document: content }), JSON.stringify({ document: content })])
        expect(wrapper.text()).toContain('Processing API description')
        await wrapper.get('textarea').trigger('keydown', { key: 'Enter' })
        expect(chats).toStrictEqual([])

        resolveEmbedding(new Response('null'))
        await flushPromises()
        expect(wrapper.text()).toContain('Your API description has been processed successfully.')
        expect(localStorage.getItem('scalar-tmp-doc')).toBe(
          mode === 'preview' ? JSON.stringify({ namespace: 'share', slug: 'selected' }) : previousDocument,
        )
        // The success message stays visible, but it must not delay the user's question.
        await wrapper.get('textarea').trigger('keydown', { key: 'Enter' })
        await flushPromises()
        expect(chats.length).toBe(1)
      } finally {
        wrapper.unmount()
      }
    },
  )

  it.each([
    ['openapi', 'preview', true],
    ['asyncapi', 'preview', true],
    ['openapi', 'full', false],
    ['asyncapi', 'full', false],
    ['openapi', 'full', true],
    ['asyncapi', 'full', true],
  ] as const)(
    'confirms the current %s description in %s mode with saved terms %s instead of restoring stale context',
    async (format, mode, savedConsent) => {
      if (savedConsent) {
        localStorage.setItem('scalar/agent-terms-accepted', 'true')
      }
      localStorage.setItem('scalar-tmp-doc', JSON.stringify({ namespace: 'old', slug: 'old' }))
      const content = JSON.stringify({ [format]: '3.1.0', info: { title: 'Current', version: '1' } })
      const requests: { url: string; body: unknown }[] = []
      vi.spyOn(globalThis, 'fetch').mockImplementation((url, init) => {
        requests.push({ url: String(url), body: init?.body })
        return Promise.resolve(
          new Response(JSON.stringify({ results: [] }), { status: String(url).includes('/upload/') ? 400 : 200 }),
        )
      })
      const wrapper = mount(App, {
        props: {
          ...props,
          mode,
          getAgentKey: mode === 'full' ? () => 'key' : undefined,
          getActiveDocumentJson: () => content,
        },
        attachTo: document.body,
      })
      await flushPromises()
      expect(requests.filter(({ url }) => url.includes('/upload/'))).toStrictEqual([])
      expect(document.querySelector('[role=dialog]')).not.toBeNull()
      expect(wrapper.find('textarea').exists()).toBe(true)
      expect(document.body.textContent).toContain('Current')
      expect(document.body.textContent).toContain('Anyone with the link can access it.')
      await clickConfirmation('Upload and continue')
      expect(requests.filter(({ url }) => url.includes('/upload/'))).toStrictEqual([
        {
          url: 'https://api.example.com/core/share/upload/apis?source=agent',
          body: JSON.stringify({ document: content }),
        },
      ])
      expect(requests.some(({ url }) => url.includes('/old'))).toBe(false)
      expect(wrapper.text()).toContain('Failed to upload your API description.')
      await wrapper.get('textarea').setValue('Explain this API')
      await wrapper.get('textarea').trigger('keydown', { key: 'Enter' })
      await flushPromises()
      expect(requests.some(({ url }) => url.endsWith('/chat'))).toBe(false)
      wrapper.unmount()
    },
  )

  it('loads key documents in full mode when no selected description is provided', async () => {
    const urls: string[] = []
    vi.spyOn(globalThis, 'fetch').mockImplementation((url) => {
      urls.push(String(url))
      return Promise.resolve(new Response(JSON.stringify({ documents: [], results: [] })))
    })
    const wrapper = mount(App, { props: { ...props, mode: 'full', getAgentKey: () => 'key' } })
    await flushPromises()
    expect(urls).toContain('https://api.example.com/vector/registry/documents')
    expect(urls.some((url) => url.includes('/upload/'))).toBe(false)
    wrapper.unmount()
  })

  it('waits for consent before uploading a selected description in preview mode', async () => {
    const urls: string[] = []
    vi.spyOn(globalThis, 'fetch').mockImplementation((url) => {
      urls.push(String(url))
      return Promise.resolve(new Response(JSON.stringify({ results: [] })))
    })
    const wrapper = mount(App, { props: { ...props, getActiveDocumentJson: () => '{}' } })
    await flushPromises()
    expect(urls.some((url) => url.includes('/upload/'))).toBe(false)
    wrapper.unmount()
  })

  it('does not upload or send a question after upload confirmation is cancelled', async () => {
    localStorage.setItem('scalar/agent-terms-accepted', 'true')
    const urls: string[] = []
    vi.spyOn(globalThis, 'fetch').mockImplementation((url) => {
      urls.push(String(url))
      return Promise.resolve(new Response(JSON.stringify({ results: [] })))
    })
    const wrapper = mount(App, {
      props: { ...props, getActiveDocumentJson: () => '{}' },
      attachTo: document.body,
    })
    await flushPromises()
    await clickConfirmation('Cancel')
    expect(wrapper.find('textarea').exists()).toBe(true)
    await flushPromises()
    expect(urls.some((url) => url.includes('/upload/') || url.endsWith('/chat'))).toBe(false)
    expect(document.querySelector('[role=dialog]')).toBeNull()
    expect(wrapper.find('[role=alert]').exists()).toBe(false)
    await wrapper.get('textarea').setValue('Explain this API')
    await wrapper.get('textarea').trigger('keydown', { key: 'Enter' })
    await flushPromises()
    expect(document.body.textContent).toContain('Upload API description?')
    expect(urls.some((url) => url.includes('/upload/'))).toBe(false)
  })

  it('requires only upload confirmation for a first-time visitor', async () => {
    const requests: string[] = []
    vi.spyOn(globalThis, 'fetch').mockImplementation((url) => {
      requests.push(String(url))
      return Promise.resolve(new Response(JSON.stringify({ results: [] }), { status: 400 }))
    })
    const wrapper = mount(App, {
      props: { ...props, getActiveDocumentJson: () => '{}' },
      attachTo: document.body,
    })
    await flushPromises()
    expect(wrapper.find('textarea').exists()).toBe(true)
    expect(new DOMWrapper(document.body).find('[role=dialog] input[type=checkbox]').exists()).toBe(false)
    expect(localStorage.getItem('scalar/agent-terms-accepted')).toBeNull()
    await clickConfirmation('Upload and continue')
    expect(localStorage.getItem('scalar/agent-terms-accepted')).toBe('true')
    expect(requests.filter((url) => url.includes('/upload/'))).toStrictEqual([
      'https://api.example.com/core/share/upload/apis?source=agent',
    ])
    expect(wrapper.find('textarea').exists()).toBe(true)
  })

  it('does not send a prefilled question before the user submits it', async () => {
    localStorage.setItem('scalar/agent-terms-accepted', 'true')
    const urls: string[] = []
    vi.spyOn(globalThis, 'fetch').mockImplementation((url) => {
      urls.push(String(url))
      return Promise.resolve(new Response(JSON.stringify({ results: [] })))
    })
    const prefilledMessage = ref('')
    const wrapper = mount(App, { props: { ...props, prefilledMessage } })
    await flushPromises()
    prefilledMessage.value = 'Explain this channel'
    await flushPromises()
    expect(wrapper.get('textarea').element.value).toBe('Explain this channel')
    expect(urls.some((url) => url.endsWith('/chat'))).toBe(false)
    wrapper.unmount()
  })
})
