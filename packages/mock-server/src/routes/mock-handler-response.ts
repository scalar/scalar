import type { OpenAPI } from '@scalar/openapi-types'
import type { Context } from 'hono'

import type { MockServerOptions } from '@/types'
import { buildHandlerContext } from '@/utils/build-handler-context'
import { executeHandler } from '@/utils/execute-handler'

/**
 * Mock response using x-handler code.
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

  // Get x-handler code from operation
  const handlerCode = operation?.['x-handler']

  if (!handlerCode) {
    c.status(500)
    return c.json({ error: 'x-handler code not found in operation' })
  }

  try {
    // Build handler context
    const context = await buildHandlerContext(c)

    // Execute handler
    const result = await executeHandler(handlerCode, context)

    // Set default status code (200) if not specified
    c.status(200)

    // Set Content-Type header
    c.header('Content-Type', 'application/json')

    // Return the handler result as JSON
    return c.json(result)
  } catch (error) {
    // Log error to console
    console.error('x-handler execution error:', error)

    // Return 500 error
    c.status(500)
    return c.json({
      error: 'Handler execution failed',
      message: error instanceof Error ? error.message : String(error),
    })
  }
}
