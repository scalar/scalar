import type { Hono } from 'hono'

import { createAsyncApiMockServer } from './create-asyncapi-mock-server'
import { createOpenApiMockServer } from './create-openapi-mock-server'
import type { MockServerOptions } from './types'
import { processDocument } from './utils/process-document'

/**
 * Create a Hono mock app from an OpenAPI or AsyncAPI document, detected after loading it.
 * WebSocket channels require a runtime-specific upgradeWebSocket adapter; HTTP and SSE do not.
 */
export const createMockServer = async (configuration: MockServerOptions): Promise<Hono> => {
  const processed = await processDocument(
    configuration?.document ?? configuration?.specification,
    configuration?.origin,
  )
  return processed.type === 'asyncapi'
    ? createAsyncApiMockServer(configuration, processed.document)
    : createOpenApiMockServer(configuration, processed.document)
}
