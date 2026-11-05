import { createWorkspaceStore } from '@scalar/workspace-store/client'
import { flushPromises, mount } from '@vue/test-utils'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { ref } from 'vue'

import AgentScalarChatInterface from './AgentScalarChatInterface.vue'

afterEach(() => vi.restoreAllMocks())

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
  it('sends the selected source context when both formats share an agent key', async () => {
    const sentTexts: string[][] = []
    vi.spyOn(globalThis, 'fetch').mockImplementation((url, options) => {
      if (String(url).endsWith('/vector/openapi/chat')) {
        const body = JSON.parse(String(options?.body))
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
    expect(sentTexts).toStrictEqual([
      ['Explain this API\n\nSelected API description: HTTP (OpenAPI, version 1, source http)'],
      ['Explain this API\n\nSelected API description: Events (AsyncAPI, version 1, source events)'],
    ])
    wrapper.unmount()
  })
})
