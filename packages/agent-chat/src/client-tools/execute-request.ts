import type { Chat } from '@ai-sdk/vue'
import { buildRequestSecurity, getResolvedUrl } from '@scalar/api-client/v2/blocks/operation-block'
import type { SecuritySchemeObjectSecret } from '@scalar/api-client/v2/blocks/scalar-auth-selector-block'
import { redirectToProxy } from '@scalar/helpers/url/redirect-to-proxy'
import type { ServerObject } from '@scalar/workspace-store/schemas/v3.1/strict/openapi-document'
import type { UIDataTypes, UIMessage } from 'ai'
import { n } from 'neverpanic'
import truncateJson from 'truncate-json'

import { EXECUTE_CLIENT_SIDE_REQUEST_TOOL_NAME, TOOL_NAMESPACE_SLUG_DELIMITER } from '@/entities'
import { createError } from '@/entities/error/helpers'
import { createDocumentName } from '@/registry/create-document-name'
import type { Tools } from '@/state/state'

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
      return {
        success: false,
        error: createError('REQUEST_NOT_OK', {
          status: response.status,
          url: response.url,
          responseBody: truncateResponse(responseBodyResult.success ? responseBodyResult.data : undefined),
          headers: Object.fromEntries(response.headers.entries()),
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
        responseBody: truncateResponse(responseBodyResult.data),
        headers: Object.fromEntries(response.headers.entries()),
      },
    }
  },
  (originalError) => createError('FAILED_TO_FETCH', { originalError }),
)

function createUrl({ path, activeServer }: { path: string; activeServer: ServerObject | null }) {
  const resolvedUrl = getResolvedUrl({
    path,
    server: activeServer,
    pathVariables: {},
    environment: {
      color: '',
      variables: [],
    },
  })

  return redirectToProxy('https://proxy.scalar.com', resolvedUrl)
}

/**
 * Executes an HTTP request with the specified options, including method, path, headers, and security schemes, and returns the processed response.
 */
export const executeRequestTool = n.safeFn(
  async ({
    documentSettings,
    toolCallId,
    chat,
    input: { method, path, body, headers, documentIdentifier },
  }: {
    documentSettings: Record<
      string,
      { activeServer: ServerObject | null; securitySchemes: SecuritySchemeObjectSecret[] }
    >
    toolCallId: string
    chat: Chat<UIMessage<unknown, UIDataTypes, Tools>>
    input: {
      method: string
      path: string
      headers?: Record<string, string>
      body?: string
      documentIdentifier: string
    }
  }) => {
    const [namespace, slug] = documentIdentifier.split(TOOL_NAMESPACE_SLUG_DELIMITER)
    if (!namespace || !slug) {
      return {
        success: false,
        error: createError('FAILED_TO_DETERMINE_DOCUMENT', { namespace, slug, documentIdentifier }),
      }
    }

    const documentName = createDocumentName(namespace, slug)
    const settings = documentSettings[documentName]

    if (!settings) {
      return {
        success: false,
        error: createError('DOCUMENT_SETTINGS_COULD_NOT_BE_DETERMINED', {
          documentName,
          namespace,
          slug,
        }),
      }
    }

    const requestSecurityOptions = buildRequestSecurity(settings.securitySchemes)

    const fetchOptions = {
      method,
      body,
      ...requestSecurityOptions,
      headers: {
        ...headers,
        ...requestSecurityOptions.headers,
      },
    }

    const url = createUrl({
      path,
      activeServer: settings.activeServer,
    })

    const result = await safeFetch(url, fetchOptions)

    chat.addToolOutput({
      tool: EXECUTE_CLIENT_SIDE_REQUEST_TOOL_NAME,
      toolCallId,
      output: result,
      state: 'output-available',
    })

    return result
  },
  (originalError) => createError('FAILED_TO_EXECUTE_REQUEST', originalError),
)
