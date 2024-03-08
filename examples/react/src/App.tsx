import { ApiReferenceReact } from '@scalar/api-reference-react'
import React from 'react'

function App() {
  return (
    <ApiReferenceReact
      configuration={{
        spec: {
          url: 'https://petstore.swagger.io/v2/swagger.json',
        },
      }}
    />
  )
}

export default App
