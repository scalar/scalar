import type { OpenAPIV3_1 } from '@scalar/openapi-types'
import type { TransformedOperation } from '@scalar/types/legacy'

/** Temp helper for converting transformed operation to operationId payload */
export const operationIdParams = (transformedOperation: TransformedOperation) => ({
  ...(transformedOperation.information as OpenAPIV3_1.OperationObject),
  path: transformedOperation.path,
  method: transformedOperation.httpVerb.toLowerCase() as OpenAPIV3_1.HttpMethods,
})
