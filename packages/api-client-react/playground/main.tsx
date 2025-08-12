import React from 'react'
import ReactDOM from 'react-dom/client'

import { ApiClientModalProvider } from '../src/ApiClientModalProvider'
import App from './App'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ApiClientModalProvider
      configuration={{
        url: 'https://registry.scalar.com/@scalar/apis/galaxy/latest?format=json',
      }}>
      <App />
    </ApiClientModalProvider>
    <ApiClientModalProvider
      configuration={{
        url: 'https://registry.scalar.com/@scalar/apis/galaxy/latest?format=json',
      }}>
      <App initialRequest={{ path: '/auth/token', method: 'post' }} />
    </ApiClientModalProvider>
    <ApiClientModalProvider
      configuration={{
        url: 'https://registry.scalar.com/@scalar/apis/galaxy/latest?format=json',
      }}>
      <App initialRequest={{ path: '/planets', method: 'get' }} />
    </ApiClientModalProvider>
  </React.StrictMode>,
)
