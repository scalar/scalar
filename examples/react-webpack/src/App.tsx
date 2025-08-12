import { ApiReferenceReact } from '@scalar/api-reference-react'
import React from 'react'
import '@scalar/api-reference-react/style.css'

const App = () => {
  return (
    <ApiReferenceReact
      configuration={{
        url: 'https://registry.scalar.com/@scalar/apis/galaxy/latest?format=yaml',
      }}
    />
  )
}

export default App
