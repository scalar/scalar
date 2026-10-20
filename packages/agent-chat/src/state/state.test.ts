import { flushPromises, mount } from '@vue/test-utils'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { defineComponent, h } from 'vue'

import { createState } from './state'

afterEach(() => vi.restoreAllMocks())

describe('state', () => {
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
