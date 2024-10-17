import React from 'react'
import ReactDOM from 'react-dom/client'

import { ApiClientModalProvider } from '../src/ApiClientModalProvider'
import App from './App'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ApiClientModalProvider
      configuration={{
        spec: {
          url: 'https://cdn.jsdelivr.net/npm/@scalar/galaxy/dist/latest.json',
        },
      }}>
      <App />
    </ApiClientModalProvider>
    <ApiClientModalProvider
      configuration={{
        spec: {
          url: 'https://cdn.jsdelivr.net/npm/@scalar/galaxy/dist/latest.json',
        },
      }}>
      <App />
    </ApiClientModalProvider>
    <ApiClientModalProvider
      configuration={{
        spec: {
          url: 'https://cdn.jsdelivr.net/npm/@scalar/galaxy/dist/latest.json',
        },
      }}>
      <App />
    </ApiClientModalProvider>
  </React.StrictMode>,
)
