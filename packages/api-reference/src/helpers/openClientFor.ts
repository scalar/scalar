import {
  useApiClientStore,
  useOpenApiStore,
  useRequestStore,
} from '@scalar/api-client'
import type { TransformedOperation } from '@scalar/oas-utils'
import type { OpenAPIV3 } from '@scalar/openapi-parser'

import { getApiClientRequest } from '../helpers'
import { useServerStore } from '../stores/useServerStore'

const { server: serverState } = useServerStore()
const { setOperation, setGlobalSecurity } = useOpenApiStore()

const { toggleApiClient } = useApiClientStore()

const { setActiveRequest, resetActiveResponse } = useRequestStore()

export function openClientFor(
  operation: TransformedOperation,
  globalSecurity?: OpenAPIV3.SecurityRequirementObject[],
) {
  // Get the HAR request object
  const request = getApiClientRequest({
    serverState: serverState,
    operation,
    // Let the API client handle the authentication.
    authenticationState: null,
    globalSecurity: null,
  })

  // Reset the API client response
  resetActiveResponse()

  // Set the new API client request
  setActiveRequest(request)

  // Pass OpenAPI information to the API client, so it can handle the authentication properly.
  // TODO: Would be easier to just pass the whole specification once instead of passing a handful of small objects and doing data transformations everywhere, eh? Anyway, we’ll add this for now and hopefully we can further improve this later.
  setOperation(operation)
  setGlobalSecurity(globalSecurity)

  toggleApiClient(request, true)
}
