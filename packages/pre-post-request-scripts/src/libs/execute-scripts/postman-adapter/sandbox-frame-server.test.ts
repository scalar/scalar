// @vitest-environment jsdom
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

import { runSandboxExecution, startSandboxFrameServer } from './sandbox-frame-server'
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

describe('startSandboxFrameServer', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  /**
   * `startSandboxFrameServer` posts a `ready` message and registers a `message` listener. We
   * stub the bare minimum off `window.parent` (target of `postMessage`) and dispatch synthetic
   * `MessageEvent`s with controlled `origin`/`source` so we can prove the listener enforces the
   * same-origin pin without spinning up a real iframe.
   *
   * We rely on the teardown returned by `startSandboxFrameServer` so each test cleans up its
   * own listener; without that, listeners from earlier tests would still see dispatched events
   * and call into the parent stub of the current test, contaminating assertions.
   */
  const setupServer = (origin = window.location.origin) => {
    const parentPostMessage = vi.fn()
    const originalLocationDescriptor = Object.getOwnPropertyDescriptor(window, 'location')
    const originalParentDescriptor = Object.getOwnPropertyDescriptor(window, 'parent')

    Object.defineProperty(window, 'location', {
      configurable: true,
      value: {
        ...window.location,
        origin,
      },
    })

    // Replace `window.parent` with our stub. Captured here so the teardown can restore exactly
    // what was there before, even if the original was the engine-provided non-configurable
    // descriptor (in which case `originalParentDescriptor` is `undefined` and `delete` is the
    // correct restore).
    const parentWindow = {
      postMessage: parentPostMessage,
    } as unknown as Window

    Object.defineProperty(window, 'parent', {
      configurable: true,
      get: () => parentWindow,
    })

    const teardown = startSandboxFrameServer()

    return {
      parentPostMessage,
      restore: () => {
        teardown()
        if (originalLocationDescriptor) {
          Object.defineProperty(window, 'location', originalLocationDescriptor)
        }
        if (originalParentDescriptor) {
          Object.defineProperty(window, 'parent', originalParentDescriptor)
        } else {
          // No own descriptor existed (the property came from the prototype chain) — drop ours
          // so the original lookup path is re-exposed.
          delete (window as unknown as { parent?: unknown }).parent
        }
      },
    }
  }

  const dispatchExecute = (overrides: Partial<MessageEventInit<unknown>> = {}) => {
    const request: SandboxExecuteRequest = {
      channel: SANDBOX_CHANNEL,
      kind: 'execute',
      id: '1',
      listen: 'test',
      script: 'pm.test("noop", () => {})',
    }

    window.dispatchEvent(
      new MessageEvent('message', {
        data: request,
        origin: window.location.origin,
        source: window.parent,
        ...overrides,
      }),
    )
  }

  it('announces readiness to the parent pinned to the current origin (not wildcard)', () => {
    const { parentPostMessage, restore } = setupServer()

    try {
      expect(parentPostMessage).toHaveBeenCalledWith(
        expect.objectContaining({ channel: SANDBOX_CHANNEL, kind: 'ready' }),
        window.location.origin,
      )
      expect(parentPostMessage).not.toHaveBeenCalledWith(expect.anything(), '*')
    } finally {
      restore()
    }
  })

  it('announces readiness from file origins with a wildcard target origin', () => {
    const { parentPostMessage, restore } = setupServer('file://')

    try {
      expect(parentPostMessage).toHaveBeenCalledWith(
        expect.objectContaining({ channel: SANDBOX_CHANNEL, kind: 'ready' }),
        '*',
      )
    } finally {
      restore()
    }
  })

  it('accepts execute messages from the file origin null message origin', async () => {
    sandboxContextMock.execute.mockImplementation((_target, _options, callback) => callback(undefined))
    const { parentPostMessage, restore } = setupServer('file://')

    try {
      parentPostMessage.mockClear()
      dispatchExecute({ origin: 'null' })
      await vi.waitFor(() => expect(createContextMock).toHaveBeenCalled())

      expect(parentPostMessage).toHaveBeenCalledWith(expect.objectContaining({ kind: 'done' }), '*')
    } finally {
      restore()
    }
  })

  it('ignores execute messages from a foreign origin', () => {
    const { parentPostMessage, restore } = setupServer()

    try {
      parentPostMessage.mockClear()

      // Synthetic message from `https://evil.example`. The server must drop it without invoking
      // the sandbox, so no `test-results`/`done` are ever posted back.
      dispatchExecute({ origin: 'https://evil.example' })

      expect(createContextMock).not.toHaveBeenCalled()
      expect(parentPostMessage).not.toHaveBeenCalled()
    } finally {
      restore()
    }
  })

  it('ignores execute messages whose source is not the parent window', () => {
    const { parentPostMessage, restore } = setupServer()

    try {
      parentPostMessage.mockClear()

      // Correct origin but a different window object (for example a sibling frame).
      dispatchExecute({ source: window as unknown as MessageEventSource })

      expect(createContextMock).not.toHaveBeenCalled()
      expect(parentPostMessage).not.toHaveBeenCalled()
    } finally {
      restore()
    }
  })
})
