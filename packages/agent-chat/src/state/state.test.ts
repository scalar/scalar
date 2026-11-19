import { createWorkspaceStore } from '@scalar/workspace-store/client'
import { flushPromises, mount } from '@vue/test-utils'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { defineComponent, h } from 'vue'

import type { SelectedDocument } from '@/types'

import { createState } from './state'

afterEach(() => vi.restoreAllMocks())

describe('state', () => {
  it.each([false, true])(
    'sends selection metadata %s without changing messages across follow-ups and regeneration',
    async (withSelection) => {
      const selectedDocument: SelectedDocument = { source: 'orders', title: 'Orders', format: 'OpenAPI', version: '1' }
      const selection = { current: selectedDocument }
      const requests: {
        messages: { role: string; parts: unknown[] }[]
        registryDocuments: unknown[]
        selectedDocument?: SelectedDocument
      }[] = []
      const headers: (string | null)[] = []
      vi.spyOn(globalThis, 'fetch').mockImplementation((_url, options) => {
        requests.push(JSON.parse(String(options?.body)))
        headers.push(new Headers(options?.headers).get('x-scalar-agent-key'))
        return Promise.resolve(
          new Response('data: [DONE]\n\n', {
            headers: { 'content-type': 'text/event-stream', 'x-vercel-ai-ui-message-stream': 'v1' },
          }),
        )
      })
      const holder: { state?: ReturnType<typeof createState> } = {}
      const wrapper = mount(
        defineComponent({
          setup() {
            holder.state = createState({
              initialRegistryDocuments: [],
              registryUrl: '',
              dashboardUrl: '',
              platformProxyUrl: '',
              baseUrl: 'https://api.example.com',
              mode: 'full',
              getAgentKey: () => 'agent-key',
              getActiveDocumentSelection: withSelection ? () => selection.current : undefined,
            })
            return () => h('div')
          },
        }),
      )
      const state = holder.state!
      const registryDocument = {
        id: 'orders',
        namespace: 'acme',
        slug: 'orders',
        title: 'Orders',
        currentVersion: '1',
        logoUrl: null,
        removable: false,
      }
      state.registryDocuments.value = [registryDocument]
      try {
        await state.chat.sendMessage({ text: 'Explain this API' })
        selection.current = { ...selectedDocument, version: '2' }
        await state.chat.sendMessage({ text: 'Explain the response' })
        await state.chat.regenerate()
        const userMessages = ['Explain this API', 'Explain the response'].map((text) => ({
          role: 'user',
          parts: [{ type: 'text', text }],
        }))
        expect(state.chat.messages.map(({ role, parts }) => ({ role, parts }))).toStrictEqual(userMessages)
        expect(requests.map(({ messages }) => messages.map(({ role, parts }) => ({ role, parts })))).toStrictEqual([
          [userMessages[0]],
          userMessages,
          userMessages,
        ])
        expect(requests.map(({ selectedDocument: selection }) => selection)).toStrictEqual(
          withSelection
            ? [selectedDocument, { ...selectedDocument, version: '2' }, { ...selectedDocument, version: '2' }]
            : [undefined, undefined, undefined],
        )
        expect(requests.map(({ registryDocuments }) => registryDocuments)).toStrictEqual([
          [registryDocument],
          [registryDocument],
          [registryDocument],
        ])
        expect(headers).toStrictEqual(['agent-key', 'agent-key', 'agent-key'])
      } finally {
        await state.chat.stop()
        wrapper.unmount()
      }
    },
  )

  it.each(
    ['asyncapi', 'plugin', 'missing'].flatMap((format) =>
      ['get', 'post', 'authentication'].map((action) => ({ format, action })),
    ),
  )('completes unsupported $format $action tools without making a request', async ({ format, action }) => {
    const toolName = action === 'authentication' ? 'ask-for-authentication' : 'execute-request'
    const input =
      action === 'authentication'
        ? { documentName: 'events', uniqueIdentifier: 'events' }
        : { documentName: 'events', documentIdentifier: 'events', method: action, path: '/orders' }
    const responses = [
      [
        { type: 'start', messageId: 'answer' },
        { type: 'start-step' },
        { type: 'tool-input-available', toolCallId: 'tool-1', toolName, input },
        { type: 'finish', finishReason: 'tool-calls' },
      ],
      [
        { type: 'start', messageId: 'done' },
        { type: 'start-step' },
        { type: 'text-start', id: 'text-1' },
        { type: 'text-delta', id: 'text-1', delta: 'I can explain the API.' },
        { type: 'text-end', id: 'text-1' },
        { type: 'finish', finishReason: 'stop' },
      ],
    ]
    const selectedDocument: SelectedDocument = { source: 'events', title: 'Events', format: 'AsyncAPI', version: '1' }
    const selections: unknown[] = []
    const requests: string[] = []
    vi.spyOn(globalThis, 'fetch').mockImplementation((url, options) => {
      selections.push(JSON.parse(String(options?.body)).selectedDocument)
      requests.push(String(url))
      const events = responses.shift()
      if (!events) {
        return Promise.reject(new Error('Unexpected extra chat request'))
      }
      return Promise.resolve(
        new Response(events.map((event) => `data: ${JSON.stringify(event)}\n\n`).join('') + 'data: [DONE]\n\n', {
          headers: { 'content-type': 'text/event-stream', 'x-vercel-ai-ui-message-stream': 'v1' },
        }),
      )
    })
    const stateHolder: { current?: ReturnType<typeof createState> } = {}
    const wrapper = mount(
      defineComponent({
        setup() {
          stateHolder.current = createState({
            initialRegistryDocuments: [],
            registryUrl: '',
            dashboardUrl: '',
            platformProxyUrl: '',
            baseUrl: 'https://api.example.com',
            mode: 'full',
            getActiveDocumentSelection: () => selectedDocument,
          })
          return () => h('div')
        },
      }),
    )
    const state = stateHolder.current!
    const sourceStore = createWorkspaceStore({
      documentTypes: [{ type: 'custom', detect: (document) => document.format === 'custom', traverse: () => [] }],
    })
    if (format !== 'missing') {
      await sourceStore.addDocument({
        name: 'events',
        document:
          format === 'plugin'
            ? {
                format: 'custom',
                openapi: '3.1.0',
                asyncapi: '3.1.0',
                info: { title: 'Plugin', version: '1' },
                paths: {},
              }
            : { asyncapi: '3.1.0', info: { title: 'Events', version: '1' }, channels: {} },
      })
    }
    state.workspaceStore.loadWorkspace(sourceStore.exportWorkspace())
    await state.chat.sendMessage({ text: 'Use this API' })
    await flushPromises()
    const outputs = state.chat.messages
      .flatMap((message) => message.parts)
      .filter((part) => part.type === `tool-${toolName}`)
      .map((part) => ({
        state: 'state' in part ? part.state : undefined,
        errorText: 'errorText' in part ? part.errorText : undefined,
      }))
    expect(outputs).toStrictEqual([
      {
        state: 'output-error',
        errorText:
          format === 'asyncapi'
            ? 'Live AsyncAPI messaging and authentication are not supported in Ask AI. Ask for an explanation or code example instead.'
            : 'Requests and authentication require an OpenAPI document. This document format is not supported in Ask AI.',
      },
    ])
    expect(requests).toStrictEqual([
      'https://api.example.com/vector/openapi/chat',
      'https://api.example.com/vector/openapi/chat',
    ])
    expect(selections).toStrictEqual([selectedDocument, selectedDocument])
    await state.chat.stop()
    wrapper.unmount()
  })
})
