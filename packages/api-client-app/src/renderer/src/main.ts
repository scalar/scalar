import { webHashRouter } from '@scalar/api-client'
import { createApiClientApp } from '@scalar/api-client/layouts/App'
import '@scalar/api-client/style.css'
import { load, trackEvent } from 'fathom-client'

// Initialize
await createApiClientApp(
  document.getElementById('scalar-client'),
  {},
  true,
  webHashRouter,
)

/**
 * Fathom Analytics offers simple & privacy-first tracking
 * @see https://usefathom.com/
 */
load('EUNBEXQC', {
  // Skips automatically tracking page views
  auto: false,
})

// Track the launch event
const { platform } = window.electron.process

const os =
  platform === 'darwin'
    ? 'mac'
    : platform === 'win32'
      ? 'windows'
      : platform === 'linux'
        ? 'linux'
        : 'unknown'

trackEvent(`launch: ${os}`)
