import { ERRORS, type ErrorResponse, normalizeError } from '@scalar/helpers/errors/normalize-error'
import type { HttpMethod } from '@scalar/helpers/http/http-methods'
import { httpStatusCodes } from '@scalar/helpers/http/http-status-codes'
import { normalizeHeaders } from '@scalar/helpers/http/normalize-headers'
import type { ClientPlugin } from '@scalar/oas-utils/helpers'
import * as cookie from 'cookie'
import { parseSetCookie } from 'set-cookie-parser'

import { getCookieHeaderKeys } from '@/v2/blocks/operation-block/helpers/get-cookie-header-keys'
import { resolveResponseBodyHandler } from '@/v2/blocks/response-block/helpers/resolve-response-body-handler'
import {
  resolveResponseContentType,
  resolveResponseMimeType,
} from '@/v2/blocks/response-block/helpers/resolve-response-content-type'

import { decodeBuffer } from './decode-buffer'

const CUSTOM_COOKIE_HEADER = 'x-scalar-set-cookie'

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

/** HTTP status codes that should not include a response body */
const NO_BODY_STATUS_CODES = [204, 205, 304]

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
  request,
  plugins = [],
}: {
  isUsingProxy: boolean
  request: Request
  /** Registered client plugins for custom content type handling */
  plugins?: ClientPlugin[]
}): Promise<
  ErrorResponse<{
    response: ResponseInstance
    request: Request
    timestamp: number
    originalResponse: Response
  }>
> => {
  try {
    // Execute the request and measure duration
    const startTime = performance.now()
    const response = await fetch(request.clone())
    const endTime = performance.now()
    const timestamp = Date.now()
    const duration = endTime - startTime

    // Extract response metadata early for reuse
    const contentType = response.headers.get('content-type')
    const responseHeaders = normalizeHeaders(response.headers, isUsingProxy)
    const responseUrl = new URL(response.url)
    const fullPath = responseUrl.pathname + responseUrl.search
    const statusText = response.statusText || httpStatusCodes[response.status]?.name || ''
    const method = request.method as HttpMethod
    const shouldSkipBody = NO_BODY_STATUS_CODES.includes(response.status)

    /**
     * Handle server-sent event streams separately.
     * These responses need a reader instead of buffered data.
     * We check this early to avoid unnecessary body reading.
     */
    if (contentType?.startsWith('text/event-stream') && response.body) {
      return buildStreamingResponse({
        response,
        request,
        timestamp,
        duration,
        responseHeaders,
        statusText,
        method,
        fullPath,
      })
    }

    return buildStandardResponse({
      response,
      request,
      timestamp,
      duration,
      responseHeaders,
      statusText,
      method,
      fullPath,
      contentType,
      shouldSkipBody,
      plugins,
    })
  } catch (error) {
    return [normalizeError(error, ERRORS.REQUEST_FAILED), null]
  }
}

/**
 * Extracts and serializes custom cookies from the response using the custom cookie header.
 *
 * This function parses the custom cookie header (if present), serializes each cookie using the
 * 'cookie' library, and then deletes the custom cookie header from the response.
 * Returns an array of serialized cookie strings, or null if no cookies were found.
 *
 * The @ts-expect-error is present due to a type mismatch between the 'cookie' parsing and serialization libraries.
 */
const getCustomCookie = (response: Response): string[] | null => {
  const result = parseSetCookie(response.headers.get(CUSTOM_COOKIE_HEADER) ?? '').map((c) =>
    cookie.serialize(c.name, c.value, {
      ...c,
      sameSite: c.sameSite as boolean | 'lax' | 'strict' | 'none' | undefined,
      encode: (str: string) => str,
    }),
  )

  if (result.length) {
    return result
  }

  return null
}

/**
 * Build a streaming response for server-sent events.
 * Streaming responses use a reader instead of buffering the entire body.
 */
const buildStreamingResponse = ({
  response,
  request,
  timestamp,
  duration,
  responseHeaders,
  statusText,
  method,
  fullPath,
}: {
  response: Response
  request: Request
  timestamp: number
  duration: number
  responseHeaders: Record<string, string>
  statusText: string
  method: HttpMethod
  fullPath: string
}): ErrorResponse<{
  response: ResponseInstance
  request: Request
  timestamp: number
  originalResponse: Response
}> => {
  const normalizedResponse = new Response(null, {
    status: response.status,
    statusText,
    headers: response.headers,
  })

  const customCookie = getCustomCookie(normalizedResponse)
  const cookieHeaderKeys = customCookie ?? getCookieHeaderKeys(normalizedResponse.headers)

  return [
    null,
    {
      timestamp,
      request: request,
      response: {
        ...normalizedResponse,
        headers: responseHeaders,
        cookieHeaderKeys,
        reader: response.body!.getReader(),
        duration,
        method,
        path: fullPath,
      },
      originalResponse: normalizedResponse.clone(),
    },
  ]
}

/**
 * Build a standard response with buffered body data.
 * This handles all non-streaming responses including JSON, text, and binary data.
 */
const buildStandardResponse = async ({
  response,
  request,
  timestamp,
  duration,
  responseHeaders,
  statusText,
  method,
  fullPath,
  contentType,
  shouldSkipBody,
  plugins,
}: {
  response: Response
  request: Request
  timestamp: number
  duration: number
  responseHeaders: Record<string, string>
  statusText: string
  method: HttpMethod
  fullPath: string
  contentType: string | null
  shouldSkipBody: boolean
  plugins: ClientPlugin[]
}): Promise<
  ErrorResponse<{
    response: ResponseInstance
    request: Request
    timestamp: number
    originalResponse: Response
  }>
> => {
  /**
   * Clone the response to preserve the original for body reading.
   * Read the body once and reuse the buffer for both decoding and creating a new Response.
   */
  const clonedResponse = response.clone()
  const arrayBuffer = await clonedResponse.arrayBuffer()
  const responseType = resolveResponseContentType(contentType)
  const mimeEssence = resolveResponseMimeType(contentType).essence
  const pluginHandler = resolveResponseBodyHandler(mimeEssence, plugins)
  const responseData = await decodeBuffer(arrayBuffer, responseType, pluginHandler)

  /**
   * Create a new Response using the arrayBuffer we already read.
   * ArrayBuffers can be reused to create new Response objects without additional memory.
   */
  const normalizedResponse = new Response(shouldSkipBody ? null : arrayBuffer, {
    status: response.status,
    statusText,
    headers: response.headers,
  })

  const customCookie = getCustomCookie(normalizedResponse)
  const cookieHeaderKeys = customCookie ?? getCookieHeaderKeys(normalizedResponse.headers)

  return [
    null,
    {
      timestamp,
      request: request,
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
      originalResponse: response.clone(),
    },
  ]
}
