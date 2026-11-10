import type { OpenAPIV3_1 } from '@scalar/openapi-types'
import type { Context } from 'hono'

/** The operation a route mocks, used to name what failed in an error response */
export type MockedOperation = {
  /** HTTP method with the capitalization sent in the request, for example `GET` or `copy` */
  method: string
  /** The OpenAPI path key, for example `/pets/{petId}` (not the Hono route it is registered as) */
  path: string
  /** The `operationId` of the operation, when the document declares one */
  operationId?: string
}

/**
 * Context variables the mock server sets on a request, so the error handler can read back which
 * operation was being mocked when something threw.
 *
 * The app itself stays a plain `Hono` because that type is part of this package's public API, so
 * the variable is reached through a narrowed view of the context instead.
 */
type MockServerContext = Context<{
  Variables: { mockedOperation: MockedOperation; matchedOperation: OpenAPIV3_1.OperationObject }
}>

/**
 * Record which operation a request matched, so an error escaping it can be named and `onResponse`
 * receives the operation object itself.
 */
export const setMockedOperation = (
  c: Context,
  mockedOperation: MockedOperation,
  operation: OpenAPIV3_1.OperationObject,
): void => {
  ;(c as MockServerContext).set('mockedOperation', mockedOperation)
  ;(c as MockServerContext).set('matchedOperation', operation)
}

/** Read back the operation a request matched, or `undefined` when it reached no mocked route */
export const getMockedOperation = (c: Context): MockedOperation | undefined =>
  (c as MockServerContext).get('mockedOperation')

/** Read back the operation object a request matched, or `undefined` when it reached no mocked route */
export const getMatchedOperation = (c: Context): OpenAPIV3_1.OperationObject | undefined =>
  (c as MockServerContext).get('matchedOperation')
