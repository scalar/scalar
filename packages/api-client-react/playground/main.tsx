import React from 'react'
import ReactDOM from 'react-dom/client'

import { App } from './App'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
    <App initialRequest={{ path: '/auth/token', method: 'post' }} />
    <App initialRequest={{ path: '/planets', method: 'get' }} />
  </React.StrictMode>,
)
