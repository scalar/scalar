import { type ToolPartLike, openApiApprovalPolicies, toolCardStatus } from '@scalar/chat-protocol'
import { describe, expect, it, vi } from 'vitest'
import { reactive } from 'vue'

import { type ApprovalChat, createApprovalStore } from './create-approval-store'

type MutableChat = ApprovalChat & {
  messages: {
    id: string
    role: string
    parts: ToolPartLike[]
  }[]
}

const createFakeChat = (parts: ToolPartLike[]): MutableChat => {
  const chat = reactive({
    messages: [{ id: 'msg-1', role: 'assistant', parts }],
    status: 'ready',
    addToolOutput: vi.fn((options: { toolCallId: string; state?: string; errorText?: string; output?: unknown }) => {
      const part = chat.messages[0]?.parts.find((candidate) => candidate.toolCallId === options.toolCallId)

      if (part) {
        part.state = (options.state ?? 'output-available') as ToolPartLike['state']
        part.errorText = options.errorText
        part.output = options.output
      }
    }),
    addToolApprovalResponse: vi.fn(),
  }) as unknown as MutableChat

  return chat
}

const requestPart = (toolCallId: string, method: string): ToolPartLike => ({
  type: 'tool-execute-request',
  toolCallId,
  state: 'input-available',
  input: { method, path: '/planets' },
})

describe('create-approval-store', () => {
  it('holds mutating calls and lets reads through', () => {
    const chat = createFakeChat([requestPart('call-1', 'GET'), requestPart('call-2', 'POST')])
    const store = createApprovalStore({
      chat,
      registry: openApiApprovalPolicies,
      executors: { 'execute-request': vi.fn(async () => {}) },
    })

    expect(store.pending.value.map((approval) => approval.toolCallId)).toEqual(['call-2'])
  })

  it('ignores tools without a client executor — not this client’s decision', () => {
    const chat = createFakeChat([requestPart('call-1', 'POST')])
    const store = createApprovalStore({ chat, registry: openApiApprovalPolicies })

    expect(store.pending.value).toEqual([])
  })

  it('runs the executor on approve and keeps the pending count honest while it runs', async () => {
    const chat = createFakeChat([requestPart('call-1', 'POST')])

    let resolveExecutor: () => void = () => {}
    const executor = vi.fn(
      (part: ToolPartLike) =>
        new Promise<void>((resolve) => {
          resolveExecutor = () => {
            chat.addToolOutput({ tool: 'execute-request', toolCallId: part.toolCallId, output: { success: true } })
            resolve()
          }
        }),
    )

    const store = createApprovalStore({
      chat,
      registry: openApiApprovalPolicies,
      executors: { 'execute-request': executor },
    })

    const approvePromise = store.approve('call-1')

    // While the executor runs the part is still input-available, but it must
    // not count as pending (the F10 phantom-count fix) — and the status
    // machine reports it as applying.
    expect(store.pending.value).toEqual([])
    expect(store.isApplying('call-1')).toBe(true)
    expect(
      toolCardStatus(chat.messages[0]?.parts[0] as ToolPartLike, {
        awaitingApproval: false,
        applying: store.isApplying('call-1'),
      }),
    ).toBe('applying')

    resolveExecutor()
    await approvePromise

    expect(store.isApplying('call-1')).toBe(false)
    expect(executor).toHaveBeenCalledTimes(1)
    expect(store.pending.value).toEqual([])
  })

  it('rejects with the legacy encoding the servers understand', async () => {
    const chat = createFakeChat([requestPart('call-1', 'DELETE')])
    const store = createApprovalStore({
      chat,
      registry: openApiApprovalPolicies,
      executors: { 'execute-request': vi.fn(async () => {}) },
    })

    await store.reject('call-1')

    expect(chat.addToolOutput).toHaveBeenCalledWith({
      tool: 'execute-request',
      toolCallId: 'call-1',
      state: 'output-error',
      errorText: 'The user denied the request.',
    })
    expect(toolCardStatus(chat.messages[0]?.parts[0] as ToolPartLike)).toBe('rejected')
  })

  it('answers native approval requests through addToolApprovalResponse', async () => {
    const nativePart: ToolPartLike = {
      type: 'tool-write_file',
      toolCallId: 'call-9',
      state: 'approval-requested',
      input: { path: 'a.md', content: '' },
      approval: { id: 'appr-9' },
    }
    const chat = createFakeChat([nativePart])
    const store = createApprovalStore({ chat, registry: {} })

    expect(store.pending.value[0]?.native).toBe(true)

    await store.approve('call-9')
    expect(chat.addToolApprovalResponse).toHaveBeenCalledWith({ id: 'appr-9', approved: true })

    await store.reject('call-9', 'Keep the existing intro.')
    expect(chat.addToolApprovalResponse).toHaveBeenCalledWith({
      id: 'appr-9',
      approved: false,
      reason: 'Keep the existing intro.',
    })
  })

  it('approves in strict emission order', async () => {
    const chat = createFakeChat([requestPart('call-1', 'POST'), requestPart('call-2', 'POST')])
    const order: string[] = []
    const store = createApprovalStore({
      chat,
      registry: openApiApprovalPolicies,
      executors: {
        'execute-request': (part) => {
          order.push(part.toolCallId)
          chat.addToolOutput({ tool: 'execute-request', toolCallId: part.toolCallId, output: { success: true } })
          return Promise.resolve()
        },
      },
    })

    await store.approveAll()

    expect(order).toEqual(['call-1', 'call-2'])
    expect(store.pending.value).toEqual([])
  })

  it('rejects everything pending at once', async () => {
    const chat = createFakeChat([requestPart('call-1', 'POST'), requestPart('call-2', 'PUT')])
    const store = createApprovalStore({
      chat,
      registry: openApiApprovalPolicies,
      executors: { 'execute-request': vi.fn(async () => {}) },
    })

    await store.rejectAll()

    expect(store.pending.value).toEqual([])
    expect(chat.addToolOutput).toHaveBeenCalledTimes(2)
  })
})
