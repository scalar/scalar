'use client'

import { ApiClientModalProvider } from '@scalar/api-client-react'
import type { OpenClientPayload } from '@scalar/api-client-react'

import '@scalar/api-client-react/style.css'
import type { PropsWithChildren } from 'react'

const galaxyDocument = {
  openapi: '3.1.0',
  info: {
    title: 'Scalar Galaxy',
    version: '1.0.0',
  },
  paths: {
    '/auth/token': {
      post: {
        operationId: 'createToken',
      },
    },
    '/planets': {
      get: {
        operationId: 'listPlanets',
      },
      post: {
        operationId: 'createPlanet',
      },
    },
  },
}

export const ClientWrapper = ({
  children,
  initialRequest,
}: PropsWithChildren<{ initialRequest?: OpenClientPayload }>) => {
  return (
    <ApiClientModalProvider
      initialRequest={initialRequest}
      configuration={{
        content: galaxyDocument,
      }}>
      {children}
    </ApiClientModalProvider>
  )
}
