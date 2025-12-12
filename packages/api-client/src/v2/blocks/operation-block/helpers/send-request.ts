import type { HttpMethod } from '@scalar/helpers/http/http-methods'
import { httpStatusCodes } from '@scalar/helpers/http/http-status-codes'
import type { OperationObject } from '@scalar/workspace-store/schemas/v3.1/strict/openapi-document'

import { ERRORS, type ErrorResponse, normalizeError } from '@/libs/errors'
import { normalizeHeaders } from '@/libs/normalize-headers'
import { type ClientPlugin, executeHook } from '@/v2/helpers/plugins'

import { decodeBuffer } from './decode-buffer'

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
 * Execute the built fetch request
 *
 * Mostly copied over from v1 with minimal changes, could use some upgrades
 *
 * @param request the request build by the buildRequest helper
 * @returns a responseInsta
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

    const startTime = Date.now()
    const response = await fetch(modifiedRequest)
    const endTime = Date.now()
    const duration = endTime - startTime
    const contentType = response.headers.get('content-type')

    /** Clone once to preserve the original as we cannot read the body twice */
    const clonedResponse = response.clone()

    const responseHeaders = normalizeHeaders(response.headers, isUsingProxy)
    const responseType = contentType ?? 'text/plain;charset=UTF-8'
    const responseUrl = new URL(response.url)
    const fullPath = responseUrl.pathname + responseUrl.search

    // Read the body from the clone
    const arrayBuffer = await clonedResponse.arrayBuffer()
    const responseData = decodeBuffer(arrayBuffer, responseType)

    // Get statusText from the original response (no body reading needed)
    const statusText = response.statusText || httpStatusCodes[response.status]?.name || ''

    // Skip the body when creating the normalized response if the status is 204, 205, 304
    const shouldSkipBody = [204, 205, 304].includes(response.status)

    /**
     * Create a new Response using the arrayBuffer we already read
     * ArrayBuffers can be reused to create new Response objects
     */
    const normalizedResponse = new Response(!shouldSkipBody ? arrayBuffer : null, {
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

    /** Safely check for cookie headers */
    const cookieHeaderKeys =
      'getSetCookie' in normalizedResponse.headers && typeof normalizedResponse.headers.getSetCookie === 'function'
        ? normalizedResponse.headers.getSetCookie()
        : []

    /**
     * Checks if the response is streaming
     * Unfortunately we cannot check the transfer-encoding header as it is not set by the browser so not quite sure how to test when
     * content-type === 'text/plain' and transfer-encoding === 'chunked'
     *
     * Currently we are only checking for server sent events. In OpenApi 3.2.0 streams will be added to the spec
     */
    if (contentType?.startsWith('text/event-stream') && response.body) {
      return [
        null,
        {
          timestamp: endTime,
          request: modifiedRequest,
          response: {
            ...normalizedResponse,
            headers: responseHeaders,
            cookieHeaderKeys,
            reader: response.body?.getReader(),
            duration,
            method: modifiedRequest.method as HttpMethod,
            path: fullPath,
          },
        },
      ]
    }

    // Standard response
    return [
      null,
      {
        timestamp: Date.now(),
        request: modifiedRequest,
        response: {
          ...response,
          headers: responseHeaders,
          cookieHeaderKeys,
          data: responseData,
          size: arrayBuffer.byteLength,
          duration: Date.now() - startTime,
          method: modifiedRequest.method as HttpMethod,
          status: response.status,
          path: fullPath,
        },
      },
    ]
  } catch (error) {
    return [normalizeError(error, ERRORS.REQUEST_FAILED), null]
  }
}
