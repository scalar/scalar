import { webHashRouter } from '@scalar/api-client'
import { createApiClientApp } from '@scalar/api-client/layouts/App'
import '@scalar/api-client/style.css'
import * as Fathom from 'fathom-client'

// Initialize
await createApiClientApp(
  document.getElementById('scalar-client'),
  {
    proxyUrl: 'https://proxy.scalar.com',
  },
  true,
  webHashRouter,
)

/**
 * Fathom Analytics offers simple & privacy-first tracking
 * @see https://usefathom.com/
 */
Fathom.load('MY_FATHOM_ID', {
  // Skips automatically tracking page views
  auto: false,
})

Fathom.trackEvent('launch')
