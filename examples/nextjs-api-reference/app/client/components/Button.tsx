'use client'

import { useApiClientModal } from '@scalar/api-client-react'

export const Button = ({ method, path }: { method: 'GET' | 'POST'; path: string }) => {
  const client = useApiClientModal()

  return <button onClick={() => client?.open({ method, path })}>Click me to open the Api Client</button>
}
