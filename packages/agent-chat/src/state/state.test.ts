import { flushPromises, mount } from '@vue/test-utils'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { defineComponent, h } from 'vue'

import { createState } from './state'

afterEach(() => vi.restoreAllMocks())

describe('state', () => {
  it.each([undefined, 'Scalar Galaxy (OpenAPI, version 0.7.2, source scalar-galaxy)'])(
    'keeps context %s separate from visible messages across follow-ups',
    async (context) => {
      const requests: { messages: { role: string; parts: unknown[] }[]; registryDocuments: unknown[] }[] = []
      vi.spyOn(globalThis, 'fetch').mockImplementation((_url, options) => {
        requests.push(JSON.parse(String(options?.body)))
        return Promise.resolve(
          new Response('data: [DONE]\n\n', {
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
              getActiveDocumentContext: context ? () => context : undefined,
            })
            return () => h('div')
          },
        }),
      )
      const state = stateHolder.current!
      try {
        await state.chat.sendMessage({ text: 'create planet curl example' })
        await state.chat.sendMessage({ text: 'Explain the response' })
        const userMessages = ['create planet curl example', 'Explain the response'].map((text) => ({
          role: 'user',
          parts: [{ type: 'text', text }],
        }))
        expect(state.chat.messages.map(({ role, parts }) => ({ role, parts }))).toStrictEqual(userMessages)
        const contextMessages = context
          ? [{ role: 'user', parts: [{ type: 'text', text: `Selected API description: ${context}` }] }]
          : []
        expect(requests.map(({ messages }) => messages.map(({ role, parts }) => ({ role, parts })))).toStrictEqual([
          [...contextMessages, userMessages[0]],
          [...contextMessages, ...userMessages],
        ])
        expect(requests.map(({ registryDocuments }) => registryDocuments)).toStrictEqual([[], []])
      } finally {
        await state.chat.stop()
        wrapper.unmount()
      }
    },
  )

  it.each(['get', 'post', 'authentication'])(
    'completes unsupported AsyncAPI %s tools without making a request',
    async (action) => {
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
      const requests: string[] = []
      vi.spyOn(globalThis, 'fetch').mockImplementation((url) => {
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
            })
            return () => h('div')
          },
        }),
      )
      const state = stateHolder.current!
      await state.workspaceStore.addDocument({
        name: 'events',
        document: { asyncapi: '3.1.0', info: { title: 'Events', version: '1' }, channels: {} },
      })
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
            'Live AsyncAPI messaging and authentication are not supported in Ask AI. Ask for an explanation or code example instead.',
        },
      ])
      expect(requests).toStrictEqual([
        'https://api.example.com/vector/openapi/chat',
        'https://api.example.com/vector/openapi/chat',
      ])
      await state.chat.stop()
      wrapper.unmount()
    },
  )
})
