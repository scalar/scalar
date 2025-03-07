'use client'

import { ApiClientModalProvider } from '@scalar/api-client-react'
import type { OpenClientPayload } from '@scalar/api-client-react'

import '@scalar/api-client-react/style.css'
import type { PropsWithChildren } from 'react'

export const ClientWrapper = ({
  children,
  initialRequest,
}: PropsWithChildren<{ initialRequest?: OpenClientPayload }>) => {
  return (
    <ApiClientModalProvider
      initialRequest={initialRequest}
      configuration={{
        url: 'https://cdn.jsdelivr.net/npm/@scalar/galaxy/dist/latest.json',
      }}>
      {children}
    </ApiClientModalProvider>
  )
}
