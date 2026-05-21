import { beforeEach, describe, expect, it, vi } from 'vitest'

const { sandboxContextMock, createContextMock } = vi.hoisted(() => {
  const sandboxContext = {
    on: vi.fn(),
    off: vi.fn(),
    execute: vi.fn(),
    dispose: vi.fn(),
  }

  return {
    sandboxContextMock: sandboxContext,
    createContextMock: vi.fn((callback: (error: unknown, context: typeof sandboxContext) => void) =>
      callback(null, sandboxContext),
    ),
  }
})

vi.mock('postman-sandbox', () => ({
  default: {
    createContext: createContextMock,
  },
}))

import { runSandboxExecution } from './sandbox-frame-server'
import { SANDBOX_CHANNEL, type SandboxExecuteRequest, type SandboxOutboundMessage } from './sandbox-protocol'

const baseRequest = (overrides: Partial<SandboxExecuteRequest>): SandboxExecuteRequest => ({
  channel: SANDBOX_CHANNEL,
  kind: 'execute',
  id: '1',
  listen: 'test',
  script: 'pm.test("noop", () => {})',
  ...overrides,
})

describe('sandbox-frame-server', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('passes the plain response through to the sandbox context', async () => {
    sandboxContextMock.execute.mockImplementation((_target, _options, callback) => callback(undefined))

    await runSandboxExecution(
      baseRequest({
        response: {
          code: 200,
          status: '200',
          header: [
            { key: 'content-type', value: 'application/json' },
            { key: 'x-request-id', value: 'req-123' },
          ],
          stream: { type: 'Buffer', data: [] },
        },
      }),
      vi.fn(),
    )

    expect(sandboxContextMock.execute).toHaveBeenCalledWith(
      expect.objectContaining({ listen: 'test' }),
      expect.objectContaining({
        context: expect.objectContaining({
          response: expect.objectContaining({
            header: expect.arrayContaining([
              expect.objectContaining({ key: 'content-type', value: 'application/json' }),
              expect.objectContaining({ key: 'x-request-id', value: 'req-123' }),
            ]),
          }),
        }),
      }),
      expect.any(Function),
    )
  })

  it('uses the prerequest listener for pre-request and the test listener for post-response', async () => {
    sandboxContextMock.execute.mockImplementation((_target, _options, callback) => callback(undefined))

    await runSandboxExecution(baseRequest({ listen: 'prerequest', script: 'pm.globals.set("a", "1")' }), vi.fn())
    expect(sandboxContextMock.execute).toHaveBeenCalledWith(
      expect.objectContaining({ listen: 'prerequest' }),
      expect.any(Object),
      expect.any(Function),
    )

    vi.clearAllMocks()
    sandboxContextMock.execute.mockImplementation((_target, _options, callback) => callback(undefined))

    await runSandboxExecution(baseRequest({ listen: 'test' }), vi.fn())
    expect(sandboxContextMock.execute).toHaveBeenCalledWith(
      expect.objectContaining({ listen: 'test' }),
      expect.any(Object),
      expect.any(Function),
    )
  })

  it('removes listeners and disposes the context after execution', async () => {
    sandboxContextMock.execute.mockImplementation((_target, _options, callback) => callback(undefined))

    await runSandboxExecution(baseRequest({}), vi.fn())

    expect(sandboxContextMock.on).toHaveBeenCalledWith('execution.assertion', expect.any(Function))
    expect(sandboxContextMock.on).toHaveBeenCalledWith('console', expect.any(Function))
    expect(sandboxContextMock.off).toHaveBeenCalledWith('execution.assertion', expect.any(Function))
    expect(sandboxContextMock.off).toHaveBeenCalledWith('console', expect.any(Function))
    expect(sandboxContextMock.dispose).toHaveBeenCalledTimes(1)
  })

  it('forwards variable scopes from the execution result in the done message', async () => {
    sandboxContextMock.execute.mockImplementation((_target, _options, callback) =>
      callback(undefined, {
        _variables: { values: [{ key: 'local', value: 'l' }] },
        globals: { values: [{ key: 'g', value: '1' }] },
      }),
    )

    const messages: SandboxOutboundMessage[] = []
    await runSandboxExecution(baseRequest({ id: '7' }), (message) => messages.push(message))

    const done = messages.find((message) => message.kind === 'done')
    expect(done).toEqual(
      expect.objectContaining({
        id: '7',
        variables: expect.objectContaining({
          local: [{ key: 'local', value: 'l' }],
          globals: [{ key: 'g', value: '1' }],
        }),
      }),
    )
  })

  it('emits a failed test result and a done error when the script throws', async () => {
    sandboxContextMock.execute.mockImplementation((_target, _options, callback) => callback(new Error('kaboom')))

    const messages: SandboxOutboundMessage[] = []
    await runSandboxExecution(baseRequest({}), (message) => messages.push(message))

    const lastResults = messages.filter((message) => message.kind === 'test-results').at(-1)
    expect(lastResults?.kind === 'test-results' && lastResults.results).toEqual(
      expect.arrayContaining([expect.objectContaining({ title: 'Script Execution', passed: false, error: 'kaboom' })]),
    )

    const done = messages.find((message) => message.kind === 'done')
    expect(done?.kind === 'done' && done.error).toBe('kaboom')
  })
})
