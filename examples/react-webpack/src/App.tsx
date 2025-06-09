import React from 'react'
import { ApiReferenceReact } from '@scalar/api-reference-react'
import '@scalar/api-reference-react/style.css'

const App = () => {
  return (
    <ApiReferenceReact
      configuration={{
        url: 'https://cdn.jsdelivr.net/npm/@scalar/galaxy/dist/latest.yaml',
      }}
    />
  )
}

export default App
