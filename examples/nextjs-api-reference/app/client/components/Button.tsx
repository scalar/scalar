'use client'

import { useApiClient } from '@scalar/api-client-react'
import '@scalar/api-client-react/style.css'

export const Button = ({ method, path }: { method: 'get' | 'post'; path: string }) => {
  const client = useApiClient({
    configuration: {
      url: 'https://registry.scalar.com/@scalar/apis/galaxy?format=json',
    },
  })

  return <button onClick={() => client?.open({ method, path })}>Click me to open the Api Client</button>
}
