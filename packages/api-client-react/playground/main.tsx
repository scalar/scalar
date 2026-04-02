import React from 'react'
import ReactDOM from 'react-dom/client'

import { ApiClientModalProvider } from '../src/ApiClientModalProvider'
import { App } from './App'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ApiClientModalProvider
      configuration={{
        content: JSON.stringify({
          openapi: '3.1.0',
          info: {
            title: 'Scalar API Client React',
            version: '1.0.0',
          },
          paths: {
            '/planets': {
              get: {
                operationId: 'listPlanets',
              },
              post: {
                operationId: 'createPlanet',
              },
            },
            '/auth/token': {
              post: {
                operationId: 'createToken',
              },
            },
          },
        }),
      }}>
      <App />
    </ApiClientModalProvider>
    <ApiClientModalProvider
      configuration={{
        content: JSON.stringify({
          openapi: '3.1.0',
          info: {
            title: 'Scalar API Client React',
            version: '1.0.0',
          },
          paths: {
            '/planets': {
              get: {
                operationId: 'listPlanets',
              },
              post: {
                operationId: 'createPlanet',
              },
            },
            '/auth/token': {
              post: {
                operationId: 'createToken',
              },
            },
          },
        }),
      }}>
      <App initialRequest={{ path: '/auth/token', method: 'post' }} />
    </ApiClientModalProvider>
    <ApiClientModalProvider
      configuration={{
        content: JSON.stringify({
          openapi: '3.1.0',
          info: {
            title: 'Scalar API Client React',
            version: '1.0.0',
          },
          paths: {
            '/planets': {
              get: {
                operationId: 'listPlanets',
              },
              post: {
                operationId: 'createPlanet',
              },
            },
            '/auth/token': {
              post: {
                operationId: 'createToken',
              },
            },
          },
        }),
      }}>
      <App initialRequest={{ path: '/planets', method: 'get' }} />
    </ApiClientModalProvider>
  </React.StrictMode>,
)
