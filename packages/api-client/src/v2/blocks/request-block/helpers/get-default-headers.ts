import { type DefaultHeader, getDefaultHeaders as getDefaultHeadersCore } from '@scalar/core/libs/get-default-headers'
import type { HttpMethod } from '@scalar/helpers/http/http-methods'
import type { OperationObject } from '@scalar/workspace-store/schemas/v3.1/strict/openapi-document'

import { isElectron } from '@/libs/electron'
import { APP_VERSION } from '@/v2/constants'

export type { DefaultHeader }

export const getDefaultHeaders = ({
  method,
  operation,
  exampleKey,
  hideDisabledHeaders = false,
}: {
  method: HttpMethod
  operation: OperationObject
  exampleKey: string
  hideDisabledHeaders?: boolean
}): DefaultHeader[] => {
  return getDefaultHeadersCore({
    method,
    operation,
    exampleKey,
    hideDisabledHeaders,
    userAgent: isElectron() && APP_VERSION ? `Scalar/${APP_VERSION}` : undefined,
  })
}
