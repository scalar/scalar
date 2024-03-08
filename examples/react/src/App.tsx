import { ApiReferenceReact } from '@scalar/api-reference-react'
import React from 'react'

import content from '../../web/src/fixtures/petstorev3.json'

function App() {
  return (
    <ApiReferenceReact
      configuration={{
        spec: {
          content,
        },
      }}
    />
  )
}

export default App
