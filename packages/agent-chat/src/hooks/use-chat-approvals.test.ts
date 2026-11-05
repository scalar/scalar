import { mount } from '@vue/test-utils'
import { type UIMessageChunk, createUIMessageStreamResponse } from 'ai'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { defineComponent, h, provide } from 'vue'

import { STATE_SYMBOL, createState } from '@/state/state'

import { requestPartRequiresApproval, useRequestApprovals } from './use-chat-approvals'

const input = {
  method: 'GET',
  path: '/private-data',
  documentName: 'test/private',
  documentIdentifier: 'test/private',
}

const streamResponse = (chunks: UIMessageChunk[]): Response =>
  createUIMessageStreamResponse({
    stream: new ReadableStream({
      start(controller) {
        chunks.forEach((chunk) => controller.enqueue(chunk))
        controller.close()
      },
    }),
  })

const mountChat = (): {
  state: ReturnType<typeof createState>
  approvals: ReturnType<typeof useRequestApprovals>
  unmount: () => void
} => {
  let state: ReturnType<typeof createState>
  let approvals: ReturnType<typeof useRequestApprovals>
  const Consumer = defineComponent({
    setup() {
      approvals = useRequestApprovals()
      return () => null
    },
  })
  const wrapper = mount(
    defineComponent({
      setup() {
        state = createState({
          initialRegistryDocuments: [],
          registryUrl: 'https://registry.example.com',
          dashboardUrl: 'https://dashboard.example.com',
          platformProxyUrl: 'https://proxy.example.com',
          baseUrl: 'https://chat.example.com',
          mode: 'full',
        })
        provide(STATE_SYMBOL, state)
        return () => h(Consumer)
      },
    }),
  )
  return { state: state!, approvals: approvals!, unmount: () => wrapper.unmount() }
}

const prepareChat = async (
  credentialed = true,
): Promise<
  ReturnType<typeof mountChat> & {
    requests: { url: string; authorization: string | null }[]
    getChatRequests: () => number
  }
> => {
  const requests: { url: string; authorization: string | null }[] = []
  let chatRequests = 0
  vi.spyOn(globalThis, 'fetch').mockImplementation((url, init) => {
    if (String(url) === 'https://chat.example.com/vector/openapi/chat') {
      chatRequests++
      if (chatRequests > 3) {
        return Promise.reject(new Error('Unexpected chat continuation'))
      }
      return Promise.resolve(
        streamResponse(
          chatRequests === 1
            ? [
                { type: 'start', messageId: 'assistant-1' },
                { type: 'start-step' },
                { type: 'tool-input-available', toolCallId: 'request-1', toolName: 'execute-request', input },
                { type: 'finish-step' },
                { type: 'finish' },
              ]
            : [
                { type: 'start', messageId: 'assistant-2' },
                { type: 'start-step' },
                { type: 'text-start', id: 'text-1' },
                { type: 'text-delta', id: 'text-1', delta: 'Done' },
                { type: 'text-end', id: 'text-1' },
                { type: 'finish-step' },
                { type: 'finish' },
              ],
        ),
      )
    }
    requests.push({ url: String(url), authorization: new Headers(init?.headers).get('Authorization') })
    return Promise.resolve(Response.json({ privateData: 'sensitive-value' }))
  })
  const chat = mountChat()
  await chat.state.workspaceStore.addDocument({
    name: input.documentName,
    document: {
      openapi: '3.1.0',
      info: { title: 'Private API', version: '1.0.0' },
      servers: [{ url: 'https://private.example.com' }],
      paths: {},
      components: { securitySchemes: { bearer: { type: 'http', scheme: 'bearer' } } },
      security: [{ bearer: [] }],
    },
  })
  chat.state.registryDocuments.value.push({
    id: 'private-api',
    namespace: 'test',
    slug: 'private',
    title: 'Private API',
    currentVersion: '1.0.0',
    logoUrl: null,
  })
  if (credentialed) {
    chat.state.workspaceStore.auth.setAuthSecrets(input.documentName, 'bearer', {
      type: 'http',
      'x-scalar-secret-token': 'stored-secret',
    })
  }
  return { ...chat, requests, getChatRequests: () => chatRequests }
}

describe('use-chat-approvals', () => {
  afterEach(() => {
    vi.restoreAllMocks()
    localStorage.clear()
  })

  it.each(['GET', 'get', 'POST', 'DELETE', 'HEAD'])('requires approval for %s requests', (method) => {
    expect(
      requestPartRequiresApproval({
        type: 'tool-execute-request',
        toolCallId: 'request-1',
        state: 'input-available',
        input: { ...input, method },
      }),
    ).toBe(true)
  })

  it('does not require approval for incomplete or completed requests', () => {
    expect(
      requestPartRequiresApproval({
        type: 'tool-execute-request',
        toolCallId: 'request-1',
        state: 'input-streaming',
        input: { method: 'GET' },
      }),
    ).toBe(false)
    expect(
      requestPartRequiresApproval({
        type: 'tool-execute-request',
        toolCallId: 'request-1',
        state: 'output-error',
        input,
        errorText: 'Denied',
      }),
    ).toBe(false)
    expect(requestPartRequiresApproval({ type: 'text', text: 'Hello' })).toBe(false)
  })

  it('waits for approval before sending a GET with stored credentials', async () => {
    const { state, approvals, requests, getChatRequests, unmount } = await prepareChat()
    try {
      await state.chat.sendMessage({ text: 'Read the private API' })
      expect(state.chat.error).toBeUndefined()
      expect(requests).toStrictEqual([])
      expect(getChatRequests()).toBe(1)
      expect(approvals.approvalRequiredParts.value.map((part) => part.toolCallId)).toStrictEqual(['request-1'])

      await approvals.respondToRequestApprovals(true)
      expect(requests).toStrictEqual([
        {
          url: 'https://proxy.scalar.com/?scalar_url=https%3A%2F%2Fprivate.example.com%2Fprivate-data',
          authorization: 'Bearer stored-secret',
        },
      ])
      await vi.waitFor(() => expect(getChatRequests()).toBe(2))
      expect(approvals.approvalRequiredParts.value).toStrictEqual([])
    } finally {
      unmount()
    }
  })

  it('also waits for approval for a GET without stored credentials', async () => {
    const { state, approvals, requests, getChatRequests, unmount } = await prepareChat(false)
    try {
      await state.chat.sendMessage({ text: 'Read the API' })
      expect(requests).toStrictEqual([])
      expect(getChatRequests()).toBe(1)
      expect(approvals.approvalRequiredParts.value.map((part) => part.toolCallId)).toStrictEqual(['request-1'])
    } finally {
      unmount()
    }
  })

  it('never sends a denied GET request', async () => {
    const { state, approvals, requests, getChatRequests, unmount } = await prepareChat()
    try {
      await state.chat.sendMessage({ text: 'Read the private API' })
      await approvals.respondToRequestApprovals(false)
      expect(requests).toStrictEqual([])
      await vi.waitFor(() => expect(getChatRequests()).toBe(2))
      expect(approvals.approvalRequiredParts.value).toStrictEqual([])
      const deniedRequest = state.chat.messages
        .flatMap((message) => message.parts)
        .find((part) => part.type === 'tool-execute-request')
      expect(deniedRequest?.state).toBe('output-error')
      expect(deniedRequest?.errorText).toBe('The user denied the request.')
    } finally {
      unmount()
    }
  })
})
