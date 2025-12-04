import type { OpenAPI } from '@scalar/openapi-types'
import type { Context } from 'hono'
import type { StatusCode } from 'hono/utils/http-status'

import type { MockServerOptions } from '@/types'
import { buildHandlerContext } from '@/utils/build-handler-context'
import { executeHandler } from '@/utils/execute-handler'

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
export async function mockHandlerResponse(c: Context, operation: OpenAPI.Operation, options: MockServerOptions) {
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
    const { context, tracking } = await buildHandlerContext(c)

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
