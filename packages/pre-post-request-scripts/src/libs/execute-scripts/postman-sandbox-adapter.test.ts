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

import { executeInPostmanSandbox } from './postman-sandbox-adapter'

describe('postman-sandbox-adapter', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('passes response headers as Postman header objects', async () => {
    sandboxContextMock.execute.mockImplementation((_target, _options, callback) => callback(undefined))

    const response = new Response('{"ok":true}', {
      status: 200,
      headers: {
        'content-type': 'application/json',
        'x-request-id': 'req-123',
      },
    })

    await executeInPostmanSandbox({
      script: 'pm.test("noop", () => {})',
      response,
      scriptConsole: {
        log: vi.fn(),
        error: vi.fn(),
        warn: vi.fn(),
        info: vi.fn(),
        debug: vi.fn(),
        trace: vi.fn(),
        table: vi.fn(),
      },
    })

    expect(sandboxContextMock.execute).toHaveBeenCalledWith(
      expect.any(Object),
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

  it('cleans up sandbox listeners and context when response conversion fails', async () => {
    const response = new Response('payload', { status: 200 })
    response.text = () => Promise.reject(new Error('Body already used'))

    await expect(
      executeInPostmanSandbox({
        script: 'pm.test("noop", () => {})',
        response,
        scriptConsole: {
          log: vi.fn(),
          error: vi.fn(),
          warn: vi.fn(),
          info: vi.fn(),
          debug: vi.fn(),
          trace: vi.fn(),
          table: vi.fn(),
        },
      }),
    ).rejects.toThrow('Body already used')

    expect(sandboxContextMock.on).toHaveBeenCalledWith('execution.assertion', expect.any(Function))
    expect(sandboxContextMock.on).toHaveBeenCalledWith('console', expect.any(Function))
    expect(sandboxContextMock.off).toHaveBeenCalledWith('execution.assertion', expect.any(Function))
    expect(sandboxContextMock.off).toHaveBeenCalledWith('console', expect.any(Function))
    expect(sandboxContextMock.execute).not.toHaveBeenCalled()
    expect(sandboxContextMock.dispose).toHaveBeenCalledTimes(1)
  })
})
