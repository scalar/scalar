import React from 'react'
import ReactDOM from 'react-dom/client'

import { ApiClientModalProvider } from '../src/ApiClientModalProvider'
import App from './App'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ApiClientModalProvider
      initialRequest={{
        method: 'DELETE',
        path: '/planets/{planetId}',
      }}
      configuration={{
        spec: {
          url: 'https://cdn.jsdelivr.net/npm/@scalar/galaxy/dist/latest.json',
        },
      }}>
      <App />
    </ApiClientModalProvider>
  </React.StrictMode>,
)
