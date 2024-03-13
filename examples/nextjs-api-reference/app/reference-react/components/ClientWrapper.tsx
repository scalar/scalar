'use client'

import { ApiReferenceReact } from '@scalar/api-reference-react'
import React from 'react'

export const ClientWrapper = () => (
  <ApiReferenceReact
    configuration={{
      spec: {
        url: 'https://petstore.swagger.io/v2/swagger.json',
      },
    }}
  />
)
