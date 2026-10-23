import { createWorkspaceStore } from '@scalar/workspace-store/client'
import { flushPromises, mount } from '@vue/test-utils'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { ref } from 'vue'

import AgentScalarChatInterface from './AgentScalarChatInterface.vue'

afterEach(() => {
  vi.restoreAllMocks()
  vi.useRealTimers()
  localStorage.clear()
})

describe('AgentScalarChatInterface', () => {
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
  it.each([undefined, 'agent-key'])(
    'uploads each selected description and preserves agent key %s across format switches',
    async (key) => {
      vi.useFakeTimers()
      if (!key) {
        localStorage.setItem('scalar/agent-terms-accepted', 'true')
      }
      const workspaceStore = createWorkspaceStore()
      await workspaceStore.addDocument({
        name: 'http',
        document: { openapi: '3.1.0', info: { title: 'HTTP', version: '1' }, paths: {} },
      })
      await workspaceStore.addDocument({
        name: 'events',
        document: { asyncapi: '3.1.0', info: { title: 'Events', version: '2' }, channels: {} },
      })
      workspaceStore.update('x-scalar-active-document', 'http')
      const uploads: string[] = []
      const requests: string[] = []
      const chats: { registryDocuments: unknown; messages: { parts: unknown }[] }[] = []
      const metadata = (
        slug: string,
      ): {
        id: string
        namespace: string
        slug: string
        title: string
        currentVersion: string
        logoUrl: null
      } => ({
        id: slug,
        namespace: 'share',
        slug,
        title: slug === 'http' ? 'HTTP' : 'Events',
        currentVersion: '0.1.0',
        logoUrl: null,
      })
      const documents = new Map<string, string>()
      vi.spyOn(globalThis, 'fetch').mockImplementation((url, options) => {
        const path = String(url)
        requests.push(path)
        const respond = (body: unknown): Promise<Response> => Promise.resolve(new Response(JSON.stringify(body)))
        if (path.includes('/upload/')) {
          const { document } = JSON.parse(String(options?.body)) as { document: string }
          uploads.push(document)
          const slug = workspaceStore.workspace['x-scalar-active-document'] ?? ''
          documents.set(slug, document)
          return respond({ namespace: 'share', slug, url: `https://registry.example.com/share/apis/${slug}` })
        }
        if (path.includes('/embeddings/')) {
          return respond(null)
        }
        if (path.includes('/registry/document/share/')) {
          return respond(metadata(path.split('/').at(-1) ?? ''))
        }
        if (path.includes('/@share/apis/')) {
          return Promise.resolve(new Response(documents.get(path.split('/').at(-2) ?? '')))
        }
        if (path.endsWith('/vector/openapi/chat')) {
          expect(new Headers(options?.headers).get('x-scalar-agent-key')).toBe(key ?? null)
          chats.push(JSON.parse(String(options?.body)))
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
          agentScalarConfiguration: key ? { key } : undefined,
          externalUrls: {
            apiBaseUrl: 'https://api.example.com',
            registryUrl: 'https://registry.example.com',
            dashboardUrl: 'https://dashboard.example.com',
            proxyUrl: '',
          },
        },
      })
      try {
        for (const name of ['http', 'events', 'http']) {
          workspaceStore.update('x-scalar-active-document', name)
          await flushPromises()
          await wrapper.get('textarea').setValue('Do not send while uploading')
          await wrapper.get('textarea').trigger('keydown', { key: 'Enter' })
          expect(chats.length).toBe(uploads.length - 1)
          await vi.advanceTimersByTimeAsync(5_000)
          await wrapper.get('textarea').setValue('Explain this API')
          await wrapper.get('textarea').trigger('keydown', { key: 'Enter' })
          await flushPromises()
          expect(uploads.at(-1)).toBe(workspaceStore.exportActiveDocument('json'))
        }
        expect(uploads.length).toBe(3)
        expect(chats.map(({ registryDocuments }) => registryDocuments)).toStrictEqual([
          [{ ...metadata('http'), removable: false }],
          [{ ...metadata('events'), removable: false }],
          [{ ...metadata('http'), removable: false }],
        ])
        expect(chats.map(({ messages }) => messages.map(({ parts }) => parts))).toStrictEqual([
          [
            [
              {
                type: 'text',
                text: 'Explain this API\n\nSelected API description: HTTP (OpenAPI, version 1, source http)',
              },
            ],
          ],
          [
            [
              {
                type: 'text',
                text: 'Explain this API\n\nSelected API description: Events (AsyncAPI, version 2, source events)',
              },
            ],
          ],
          [
            [
              {
                type: 'text',
                text: 'Explain this API\n\nSelected API description: HTTP (OpenAPI, version 1, source http)',
              },
            ],
          ],
        ])
        expect(requests).not.toContain('https://api.example.com/vector/registry/documents')
      } finally {
        wrapper.unmount()
      }
    },
  )
})
