'use client'

import React, { useState } from 'react'

import { ApiClientReact } from '../../../../../packages/api-client-react/src'

export const ClientWrapper = () => {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <div>
      <button onClick={() => setIsOpen(true)}>
        Click me to open the Api Client
      </button>

      <ApiClientReact
        close={() => setIsOpen(false)}
        isOpen={isOpen}
        request={{
          url: 'https://api.sampleapis.com',
          type: 'GET',
          path: '/simpsons/characters',
        }}
      />
    </div>
  )
}
