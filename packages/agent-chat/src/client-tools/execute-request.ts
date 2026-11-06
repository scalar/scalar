import type { Chat } from '@ai-sdk/vue'
import { restoreOriginalHeaders } from '@scalar/helpers/http/restore-original-headers'
import { redirectToProxy } from '@scalar/helpers/url/redirect-to-proxy'
import type { SecuritySchemeObjectSecret } from '@scalar/workspace-store/request-example'
import { buildRequestSecurity, getResolvedUrl } from '@scalar/workspace-store/request-example'
import type { ServerObject } from '@scalar/workspace-store/schemas/v3.2/strict/openapi-document'
import type { UIDataTypes, UIMessage } from 'ai'
import { encode as encodeBase64 } from 'js-base64'
import { n } from 'neverpanic'
import truncateJson from 'truncate-json'

import { EXECUTE_CLIENT_SIDE_REQUEST_TOOL_NAME } from '@/entities'
import { createError } from '@/entities/error/helpers'
import type { Tools } from '@/state/state'

import { createSecretRedactor } from './redact-secrets'

// The maximum number of bytes the requests response can be.
const MAX_RESPONSE_SIZE = 50_000

const getBody = n.safeFn(
  async (response: Response) => {
    const contentType = response.headers.get('content-type')

    if (contentType === 'application/json') {
      return { success: true, data: await response.json() }
    }

    return { success: true, data: await response.text() }
  },
  (originalError) => createError('FAILED_TO_PARSE_RESPONSE_BODY', { originalError }),
)

const truncateResponse = (response: unknown) =>
  JSON.parse(truncateJson(JSON.stringify(response), MAX_RESPONSE_SIZE).jsonString)

/* Result type wrapper for fetch */
const safeFetch = n.safeFn(
  async (url: string, init: RequestInit) => {
    const response = await fetch(url, init)

    const responseBodyResult = await getBody(response)

    if (!response.ok) {
      // Response URLs can contain credentials, so keep them out of model-visible tool output.
      return {
        success: false,
        error: createError('REQUEST_NOT_OK', {
          status: response.status,
          responseBody: responseBodyResult.success ? responseBodyResult.data : undefined,
          headers: Object.fromEntries(restoreOriginalHeaders(response.headers).entries()),
        }),
      }
    }

    if (!responseBodyResult.success) {
      return responseBodyResult
    }

    return {
      success: true,
      data: {
        status: response.status,
        responseBody: responseBodyResult.data,
        headers: Object.fromEntries(restoreOriginalHeaders(response.headers).entries()),
      },
    }
  },
  (originalError) => createError('FAILED_TO_FETCH', { originalError }),
)

/** Validate the exact destination that will receive credentials before applying the proxy. */
const createDestination = (
  path: string,
  activeServer: ServerObject | null,
  queryParams: URLSearchParams,
): { url: string; error?: never } | { url?: never; error: string } => {
  if (!activeServer?.url?.trim()) {
    return { error: 'Add a server to the API description before sending an API request.' }
  }

  const pathname = path.split('?')[0] ?? ''
  if (
    !pathname.startsWith('/') ||
    pathname.startsWith('//') ||
    pathname.includes('\\') ||
    // biome-ignore lint/suspicious/noControlCharactersInRegex: Reject characters that URL parsers silently normalize.
    /[\u0000-\u001f\u007f]/.test(pathname)
  ) {
    return { error: 'Request paths must be relative endpoints beginning with a single forward slash.' }
  }

  try {
    const serverUrl = new URL(getResolvedUrl({ server: activeServer, path: '' }))
    const requestUrl = new URL(getResolvedUrl({ server: activeServer, path, urlParams: queryParams }))
    if (
      (requestUrl.protocol !== 'http:' && requestUrl.protocol !== 'https:') ||
      requestUrl.origin !== serverUrl.origin
    ) {
      return { error: 'Request destinations must use the selected HTTP or HTTPS server.' }
    }
    return { url: requestUrl.href }
  } catch {
    return { error: 'Select a valid HTTP or HTTPS server before sending an API request.' }
  }
}

