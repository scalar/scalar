import { useApiClientStore, useRequestStore } from '@scalar/api-client'

import {
  getApiClientRequest,
  getQueryParametersFromOperation,
} from '../helpers'
import { useGlobalStore } from '../stores'
import type { TransformedOperation } from '../types'

const { server: serverState, authentication: authenticationState } =
  useGlobalStore()

const { toggleApiClient } = useApiClientStore()

const { setActiveRequest, resetActiveResponse } = useRequestStore()

export function openClientWith(operation: TransformedOperation) {
  // Get the HAR request object
  const request = getApiClientRequest({
    serverState: serverState,
    authenticationState: authenticationState,
    operation: operation,
  })

  // Reset the API client response
  resetActiveResponse()

  // Set the new API client request
  setActiveRequest({
    ...request,
    query: getQueryParametersFromOperation(operation),
  })

  toggleApiClient(request, true)
}
