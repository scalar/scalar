import { describe, expect, it, vi } from 'vitest'

import { createCustomFetch } from './create-custom-fetch'
import { createIpcTransport } from './create-ipc-transport'
import type { IpcFetchRequest, IpcFetchResponse } from './types'

type StreamCallbacks = {
  onData: (chunk: ArrayBuffer) => void
  onEnd: () => void
  onError: (message: string) => void
}

/** Build a window.api mock and return helpers to control the stream. */
function setupIpcMock(overrides: Partial<IpcFetchResponse> = {}) {
  const streamCallbacks: Map<string, StreamCallbacks> = new Map()
  const abortedStreams: string[] = []

  const baseResponse: IpcFetchResponse = {
    status: 200,
    statusText: 'OK',
    headers: [['content-type', 'text/event-stream']],
    body: null,
    url: 'https://example.com/events',
    redirected: false,
    streamId: 'test-stream-id',
    ...overrides,
  }

  const customFetchMock = vi
    .fn<(request: IpcFetchRequest) => Promise<IpcFetchResponse>>()
    .mockResolvedValue(baseResponse)

  ;(globalThis as Record<string, unknown>).window = {
    api: {
      customFetch: customFetchMock,
      customFetchStream: vi.fn(({ streamId, callbacks }: { streamId: string; callbacks: StreamCallbacks }) => {
        streamCallbacks.set(streamId, callbacks)
      }),
      customFetchAbort: vi.fn((streamId: string) => {
        abortedStreams.push(streamId)
      }),
    },
  }

  const emit = {
    data: (chunk: ArrayBuffer) => streamCallbacks.get('test-stream-id')?.onData(chunk),
    end: () => streamCallbacks.get('test-stream-id')?.onEnd(),
    error: (message: string) => streamCallbacks.get('test-stream-id')?.onError(message),
  }

  return { emit, abortedStreams, customFetchMock }
}

