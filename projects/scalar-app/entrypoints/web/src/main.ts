import '@/style.css'
import '@scalar/api-client/style.css'

import { appState } from '@web/app-state'
import { router } from '@web/router'
import { initializeWebsiteTrackers } from '@web/tracking'
import { load, trackEvent } from 'fathom-client'
import { createApp } from 'vue'

import App, { type AppProps } from '@/App.vue'
import { useCommandPaletteState } from '@/features/command-palette/hooks/use-command-palette-state'

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
    getCommandPaletteState: () => useCommandPaletteState(),
  } satisfies AppProps)

  app.use(router)
  app.mount(el)
}
