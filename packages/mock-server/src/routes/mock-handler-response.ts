import { getExampleFromSchema } from '@scalar/oas-utils/spec-getters'
import type { OpenAPIV3_1 } from '@scalar/openapi-types'
import type { Context } from 'hono'
import { accepts } from 'hono/accepts'
import type { StatusCode } from 'hono/utils/http-status'

import type { MockServerOptions } from '@/types'
import { buildHandlerContext } from '@/utils/build-handler-context'
import { executeHandler } from '@/utils/execute-handler'

/**
 * Get example response from OpenAPI spec for a given status code.
 * Returns the example value if found, or null if not available.
 */
function getExampleFromResponse(
  c: Context,
  statusCode: StatusCode,
  responses: OpenAPIV3_1.ResponsesObject | undefined,
): any {
  if (!responses) {
    return null
  }

  const statusCodeStr = statusCode.toString()
  const response = responses[statusCodeStr] || responses.default

  if (!response) {
    return null
  }

  const supportedContentTypes = Object.keys(response.content ?? {})

  // If no content types are defined, return null
  if (supportedContentTypes.length === 0) {
    return null
  }

  // Content-Type negotiation
  const acceptedContentType = accepts(c, {
    header: 'Accept',
    supports: supportedContentTypes,
    default: supportedContentTypes.includes('application/json')
      ? 'application/json'
      : (supportedContentTypes[0] ?? 'text/plain;charset=UTF-8'),
  })

  const acceptedResponse = response.content?.[acceptedContentType]

  if (!acceptedResponse) {
    return null
  }

  // Extract example from example property or generate from schema
  return acceptedResponse.example !== undefined
    ? acceptedResponse.example
    : acceptedResponse.schema
      ? getExampleFromSchema(acceptedResponse.schema, {
          emptyString: 'string',
          variables: c.req.param(),
          mode: 'read',
        })
      : null
}

/**
 * Determine HTTP status code based on store operation tracking.
 */
function determineStatusCode(
  lastOperation: 'get' | 'create' | 'update' | 'delete' | 'list' | null,
  lastResult: any,
): StatusCode {
  if (lastOperation === 'get') {
    // Return 404 if get() returned undefined or null
    if (lastResult === undefined || lastResult === null) {
      return 404
    }
    return 200
  }

  if (lastOperation === 'create') {
    return 201
  }

  if (lastOperation === 'update') {
    // Return 404 if update() returned null (item not found)
    if (lastResult === null || lastResult === undefined) {
      return 404
    }
    return 200
  }

  if (lastOperation === 'delete') {
    // Return 404 if delete() returned null (item not found)
    if (lastResult === null || lastResult === undefined) {
      return 404
    }
    return 204
  }

  // Default to 200 for list or no operation
  return 200
}

/**
 * Mock response using x-handle code.
 * Executes the handler and returns its result as the response.
 */
export async function mockHandlerResponse(
  c: Context,
  operation: OpenAPIV3_1.OperationObject,
  options: MockServerOptions,
) {
  // Call onRequest callback
  if (options?.onRequest) {
    options.onRequest({
      context: c,
      operation,
    })
  }

  // Get x-handle code from operation
  const handlerCode = operation?.['x-handle']

  if (!handlerCode) {
    c.status(500)
    return c.json({ error: 'x-handle code not found in operation' })
  }

  try {
    // Build handler context with tracking
    const { context, tracking } = await buildHandlerContext(c, operation)

    // Execute handler
    const { result } = await executeHandler(handlerCode, context)

    // Determine status code based on last store operation
    const statusCode = determineStatusCode(tracking.lastOperation, tracking.lastResult)

    // Set status code
    c.status(statusCode)

    // For 204 No Content, return null body without Content-Type header
    if (statusCode === 204) {
      return c.body(null)
    }

    // Set Content-Type header for other responses
    c.header('Content-Type', 'application/json')

    // Return the handler result as JSON
    // Handle undefined/null results gracefully
    if (result === undefined || result === null) {
      // Try to pick up example response from OpenAPI spec if available
      const exampleResponse = getExampleFromResponse(
        c,
        statusCode,
        operation.responses as OpenAPIV3_1.ResponsesObject | undefined,
      )
      if (exampleResponse !== null) {
        return c.json(exampleResponse)
      }
      return c.json(null)
    }

    return c.json(result)
  } catch (error) {
    // Log error to console
    console.error('x-handle execution error:', error)

    // Return 500 error
    c.status(500)
    return c.json({
      error: 'Handler execution failed',
      message: error instanceof Error ? error.message : String(error),
    })
  }
}
