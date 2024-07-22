import React from 'react'

import { useApiClientModal } from '../src/ApiClientModalProvider'

export const App = () => {
  const client = useApiClientModal()

  return (
    <button
      onClick={() => client?.open({ path: '/auth/token', method: 'get' })}>
      Click me to open the Api Client
    </button>
  )
}

export default App
