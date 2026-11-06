import { Chat } from '@ai-sdk/vue'
import { createWorkspaceStore } from '@scalar/workspace-store/client'
import type { UIDataTypes, UIMessage } from 'ai'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { createDocumentSettings } from '@/helpers'
import type { Tools } from '@/state/state'

import { executeRequestTool } from './execute-request'

const secret = 'stored-secret'
const targetUrl = `https://api.example.com/pets?api_key=${secret}`
const proxyUrl = 'https://proxy.example.com'
const proxiedUrl = `${proxyUrl}/?scalar_url=${encodeURIComponent(targetUrl)}`

const prepareRequest = async (proxy = ''): Promise<Parameters<typeof executeRequestTool>[0]> => {
  const documentName = 'test/private'
  const workspace = createWorkspaceStore()
  await workspace.addDocument({
    name: documentName,
    document: {
      openapi: '3.1.0',
      info: { title: 'Private API', version: '1.0.0' },
      servers: [{ url: 'https://api.example.com' }],
      paths: {},
      components: { securitySchemes: { apiKey: { type: 'apiKey', in: 'query', name: 'api_key' } } },
      security: [{ apiKey: [] }],
    },
  })
  workspace.auth.setAuthSecrets(documentName, 'apiKey', { type: 'apiKey', 'x-scalar-secret-token': secret })
  const input = { method: 'GET', path: '/pets', documentName, documentIdentifier: documentName }
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
  return { documentSettings: createDocumentSettings(workspace), chat, input, toolCallId: 'request-1', proxyUrl: proxy }
}

describe('execute-request.error-url', () => {
  afterEach(() => vi.restoreAllMocks())

  it.each([
    ['direct query', '', targetUrl, targetUrl],
    ['proxy target query', proxyUrl, proxiedUrl, proxiedUrl],
    ['redirect path', '', `https://api.example.com/session/${secret}`, targetUrl],
    ['redirect user information and fragment', '', `https://user:${secret}@api.example.com/pets#${secret}`, targetUrl],
  ])(
    'omits the response URL from error output for %s',
    async (_description, proxy, responseUrl, expectedRequestUrl) => {
      const request = await prepareRequest(proxy)
      const response = Response.json(
        { message: 'Access denied' },
        {
          status: 403,
          headers: { 'x-request-id': 'request-id', 'x-forwarded-host': targetUrl },
        },
      )
      // The fetch boundary supplies the final response URL, including any redirects.
      vi.spyOn(response, 'url', 'get').mockReturnValue(responseUrl)
      const fetch = vi.spyOn(globalThis, 'fetch').mockResolvedValue(response)
      const expectedOutput = {
        success: false,
        error: {
          code: 'REQUEST_NOT_OK',
          detail: {
            status: 403,
            responseBody: { message: 'Access denied' },
            headers: {
              'content-type': 'application/json',
              'x-request-id': 'request-id',
              'x-forwarded-host': targetUrl.replace(secret, '[REDACTED]'),
            },
          },
        },
      }

      const result = await executeRequestTool(request)

      expect(fetch.mock.calls).toStrictEqual([
        [expectedRequestUrl, { redirect: 'error', method: 'GET', body: undefined, headers: { Cookie: '' } }],
      ])
      expect(result).toStrictEqual(expectedOutput)
      await vi.waitFor(() => {
        const part = request.chat.messages[0]?.parts[0]
        expect(part?.type === 'tool-execute-request' && part.state).toBe('output-available')
      })
      const part = request.chat.messages[0]?.parts[0]
      if (part?.type !== 'tool-execute-request') {
        throw new Error('Expected request tool output')
      }
      expect(part.output).toStrictEqual(expectedOutput)
      expect(JSON.stringify(request.chat.messages)).not.toContain(secret)
    },
  )

  it('redacts successful response bodies and headers while preserving non-secret fields', async () => {
    const request = await prepareRequest()
    const response = Response.json(
      { pets: [], requestUrl: targetUrl },
      { headers: { 'x-request-id': 'request-id', 'x-forwarded-host': targetUrl } },
    )
    vi.spyOn(response, 'url', 'get').mockReturnValue(targetUrl)
    const fetch = vi.spyOn(globalThis, 'fetch').mockResolvedValue(response)

    const result = await executeRequestTool(request)

    expect(fetch.mock.calls).toStrictEqual([
      [targetUrl, { redirect: 'error', method: 'GET', body: undefined, headers: { Cookie: '' } }],
    ])
    expect(result).toStrictEqual({
      success: true,
      data: {
        status: 200,
        responseBody: { pets: [], requestUrl: targetUrl.replace(secret, '[REDACTED]') },
        headers: {
          'content-type': 'application/json',
          'x-request-id': 'request-id',
          'x-forwarded-host': targetUrl.replace(secret, '[REDACTED]'),
        },
      },
    })
    await vi.waitFor(() =>
      expect(request.chat.messages[0]?.parts.find((part) => part.type === 'tool-execute-request')?.state).toBe(
        'output-available',
      ),
    )
    expect(JSON.stringify(request.chat.messages)).not.toContain(secret)
  })

  it('redacts the target URL in a proxy text/plain 503 response', async () => {
    const request = await prepareRequest(proxyUrl)
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(`Get "${targetUrl}": dial tcp: connection refused`, {
        status: 503,
        headers: { 'content-type': 'text/plain', 'x-forwarded-host': targetUrl },
      }),
    )

    const result = await executeRequestTool(request)

    expect(result).toStrictEqual({
      success: false,
      error: {
        code: 'REQUEST_NOT_OK',
        detail: {
          status: 503,
          responseBody: `Get "${targetUrl.replace(secret, '[REDACTED]')}": dial tcp: connection refused`,
          headers: { 'content-type': 'text/plain', 'x-forwarded-host': targetUrl.replace(secret, '[REDACTED]') },
        },
      },
    })
    await vi.waitFor(() =>
      expect(request.chat.messages[0]?.parts.find((part) => part.type === 'tool-execute-request')?.state).toBe(
        'output-available',
      ),
    )
    expect(JSON.stringify(request.chat.messages)).not.toContain(secret)
  })
})
