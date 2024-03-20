import {
  useApiClientStore,
  useAuthenticationStore,
  useRequestStore,
} from '@scalar/api-client'
import type { TransformedOperation } from '@scalar/oas-utils'
import type { OpenAPIV3 } from '@scalar/openapi-parser'

import { getApiClientRequest } from '../helpers'
import { useServerStore } from '../stores'

const { server: serverState } = useServerStore()
const { authentication: authenticationState } = useAuthenticationStore()

const { toggleApiClient } = useApiClientStore()

const { setActiveRequest, resetActiveResponse } = useRequestStore()

export function openClientFor(
  operation: TransformedOperation,
  globalSecurity?: OpenAPIV3.SecurityRequirementObject[],
) {
  // Get the HAR request object
  const request = getApiClientRequest({
    serverState: serverState,
    authenticationState: authenticationState,
    operation: operation,
    globalSecurity: globalSecurity,
  })

  // Reset the API client response
  resetActiveResponse()

  // Set the new API client request
  setActiveRequest(request)

  toggleApiClient(request, true)
}
