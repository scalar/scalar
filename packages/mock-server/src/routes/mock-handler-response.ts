import { isXmlMediaType } from '@scalar/helpers/http/is-xml-media-type'
import type { OpenAPIV3_1 } from '@scalar/openapi-types'
import { getResolvedRef } from '@scalar/workspace-store/helpers/get-resolved-ref'
import { getXmlBodyExample } from '@scalar/workspace-store/request-example'
import type { SchemaObject } from '@scalar/workspace-store/schemas/v3.1/strict/openapi-document'
import type { Context } from 'hono'
import type { StatusCode } from 'hono/utils/http-status'

import { buildHandlerContext } from '@/utils/build-handler-context'
import { executeHandler } from '@/utils/execute-handler'
import { generateResponseExample } from '@/utils/generate-response-example'
import { negotiateContentType } from '@/utils/negotiate-content-type'
import { normalizeResponseBody } from '@/utils/normalize-response-body'
import { parsePreferHeader } from '@/utils/parse-prefer-header'
import { pathParameters } from '@/utils/path-parameters'
import { selectResponseExample } from '@/utils/select-response-example'
import { getStreamingResponse, sendStreamingResponse } from '@/utils/streaming-response'
import { serializeResponseBody } from '@/utils/serialize-response-body'

/**
 * Get example response from OpenAPI spec for a given status code.
 * Returns a serialized payload if found, or null if not available.
 *
 * Honors `Prefer: example=<name>` to pick a named example from the
 * `examples` map; otherwise it falls back to the singular `example`, the
 * first entry of the map, or a value generated from the schema.
 */
function getExampleFromResponse(
  c: Context,
  statusCode: StatusCode,
  responses: OpenAPIV3_1.ResponsesObject | undefined,
  exampleName?: string,
  openapiVersion?: string,
): string | null {
  if (!responses) {
    return null
  }

  const statusCodeStr = statusCode.toString()
  const response = getResolvedRef(responses[statusCodeStr] || responses.default)

  if (!response) {
    return null
  }

  const supportedContentTypes = Object.keys(response.content ?? {})

  // If no content types are defined, return null
  if (supportedContentTypes.length === 0) {
    return null
  }

  // Content-Type negotiation
  const acceptedContentType = negotiateContentType(c, response.content)

  const acceptedResponse = response.content?.[acceptedContentType]

  if (!acceptedResponse) {
    return null
  }

  const responseSchema = acceptedResponse.schema ? getResolvedRef(acceptedResponse.schema) : undefined

  // Extract example (named, singular, or first) or generate from schema
  const selectedExample = selectResponseExample(acceptedResponse, exampleName)
  if (isXmlMediaType(acceptedContentType)) {
    c.header('Content-Type', acceptedContentType)
    return (
      getXmlBodyExample(acceptedResponse.schema as SchemaObject | undefined, selectedExample, {
        openapiVersion,
        emptyString: 'string',
        variables: pathParameters(c),
        mode: 'read',
      }).xml ?? null
    )
  }

  const provenance =
    selectedExample?.serializedValue !== undefined
      ? 'serialized'
      : selectedExample?.dataValue !== undefined
        ? 'data'
        : undefined
  if (selectedExample && provenance) {
    c.header('Content-Type', acceptedContentType)
    return serializeResponseBody(selectedExample.value, acceptedContentType, responseSchema, provenance) ?? null
  }

  const value = selectedExample
    ? normalizeResponseBody(selectedExample.value, responseSchema)
    : responseSchema
      ? normalizeResponseBody(generateResponseExample(responseSchema, pathParameters(c)), responseSchema)
      : null
  // Legacy examples retain the handler fallback's JSON encoding policy.
  return JSON.stringify(value) ?? null
}

/**
 * Determine HTTP status code based on store operation tracking.
 * Prioritizes operations based on semantic meaning:
 * - get > update > delete > create > list
 * This ensures that if a handler performs multiple operations (e.g., get followed by create for logging),
 * the status code reflects the most semantically meaningful operation.
 */
