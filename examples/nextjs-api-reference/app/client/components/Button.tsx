'use client'

import { useApiClientModal } from '@scalar/api-client-react'

export const Button = () => {
  const client = useApiClientModal()

  return <button onClick={() => client?.open()}>Click me to open the Api Client</button>
}
