import type { HttpMethod } from '@scalar/helpers/http/http-methods'
import { getResolvedRef } from '@scalar/workspace-store/helpers/get-resolved-ref'
import type { OperationObject } from '@scalar/workspace-store/schemas/v3.1/strict/operation'

import { buildRequestBody } from '@/v2/blocks/operation-block/helpers/build-request-body'

/** Build the fetch request object which can then be executed */
export const buildRequest = ({
  operation,
  method,
  path,
  exampleKey = 'default',
}: {
  operation: OperationObject
  method: HttpMethod
  path: string
  exampleKey: string
}): Request => {
  const body = buildRequestBody(getResolvedRef(operation.requestBody), exampleKey)

  // return {
  //   method: operation.method,
  //   url: operation.path,
  //   body: buildRequestBody(operation.requestBody),
  // }
}
