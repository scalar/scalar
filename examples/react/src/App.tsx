import { ApiReferenceReact } from '@scalar/api-reference-react'
import React from 'react'

function App() {
  return (
    <ApiReferenceReact
      configuration={{
        spec: {
          url: 'https://petstore3.swagger.io/api/v3/openapi.json',
        },
      }}
    />
  )
}

export default App