function determineStatusCode(tracking: {
  operations: Array<{ operation: 'get' | 'create' | 'update' | 'delete' | 'list'; result: any }>
}): StatusCode {
  const { operations } = tracking

  // If no operations were performed, default to 200
  if (operations.length === 0) {
    return 200
  }

  // Priority order: get > update > delete > create > list
  // Check for get operations first (highest priority)
  const getOperation = operations.find((op) => op.operation === 'get')
  if (getOperation) {
    // Return 404 if get() returned undefined or null
    if (getOperation.result === undefined || getOperation.result === null) {
      return 404
    }
    return 200
  }

  // Check for update operations
  const updateOperation = operations.find((op) => op.operation === 'update')
  if (updateOperation) {
    // Return 404 if update() returned null (item not found)
    if (updateOperation.result === null || updateOperation.result === undefined) {
      return 404
    }
    return 200
  }

  // Check for delete operations
  const deleteOperation = operations.find((op) => op.operation === 'delete')
  if (deleteOperation) {
    // Return 404 if delete() returned null (item not found)
    if (deleteOperation.result === null || deleteOperation.result === undefined) {
      return 404
    }
    return 204
  }

  // Check for create operations
  const createOperation = operations.find((op) => op.operation === 'create')
  if (createOperation) {
    return 201
  }

  // Default to 200 for list or any other operation
  return 200
}

/**
 * Mock response using x-handler code.
 * Executes the handler and returns its result as the response.
 */
export async function mockHandlerResponse(
  c: Context,
  operation: OpenAPIV3_1.OperationObject,
  pathItemParameters?: OpenAPIV3_1.PathItemObject['parameters'],
  openapiVersion?: string,
) {
  // Note: the `onRequest` callback runs as middleware (see `create-mock-server`) so it also fires
  // for requests rejected before reaching this handler.

  // Get x-handler code from operation
  const handlerCode = operation?.['x-handler']

  if (!handlerCode) {
    c.status(500)
    return c.json({ error: 'x-handler code not found in operation' })
  }

  try {
    // Build handler context with tracking
    const { context, tracking } = await buildHandlerContext(c, operation, pathItemParameters)

    // Execute handler
    const { result } = await executeHandler(handlerCode, context)

    // Determine status code based on all store operations, prioritizing semantically meaningful ones
    const statusCode = determineStatusCode(tracking)

    // Set status code
    c.status(statusCode)

    // For 204 No Content, return null body without Content-Type header
    if (statusCode === 204) {
      return c.body(null)
    }

    const response = getResolvedRef(operation.responses?.[String(statusCode)] ?? operation.responses?.default)
    const contentType = negotiateContentType(c, response?.content)
    const streamingResponse = getStreamingResponse(response?.content?.[contentType], contentType, {
      body: result ?? undefined,
      exampleName: parsePreferHeader(c.req.header('Prefer')).example,
      variables: pathParameters(c),
    })
    if (streamingResponse) {
      return sendStreamingResponse(c, streamingResponse)
    }

    // Set Content-Type header for other responses
    c.header('Content-Type', 'application/json')

    // Return the handler result as JSON
    // Handle undefined/null results gracefully
    if (result === undefined || result === null) {
      // Try to pick up example response from OpenAPI spec if available
      const prefer = parsePreferHeader(c.req.header('Prefer'))
      const exampleResponse = getExampleFromResponse(
        c,
        statusCode,
        operation.responses as OpenAPIV3_1.ResponsesObject | undefined,
        prefer.example,
        openapiVersion,
      )
      if (exampleResponse !== null) {
        return c.body(exampleResponse)
      }
      if (isXmlMediaType(c.res.headers.get('Content-Type') ?? undefined)) {
        return c.body(null)
      }
      return c.json(null)
    }

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
