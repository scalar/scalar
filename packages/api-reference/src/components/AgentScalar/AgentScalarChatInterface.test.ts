import { createWorkspaceStore } from '@scalar/workspace-store/client'
import { flushPromises, mount } from '@vue/test-utils'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { ref } from 'vue'

import AgentScalarChatInterface from './AgentScalarChatInterface.vue'

afterEach(() => vi.restoreAllMocks())

describe('AgentScalarChatInterface', () => {
  it('does not mount chat for a plugin document with misleading built-in fields', async () => {
    const workspaceStore = createWorkspaceStore({
      documentTypes: [{ type: 'custom', detect: (document) => document.format === 'custom', traverse: () => [] }],
    })
    await workspaceStore.addDocument({
      name: 'plugin',
      document: {
        format: 'custom',
        openapi: '3.1.0',
        asyncapi: '3.1.0',
        info: { title: 'Plugin', version: '1' },
        paths: {},
      },
    })
    const wrapper = mount(AgentScalarChatInterface, {
      props: {
        workspaceStore,
        agentScalarConfiguration: { key: 'test-key' },
        externalUrls: {
          apiBaseUrl: 'https://api.example.com',
          registryUrl: 'https://registry.example.com',
          dashboardUrl: 'https://dashboard.example.com',
          proxyUrl: '',
        },
      },
    })
    await flushPromises()
    expect(wrapper.find('textarea').exists()).toBe(false)
    wrapper.unmount()
  })

  it('clears the previous source question when switching from OpenAPI to AsyncAPI', async () => {
    vi.spyOn(globalThis, 'fetch').mockImplementation(() =>
      Promise.resolve(new Response(JSON.stringify({ documents: [], results: [] }))),
    )
    const workspaceStore = createWorkspaceStore()
    await workspaceStore.addDocument({
      name: 'http',
      document: { openapi: '3.1.0', info: { title: 'HTTP', version: '1' }, paths: {} },
    })
    await workspaceStore.addDocument({
      name: 'events',
      document: { asyncapi: '3.1.0', info: { title: 'Events', version: '1' }, channels: {} },
    })
    workspaceStore.update('x-scalar-active-document', 'http')
    const prefilledMessage = ref('Explain GET /orders')
    const wrapper = mount(AgentScalarChatInterface, {
      props: {
        workspaceStore,
        prefilledMessage,
        agentScalarConfiguration: { key: 'test-key' },
        externalUrls: {
          apiBaseUrl: 'https://api.example.com',
          registryUrl: 'https://registry.example.com',
          dashboardUrl: 'https://dashboard.example.com',
          proxyUrl: '',
        },
      },
    })
    await flushPromises()
    expect(wrapper.get('textarea').element.value).toBe('Explain GET /orders')
    workspaceStore.update('x-scalar-active-document', 'events')
    await flushPromises()
    expect(wrapper.get('textarea').element.value).toBe('')
    prefilledMessage.value = 'Explain channel orders'
    await flushPromises()
    expect(wrapper.get('textarea').element.value).toBe('Explain channel orders')
    wrapper.unmount()
  })
  it('sends selection metadata without context messages when both formats share an agent key', async () => {
    const sentSelections: unknown[] = []
    const sentTexts: string[][] = []
    vi.spyOn(globalThis, 'fetch').mockImplementation((url, options) => {
      if (String(url).endsWith('/vector/openapi/chat')) {
        const body = JSON.parse(String(options?.body))
        sentSelections.push(body.selectedDocument)
        sentTexts.push(
          body.messages.flatMap((message: { parts: { type: string; text?: string }[] }) =>
            message.parts.filter((part) => part.type === 'text').map((part) => part.text),
          ),
        )
        return Promise.resolve(
          new Response('data: [DONE]\n\n', {
            headers: { 'content-type': 'text/event-stream', 'x-vercel-ai-ui-message-stream': 'v1' },
          }),
        )
      }
      return Promise.resolve(new Response(JSON.stringify({ documents: [], results: [] })))
    })
    const workspaceStore = createWorkspaceStore()
    await workspaceStore.addDocument({
      name: 'http',
      document: { openapi: '3.1.0', info: { title: 'HTTP', version: '1' }, paths: {} },
    })
    await workspaceStore.addDocument({
      name: 'events',
      document: { asyncapi: '3.1.0', info: { title: 'Events', version: '1' }, channels: {} },
    })
    workspaceStore.update('x-scalar-active-document', 'http')
    const wrapper = mount(AgentScalarChatInterface, {
      props: {
        workspaceStore,
        agentScalarConfiguration: { key: 'shared-key' },
        externalUrls: {
          apiBaseUrl: 'https://api.example.com',
          registryUrl: 'https://registry.example.com',
          dashboardUrl: 'https://dashboard.example.com',
          proxyUrl: '',
        },
      },
    })
    await flushPromises()
    await wrapper.get('textarea').setValue('Explain this API')
    await wrapper.get('textarea').trigger('keydown', { key: 'Enter' })
    await flushPromises()
    workspaceStore.update('x-scalar-active-document', 'events')
    await flushPromises()
    await wrapper.get('textarea').setValue('Explain this API')
    await wrapper.get('textarea').trigger('keydown', { key: 'Enter' })
    await flushPromises()
    expect(wrapper.text()).not.toContain('Selected API description:')
    expect(wrapper.text()).toContain('Explain this API')
    expect(sentSelections).toStrictEqual([
      { source: 'http', title: 'HTTP', format: 'OpenAPI', version: '1' },
      { source: 'events', title: 'Events', format: 'AsyncAPI', version: '1' },
    ])
    expect(sentTexts).toStrictEqual([['Explain this API'], ['Explain this API']])
    wrapper.unmount()
  })
  it('sends structured selection for the uploaded preview document across source switches', async () => {
    vi.useFakeTimers()
    localStorage.setItem('scalar/agent-terms-accepted', 'true')
    const workspaceStore = createWorkspaceStore()
    await workspaceStore.addDocument({
      name: 'local-http',
      document: { openapi: '3.1.0', info: { title: 'HTTP', version: '1' }, paths: {} },
    })
    await workspaceStore.addDocument({
      name: 'local-events',
      document: { asyncapi: '3.1.0', info: { title: 'Events', version: '2' }, channels: {} },
    })
    workspaceStore.update('x-scalar-active-document', 'local-http')
    const uploads: string[] = []
    const documents = new Map<string, string>()
    const requests: {
      selectedDocument: unknown
      registryDocuments: { namespace: string; slug: string }[]
      messages: { parts: unknown[] }[]
    }[] = []
    vi.spyOn(globalThis, 'fetch').mockImplementation((url, options) => {
      const path = String(url)
      const respond = (body: unknown): Promise<Response> => Promise.resolve(new Response(JSON.stringify(body)))
      if (path.includes('/upload/')) {
        const { document } = JSON.parse(String(options?.body)) as { document: string }
        uploads.push(document)
        const slug = `uploaded-${uploads.length}`
        documents.set(slug, document)
        return respond({ namespace: 'share', slug, url: `https://registry.example.com/share/apis/${slug}` })
      }
      if (path.includes('/embeddings/')) {
        return respond(null)
      }
      if (path.includes('/registry/document/share/')) {
        const slug = path.split('/').at(-1) ?? ''
        return respond({ id: slug, namespace: 'share', slug, title: 'Uploaded', currentVersion: '1', logoUrl: null })
      }
      if (path.includes('/@share/apis/')) {
        return Promise.resolve(new Response(documents.get(path.split('/').at(-2) ?? '')))
      }
      if (path.endsWith('/vector/openapi/chat')) {
        expect(new Headers(options?.headers).get('x-scalar-agent-key')).toBe(null)
        requests.push(JSON.parse(String(options?.body)))
        return Promise.resolve(
          new Response('data: [DONE]\n\n', {
            headers: { 'content-type': 'text/event-stream', 'x-vercel-ai-ui-message-stream': 'v1' },
          }),
        )
      }
      return respond({ results: [] })
    })
    const wrapper = mount(AgentScalarChatInterface, {
      props: {
        workspaceStore,
        externalUrls: {
          apiBaseUrl: 'https://api.example.com',
          registryUrl: 'https://registry.example.com',
          dashboardUrl: 'https://dashboard.example.com',
          proxyUrl: '',
        },
      },
    })
    try {
      for (const source of ['local-http', 'local-events']) {
        workspaceStore.update('x-scalar-active-document', source)
        await flushPromises()
        await vi.advanceTimersByTimeAsync(5_000)
        await flushPromises()
        await wrapper.get('textarea').setValue('Explain this API')
        await wrapper.get('textarea').trigger('keydown', { key: 'Enter' })
        await flushPromises()
        expect(uploads.at(-1)).toBe(workspaceStore.exportActiveDocument('json'))
        expect(wrapper.text()).not.toContain('Selected API description:')
      }
      expect(requests.map(({ selectedDocument }) => selectedDocument)).toStrictEqual([
        { source: 'local-http', title: 'HTTP', format: 'OpenAPI', version: '1' },
        { source: 'local-events', title: 'Events', format: 'AsyncAPI', version: '2' },
      ])
      expect(
        requests.map(({ registryDocuments }) => registryDocuments.map(({ namespace, slug }) => ({ namespace, slug }))),
      ).toStrictEqual([[{ namespace: 'share', slug: 'uploaded-1' }], [{ namespace: 'share', slug: 'uploaded-2' }]])
      expect(requests.map(({ messages }) => messages.map(({ parts }) => parts))).toStrictEqual([
        [[{ type: 'text', text: 'Explain this API' }]],
        [[{ type: 'text', text: 'Explain this API' }]],
      ])
    } finally {
      wrapper.unmount()
      localStorage.clear()
      vi.clearAllTimers()
      vi.useRealTimers()
    }
  })
})
