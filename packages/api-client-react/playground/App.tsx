import type { OpenClientPayload } from '@scalar/api-client/libs'

import React from 'react'

import { useApiClientModal } from '../src/ApiClientModalProvider'

export const App = ({
  initialRequest,
}: {
  initialRequest?: OpenClientPayload
}) => {
  const client = useApiClientModal()

  return <button onClick={() => client?.open(initialRequest)}>Click me to open the Api Client</button>
}

export default App
