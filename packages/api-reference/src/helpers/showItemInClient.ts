import { useApiClientStore, useRequestStore } from '@scalar/api-client'

import { getApiClientRequest } from '../helpers'
import { useGlobalStore } from '../stores'
import type { TransformedOperation } from '../types'

const { server: serverState, authentication: authenticationState } =
  useGlobalStore()

const { toggleApiClient } = useApiClientStore()

const { setActiveRequest } = useRequestStore()

export function showItemInClient(operation: TransformedOperation) {
  const request = getApiClientRequest({
    serverState: serverState,
    authenticationState: authenticationState,
    operation: operation,
  })

  setActiveRequest(request)

  toggleApiClient(request, true)
}