describe('create-ipc-transport', () => {
  describe('IPC stream reconstruction', () => {
    it('returns a streaming Response when the IPC response has a streamId', async () => {
      const { emit } = setupIpcMock()
      const fetch = createCustomFetch(createIpcTransport())

      const responsePromise = fetch('https://example.com/events')
      emit.end()
      const result = await responsePromise

      expect(result.body).not.toBeNull()
    })

    it('delivers IPC data chunks to the response body stream', async () => {
      const { emit } = setupIpcMock()
      const fetch = createCustomFetch(createIpcTransport())
      const encoder = new TextEncoder()

      const result = await fetch('https://example.com/events')
      const reader = result.body!.getReader()

      emit.data(encoder.encode('data: hello\n\n').buffer as ArrayBuffer)
      const { value: chunk1 } = await reader.read()
      expect(new TextDecoder().decode(chunk1)).toBe('data: hello\n\n')

      emit.data(encoder.encode('data: world\n\n').buffer as ArrayBuffer)
      const { value: chunk2 } = await reader.read()
      expect(new TextDecoder().decode(chunk2)).toBe('data: world\n\n')
    })

    it('closes the response body stream on customFetch:end', async () => {
      const { emit } = setupIpcMock()
      const fetch = createCustomFetch(createIpcTransport())

      const result = await fetch('https://example.com/events')
      const reader = result.body!.getReader()

      emit.end()
      const { done } = await reader.read()
      expect(done).toBe(true)
    })

    it('errors the response body stream on customFetch:error', async () => {
      const { emit } = setupIpcMock()
      const fetch = createCustomFetch(createIpcTransport())

      const result = await fetch('https://example.com/events')
      const reader = result.body!.getReader()

      emit.error('upstream connection reset')
      await expect(reader.read()).rejects.toThrow('upstream connection reset')
    })

    it('swallows data chunks that arrive after the stream has been cancelled', async () => {
      // Regression: when a consumer cancels the ReadableStream, the main
      // process may still be flushing buffered chunks via IPC.  Those late
      // `onData` callbacks must not throw "Cannot enqueue a chunk into a
      // closed readable stream" — otherwise the renderer surfaces a scary
      // uncaught error from `IpcRenderer.onData` in `index.js`.
      const { emit } = setupIpcMock()
      const fetch = createCustomFetch(createIpcTransport())
      const encoder = new TextEncoder()

      const result = await fetch('https://example.com/events')
      await result.body!.cancel()

      // The data chunk arrives after cancellation — must be silently dropped.
      expect(() => emit.data(encoder.encode('late chunk').buffer as ArrayBuffer)).not.toThrow()
    })

    it('calls customFetchAbort with the abortId when the stream is cancelled', async () => {
      const { abortedStreams, customFetchMock } = setupIpcMock()
      const fetch = createCustomFetch(createIpcTransport())
      const controller = new AbortController()

      // The abortId is generated inside toIpcRequest and wired to the signal,
      // but we need to also call abort() explicitly to fire the listener since
      // stream cancellation calls customFetchAbort via request.abortId.
      const result = await fetch('https://example.com/events', {
        signal: controller.signal,
      })

      // Cancel the stream — this should call customFetchAbort(abortId).
      await result.body!.cancel()

      // The abortId is the value that was sent to the main process.
      const { abortId } = customFetchMock.mock.calls[0]![0]!
      expect(abortedStreams).toContain(abortId)
    })

    it('returns a normal buffered Response when there is no streamId', async () => {
      const encoder = new TextEncoder()
      const bufferedBody = encoder.encode('{"ok":true}').buffer as ArrayBuffer

      setupIpcMock({ streamId: undefined, body: bufferedBody })
      const fetch = createCustomFetch(createIpcTransport())

      const result = await fetch('https://example.com/api')
      expect(await result.json()).toEqual({ ok: true })
    })
  })

  describe('AbortController / AbortSignal integration', () => {
    /** Minimal window.api mock that records calls to customFetchAbort. */
    function setupAbortMock() {
      const abortedIds: string[] = []
      const customFetchMock = vi.fn<(request: IpcFetchRequest) => Promise<IpcFetchResponse>>().mockResolvedValue({
        status: 200,
        statusText: 'OK',
        headers: [],
        body: new ArrayBuffer(0),
        url: 'https://example.com',
        redirected: false,
      })
      ;(globalThis as Record<string, unknown>).window = {
        api: {
          customFetch: customFetchMock,
          customFetchStream: vi.fn(),
          customFetchAbort: vi.fn((id: string) => abortedIds.push(id)),
        },
      }
      return { abortedIds, customFetchMock }
    }

    it('includes an abortId in the IPC request when a signal is provided', async () => {
      const { customFetchMock } = setupAbortMock()
      const fetch = createCustomFetch(createIpcTransport())
      const controller = new AbortController()

      await fetch('https://example.com', { signal: controller.signal })

      const sentRequest = customFetchMock.mock.calls[0]![0]!
      expect(sentRequest.abortId).toBeDefined()
      expect(typeof sentRequest.abortId).toBe('string')
    })

    it('does not include an abortId when no signal is provided', async () => {
      const { customFetchMock } = setupAbortMock()
      const fetch = createCustomFetch(createIpcTransport())

      await fetch('https://example.com')

      const sentRequest = customFetchMock.mock.calls[0]![0]!
      expect(sentRequest.abortId).toBeUndefined()
    })

    it('calls customFetchAbort with the abortId when the signal fires', async () => {
      const { abortedIds, customFetchMock } = setupAbortMock()
      const fetch = createCustomFetch(createIpcTransport())
      const controller = new AbortController()

      await fetch('https://example.com', { signal: controller.signal })

      const { abortId } = customFetchMock.mock.calls[0]![0]!

      controller.abort()

      expect(abortedIds).toContain(abortId)
    })

    it('calls customFetchAbort only once even if abort fires multiple times', async () => {
      const { abortedIds } = setupAbortMock()
      const fetch = createCustomFetch(createIpcTransport())
      const controller = new AbortController()

      await fetch('https://example.com', { signal: controller.signal })
      controller.abort()
      controller.abort() // second call is a no-op on AbortController

      expect(abortedIds).toHaveLength(1)
    })

    it('reads the signal from a Request object when no init signal is provided', async () => {
      const { customFetchMock } = setupAbortMock()
      const fetch = createCustomFetch(createIpcTransport())
      const controller = new AbortController()
      const request = new Request('https://example.com', {
        signal: controller.signal,
      })

      await fetch(request)

      const sentRequest = customFetchMock.mock.calls[0]![0]!
      expect(sentRequest.abortId).toBeDefined()
    })
  })
})