/**
 * Executes an HTTP request with the specified options, including method, path, headers, and security schemes, and returns the processed response.
 */
export const executeRequestTool = n.safeFn(
  async ({
    documentSettings,
    toolCallId,
    chat,
    proxyUrl,
    input: { method, path, body, headers, documentName },
  }: {
    documentSettings: Record<
      string,
      { activeServer: ServerObject | null; securitySchemes: SecuritySchemeObjectSecret[] }
    >
    toolCallId: string
    chat: Chat<UIMessage<unknown, UIDataTypes, Tools>>
    proxyUrl: string
    input: {
      method: string
      path: string
      headers?: Record<string, string>
      body?: string
      documentName: string
    }
  }) => {
    const settings = documentSettings[documentName]

    if (!settings) {
      void chat.addToolOutput({
        tool: EXECUTE_CLIENT_SIDE_REQUEST_TOOL_NAME,
        toolCallId,
        state: 'output-error',
        errorText: 'The selected API could not be found. Select an available API before sending a request.',
      })
      return {
        success: false,
        error: createError('DOCUMENT_SETTINGS_COULD_NOT_BE_DETERMINED', {
          documentName,
        }),
      }
    }

    const requestSecurityOptions = buildRequestSecurity(settings.securitySchemes)

    const requestSecurity = requestSecurityOptions.reduce<{
      headers: Record<string, string>
      queryParams: URLSearchParams
      cookies: Record<string, string>
    }>(
      (acc, securityOption) => {
        /** Format the security value based on its authentication scheme. */
        const securityValue = (() => {
          if (securityOption.format === 'basic') {
            return `Basic ${encodeBase64(securityOption.value)}`
          }
          if (securityOption.format === 'bearer') {
            return `Bearer ${securityOption.value}`
          }
          return securityOption.value
        })()

        if (securityOption.in === 'header') {
          acc.headers[securityOption.name] = securityValue
        } else if (securityOption.in === 'query') {
          acc.queryParams.set(securityOption.name, securityValue)
        } else if (securityOption.in === 'cookie') {
          acc.cookies[securityOption.name] = securityValue
        }

        return acc
      },
      {
        headers: {},
        queryParams: new URLSearchParams(),
        cookies: {},
      },
    )

    const destination = createDestination(path, settings.activeServer, requestSecurity.queryParams)
    if (destination.error) {
      // Tool callbacks run inside the stream queue, so do not await a write to that same queue.
      void chat.addToolOutput({
        tool: EXECUTE_CLIENT_SIDE_REQUEST_TOOL_NAME,
        toolCallId,
        state: 'output-error',
        errorText: destination.error,
      })
      return { success: false, error: createError('FAILED_TO_EXECUTE_REQUEST', destination.error) }
    }

    const cookieHeader = Object.entries(requestSecurity.cookies)
      .map(([name, value]) => `${name}=${value}`)
      .join('; ')

    const fetchOptions: RequestInit = {
      redirect: 'error',
      method,
      body,
      headers: {
        ...headers,
        ...requestSecurity.headers,
        Cookie: cookieHeader,
      },
    }

    const url = redirectToProxy(proxyUrl, destination.url)

    const redact = createSecretRedactor(requestSecurityOptions)
    const result = await safeFetch(url, fetchOptions)
    // Redact complete values before truncation can split a credential at the size limit.
    if (result.success) {
      result.data.responseBody = truncateResponse(redact(result.data.responseBody))
      result.data.headers = redact(result.data.headers)
    } else if (result.error.code === 'REQUEST_NOT_OK') {
      if (result.error.detail.responseBody !== undefined) {
        result.error.detail.responseBody = truncateResponse(redact(result.error.detail.responseBody))
      }
      result.error.detail.headers = redact(result.error.detail.headers)
    } else {
      result.error.detail.originalError = redact(result.error.detail.originalError)
    }

    void chat.addToolOutput({
      tool: EXECUTE_CLIENT_SIDE_REQUEST_TOOL_NAME,
      toolCallId,
      output: result,
      state: 'output-available',
    })

    return result
  },
  (originalError) => createError('FAILED_TO_EXECUTE_REQUEST', originalError),
)
