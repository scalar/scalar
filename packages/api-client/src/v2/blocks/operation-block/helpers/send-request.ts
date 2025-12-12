import type { HttpMethod } from '@scalar/helpers/http/http-methods'
import { httpStatusCodes } from '@scalar/helpers/http/http-status-codes'
import type { OperationObject } from '@scalar/workspace-store/schemas/v3.1/strict/openapi-document'

import { ERRORS, type ErrorResponse, normalizeError } from '@/libs/errors'
import { normalizeHeaders } from '@/libs/normalize-headers'
import { type ClientPlugin, executeHook } from '@/v2/helpers/plugins'

import { decodeBuffer } from './decode-buffer'
import { getCookieHeaderKeys } from './get-cookie-header-keys'

/** A single set of populated values for a sent request */
export type ResponseInstance = Omit<Response, 'headers'> & {
  /** Store headers as an object to match what we had with axios */
  headers: Record<string, string>
  /** Keys of headers which set cookies */
  cookieHeaderKeys: string[]
  /** Time in ms the request took */
  duration: number
  /** The response status */
  status: number
  /** The response status text */
  statusText: string
  /** The response method */
  method: HttpMethod
  /** The request path */
  path: string
} & (
    | {
        /** The response data */
        data: string | Blob
        /** The response size in bytes */
        size: number
      }
    | {
        /** A stream reader for a streamable response body */
        reader: ReadableStreamDefaultReader<Uint8Array>
      }
  )

/**
 * Execute the built fetch request and return a structured response.
 *
 * This function handles the complete request lifecycle including plugin hooks,
 * response processing, streaming detection, and error handling. It supports both
 * standard responses and server-sent event streams.
 *
 * @param request - The request built by the buildRequest helper
 * @param operation - The OpenAPI operation being executed
 * @param plugins - Array of client plugins to execute hooks
 * @param isUsingProxy - Whether the request is being proxied for header handling
 * @returns A tuple with either an error or the response data
 */
export const sendRequest = async ({
  isUsingProxy,
  operation,
  request,
  plugins,
}: {
  isUsingProxy: boolean
  operation: OperationObject
  plugins: ClientPlugin[]
  request: Request
}): Promise<
  ErrorResponse<{
    response: ResponseInstance
    request: Request
    timestamp: number
  }>
> => {
  try {
    /** Apply any beforeRequest hooks from the plugins */
    const modifiedRequest = await executeHook(request, 'beforeRequest', plugins)

    /** Execute the request and measure duration */
    const startTime = Date.now()
    const response = await fetch(modifiedRequest)
    const endTime = Date.now()
    const duration = endTime - startTime

    /** Extract response metadata early for reuse */
    const contentType = response.headers.get('content-type')
    const responseHeaders = normalizeHeaders(response.headers, isUsingProxy)
    const responseUrl = new URL(response.url)
    const fullPath = responseUrl.pathname + responseUrl.search
    const statusText = response.statusText || httpStatusCodes[response.status]?.name || ''
    const method = modifiedRequest.method as HttpMethod

    /** HTTP status codes that should not include a body */
    const shouldSkipBody = [204, 205, 304].includes(response.status)

    /**
     * Handle server-sent event streams separately.
     * These responses need a reader instead of buffered data.
     * We check this early to avoid unnecessary body reading.
     */
    const isStreamingResponse = contentType?.startsWith('text/event-stream') && response.body

    // Create a normalized response for plugin hooks without consuming the body
    if (isStreamingResponse) {
      const normalizedResponse = new Response(null, {
        status: response.status,
        statusText,
        headers: response.headers,
      })

      await executeHook(
        { response: normalizedResponse, request: modifiedRequest, operation },
        'responseReceived',
        plugins,
      )
      const cookieHeaderKeys = getCookieHeaderKeys(normalizedResponse.headers)

      return [
        null,
        {
          timestamp: endTime,
          request: modifiedRequest,
          response: {
            ...normalizedResponse,
            headers: responseHeaders,
            cookieHeaderKeys,
            reader: response.body.getReader(),
            duration,
            method,
            path: fullPath,
          },
        },
      ]
    }

    /**
     * For standard responses, read the body once and reuse the buffer.
     * Clone the response to preserve the original for body reading.
     */
    const clonedResponse = response.clone()
    const arrayBuffer = await clonedResponse.arrayBuffer()
    const responseType = contentType ?? 'text/plain;charset=UTF-8'
    const responseData = decodeBuffer(arrayBuffer, responseType)

    /**
     * Create a new Response using the arrayBuffer we already read.
     * ArrayBuffers can be reused to create new Response objects without additional memory.
     */
    const normalizedResponse = new Response(shouldSkipBody ? null : arrayBuffer, {
      status: response.status,
      statusText,
      headers: response.headers,
    })

    /** Apply any responseReceived hooks from the plugins */
    await executeHook(
      { response: normalizedResponse, request: modifiedRequest, operation },
      'responseReceived',
      plugins,
    )
    const cookieHeaderKeys = getCookieHeaderKeys(normalizedResponse.headers)

    return [
      null,
      {
        timestamp: endTime,
        request: modifiedRequest,
        response: {
          ...normalizedResponse,
          headers: responseHeaders,
          cookieHeaderKeys,
          data: responseData,
          size: arrayBuffer.byteLength,
          duration,
          method,
          status: response.status,
          path: fullPath,
        },
      },
    ]
  } catch (error) {
    return [normalizeError(error, ERRORS.REQUEST_FAILED), null]
  }
}
