import '@scalar/api-client/style.css'
import { ApiReferenceReact } from '@scalar/api-reference-react'
// import '@scalar/api-reference-react/style.css'
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
