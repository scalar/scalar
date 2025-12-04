import { faker } from '@faker-js/faker'
import { getExampleFromSchema } from '@scalar/oas-utils/spec-getters'
import type { OpenAPIV3_1 } from '@scalar/openapi-types'
import type { Context } from 'hono'
import { accepts } from 'hono/accepts'

import { store } from '../libs/store'
import { type StoreOperationTracking, createStoreWrapper } from './store-wrapper'

/**
 * Context object provided to x-handler code.
 */
export type HandlerContext = {
  store: ReturnType<typeof createStoreWrapper>['wrappedStore']
  faker: typeof faker
  req: {
    body: any
    params: Record<string, string>
    query: Record<string, string>
    headers: Record<string, string>
  }
  res: Record<string, any>
}

/**
 * Result of building handler context, including operation tracking.
 */
type HandlerContextResult = {
  context: HandlerContext
  tracking: StoreOperationTracking
}

/**
 * Get example response from OpenAPI spec for a given status code.
 * Returns the example value if found, or null if not available.
 */
function getExampleFromResponse(
  c: Context,
  statusCode: string,
  responses: OpenAPIV3_1.ResponsesObject | undefined,
): any {
  if (!responses) {
    return null
  }

  const response = responses[statusCode] || responses.default

  if (!response) {
    return null
  }

  const supportedContentTypes = Object.keys(response.content ?? {})

  // If no content types are defined, return null
  if (supportedContentTypes.length === 0) {
    return null
  }

  // Content-Type negotiation - prefer application/json
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
 * Build the handler context from a Hono context.
 */
export async function buildHandlerContext(
  c: Context,
  operation?: OpenAPIV3_1.OperationObject,
): Promise<HandlerContextResult> {
  let body: any = undefined

  try {
    const contentType = c.req.header('content-type') ?? ''
    if (contentType.includes('application/json')) {
      body = await c.req.json().catch(() => undefined)
    } else if (contentType.includes('application/x-www-form-urlencoded')) {
      body = await c.req.parseBody().catch(() => undefined)
    } else if (contentType.includes('text/')) {
      body = await c.req.text().catch(() => undefined)
    }
  } catch {
    // Ignore parsing errors, body remains undefined
  }

  const { wrappedStore, tracking } = createStoreWrapper(store)

  // Build res object with examples for all response status codes
  const res: Record<string, any> = {}
  if (operation?.responses) {
    for (const statusCode of Object.keys(operation.responses)) {
      res[statusCode] = getExampleFromResponse(
        c,
        statusCode,
        operation.responses as OpenAPIV3_1.ResponsesObject | undefined,
      )
    }
  }

  return {
    context: {
      store: wrappedStore,
      faker,
      req: {
        body,
        params: c.req.param(),
        query: Object.fromEntries(new URL(c.req.url).searchParams.entries()),
        headers: Object.fromEntries(Object.entries(c.req.header()).map(([key, value]) => [key, value ?? ''])),
      },
      res,
    },
    tracking,
  }
}
