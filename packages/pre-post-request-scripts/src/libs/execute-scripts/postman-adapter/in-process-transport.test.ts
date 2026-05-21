import { beforeEach, describe, expect, it, vi } from 'vitest'

const { runSandboxExecutionMock, setSandboxTransportMock } = vi.hoisted(() => ({
  runSandboxExecutionMock: vi.fn(),
  setSandboxTransportMock: vi.fn(),
}))

vi.mock('./sandbox-frame-server', () => ({
  runSandboxExecution: runSandboxExecutionMock,
}))

vi.mock('./sandbox-adapter', () => ({
  setSandboxTransport: setSandboxTransportMock,
}))

import { registerInProcessSandbox } from './in-process-transport'
import { SANDBOX_CHANNEL, type SandboxExecuteRequest, type SandboxOutboundMessage } from './sandbox-protocol'

const baseRequest: SandboxExecuteRequest = {
  channel: SANDBOX_CHANNEL,
  kind: 'execute',
  id: 'req-1',
  listen: 'test',
  script: 'pm.test("noop", () => {})',
}

/** Pull out the transport that `registerInProcessSandbox` installed so we can drive it directly. */
const getTransport = () => {
  registerInProcessSandbox()
  expect(setSandboxTransportMock).toHaveBeenCalledTimes(1)
  return setSandboxTransportMock.mock.calls[0]![0] as (
    request: SandboxExecuteRequest,
    onMessage: (message: SandboxOutboundMessage) => void,
  ) => void
}

describe('registerInProcessSandbox', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('forwards messages from runSandboxExecution to onMessage on success', async () => {
    runSandboxExecutionMock.mockImplementation((_request, emit) => {
      emit({ channel: SANDBOX_CHANNEL, kind: 'done', id: 'req-1' })
      return Promise.resolve()
    })

    const messages: SandboxOutboundMessage[] = []
    getTransport()(baseRequest, (m) => messages.push(m))
    // The transport returns synchronously; await a microtask so the mocked async work settles.
    await Promise.resolve()

    expect(messages).toEqual([{ channel: SANDBOX_CHANNEL, kind: 'done', id: 'req-1' }])
  })

  it('emits a done with the error message when runSandboxExecution rejects', async () => {
    // Without the catch, the host promise in `executeInPostmanSandbox` would hang forever.
    runSandboxExecutionMock.mockRejectedValueOnce(new Error('createContext failed'))

    const messages: SandboxOutboundMessage[] = []
    getTransport()(baseRequest, (m) => messages.push(m))
    await Promise.resolve()
    await Promise.resolve()

    expect(messages).toEqual([
      {
        channel: SANDBOX_CHANNEL,
        kind: 'done',
        id: 'req-1',
        error: 'createContext failed',
      },
    ])
  })

  it('stringifies non-Error rejections', async () => {
    runSandboxExecutionMock.mockRejectedValueOnce('kaboom')

    const messages: SandboxOutboundMessage[] = []
    getTransport()(baseRequest, (m) => messages.push(m))
    await Promise.resolve()
    await Promise.resolve()

    expect(messages).toEqual([
      {
        channel: SANDBOX_CHANNEL,
        kind: 'done',
        id: 'req-1',
        error: 'kaboom',
      },
    ])
  })
})
