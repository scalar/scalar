import { ApiReferenceReact } from '@scalar/api-reference-react'
import React from 'react'

function App() {
  return (
    <ApiReferenceReact
      configuration={{
        spec: {
          url: 'https://cdn.jsdelivr.net/npm/@scalar/galaxy/dist/latest.yaml',
        },
      }}
    />
  )
}

export default App
