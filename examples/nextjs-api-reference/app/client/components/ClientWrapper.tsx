'use client'

import { ApiClientReact } from '@scalar/api-client-react'
import React, { useState } from 'react'

export const ClientWrapper = () => {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <div>
      <button onClick={() => setIsOpen(true)}>
        Click me to open the Api Client
      </button>

      {/* <ApiClientReact */}
      {/*   close={() => setIsOpen(false)} */}
      {/*   isOpen={isOpen} */}
      {/*   configuration={{ */}
      {/*     spec: { */}
      {/*       url: 'https://cdn.jsdelivr.net/npm/@scalar/galaxy/dist/latest.json', */}
      {/*     }, */}
      {/*   }} */}
      {/* /> */}
    </div>
  )
}
