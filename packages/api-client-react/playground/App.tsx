import React from 'react'

import { ApiClientReact } from '../src'

export const App = () => {
  return (
    <ApiClientReact
      configuration={{
        spec: {
          url: 'https://cdn.jsdelivr.net/npm/@scalar/galaxy/dist/latest.json',
        },
      }}>
      <button>Click me to open</button>
    </ApiClientReact>
  )
}

export default App
