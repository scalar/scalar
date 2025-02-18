'use client'

import { ApiClientModalProvider } from '@scalar/api-client-react'
import '@scalar/api-client-react/style.css'
import type { PropsWithChildren } from 'react'

export const ClientWrapper = ({ children }: PropsWithChildren) => {
  return (
    <ApiClientModalProvider
      configuration={{
        spec: {
          url: 'https://cdn.jsdelivr.net/npm/@scalar/galaxy/dist/latest.json',
        },
      }}>
      {children}
    </ApiClientModalProvider>
  )
}
