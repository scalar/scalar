import '@/style.css'
import '@scalar/api-client/style.css'

import { appState } from '@web/app-state'
import { commandPaletteState } from '@web/features/command-palette'
import { router } from '@web/router'
import { initializeWebsiteTrackers } from '@web/tracking'
import { load, trackEvent } from 'fathom-client'
import { createApp } from 'vue'

import App, { type AppProps } from '@/App.vue'

/**
 * Fathom Analytics offers simple & privacy-first tracking
 * @see https://usefathom.com/
 */
load('RSYAEMNM', {
  spa: 'auto',
})

// Determine the operating system

trackEvent('launch: web-app')
initializeWebsiteTrackers()

const el = document.getElementById('scalar-client')

if (!el) {
  console.error('Missing base element to mount to. Exiting...')
} else {
  // Pass in our initial props at the top level

  const app = createApp(App, {
    getAppState: () => appState,
    getCommandPaletteState: () => commandPaletteState,
  } satisfies AppProps)

  app.use(router)
  app.mount(el)
}
